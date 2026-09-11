/* ============================================================================
 *  游医天下 · 3D 美术层（Three.js）
 *  程序化白描占位场景/角色；若 models/<境>_scene.glb / _char.glb 存在则加载替换。
 *  新增：五脏发光体（五色显影于人物对应五脏）+ 辉光后期（手工级画面）。
 * ==========================================================================*/
import * as THREE from 'three';

const PAPER = 0xf3f1e8;
const INK = 0x3a382f;

/* 角色恒立于画面右侧（避开左下角的「拟方」抽屉），FOCUS 为相机注视中心，
 * 让人物稳定落在右三分之一处，左侧留给叙事与 UI。 */
const CHAR_X = 1.6;
const FOCUS = new THREE.Vector3(0, 1.2, 0.5);

function inkMat(hex, rough = 0.95) {
  return new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.0, flatShading: true });
}

/* 五脏发光体布局（角色本地坐标；角色站立原点在地面，躯干部约 y=1.0~1.7）
 * twin 表示左右成对（肺、肾）。shen 为黑，抬高一点亮度以保证可见。 */
const ORGAN_GLOW = [
  { key:'gan',  pos:[-0.30, 1.36, 0.20], color:0x2f8f86 },          // 肝·青（左胁）
  { key:'xin',  pos:[ 0.00, 1.52, 0.27], color:0xc0392b },          // 心·赤（膻中）
  { key:'pi',   pos:[ 0.10, 1.00, 0.29], color:0xcaa12f },          // 脾·黄（中脘）
  { key:'fei',  pos:[-0.27, 1.56, 0.16], color:0xeaeae3, twin:true }, // 肺·白（左右胸膺）
  { key:'shen', pos:[-0.46, 0.86, 0.02], color:0x4a4a66, twin:true }, // 肾·黑（腰子，两侧）
];

/* 每境的程序化母题（占位，可被子模型替换） */
function buildMotif(motif) {
  const g = new THREE.Group();
  const m1 = inkMat(0x8d897c), m2 = inkMat(0x6f6c60), m3 = inkMat(0x4a463c);
  const add = (geo, mat, x, y, z) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  switch (motif) {
    case 'market':
      for (let i = -1; i <= 1; i++) {
        add(new THREE.BoxGeometry(1.4, 1.2, 1.4), m1, i * 1.8, 0.6, -1.5);
        const roof = add(new THREE.ConeGeometry(1.2, 0.6, 4), m3, i * 1.8, 1.5, -1.5); roof.rotation.y = Math.PI / 4;
      }
      break;
    case 'border':
      add(new THREE.BoxGeometry(3.4, 2.4, 0.4), m2, 0, 1.2, -1.5);
      add(new THREE.BoxGeometry(1, 0.6, 0.2), m3, 0, 2.0, -1.4);
      add(new THREE.CylinderGeometry(0.06, 0.06, 3), m3, 1.4, 1.5, -1.2);
      break;
    case 'yamen':
      add(new THREE.BoxGeometry(3, 2, 0.4), m2, 0, 1, -1.6);
      add(new THREE.BoxGeometry(1, 0.6, 0.2), m3, 0, 2.0, -1.4);
      break;
    case 'garden':
      add(new THREE.DodecahedronGeometry(0.9), m2, -1.2, 0.9, -1.2);
      add(new THREE.CylinderGeometry(0.08, 0.12, 2.2), m3, 1.1, 1.1, -1.0);
      add(new THREE.SphereGeometry(0.6, 8, 6), m1, 1.1, 2.2, -1.0);
      break;
    case 'lake':
      const water = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshStandardMaterial({ color: 0x9fb3bd, roughness: 0.4, metalness: 0.1 }));
      water.rotation.x = -Math.PI / 2; water.position.y = 0.02; g.add(water);
      add(new THREE.BoxGeometry(1.6, 0.4, 0.7), m3, 0, 0.4, -0.5);
      break;
    case 'village':
      add(new THREE.BoxGeometry(1.6, 1.4, 1.6), m1, -1, 0.7, -1.4);
      add(new THREE.ConeGeometry(1.3, 0.9, 4), m3, -1, 1.8, -1.4).rotation.y = Math.PI / 4;
      add(new THREE.BoxGeometry(1.2, 1.1, 1.2), m1, 1, 0.55, -1.4);
      add(new THREE.ConeGeometry(1.0, 0.7, 4), m3, 1, 1.4, -1.4).rotation.y = Math.PI / 4;
      break;
    case 'exam':
      add(new THREE.BoxGeometry(1.6, 2, 1.2), m2, 0, 1, -1.5);
      add(new THREE.CylinderGeometry(0.05, 0.05, 1.4), m3, -0.9, 1.2, -1.2);
      add(new THREE.CylinderGeometry(0.05, 0.05, 1.4), m3, 0.9, 1.2, -1.2);
      break;
    case 'palace':
      add(new THREE.BoxGeometry(3.6, 2.2, 0.5), m2, 0, 1.1, -1.8);
      add(new THREE.ConeGeometry(3.0, 1.4, 4), m3, 0, 3.0, -1.8).rotation.y = Math.PI / 4;
      add(new THREE.CylinderGeometry(0.1, 0.1, 2.4), m3, 0, 2.2, -1.4);
      break;
    case 'country':
      add(new THREE.BoxGeometry(1.8, 1.2, 1.6), m1, 0, 0.6, -1.4);
      add(new THREE.ConeGeometry(1.4, 0.8, 4), m3, 0, 1.6, -1.4).rotation.y = Math.PI / 4;
      add(new THREE.CylinderGeometry(0.1, 0.14, 2.4), m2, 1.4, 1.2, -1.0);
      add(new THREE.SphereGeometry(0.9, 8, 6), m1, 1.4, 2.5, -1.0);
      break;
  }
  g.position.z = -1.0;
  return g;
}

/* 程序化角色占位（低多边形白描） */
function buildCharacterPlaceholder(dominantHex) {
  const g = new THREE.Group();
  const skin = inkMat(0xe9e3d6), robe = inkMat(0x6f6c60);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.0, 4, 8), robe); body.position.y = 1.0; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), skin); head.position.y = 1.95; head.castShadow = true; g.add(head);
  g.userData.clickable = true;
  return g;
}

/* 五脏光斑（柔和发光精灵，替代硬圈/腰环；加法混合产生晕染感） */
let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 128;
  const ctx = cvs.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(cvs); return _glowTex;
}
function buildOrgans(character) {
  const groups = {};
  ORGAN_GLOW.forEach(def => {
    const arr = [];
    const xs = def.twin ? [-def.pos[0], def.pos[0]] : [def.pos[0]];
    xs.forEach(x => {
      const mat = new THREE.SpriteMaterial({ map: glowTexture(), color: def.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.position.set(x, def.pos[1], def.pos[2] + 0.06);
      sp.scale.setScalar(0.9);
      sp.renderOrder = 5;
      character.add(sp);
      arr.push({ sprite: sp, mat });
    });
    groups[def.key] = arr;
  });
  return groups;
}

/* 柔和的脚下阴影贴图 */
function softShadowTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = 128; cvs.height = 128;
  const ctx = cvs.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.35)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cvs);
}


/* 2.5D 景深舞台：取材自本境背景图，裁切为「后景 / 中景 / 近景 / 前景」多层，
 * 各层随指针做视差位移（近层位移大、远层位移小），形成前中后景别，
 * 取代原先程序化的 cone/box 简陋建模。 */
function buildParallaxStage(scene, url) {
  if (!url) return { update() {} };
  const img = new Image();
  const layers = [];
  img.onload = () => {
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    if (!W || !H) return;
    function makeLayer(opt) {
      const { z, w, h, sx, sy, sw, sh, depth, baseY = h / 2 - 0.5, mode = 'none' } = opt;
      const cw = Math.max(2, Math.round(sw)), ch = Math.max(2, Math.round(sh));
      const cvs = document.createElement('canvas'); cvs.width = cw; cvs.height = ch;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      if (mode === 'radial') {
        ctx.globalCompositeOperation = 'destination-in';
        const g = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.18, cw / 2, ch / 2, Math.max(cw, ch) * 0.62);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
      } else if (mode === 'topfade') {
        ctx.globalCompositeOperation = 'destination-in';
        const g = ctx.createLinearGradient(0, 0, 0, ch);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(0,0,0,1)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
      }
      const tex = new THREE.CanvasTexture(cvs);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      plane.position.set(0, baseY, z);
      plane.renderOrder = z;
      plane.userData = { depth, baseY };
      scene.add(plane);
      layers.push(plane);
    }
    // 后景：整幅远景平面，置于深远处，微视差
    makeLayer({ z: -18, w: 54, h: 30, sx: 0, sy: 0, sw: W, sh: H, depth: 0.02 });
    // 中景：取画面中部，径向羽化，制造空间纵深
    makeLayer({ z: -9, w: 38, h: 21, sx: W * 0.13, sy: H * 0.10, sw: W * 0.74, sh: H * 0.80, depth: 0.09, mode: 'radial' });
    // 近景：取中下部分，径向羽化，略前于中景
    makeLayer({ z: -3, w: 34, h: 16, sx: W * 0.06, sy: H * 0.45, sw: W * 0.88, sh: H * 0.55, depth: 0.20, mode: 'radial' });
    // 前景：相机脚下的近景带（底部），顶部羽化淡出，位于角色之前，强化前中后景别
    makeLayer({ z: 2.4, w: 64, h: 7, sx: W * 0.08, sy: H * 0.80, sw: W * 0.84, sh: H * 0.20, depth: 0.45, baseY: -3.2, mode: 'topfade' });
  };
  img.src = url;
  return {
    update(px, py) {
      for (const p of layers) {
        const d = p.userData.depth;
        p.position.x = -px * d * 6;
        p.position.y = p.userData.baseY + py * d * 3;
      }
    }
  };
}

/* 大气粒子：按每境母题生成不同的空间氛围（雪 / 花瓣 / 萤火 / 炊烟 / 落叶…） */
function createAtmosphere(scene, motif) {
  const presets = {
    market: { color: 0xcdbb95, count: 120, size: 0.06, fall: 0.25, sway: 0.3, yMax: 7,  glow: false },
    border: { color: 0xffffff, count: 280, size: 0.08, fall: 0.50, sway: 0.2, yMax: 10, glow: false },
    yamen:  { color: 0xd9d3c5, count: 110, size: 0.05, fall: 0.18, sway: 0.4, yMax: 7,  glow: false },
    garden: { color: 0xe7b3c2, count: 150, size: 0.07, fall: 0.28, sway: 0.5, yMax: 8,  glow: false },
    lake:   { color: 0xcdd8de, count: 100, size: 0.22, fall: 0.06, sway: 0.6, yMax: 5,  glow: false },
    village:{ color: 0xff9a4d, count: 90,  size: 0.06, fall: 0.40, sway: 0.3, yMax: 7,  glow: true  },
    exam:   { color: 0xffd98a, count: 120, size: 0.05, fall: 0.20, sway: 0.4, yMax: 7,  glow: true  },
    palace: { color: 0xf0d28a, count: 140, size: 0.055,fall: 0.16, sway: 0.35,yMax: 9,  glow: true  },
    country:{ color: 0xb9c98e, count: 120, size: 0.06, fall: 0.24, sway: 0.5, yMax: 8,  glow: false },
  };
  const p = presets[motif] || presets.market;
  const N = p.count;
  const pos = new Float32Array(N * 3);
  const phase = new Float32Array(N);
  const spd = new Float32Array(N);
  const area = 22;
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * area;
    pos[i * 3 + 1] = Math.random() * p.yMax;
    pos[i * 3 + 2] = (Math.random() - 0.5) * area - 4;
    phase[i] = Math.random() * Math.PI * 2;
    spd[i] = 0.6 + Math.random() * 0.8;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: p.color, size: p.size, map: glowTexture(), transparent: true,
    depthWrite: false, opacity: p.glow ? 0.9 : 0.7,
    blending: p.glow ? THREE.AdditiveBlending : THREE.NormalBlending,
    sizeAttenuation: true, fog: true,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = 2;
  scene.add(points);
  return {
    points,
    update(dt) {
      const a = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        a[i * 3 + 1] -= p.fall * spd[i] * dt;
        a[i * 3] += Math.sin(phase[i] + performance.now() * 0.0004 * spd[i]) * p.sway * dt * 0.4;
        if (a[i * 3 + 1] < -1) { a[i * 3 + 1] = p.yMax; a[i * 3] = (Math.random() - 0.5) * area; }
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/* 角色：将已生成的人物立绘做成面向相机的广告牌，素白底抠成透明 */
function makeCharBillboard(url) {
  const group = new THREE.Group();
  group.userData.isBillboard = true;
  group.userData.clickable = true;
  // 脚下接触阴影：强接地暗示，避免立绘悬浮如幽灵
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshBasicMaterial({ map: softShadowTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.0;
  shadow.renderOrder = 3;
  group.add(shadow);
  new THREE.TextureLoader().load(url, (tex) => {
    const img = tex.image;
    const w = img.width || 512, h0 = img.height || 1024;
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h0;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h0);
    const data = ctx.getImageData(0, 0, w, h0), d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 238 && d[i + 1] > 238 && d[i + 2] > 238) d[i + 3] = 0; // 抠掉素白背景
    }
    ctx.putImageData(data, 0, 0);
    const ctex = new THREE.CanvasTexture(cvs);
    ctex.colorSpace = THREE.SRGBColorSpace;
    const aspect = h0 / w;
    const h = 2.3;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(h / aspect, h),
      new THREE.MeshBasicMaterial({ map: ctex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    plane.position.y = h / 2;
    plane.renderOrder = 4;
    group.add(plane);
    group.userData.plane = plane;
  });
  return group;
}

/* 青石板等脚下建模已移除：周阿公直接以 2D 立绘贴地呈现，不再叠加 3D 坐具。 */

export function createWorld(container, loc, dominantHex) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.id = 'threeCanvas';

  // 鼠标视差：记录目标偏移，render 中平滑插值，强化空间沉浸
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointerMove = (e) => {
    const r = container.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  container.addEventListener('pointermove', onPointerMove);

  const scene = new THREE.Scene();
  const tint = new THREE.Color(dominantHex);
  scene.background = null; // 背景图改由 #bgLayer 以整图铺满（见 game.js enterScene）
  scene.fog = new THREE.Fog(0xe9e6dd, 18, 46);

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 2.4, 6.2);
  camera.lookAt(FOCUS);

  // 灯光
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9688, 0.9));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(4, 8, 5); dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024); scene.add(dir);
  const rim = new THREE.PointLight(tint.getHex(), 0.6, 30); rim.position.set(-4, 3, -3); scene.add(rim);

  // 背景图（#bgLayer）已自带场景地台与光影，3D 不再叠加程序化地面/投影，以免遮挡背景


  // 背景图改由 #bgLayer 整图铺满（不再裁切视差层），3D 仅叠加角色与五脏光影
  const stage = null;
  const atmosphere = createAtmosphere(scene, loc.motif);

  const character = loc.char ? makeCharBillboard(loc.char) : buildCharacterPlaceholder(dominantHex);
  // 市井·周阿公：挪到背景里右侧木凳/长凳的位置，y 抬高呈坐姿，z 后推、缩放匹配背景透视
  if (loc.id === 'shijing') {
    character.position.set(0.7, -0.75, -0.3); // 继续往左下挪
    character.scale.setScalar(1.12);
  } else if (loc.id === 'fuyao') {
    // 府衙：人物对齐案后座位正心，略下沉似落座
    character.position.set(0.08, -0.58, 0.48);
    character.scale.setScalar(1.0);
  } else if (loc.id === 'dangzhou') {
    // 湖心：人物脚靠近船缘，向船身前移并下沉
    character.position.set(1.58, -0.65, -0.02);
    character.scale.setScalar(1.0);
  } else {
    const charY = loc.id === 'cunliu' ? -0.45 : -0.22;
    character.position.set(CHAR_X, charY, 0.5);
  }
  scene.add(character);

  // 服化道：已移除程序化道具（腰环/硬圈/叙事几何），仅保留立绘与五脏光斑
  const organs = buildOrgans(character);

  const world = {
    renderer, scene, camera, character, organs,
    charHit: character,
    focus: FOCUS,
    cinematic: false,
    camAngle: 0,
    clock: new THREE.Clock(),
    atmosphere,
    stage,
    pointer,
    setOrganIntensities(profile) {
      ORGAN_GLOW.forEach(def => {
        const v = Math.max(0, Math.min(1, (profile[def.key] || 0) / 100));
        (organs[def.key] || []).forEach(o => {
          o.mat.opacity = v * 0.7;
          o.sprite.scale.setScalar(0.6 + v * 1.2);
        });
      });
      const maxV = Math.max(profile.gan||0, profile.xin||0, profile.pi||0, profile.fei||0, profile.shen||0) / 100;

    },
    setTint(hex) {
      const t = new THREE.Color(hex);
      rim.color.copy(t);

      const plane = character.userData.plane;
      if (plane) plane.material.color.copy(new THREE.Color(0xffffff).lerp(t, 0.18));
    },
    setCinematic(on) {
      this.cinematic = on;
      if (on) this.camAngle = 0;
    },
    render() {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      if (this.atmosphere) this.atmosphere.update(dt);
      if (character.userData.isBillboard) {
        character.rotation.y = Math.atan2(camera.position.x - character.position.x, camera.position.z - character.position.z);
      }
      // 鼠标视差：本帧临时偏移相机并回退，避免与 loop 的相机插值相互累积
      this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.06;
      this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.06;
      if (this.stage) this.stage.update(this.pointer.x, this.pointer.y);
      const ox = this.pointer.x * 0.7, oy = -this.pointer.y * 0.35;
      camera.position.x += ox; camera.position.y += oy;
      camera.lookAt(this.focus);
      renderer.render(scene, camera);
      camera.position.x -= ox; camera.position.y -= oy;
    },
    onResize() {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    },
    dispose() {
      container.removeEventListener('pointermove', onPointerMove);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
  return world;
}
