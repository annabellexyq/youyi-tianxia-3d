/* ============================================================================
 *  游医天下 · 3D 版主逻辑
 *  地图导航 → Three.js 场景 → 五脏五色组方（驱动世界模型）→ 手工级五脏显影
 * ==========================================================================*/
import * as THREE from 'three';
import { createWorld } from './art3d.js';
import { openBencaoWheel, mountWheel } from './bencao-wheel.js';
import { propSVG } from './map-props.js';

const { ORGANS, ORGAN_ORDER, WORLD_MODEL, LOCATIONS, HERBS, FORMULA_RULES } = window.YIYI;

/* —— 生辰八字 → 先天五行（天干地支纳音归脏） —— */
const TIAN_GAN = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水' };
const DI_ZHI   = { 子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水' };
const ELEM_ORGAN = { 木:'gan', 火:'xin', 土:'pi', 金:'fei', 水:'shen' };
function baziToElements(str) {
  const counts = { 木:0,火:0,土:0,金:0,水:0 };
  if (!str) return counts;
  for (const ch of str.trim()) {
    if (TIAN_GAN[ch]) counts[TIAN_GAN[ch]]++;
    else if (DI_ZHI[ch]) counts[DI_ZHI[ch]]++;
  }
  return counts;
}
function baziDominant(counts) {
  let dom = null, max = 0;
  for (const k of ['木','火','土','金','水']) if (counts[k] > max) { max = counts[k]; dom = k; }
  return max > 0 ? dom : null;
}

const state = { idx: 0, visited: new Set(), player: {}, grade: null, conv: {}, chatLog: {}, levels: {}, levelStart: 0, levelStop: 0, lastScore: 0, lastTime: 0 };
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const contrastColor = (hex) => { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return ((r * 299 + g * 587 + b * 114) / 1000) >= 140 ? '#0e1317' : '#fff'; };

const screens = { title: $('#title'), map: $('#mapScreen'), scene: $('#sceneScreen') };

/* 浅色脏器（肺/白）在浅色纸底会看不见，返回更沉的银灰以作正文用色 */
function organTextHex(key) { return key === 'fei' ? '#7a8a95' : ORGANS[key].hex; }
function show(n) {
  Object.values(screens).forEach(s => s.classList.remove('on'));
  screens[n].classList.add('on');
  if (n === 'map') requestAnimationFrame(alignHorizon);   // 屏显后再量，才量得到真实尺寸
  if (n !== 'scene') { const ol = $('#outcomeLayer'); if (ol) ol.classList.remove('on'); }
}

/* —— 地图底图 —— */
function mapSVG() {
  return `<svg class="map-bg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="800" fill="#f3f1e8"/>
    <path d="M40 740 C 220 660,160 520,360 470 S620 520,720 470 S1020 360,1140 220" fill="none" stroke="#8fa6b0" stroke-width="10" stroke-opacity="0.5" stroke-linecap="round"/>
    <path d="M40 740 C 220 660,160 520,360 470 S620 520,720 470 S1020 360,1140 220" fill="none" stroke="#5d7884" stroke-width="2" stroke-opacity="0.6" stroke-dasharray="2 10"/>
    <g fill="#b9b5a4" fill-opacity="0.7" stroke="#6f6c60" stroke-width="1.4">
      <path d="M0 260 q200 -90 400 -40 t800 -20 V800 H0 Z"/>
      <path id="nearRidge" d="M0 520 q300 -110 600 -50 t600 -30 V800 H0 Z"/>
    </g>
  </svg>`;
}

/* —— 地平线对齐 ——
 * 底图用 xMidYMid slice，缩放随视口比例变化，山脊落点不固定。
 * 这里把「近处地平线」整体微调，让它在「科举揭发」处正好从图标与名牌之间的空隙穿过，
 * 既不压图标、也不压文字框（任何屏幕比例都成立）。 */
function ridgeYAtX(path, x) {
  const len = path.getTotalLength();
  let best = null, bestD = Infinity;
  for (let i = 0; i <= 480; i++) {
    const p = path.getPointAtLength(len * i / 480);
    if (p.y > 700) continue;                 // 跳过收口到画布底边的两段
    const d = Math.abs(p.x - x);
    if (d < bestD) { bestD = d; best = p.y; }
  }
  return best;
}
function alignHorizon() {
  const wrap = $('#mapWrap');
  const svg = wrap && wrap.querySelector('svg.map-bg');
  const ridge = svg && svg.querySelector('#nearRidge');
  const node = wrap && wrap.querySelector('.node[data-loc="keju"]');
  if (!svg || !ridge || !node) return;
  ridge.removeAttribute('transform');
  const prop = node.querySelector('.prop'), lbl = node.querySelector('.lbl');
  if (!prop || !lbl) return;
  const pr = prop.getBoundingClientRect(), lr = lbl.getBoundingClientRect();
  if (!pr.height || !lr.height) return;
  const m = svg.getScreenCTM();
  if (!m) return;
  const gapY = (pr.bottom + lr.top) / 2;                       // 图标底与名牌顶的空隙中心
  const pt = svg.createSVGPoint();
  pt.x = pr.left + pr.width / 2; pt.y = gapY;
  const vb = pt.matrixTransform(m.inverse());                  // 换算回 viewBox 坐标
  const yAt = ridgeYAtX(ridge, vb.x);
  if (yAt == null) return;
  const dy = vb.y - yAt;
  if (Math.abs(dy) < 0.5) return;
  ridge.setAttribute('transform', 'translate(0 ' + dy.toFixed(2) + ')');
}
let horizonBound = false;
function bindHorizon() {
  if (horizonBound) return;
  horizonBound = true;
  // 屏幕比例变了要重排点位（横竖屏切换会切换 mapPos / mapPosP），再重新对齐地平线
  let t = 0;
  const onResize = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const map = $('#mapScreen');
      if (map && map.classList.contains('on')) buildMap();   // buildMap 内部会再 alignHorizon
      else alignHorizon();
    }, 160);
  };
  addEventListener('resize', onResize);
  addEventListener('orientationchange', onResize);
}

/* —— 标题 / 地图 —— */
$('#startBtn').addEventListener('click', () => { buildMap(); show('map'); });

function canEnter(i) { return i === 0 || state.visited.has(LOCATIONS[i - 1].id); }

/* 竖屏 / 折叠屏（竖持）时改用 mapPosP —— 这类屏幕窄，点位普遍要再往两侧撑开一点 */
function isPortraitNarrow() {
  return window.innerHeight >= window.innerWidth && window.innerWidth <= 1024;
}
function posOf(loc) {
  return (isPortraitNarrow() && loc.mapPosP) ? loc.mapPosP : loc.mapPos;
}

function buildMap() {
  const wrap = $('#mapWrap'); wrap.innerHTML = '';
  wrap.appendChild(htmlToNode(mapSVG()));
  LOCATIONS.forEach((loc, i) => {
    const pos = posOf(loc);
    const node = el('div', 'node');
    node.dataset.loc = loc.id;
    node.style.left = pos.x + '%'; node.style.top = pos.y + '%';
    if (state.visited.has(loc.id)) node.classList.add('done');
    if (i === state.idx && canEnter(i)) node.classList.add('cur');
    if (!canEnter(i)) node.classList.add('locked');
    node.innerHTML = `<div class="prop">${propSVG(loc.id)}<i class="ring"></i></div><div class="lbl">${loc.name}</div>`;
    node.addEventListener('click', () => canEnter(i) ? enterScene(i) : toast('此境尚未解锁——且随张天一一路行去。'));
    wrap.appendChild(node);
  });
  alignHorizon();
  bindHorizon();
}

/* —— 进入 3D 场景 —— */
let world = null, raf = 0;
function enterScene(i) {
  state.idx = i;
  const loc = LOCATIONS[i];
  state.player = {}; state.grade = null;
  const domKey = loc.puzzle ? dominantFrom(loc.puzzle.suggested) : 'pi';
  if (!loc.puzzle) state.visited.add(loc.id);

  if (world) { cancelAnimationFrame(raf); world.dispose(); }

  // HUD
  const hud = $('#sceneHud');
  if (loc.puzzle) { state.levelStart = performance.now(); state.levelStop = 0; }
  else { state.levelStart = 0; }
  const timerHtml = loc.puzzle ? `<div class="timer" id="hudTimer">用时 0″</div>` : '';
  hud.innerHTML = `<div class="idx">${loc.subtitle}</div><h2>${loc.name}</h2>${timerHtml}<div class="st">游医张天一 · 拟方调五脏五色；点角色开合「手工级五脏显影」</div>`;

  // 工具条
  const tools = $('#sceneTools');
  tools.innerHTML = '';
  const back = el('button', 'btn', '◀ 地图'); back.onclick = () => { if (world) { cancelAnimationFrame(raf); world.dispose(); world = null; } buildMap(); show('map'); };
  tools.appendChild(back);
  const shot = el('button', 'btn', '我要上传'); shot.onclick = () => openUpload(loc);
  tools.appendChild(shot);
  const pal = el('button', 'btn', '本草色盘'); pal.onclick = () => openBencaoWheel();
  tools.appendChild(pal);
  if (loc.puzzle) {
    const f = el('button', 'btn primary', '拟方 · 调色盘');
    f.onclick = () => toggleDrawer();
    tools.appendChild(f);
  }

  // 先显示场景（让容器有尺寸），再创建 3D 世界；进入新境时务必重置转归弹窗
  show('scene');
  const ol0 = $('#outcomeLayer'); if (ol0) ol0.classList.remove('on');
  $('#sceneScreen').classList.remove('cinema');
  const bgEl = document.getElementById('bgLayer');
  if (bgEl) { bgEl.style.backgroundImage = 'url("' + loc.bg + '")'; bgEl.style.display = 'block'; bgEl.style.transform = loc.id === 'dangzhou' ? 'scaleX(-1)' : 'scaleX(1)'; bgEl.style.backgroundPosition = loc.id === 'shijing' ? '72% 64%' : 'center'; }
  world = createWorld($('#sceneStage'), loc, ORGANS[domKey].hex);
  buildBwEmbed(loc);

  // 点击 3D 角色：开合手工级五脏显影
  world.renderer.domElement.onclick = (e) => {
    const r = world.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -(((e.clientY - r.top) / r.height) * 2 - 1)
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, world.camera);
    const hit = ray.intersectObject(world.charHit, true);
    if (hit.length) toggleCinematic();
  };

  loop();
  buildMap();
  playStory(loc, () => buildDrawer(loc));
}

/* —— 社会背景动画 + 本案情况分析 —— */
function playStory(loc, done) {
  if (!loc.intro || !loc.intro.length) { done && done(); return; }
  const layer = $('#storyLayer'); layer.classList.add('on');
  const cap = $('#storyCap'), step = $('#storyStep'), next = $('#storyNext');
  const ana = $('#analysis'), body = $('#analysisBody');
  if (world) { world.setCinematic(true); $('#sceneScreen').classList.add('cinema'); }
  let i = 0; const shots = loc.intro;
  function showShot() {
    ana.classList.remove('on');
    cap.innerHTML = shots[i].split('\n').join('<br>');
    cap.classList.remove('show'); void cap.offsetWidth; cap.classList.add('show');
    step.textContent = (i + 1) + ' / ' + shots.length;
    next.textContent = (i >= shots.length - 1) ? '本案情况分析 ▶' : '继续 ▶';
    i++;
  }
  function finish() {
    body.innerHTML = `<div class="ac"><b>本案病机</b><span>${loc.npc.desc}</span></div>` +
      (loc.jingFang ? `<div class="ac"><b>经方取向</b><span>${loc.jingFang.name} · ${loc.jingFang.note}</span></div>` : '') +
      (loc.puzzle ? `<div class="ac"><b>临证提示</b><span>${loc.puzzle.hint.replace(/\n/g, '<br>')}</span></div>` : '');
    ana.classList.add('on');
  }
  next.onclick = () => { if (i < shots.length) showShot(); else finish(); };
  $('#analysisGo').onclick = () => {
    layer.classList.remove('on');
    if (world) { world.setCinematic(false); $('#sceneScreen').classList.remove('cinema'); }
    done && done();
  };
  showShot();
}

/* 手工级五脏显影：开合 cinematic + 暗角 */
function toggleCinematic() {
  if (!world) return;
  const on = !world.cinematic;
  world.setCinematic(on);
  $('#sceneScreen').classList.toggle('cinema', on);
  if (on) world.setOrganIntensities(state.player);
}

function loop() {
  if (!world) return;
  if (world.cinematic) {
    world.camAngle += 0.0016;
    const r = 2.9;
    const tx = Math.sin(world.camAngle) * r, tz = Math.cos(world.camAngle) * r;
    world.camera.position.lerp(new THREE.Vector3(tx, 1.35, tz), 0.04);
  } else {
    world.charHit.rotation.y += 0.004;
    world.camera.position.lerp(new THREE.Vector3(0, 2.4, 6.2), 0.05);
  }
  world.camera.lookAt(world.focus);
  if (state.levelStart) {
    const t = (state.levelStop || performance.now()) - state.levelStart;
    const te = $('#hudTimer'); if (te) te.textContent = '用时 ' + Math.floor(t / 1000) + '″';
  }
  world.render();
  raf = requestAnimationFrame(loop);
}
window.addEventListener('resize', () => world && world.onResize());

/* —— 抽屉（叙事 + 组方） —— */
function buildDrawer(loc) {
  const d = $('#drawer'); d.innerHTML = ''; d.classList.add('on');
  d.appendChild(el('div', 'seal', '游醫<br>天下'));
  loc.intro.forEach(t => d.appendChild(el('p', null, t)));
  const case_ = el('div', 'case');
  case_.innerHTML = `<div class="cap">本案病机</div><div class="ct">${loc.npc.desc}</div>` +
    (loc.jingFang ? `<div class="cap">经方取向</div><div class="ct">${loc.jingFang.name} · ${loc.jingFang.note}</div>` : '');
  d.appendChild(case_);

  if (loc.puzzle) buildFormula(d, loc);
  else {
    const note = el('p', null, '张天一这一路，依五脏五色自拟组方。下方是他的行医治验总览——九境的偏性，皆成杏林一段公案。');
    d.appendChild(note);
    const tally = el('div', 'jingfang');
    const grades = [...state.visited].map(id => { const l = LOCATIONS.find(x => x.id === id); return `<div>${l.name} · ${l.jingFang.name}</div>`; }).join('');
    tally.innerHTML = `<b>行医治验</b><br>${grades || '<span style="color:var(--ink-soft)">（尚未施治）</span>'}`;
    d.appendChild(tally);
    const nr = el('div', 'next-row');
    const fin = el('button', 'btn primary', '见结局 ▶'); fin.onclick = () => showEnd();
    nr.appendChild(fin); d.appendChild(nr);
  }
}
function toggleDrawer(on) { const d = $('#drawer'); if (on === undefined) d.classList.toggle('on'); else d.classList.toggle('on', on); }

/* —— 组方小游戏 —— */
function buildFormula(panel, loc) {
  const f = el('div', 'formula');
  f.appendChild(el('h3', null, '拟方 · 五脏五色调色盘'));
  f.appendChild(el('div', 'hint', loc.puzzle.hint));
  f.appendChild(el('div', 'jingfang', `<b>经方建议：</b>${loc.jingFang.name}<br><span style="color:var(--ink-soft)">${loc.jingFang.note}</span>`));
  const refrow = el('div', 'refrow');
  const wb = el('button', 'btn', '本草升降色盘 ▦'); wb.onclick = () => openBencaoWheel();
  refrow.appendChild(wb); f.appendChild(refrow);
  const sliders = el('div', 'sliders'); const refs = {};
  ORGAN_ORDER.forEach(k => {
    const o = ORGANS[k]; const col = el('div', 'scol');
    const sw = el('div', 'bzclr'); sw.style.background = o.hex;
    const range = document.createElement('input'); range.type = 'range'; range.min = 0; range.max = 100; range.value = 0;
    const val = el('div', 'val', '0'); const ref = el('div', 'ref', '经 ' + loc.puzzle.suggested[k]);
    range.oninput = () => { val.textContent = range.value; state.player[k] = +range.value; livePreview(loc, refs); updatePlan(loc, refs, planBox); };
    col.appendChild(el('div', 'bzname', o.color)); col.appendChild(sw); col.appendChild(el('div', 'zang', o.zang));
    col.appendChild(range); col.appendChild(val); col.appendChild(ref); sliders.appendChild(col);
    refs[k] = { range, val };
  });
  f.appendChild(sliders);
  const planBox = el('div', 'plan'); f.appendChild(planBox);
  const actions = el('div', 'actions');
  const reset = el('button', 'btn', '归零'); reset.onclick = () => { ORGAN_ORDER.forEach(k => { refs[k].range.value = 0; refs[k].val.textContent = '0'; state.player[k] = 0; }); livePreview(loc, refs); updatePlan(loc, refs, planBox); };
  const submit = el('button', 'btn primary', '拟方入药'); submit.onclick = () => submitFormula(loc, refs);
  actions.appendChild(reset); actions.appendChild(submit); f.appendChild(actions);
  panel.appendChild(f);
  updatePlan(loc, refs, planBox);
}
function derivePlan(loc, profile) {
  const rules = FORMULA_RULES[loc.id]; if (!rules) return null;
  const items = [], seen = new Set();
  const add = (id, v, main) => {
    if (seen.has(id)) return; seen.add(id);
    const h = HERBS[id]; if (!h) return;
    const lo = h.dose[0], hi = h.dose[1];
    const dose = main ? Math.round((lo + hi) / 2) : Math.max(lo, Math.min(hi, Math.round(lo + (v / 100) * (hi - lo))));
    items.push({ name: h.name, dose, note: h.note, main });
  };
  rules.base.forEach(id => add(id, 50, true));
  ORGAN_ORDER.forEach(k => {
    const v = profile[k] || 0;
    if (v >= 35 && rules.byOrgan[k]) {
      const cand = rules.byOrgan[k].find(id => !seen.has(id));
      if (cand) add(cand, v, false);
    }
  });
  return items;
}
function updatePlan(loc, refs, box) {
  const items = derivePlan(loc, currentProfile(refs));
  if (!items) { box.innerHTML = ''; return; }
  if (!items.length) { box.innerHTML = '<div class="ph">拖动五色，拟出具体用药方案。</div>'; return; }
  const lis = items.map(it => `<div class="ph-item"><b class="herb-link" data-herb="${it.name}">${it.name}</b><span class="pd">${it.dose}g</span><span class="pn">${it.note}</span>${it.main ? '<i>主</i>' : ''}</div>`).join('');
  box.innerHTML = `<div class="ph-title">具体用药方案（依五色强弱化裁 · 实时）</div><div class="ph-list">${lis}</div>`;
}
function currentProfile(refs) {
  const p = {}; ORGAN_ORDER.forEach(k => p[k] = refs[k] ? +refs[k].range.value : 0);
  if (Object.values(p).every(v => v === 0) && Object.keys(state.player).length) ORGAN_ORDER.forEach(k => p[k] = state.player[k] || 0);
  return p;
}
function dominantFrom(profile) {
  let best = 'pi', bv = -1;
  ORGAN_ORDER.forEach(k => { if ((profile[k] || 0) > bv) { bv = profile[k] || 0; best = k; } });
  return bv <= 0 ? 'pi' : best;
}
function livePreview(loc, refs) {
  const p = currentProfile(refs);
  const dom = dominantFrom(p);
  if (world) { world.setTint(ORGANS[dom].hex); world.setOrganIntensities(p); }
}
function submitFormula(loc, refs) {
  const p = currentProfile(refs);
  if (ORGAN_ORDER.reduce((s, k) => s + (p[k] || 0), 0) === 0) { toast('未曾下笔，何来组方？'); return; }
  const sug = loc.puzzle.suggested;
  const maxd = ORGAN_ORDER.reduce((s, k) => s + Math.abs((p[k] || 0) - sug[k]), 0);
  const denom = ORGAN_ORDER.reduce((s, k) => s + (sug[k] + 100), 0);
  const match = 1 - maxd / denom;
  const grade = match > 0.78 ? 'shang' : match > 0.5 ? 'zhong' : 'xia';
  const score = Math.round(match * 100);
  const t = (state.levelStop = performance.now()) - state.levelStart;
  state.player = p; state.grade = grade;
  state.lastScore = score; state.lastTime = t;
  state.levels[state.idx] = { name: loc.name, score, time: t, grade };
  const dom = dominantFrom(p);
  if (world) {
    world.setTint(ORGANS[dom].hex);
    world.setOrganIntensities(p);
    world.setCinematic(true);
    $('#sceneScreen').classList.add('cinema');
  }
  state.visited.add(loc.id);
  buildMap();
  playOutcome(loc, grade, dom);
}
function renderResult(loc, grade, domKey) {
  const out = loc.outcomes && loc.outcomes[grade];
  if (!out || !out.line) { console.warn('Missing result outcome for', loc.id, grade); return; }
  const wm = WORLD_MODEL[domKey];
  const label = { shang: '上工 · 效如桴鼓', zhong: '中工 · 平稳收功', xia: '下工 · 偏性生变' }[grade];
  const old = $('.result', $('#drawer')); if (old) old.remove();
  const r = el('div', 'result');
  r.innerHTML = `<div class="grade ${grade}">${label}</div><div class="score-line">用药评分 ${state.lastScore} · 用时 ${Math.floor(state.lastTime / 1000)}″</div><p>${out.line}</p>` +
    `<div class="env">环境衍生：${out.envNote || wm.env}</div>` +
    `<div class="world">由「五色深浅排列」推得主干为 <b>${ORGANS[domKey].color}（${ORGANS[domKey].zang}）</b>：<br>空间：${wm.env}<br>服化：${wm.dress}</div>`;
  const nr = el('div', 'next-row');
  const mb = el('span', 'mapback', '◀ 返回地图'); mb.onclick = () => { if (world) { cancelAnimationFrame(raf); world.dispose(); world = null; } buildMap(); show('map'); };
  const ni = LOCATIONS.findIndex(l => l.id === loc.id) + 1;
  if (ni < LOCATIONS.length) { const nx = el('button', 'btn primary', '前往下一境 ▶'); nx.onclick = () => enterScene(ni); nr.appendChild(mb); nr.appendChild(nx); }
  else { const fin = el('button', 'btn primary', '功成 · 见结局 ▶'); fin.onclick = () => showEnd(); nr.appendChild(mb); nr.appendChild(fin); }
  r.appendChild(nr); $('#drawer').appendChild(r);
  const items = derivePlan(loc, state.player);
  if (items && items.length) {
    const lis = items.map(it => `<div class="ph-item"><b class="herb-link" data-herb="${it.name}">${it.name}</b><span class="pd">${it.dose}g</span><span class="pn">${it.note}</span>${it.main ? '<i>主</i>' : ''}</div>`).join('');
    r.insertAdjacentHTML('beforeend', `<div class="plan plan-out"><div class="ph-title">本方案用药（${grade === 'shang' ? '上工' : grade === 'zhong' ? '中工' : '下工'}化裁）</div><div class="ph-list">${lis}</div></div>`);
  }
  $('#drawer').scrollTop = $('#drawer').scrollHeight;
}

/* —— 转归电影动画 —— */
function playOutcome(loc, grade, domKey) {
  const out = loc.outcomes && loc.outcomes[grade];
  if (!out || !out.line) { console.warn('Missing outcome for', loc.id, grade); return; }
  const layer = $('#outcomeLayer');
  layer.classList.remove('on'); void layer.offsetWidth; // 清除旧弹窗并重启动画
  layer.classList.add('on');
  const wm = WORLD_MODEL[domKey];
  const cap = $('#outcomeCap');
  const label = { shang: '上工 · 效如桴鼓', zhong: '中工 · 平稳收功', xia: '下工 · 偏性生变' }[grade];
  cap.innerHTML = `<div class="ol">${label}</div>${out.line}<br><br><span class="osub">用药评分 ${state.lastScore} · 用时 ${Math.floor(state.lastTime / 1000)}″<br>转归 · ${out.envNote || wm.env}<br>服化 · ${wm.dress}</span>`;
  cap.classList.remove('show'); void cap.offsetWidth; cap.classList.add('show');
  $('#outcomeGo').onclick = () => {
    layer.classList.remove('on');
    renderResult(loc, grade, domKey);
    toggleDrawer(true);
  };
}

/* —— 结局 —— */
function showEnd() {
  if (world) { cancelAnimationFrame(raf); world.dispose(); world = null; }
  $('#endScreen').classList.add('on'); screens.scene.classList.remove('on');
  const inner = $('#endInner');
  const recs = Object.keys(state.levels).map(k => state.levels[k]);
  const n = recs.length;
  const total = recs.reduce((s, r) => s + r.score, 0);
  const tTime = recs.reduce((s, r) => s + r.time, 0);
  const avg = n ? Math.round(total / n) : 0;
  const rank = rankFor(avg);
  inner.innerHTML = `<h2>游医天下 · 行旅总结</h2>` +
    `<p>明清之交，瘟疫横行。游医张天一以四大经典之智，走遍九境，终归乡野。</p>` +
    `<div class="end-rank ${rank.cls}">医道评级 · ${rank.title}</div>` +
    `<div class="end-score">总评 ${avg} 分（${n} 方 · 每方满分 100）</div>` +
    `<div class="end-time">合计用时 ${fmtTime(tTime)}</div>` +
    (n ? `<table class="end-table"><thead><tr><th>境</th><th>用药评分</th><th>用时</th><th>工</th></tr></thead><tbody>` +
      recs.map(r => `<tr><td>${r.name}</td><td>${r.score}</td><td>${fmtTime(r.time)}</td><td>${gradeLabel(r.grade)}</td></tr>`).join('') +
      `</tbody></table>` : '<div class="end-empty">尚未于任何一境拟方施治。</div>') +
    `<button class="btn primary" id="restartBtn">再游一程</button>`;
  $('#restartBtn').onclick = () => {
    state.visited = new Set(); state.idx = 0; state.player = {}; state.grade = null;
    state.levels = {}; state.levelStart = 0; state.levelStop = 0;
    $('#endScreen').classList.remove('on'); buildMap(); show('map');
  };
}
/* 旅程总结：医道评级 / 时间格式化 / 上中下工 */
function rankFor(avg) {
  if (avg >= 90) return { cls: 'r1', title: '神医 · 杏林国手' };
  if (avg >= 75) return { cls: 'r2', title: '良医 · 着手成春' };
  if (avg >= 60) return { cls: 'r3', title: '游医 · 悬壶济世' };
  if (avg >= 40) return { cls: 'r4', title: '学徒 · 初窥门径' };
  return { cls: 'r5', title: '蒙童 · 再接再厉' };
}
function fmtTime(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return s < 60 ? `${s}″` : `${Math.floor(s / 60)}′${s % 60}″`;
}
function gradeLabel(g) { return { shang: '上工', zhong: '中工', xia: '下工' }[g] || '—'; }

/* —— 工具 —— */
function htmlToNode(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }

/* 用药方案里的药名 → 打开本草升降色盘并定位该药 */
document.addEventListener('click', (e) => {
  const a = e.target.closest('.herb-link');
  if (a) openBencaoWheel(a.dataset.herb);
});

/* —— 右上角：本草升降色盘（本集相关嵌入） —— */
function episodeHerbs(loc) {
  const set = new Set();
  const r = window.YIYI.FORMULA_RULES[loc.id];
  if (r) {
    r.base.forEach(id => { const h = window.YIYI.HERBS[id]; if (h) set.add(h.name); });
    Object.values(r.byOrgan).forEach(arr => arr.forEach(id => { const h = window.YIYI.HERBS[id]; if (h) set.add(h.name); }));
  }
  return set;
}
function buildBwEmbed(loc) {
  const old = $('#bwEmbed'); if (old) old.remove();
  const herbs = episodeHerbs(loc);
  const domKey = loc.puzzle ? dominantFrom(loc.puzzle.suggested) : 'pi';
  const o = ORGANS[domKey];
  const embed = el('div', 'bw-embed collapsed'); embed.id = 'bwEmbed';
  embed.innerHTML = `
    <div class="bwe-head">
      <b>本草升降色盘</b>
      <span class="bwe-tag">本集 · ${loc.name}</span>
      <span class="bwe-chip" style="background:${o.hex};color:${contrastColor(o.hex)}">${o.color}·${o.zang}</span>
    </div>
    <div class="bwe-wheel"><svg viewBox="0 0 760 760" class="bwe-svg" role="img" aria-label="本集本草升降色盘"></svg></div>
    <div class="bwe-legend">${
      [...herbs].map(n => `<span class="bwe-herb" data-herb="${n}">${n}</span>`).join('') ||
      '<span class="bwe-empty">自由之境 · 五色随心</span>'
    }</div>`;
  $('#sceneScreen').appendChild(embed);
  mountWheel(embed.querySelector('.bwe-svg'), { highlight: herbs, onPick: (name) => openBencaoWheel(name) });
  embed.querySelectorAll('.bwe-herb').forEach(s => s.onclick = () => openBencaoWheel(s.dataset.herb));
}

/* —— 我要上传：拍照 → 望色归脏 → 拟方 —— */
function openUpload(loc) {
  let ov = document.getElementById('uploadOverlay');
  if (ov) { ov.classList.add('on'); return; }
  ov = el('div', 'up-overlay'); ov.id = 'uploadOverlay';
  ov.innerHTML = `
    <div class="up-modal">
      <div class="up-head">
        <div class="up-t"><b>望形开方 · 上传一相</b><span>传一张照片，本游医依「五色入五脏」推演，为你拟一方。纯属游戏演绎，不作临床依据。</span></div>
        <button class="up-close" aria-label="关闭">✕</button>
      </div>
      <div class="up-stage">
        <div class="up-left">
          <label class="up-drop" id="upDrop">
            <input type="file" id="upFile" accept="image/*" hidden>
            <div class="up-placeholder" id="upPh">点击 / 拖拽照片至此<br><span>（舌苔 · 面色 · 景物皆可）</span></div>
            <img class="up-img" id="upImg" alt="" hidden>
          </label>
        </div>
        <div class="up-right-col">
          <div class="up-exo" id="upExo" title="点击与 外泌体晨光 对话">
            <div class="up-exo-body">
              <div class="up-exo-glow"></div>
              <div class="up-exo-core"></div>
            </div>
            <span class="up-exo-lbl">外泌体晨光</span>
            <span class="up-exo-lbl">点击对话</span>
          </div>
          <div class="up-right" id="upResult"><div class="up-empty">尚未上传。传图后，这里会给出「望色归脏 → 拟方」的推演结果。</div></div>
        </div>
      </div>
      <div class="up-bazi">
        <label class="up-bazi-l">人物生辰八字（选填）</label>
        <input class="up-bazi-i" id="upBazi" type="text" placeholder="如 庚午 丁亥 甲子 癸酉 · 八字将参与先天五行推演" autocomplete="off">
        <span class="up-bazi-s">天干地支四柱，将与其望色并观，参定先天体质与拟方取向。</span>
      </div>
      <div class="up-chat" id="upChat" hidden>
        <div class="up-chat-head">
          <b>与 外泌体晨光 对话</b>
        </div>
        <div class="up-chat-msgs" id="upChatMsgs"></div>
        <div class="up-chat-input">
          <input id="upChatIn" type="text" placeholder="对 TA 说点什么…（回车发送）" autocomplete="off">
          <button class="btn primary" id="upChatSend" type="button">发送</button>
        </div>
      </div>
      <div class="up-foot">本游戏不构成临床用药建议 · 所拟方药仅供剧情演绎，有病请及时就医</div>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('.up-close').onclick = () => ov.classList.remove('on');
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('on'); });

  const file = ov.querySelector('#upFile'), img = ov.querySelector('#upImg'), ph = ov.querySelector('#upPh'), drop = ov.querySelector('#upDrop');
  const recv = (f) => { if (f) handleUpload(f, img, ph, ov.querySelector('#upResult'), loc); };
  file.onchange = () => recv(file.files[0]);
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('on'); };
  drop.ondragleave = () => drop.classList.remove('on');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('on'); recv(e.dataTransfer.files[0]); };

  /* 与 NPC（外泌体晨光 · waixiti）对话：点击弹跳外泌体打开 */
  const exo = ov.querySelector('#upExo'), chat = ov.querySelector('#upChat'),
        msgs = ov.querySelector('#upChatMsgs'), cin = ov.querySelector('#upChatIn'),
        csend = ov.querySelector('#upChatSend');
  let convId = '';
  const addMsg = (who, text) => {
    const m = el('div', 'up-msg ' + who); m.textContent = text; msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
  };
  if (!msgs.dataset.init) {
    msgs.dataset.init = '1';
    addMsg('npc', '（外泌体晨光微微浮动）你来了。你欲问医理，还是这「外泌体」形貌的来历？');
  }
  exo.onclick = () => { chat.hidden = !chat.hidden; if (!chat.hidden) cin.focus(); };
  // 离线知识库兜底：后端未部署 / 未配置密钥 / 网络失败时，由「外泌体晨光」用游戏内置的
  // 五脏五色知识本地应答，保证一定能对话，不会报「load failed」。
  const offlineReply = (q) => {
    const t = q || '';
    const has = (...ks) => ks.some(k => t.includes(k));
    if (has('来历', '是谁', '什么', '外泌体', '你叫', '名字', '你谁')) {
      return '（外泌体晨光轻晃）我名唤「外泌体晨光」，是五行精气凝成的一缕药灵。你拟的每一张方子，都化作我身上的五色微光——这便是「五色入五脏」的显影。';
    }
    if (has('五脏', '五色', '肝', '心', '脾', '肺', '肾', '青', '赤', '黄', '白', '黑')) {
      return '（它指了指自身的五色流光）肝青木、心赤火、脾黄土、肺白金、肾黑水。你调哪一味色深，哪一脏便得滋养——这便是「拟方即调色」。';
    }
    if (has('拟方', '组方', '开方', '药方', '方子', '调色', '怎么玩', '玩法', '怎么治', '治')) {
      return '（晨光舒展）把处方想成五只色盏：肝青、心赤、脾黄、肺白、肾黑。斟酌剂量，便是在为这一境之人补虚泻实。斟好了，便看世界如何因你而变。';
    }
    if (has('望色', '归脏', '拍照', '上传', '照片', '图', '面')) {
      return '（它凝神）望色归脏，是依「五色入五脏」推演：面上哪色偏盛，便知哪脏有恙。你传来的图，我会试着归脏、拟方——权作一隅之见，有病仍须延医。';
    }
    if (has('九境', '地图', '疫', '天下', '关卡', '哪里', '地方')) {
      return '（它望向远处）九境顺着运河次第铺开，从市井的咳，到关隘的血、园林的郁、湖上的湿……你以游医之眼走过，每一境都是一道医案。';
    }
    if (has('你好', '在吗', '在不在', '嗨', '您好', '在')) {
      return '（晨光微亮）我在。你欲问医理，还是这「外泌体」形貌的来历？';
    }
    return '（外泌体晨光浮了浮）你所问，我且以医理相答：医者意也，不执一药、不泥一经。你若说这境的偏性，或你拟的方子，我便与你细论。';
  };

  const sendChat = () => {
    const q = cin.value.trim(); if (!q) return;
    addMsg('me', q); cin.value = '';
    csend.disabled = true; csend.textContent = '…';
    const api = (window.GNPC_API && window.GNPC_API.trim()) || '/gnpc/chat';
    fetch(api, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'waixiti', query: q, conversationId: convId })
    })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j && j.reply) {
          convId = j.conversationId || convId;
          addMsg('npc', j.reply);
        } else if (j && j.error) {
          // 后端真的返回了错误（如未配置 / 密钥不对）→ 如实展示，便于排查真实 GNPC 配置
          addMsg('npc', '（后端返回：「' + j.error + '」）');
        } else {
          // 网络连不通（load failed）→ 离线知识库兜底
          addMsg('npc', offlineReply(q));
        }
      })
      .catch(() => addMsg('npc', offlineReply(q)))
      .finally(() => { csend.disabled = false; csend.textContent = '发送'; });
  };
  csend.onclick = sendChat;
  cin.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

  ov.classList.add('on');
}
function handleUpload(file, img, ph, resultEl, loc, baziEl) {
  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result; img.hidden = false; ph.hidden = true;
    const im = new Image();
    im.onload = () => { const organ = diagnoseFromImage(im); renderUploadResult(organ, loc, resultEl, reader.result); };
    im.src = reader.result;
  };
  reader.readAsDataURL(file);
}
function hexToRgb(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}
function diagnoseFromImage(img) {
  const c = document.createElement('canvas'); c.width = 72; c.height = 72;
  const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, 72, 72);
  const d = ctx.getImageData(0, 0, 72, 72).data;
  const anchors = ORGAN_ORDER.map(k => ({ k, rgb: hexToRgb(ORGANS[k].hex) }));
  const count = {};
  for (let i = 0; i < d.length; i += 4) {
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (s < 0.14) continue;                 // 中性灰不投票，避免偏黑/偏白
    let best = null, bd = 1e9;
    anchors.forEach(a => {
      const dr = d[i] - a.rgb[0], dg = d[i + 1] - a.rgb[1], db = d[i + 2] - a.rgb[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bd) { bd = dist; best = a.k; }
    });
    if (best) count[best] = (count[best] || 0) + 1;
  }
  let best = 'pi', bv = -1;
  ORGAN_ORDER.forEach(k => { if ((count[k] || 0) > bv) { bv = count[k] || 0; best = k; } });
  return best;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function herbsForOrgan(k, n = 3) {
  const H = window.YIYI.HERBS; const ids = Object.keys(H).filter(id => (H[id].zang[k] || 0) >= 2);
  return shuffle(ids).slice(0, n).map(id => { const h = H[id]; const dose = Math.round((h.dose[0] + h.dose[1]) / 2); return { name: h.name, dose, note: h.note }; });
}
function renderUploadResult(organKey, loc, resultEl, dataURL, baziEl) {
  const o = ORGANS[organKey];
  const textHex = organTextHex(organKey);
  let items = herbsForOrgan(organKey, 3);
  let baziBlock = '';
  const baziInput = document.getElementById('upBazi');
  const baziStr = baziInput && baziInput.value ? baziInput.value.trim() : '';
  if (baziStr) {
    const counts = baziToElements(baziStr);
    const dom = baziDominant(counts);
    const domOrgan = dom ? ORGANS[ELEM_ORGAN[dom]] : null;
    const concord = domOrgan && domOrgan.key === organKey;
    baziBlock = `
      <div class="up-bazi-out">
        <div class="up-line">八字 <b>${baziStr}</b>：先天 <b style="color:${domOrgan ? organTextHex(domOrgan.key) : '#555'}">${dom}行</b> 为体。</div>
        <div class="bz-tags">${['木','火','土','金','水'].map(e => `<span class="bz-tag" style="--c:${organTextHex(ORGANS[ELEM_ORGAN[e]].key)}">${e}·${counts[e] || 0}</span>`).join('')}</div>
        <div class="up-sub">${concord ? `先天 <b style="color:${organTextHex(domOrgan.key)}">${dom}行</b> 与望色所主「${o.zang}」相合，根基可据，拟方宜顺势。` : domOrgan ? `先天 <b style="color:${organTextHex(domOrgan.key)}">${dom}行</b> 偏盛，与望色所主「${o.zang}」异趣，拟方当兼顾${domOrgan.zang}（${dom}）。` : '八字五行未辨，仅依望色拟方。'}</div>
      </div>`;
    if (domOrgan && domOrgan.key !== organKey) {
      const extra = herbsForOrgan(domOrgan.key, 1)[0];
      if (extra) items.push({ ...extra, bazi: true });
    }
  }
  const locDom = loc.puzzle ? dominantFrom(loc.puzzle.suggested) : 'pi';
  const match = organKey === locDom;
  const tie = match
    ? `正合本境「${loc.name}」之机（主${ORGANS[locDom].zang}）。`
    : `与本境「${loc.name}」之机异趣，可两相参看。`;
  const lis = items.map(it => `<div class="ph-item"><b class="herb-link" data-herb="${it.name}">${it.name}</b>${it.bazi ? '<i>先天</i>' : ''}<span class="pd">${it.dose}g</span><span class="pn">${it.note}</span></div>`).join('');
  resultEl.innerHTML = `
    <div class="up-res">
      ${baziBlock}
      <div class="up-diag">
        <img class="up-thumb" src="${dataURL}" alt="上传之相">
        <div>
          <div class="up-line">望此相，以色归脏：主 <b style="color:${textHex}">${o.color}·${o.zang}</b>（五行·${o.element}）</div>
          <div class="up-sub">${o.color}属${o.element}，应${o.zang}。本游医依五色入五脏之理，从象推形，择药以配其偏性。所拟仅供剧情演绎，不作临床依据。</div>
          <div class="up-sub">${tie}</div>
        </div>
      </div>
      <div class="ph-title">推拟用药（游戏演绎）</div>
      <div class="ph-list">${lis}</div>
    </div>`;
}
