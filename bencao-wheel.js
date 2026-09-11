/* ============================================================================
 *  本草升降色盘 · 游医天下内嵌图鉴
 *  以明度示「升降浮沉」，色相分五脏五行（肝青木 / 心赤火 / 脾黄土 / 肺白金 / 肾黑水）。
 *  可挂载到任意 <svg>（浮层图鉴 / 右上角本集嵌入），并支持按本集用药高亮。
 * ==========================================================================*/
const P = {
  huo:{glyph:'火',se:'赤',zang:'心',h:5,s:60,lo:24,hi:66},
  tu: {glyph:'土',se:'黄',zang:'脾',h:40,s:62,lo:26,hi:70},
  jin:{glyph:'金',se:'白',zang:'肺',h:44,s:14,lo:36,hi:92},
  shui:{glyph:'水',se:'黑',zang:'肾',h:203,s:28,lo:17,hi:62},
  mu: {glyph:'木',se:'青',zang:'肝',h:165,s:46,lo:22,hi:66}
};
const ORDER = ['huo','tu','jin','shui','mu'];

// [行, 名, 性味, 归经, 升降值(+升 −降), 升降依据]
const H = [
  ['mu','蔓荆子','辛苦微寒','肝膀胱',65,'子实本应下行，独其轻浮上达头面，疏散风热而清利头目'],
  ['mu','柴胡','苦平','肝胆',80,'升举清阳、透达少阳，为升散之药中最能引气上行者'],
  ['mu','菊花','甘苦微寒','肝肺',35,'质轻上浮以清头目，然平肝之力又稍牵其下，升中带敛'],
  ['mu','青蒿','苦辛寒','肝胆',40,'气芳香而透，引阴分伏热外出，走向为升'],
  ['mu','天麻','甘平','肝',-15,'息风定眩，风阳自上而潜，性平而略偏于降'],
  ['mu','木瓜','酸温','肝脾',-25,'酸温收敛，舒筋而不发散，力在中下'],
  ['mu','芍药','酸苦微寒','肝脾',-40,'酸以敛阴和营，与桂枝之散正成一收一发'],
  ['mu','乌梅','酸平','肝脾肺',-50,'大酸固涩，安蛔敛气，纯为收降'],
  ['mu','决明子','甘苦咸微寒','肝',-45,'子实沉重，清肝兼润肠通便，热从下泄'],
  ['mu','五味子','酸温','肺心肾',-55,'敛肺纳气归肾，把上焦浮气收回下焦'],
  ['mu','山茱萸','酸微温','肝肾',-60,'酸温固涩，专固下焦精关'],
  ['mu','龙胆','苦寒','肝胆',-75,'大苦大寒直折肝火，泻热下行无余'],

  ['huo','连翘','苦微寒','心肺',60,'轻清透邪，散上焦心肺客热于外'],
  ['huo','远志','辛温','心肾',30,'辛温开窍豁痰，交通心肾而气行于上'],
  ['huo','红花','辛温','心肝',15,'辛温走散，行血通经，动而微升'],
  ['huo','当归','甘辛温','心肝脾',5,'古分头升、身守、尾降，全用则升降相济'],
  ['huo','丹参','苦微寒','心肝',-20,'专走血分，凉行而不上浮'],
  ['huo','茜草','苦寒','肝',-40,'凉血止血，血热得降'],
  ['huo','赤芍','苦微寒','肝',-45,'苦寒清降，凉血散瘀'],
  ['huo','灯心草','甘淡微寒','心小肠',-45,'质极轻而用在导赤，引心火从小肠下出，形轻用降'],
  ['huo','莲子心','苦寒','心',-55,'极苦直清心火，沉降不留'],
  ['huo','苦参','苦寒','心肝胃',-70,'苦寒燥湿兼利小便，湿热从下焦去'],
  ['huo','黄连','苦寒','心胃',-80,'苦降之最，泻心汤即取其直折而下'],
  ['huo','丹砂','甘微寒','心',-95,'矿物质重，镇心安神，为沉之极'],

  ['tu','黄芪','甘微温','脾肺',70,'补气而升阳举陷，土中升力最著'],
  ['tu','苍术','辛苦温','脾胃',45,'辛温燥烈，发散湿邪于表'],
  ['tu','人参','甘微苦微温','脾肺心',30,'大补元气，气足自能升举'],
  ['tu','陈皮','辛苦温','脾肺',25,'辛香理气，升降兼施而略偏于散'],
  ['tu','白术','苦甘温','脾胃',15,'健脾燥湿，守中而微向上'],
  ['tu','大枣','甘温','脾胃',5,'甘温补中，缓和居间'],
  ['tu','甘草','甘平','心肺脾胃',0,'甘平调和，不升不降，正当中央之位'],
  ['tu','饴糖','甘温','脾胃肺',0,'甘缓建中，力守中焦'],
  ['tu','山药','甘平','脾肺肾',-10,'平补三阴兼有涩性，稍向下沉'],
  ['tu','黄精','甘平','脾肺肾',-35,'甘润滋填，质厚而降'],
  ['tu','薏苡仁','甘淡微寒','脾胃肺',-50,'甘淡渗湿，水从小便去'],
  ['tu','茯苓','甘淡平','心脾肾',-55,'利水渗湿，专引水湿下行'],

  ['jin','麻黄','辛微苦温','肺膀胱',95,'辛温开腠发汗，升浮之极'],
  ['jin','白芷','辛温','肺胃',80,'辛香上达头面，通鼻窍止头痛'],
  ['jin','桔梗','苦辛平','肺',75,'载药上行，故有舟楫之称'],
  ['jin','细辛','辛温','肺肾',70,'辛烈走窜，散寒饮于上下内外'],
  ['jin','葱白','辛温','肺胃',70,'辛温通阳，白通汤取其发越'],
  ['jin','生姜','辛微温','肺脾胃',65,'辛散解表，助卫气外达'],
  ['jin','贝母','苦甘微寒','肺心',-25,'润肺化痰散结，气机稍降'],
  ['jin','百合','甘微寒','肺心',-35,'甘润清降，敛肺气之浮'],
  ['jin','杏仁','苦微温','肺大肠',-55,'降肺气平喘，与麻黄一宣一降'],
  ['jin','半夏','辛温','脾胃肺',-60,'降逆止呕，痰随气下'],
  ['jin','桑白皮','甘寒','肺',-65,'泻肺行水，水道下通'],
  ['jin','石膏','辛甘大寒','肺胃',-70,'虽辛而质重大寒，清降气分大热'],

  ['shui','附子','辛甘大热','心肾脾',40,'水行中唯一偏浮者：大热无沉，走而不守，通行十二经'],
  ['shui','巴戟天','甘辛微温','肾肝',-10,'温肾助阳，温性稍提而根本在下'],
  ['shui','胡麻','甘平','肝肾',-45,'甘平油润，滋填而沉'],
  ['shui','何首乌','苦甘涩微温','肝肾',-50,'补精血兼润肠，力向下焦'],
  ['shui','杜仲','甘温','肝肾',-50,'补肝肾强腰膝，专责下焦筋骨'],
  ['shui','肉苁蓉','甘咸温','肾大肠',-55,'咸温润下，益精而通便'],
  ['shui','女贞子','甘苦凉','肝肾',-55,'滋补肝肾之阴，静而沉'],
  ['shui','海藻','咸寒','肝肾胃',-60,'咸寒软坚，痰核随之下消'],
  ['shui','玄参','甘苦咸微寒','肺胃肾',-65,'咸寒滋阴降火，引浮火归元'],
  ['shui','地黄','甘寒','心肝肾',-70,'甘寒滋填，质厚味重，纯为沉降'],
  ['shui','龟甲','咸甘微寒','肝肾心',-85,'血肉重镇，滋阴潜阳'],
  ['shui','牡蛎','咸微寒','肝肾',-90,'介类潜阳，重镇之极'],
];

const tone = (e,v)=>{const p=P[e],t=(v+100)/200;return `hsl(${p.h} ${p.s}% ${(p.lo+(p.hi-p.lo)*t).toFixed(1)}%)`;};
const lum  = (e,v)=>{const p=P[e];return p.lo+(p.hi-p.lo)*(v+100)/200;};
const dir  = v=> v>=55?'升浮':v>=15?'微升':v>-15?'平':v>-55?'微降':'沉降';

const NS='http://www.w3.org/2000/svg', XLINK='http://www.w3.org/1999/xlink';
const CX=380,CY=380,RIN=96,ROUT=332,TH=16,SEP=18.6,PAD=2.6;

const mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;};
const pt=(a,r)=>[CX+r*Math.cos(a),CY+r*Math.sin(a)];
const ring=(a1,a2,r1,r2)=>{
  const [x1,y1]=pt(a1,r2),[x2,y2]=pt(a2,r2),[x3,y3]=pt(a2,r1),[x4,y4]=pt(a1,r1);
  return `M${x1},${y1}A${r2},${r2} 0 0 1 ${x2},${y2}L${x3},${y3}A${r1},${r1} 0 0 0 ${x4},${y4}Z`;
};
const mk2=(t,c)=>{const e=document.createElement(t);e.className=c;return e;};

/* 把色盘构建进任意 svg 元素；highlight 为本集用药名集合，onPick 为点药回调 */
function buildWheelInto(svgEl, { highlight = new Set(), onPick = null } = {}) {
  svgEl.innerHTML='';
  const defs=mk('defs',{}); svgEl.appendChild(defs);
  const tiles=[];

  ORDER.forEach((k,si)=>{
    const c=(-90+si*72), a1=(c-36+PAD)*Math.PI/180, a2=(c+36-PAD)*Math.PI/180;
    const norm=((c%360)+360)%360, rev = norm>0 && norm<180;
    const list=H.filter(h=>h[0]===k).sort((a,b)=>b[4]-a[4]);

    let r=list.map(h=>RIN+TH/2+((h[4]+100)/200)*(ROUT-RIN-TH));
    const RMAX=ROUT-TH/2, RMIN=RIN+TH/2;
    r[0]=Math.min(r[0],RMAX);
    for(let i=1;i<r.length;i++) r[i]=Math.min(r[i],r[i-1]-SEP);
    r[r.length-1]=Math.max(r[r.length-1],RMIN);
    for(let i=r.length-2;i>=0;i--) r[i]=Math.max(r[i],r[i+1]+SEP);

    list.forEach((h,i)=>{
      const col=tone(k,h[4]), rc=r[i];
      const g=mk('g',{});
      const path=mk('path',{d:ring(a1,a2,rc-TH/2,rc+TH/2),fill:col,class:'tile',tabindex:'0',role:'button','aria-label':h[1]});
      path.addEventListener('mouseenter',()=>show(h,col));
      path.addEventListener('focus',()=>show(h,col));
      path.addEventListener('click',()=>{ show(h,col,true); if(onPick) onPick(h[1]); });
      g.appendChild(path);

      // 标牌置于扇形格几何中心（中心角 c、半径 rc），沿扇区切向旋转，使其贴合细长环形格
      // 而不被相邻格遮挡；顶部红色扇区（c=-90）旋转后为 0°，保持水平不变。
      const [tx,ty]=pt(c*Math.PI/180, rc);
      let rot=(c+90); while(rot>90) rot-=180; while(rot<-90) rot+=180;
      const txt=mk('text',{class:'tlabel',x:tx,y:ty,fill:'#0E1317','text-anchor':'middle','dominant-baseline':'central','alignment-baseline':'central',transform:`rotate(${rot} ${tx} ${ty})`});
      txt.textContent=h[1];
      g.appendChild(txt);
      svgEl.appendChild(g);
      const tile={k,rc,col,h,path};
      if(highlight.has(h[1])) path.classList.add('hot');
      tiles.push(tile);
    });

    const [lx,ly]=pt(c*Math.PI/180, ROUT+22);
    const sect=mk('text',{class:'sect',x:lx,y:ly+6,fill:P[k].se==='白'?'#cfd6dc':tone(k,70)});
    sect.textContent=`${P[k].glyph}·${P[k].se}`;
    svgEl.appendChild(sect);
  });

  ORDER.forEach((k,si)=>{
    const c=(si*72-90+36);
    const [x1,y1]=pt(c*Math.PI/180,RIN),[x2,y2]=pt(c*Math.PI/180,ROUT);
    svgEl.appendChild(mk('line',{x1,y1,x2,y2,stroke:'var(--bw-rule)','stroke-width':'1'}));
  });
  svgEl.appendChild(mk('circle',{cx:CX,cy:CY,r:RIN,fill:'var(--bw-panel)',stroke:'var(--bw-rule)','stroke-width':'1.4'}));
  const hub=mk('text',{class:'hubline',x:CX,y:CY-6,fill:'var(--bw-ink)','font-size':'22'}); hub.textContent='升降';
  const hub2=mk('text',{class:'hubline',x:CX,y:CY+20,fill:'var(--bw-mute)','font-size':'14'}); hub2.textContent='浮沉';
  svgEl.appendChild(hub); svgEl.appendChild(hub2);

  return { tiles, pipMap:{}, focus(name){
    tiles.forEach(t=>t.path.classList.remove('hot'));
    const t=tiles.find(x=>x.h[1]===name);
    if(t){ show(t.h,t.col,true); t.path.classList.add('hot'); }
    else { const c=document.getElementById('bwcard'); if(c) c.innerHTML=`<p class="empty">「${name}」未列入本图谱（仅收升降有据之药）。</p>`; }
    if(this.pipMap[name]){ document.querySelectorAll('.bw-side .pip.on').forEach(p=>p.classList.remove('on')); this.pipMap[name].classList.add('on'); }
  }};
}

function show(h,col,on){
  const card=document.getElementById('bwcard');
  if(card) card.innerHTML=`<div class="cn"><span class="sw" style="background:${col}"></span>${h[1]}</div>`+
    `<div class="meta">${P[h[0]].se}行 · 入${P[h[0]].zang} · ${h[2]} · 归${h[3]} · <b style="color:${col}">${dir(h[4])}（${h[4]>=0?'+':''}${h[4]}）</b></div>`+
    `<div class="why">${h[5]}</div>`;
  const ramp=document.getElementById('bwramp');
  if(ramp) buildRamp(h[0]);
}

function buildRamp(e){
  const ramp=document.getElementById('bwramp'); if(!ramp) return;
  ramp.innerHTML='';
  const N=32;
  for(let i=0;i<N;i++){const v=100-200*i/(N-1);const i2=document.createElement('i');i2.style.background=tone(e,v);ramp.appendChild(i2);}
}

function buildRows(){
  const rows=document.getElementById('bwrows'); if(!rows) return {};
  rows.innerHTML='';
  const pipMap={};
  ORDER.forEach(k=>{
    const list=H.filter(h=>h[0]===k);
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div class="rh"><b style="color:${tone(k,75)}">${P[k].glyph}</b><span>${P[k].se} · ${P[k].zang}</span></div>`;
    const strip=document.createElement('div'); strip.className='strip';
    strip.appendChild(mk2('div','base')); strip.appendChild(mk2('div','mid'));
    list.forEach(h=>{
      const v=h[4];
      const pip=mk2('div','pip'); pip.style.left=((100-v)/2)+'%'; pip.style.background=tone(k,v);
      pip.title=`${h[1]} · ${dir(v)}（${v>=0?'+':''}${v}）`;
      pip.addEventListener('mouseenter',()=>show(h,tone(k,v)));
      pip.addEventListener('click',()=>show(h,tone(k,v),true));
      strip.appendChild(pip); pipMap[h[1]]=pip;
    });
    row.appendChild(strip); rows.appendChild(row);
  });
  return pipMap;
}

function buildOverlay(){
  const ov=document.createElement('div'); ov.className='bw-overlay';
  ov.innerHTML=`
    <div class="bw-modal">
      <div class="bw-head">
        <div class="bw-t"><b>本草升降色盘</b><span>以明度示升降浮沉，色相分五脏五行；点药名或悬停查看，与「拟方·用药方案」联动。</span></div>
        <button class="bw-close" aria-label="关闭">✕</button>
      </div>
      <div class="bw-stage">
        <div class="bw-wheel"><svg viewBox="0 0 760 760" class="bw-svg" role="img" aria-label="五行升降色盘"></svg></div>
        <div class="bw-side">
          <h3>升降标尺</h3>
          <p class="sub">同一色相的明度跨度即该行的升降幅度。</p>
          <div class="ramp" id="bwramp"></div>
          <div class="rampcap"><span>升浮 · 轻清上行</span><span>沉降 · 重浊下达</span></div>
          <h3>五行各自的升降分布</h3>
          <p class="sub">横轴左升右降，跨行可比。</p>
          <div class="rows" id="bwrows"></div>
          <div class="card" id="bwcard"><p class="empty">选一味药，看它的升降定位与依据。</p></div>
        </div>
      </div>
    </div>`;
  ov.querySelector('.bw-close').onclick=()=>ov.classList.remove('on');
  ov.addEventListener('click',e=>{ if(e.target===ov) ov.classList.remove('on'); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') ov.classList.remove('on'); });
  return ov;
}

let root=null, overlayWheel=null;

export function mountWheel(svgEl, opts){ return buildWheelInto(svgEl, opts); }

export function openBencaoWheel(name){
  if(!root){
    root=buildOverlay(); document.body.appendChild(root);
    overlayWheel = mountWheel(root.querySelector('.bw-svg'), {});
    overlayWheel.pipMap = buildRows();
    buildRamp('mu');
  }
  root.classList.add('on');
  if(name) requestAnimationFrame(()=>overlayWheel.focus(name));
}
