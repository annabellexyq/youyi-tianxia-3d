/* ============================================================================
 *  游医天下 · 地图节点道具图标（九境）
 *  白描线稿：fill:none + stroke:currentColor，无背景，可随节点状态（未至/已至/当前）变色
 *  市井·竹篓 / 边境·破旗 / 府衙·笔架 / 园林·假山 / 湖心·船与船夫
 *  村民·茅草屋 / 科举·试卷 / 皇朝·灯笼 / 乡野·枯树
 * ==========================================================================*/
const PROPS = {
  // 市井 —— 竹篓
  shijing: `
    <path d="M13 18 C13 8 21 4.5 24 4.5 C27 4.5 35 8 35 18"/>
    <path d="M11 18 C12 30 15 40.5 24 40.5 C33 40.5 36 30 37 18"/>
    <ellipse cx="24" cy="18" rx="13" ry="4.2"/>
    <path d="M12.6 25 Q24 29 35.4 25" stroke-width="1.2"/>
    <path d="M13.8 32.5 Q24 36 34.2 32.5" stroke-width="1.2"/>
    <path d="M17.6 21.4 Q16.6 30 18.6 39.4" stroke-width="1.1"/>
    <path d="M24 22.2 V40.4" stroke-width="1.1"/>
    <path d="M30.4 21.4 Q31.4 30 29.4 39.4" stroke-width="1.1"/>`,

  // 边境 —— 破旗（旗杆 + 撕口的旗面）
  bianjing: `
    <circle cx="11" cy="4.4" r="1.7" fill="currentColor" stroke="none"/>
    <path d="M11 6.4 V43" stroke-width="2"/>
    <path d="M13 9 H33 L29.5 13 L34 17.5 L28.5 20.5 L34 24.5 L30 28.5 H13 Z"/>
    <path d="M16.5 14 Q20.5 16.2 24.5 13.8" stroke-width="1.1"/>
    <path d="M16.5 21.5 Q21.5 23.6 26.5 21.2" stroke-width="1.1"/>
    <path d="M25 24 L27.8 25.5 L26.4 28.2 L23.6 26.6 Z" stroke-width="1"/>`,

  // 府衙 —— 官帽椅（搭脑上翘、靠背板、扶手、座面、四腿与管脚枨）
  fuyao: `
    <path d="M12.4 8.4 C13.6 6.6 16.2 7 17.2 8.6 Q24 6.6 30.8 8.6 C31.8 7 34.4 6.6 35.6 8.4" stroke-width="1.6"/>
    <path d="M17.2 8.8 V42 M30.8 8.8 V42" stroke-width="1.6"/>
    <path d="M20.4 9.4 V19.6 H27.6 V9.4" stroke-width="1.3"/>
    <path d="M24 10.2 V18.8" stroke-width="0.9"/>
    <path d="M17.2 15 C14 15.2 11.4 15.8 9.6 16.6" stroke-width="1.4"/>
    <path d="M30.8 15 C34 15.2 36.6 15.8 38.4 16.6" stroke-width="1.4"/>
    <path d="M9.6 16.6 V42 M38.4 16.6 V42" stroke-width="1.6"/>
    <path d="M9.6 21 H38.4" stroke-width="1.9"/>
    <path d="M11 23.2 H37" stroke-width="1"/>
    <path d="M9.6 37.5 H38.4" stroke-width="0.9"/>
    <path d="M4 42.6 H44" stroke-width="1.2"/>`,

  // 园林 —— 假山（连笔深勾，弯曲嶙峋，太湖石孔）
  biyu: `
    <path d="M7 41 C5.6 33 9 28.5 10 22.5 C11 15.5 12 10 17 9 C21 8.2 23 13 24 18 C26 12 30 8 34 11 C37 13.2 34 18 35 23 C36 28 41.5 27.5 40.5 34 C39.6 39 36 41 33 41 Z" stroke-width="1.9"/>
    <path d="M15 41 C16 34 13 28 17 21.5 C18 18.5 18 15 17 11.5" stroke-width="1.4"/>
    <path d="M24.5 41 C25.5 34 22.5 28 26.5 21.5 C27 19 26.5 17.5 26 16.5" stroke-width="1.4"/>
    <path d="M33 41 C34 35 31 30.5 34 24.5 C35 20.5 34 16.5 33 13" stroke-width="1.4"/>
    <path d="M27.5 27 C29 24 33 24.6 33 27.6 C33 30.6 28.6 30.6 27.5 27.6 Z" stroke-width="1.1"/>
    <path d="M4 41.5 H44" stroke-width="1.2"/>`,

  // 湖心 —— 船与船夫（斗笠、竹篙、水波）
  dangzhou: `
    <path d="M18 16.5 Q24 9.5 30 16.5 Z" stroke-width="1.5"/>
    <circle cx="24" cy="19.5" r="2.4" stroke-width="1.4"/>
    <path d="M24 22 V29.5" stroke-width="1.6"/>
    <path d="M24 24.5 L18.5 27.5" stroke-width="1.4"/>
    <path d="M10.5 38.5 L31 16.5" stroke-width="1.3"/>
    <path d="M5 31 C5 31 8.5 41 24 41 C39.5 41 43 31 43 31 C34 35.2 14 35.2 5 31 Z" stroke-width="1.9"/>
    <path d="M4 45 Q10 43 16 45 T28 45 T40 45" stroke-width="1.1"/>`,

  // 村民 —— 茅草屋（草顶、土墙、柴门、小窗）
  cunliu: `
    <path d="M5 24 C9 20 16 11 24 10.5 C32 11 39 20 43 24 C38 26.6 30 27.2 24 27.2 C18 27.2 10 26.6 5 24 Z" stroke-width="1.8"/>
    <path d="M22 11 Q24 8.6 26 11" stroke-width="1.3"/>
    <path d="M10 22.6 Q14 21.4 17 21.8" stroke-width="1"/>
    <path d="M13.5 18.6 Q17.5 17.4 20.5 18.2" stroke-width="1"/>
    <path d="M31 18.2 Q34 17.4 37.5 18.6" stroke-width="1"/>
    <path d="M34 21.8 Q37 21.4 40 22.6" stroke-width="1"/>
    <path d="M12 27.2 V40.5 H36 V27.2" stroke-width="1.7"/>
    <path d="M20 40.5 V32 H28 V40.5" stroke-width="1.5"/>
    <path d="M24 32 V40.5" stroke-width="1"/>
    <path d="M14 31.5 H18.5 V36 H14 Z" stroke-width="1.1"/>
    <path d="M14 33.8 H18.5 M16.2 31.5 V36" stroke-width="0.9"/>
    <path d="M6 40.5 H42" stroke-width="1.3"/>`,

  // 科举 —— 试卷（竖排文字 + 朱印）
  keju: `
    <path d="M12 5 H36 V40 C30.5 42.6 17.5 42.6 12 40 Z"/>
    <path d="M18 12 V31 M24 12 V31 M30 12 V27" stroke-width="1.1"/>
    <path d="M16.4 16 H19.6 M22.4 16 H25.6 M28.4 16 H31.6" stroke-width="1"/>
    <path d="M16.4 21 H19.6 M22.4 21 H25.6" stroke-width="1"/>
    <path d="M16.4 26 H19.6 M22.4 26 H25.6 M28.4 23 H31.6" stroke-width="1"/>
    <path d="M12 40 C17 42.6 30.5 42.6 36 40" stroke-width="1.2"/>
    <rect x="25" y="30" width="8" height="8" rx="1.2" class="p-seal"/>`,

  // 皇朝 —— 宫灯（提绳、灯身骨、流苏）
  huangchao: `
    <path d="M24 4 V9" stroke-width="1.3"/>
    <rect x="18" y="9" width="12" height="3.6" rx="1.2" stroke-width="1.6"/>
    <ellipse cx="24" cy="24" rx="12" ry="10.6"/>
    <path d="M24 13.4 V34.6" stroke-width="1.2"/>
    <path d="M18.6 15 C15.2 20 15.2 28 18.6 33" stroke-width="1.2"/>
    <path d="M29.4 15 C32.8 20 32.8 28 29.4 33" stroke-width="1.2"/>
    <rect x="18" y="34" width="12" height="3.6" rx="1.2" stroke-width="1.6"/>
    <path d="M24 37.6 V41" stroke-width="1.3"/>
    <path d="M24 41 C22.4 43 21.4 45 21 46.6" stroke-width="1"/>
    <path d="M24 41 V47" stroke-width="1"/>
    <path d="M24 41 C25.6 43 26.6 45 27 46.6" stroke-width="1"/>`,

  // 乡野 —— 枯树（枯笔主干、嶙峋枝梢）
  xiangye: `
    <path d="M20.5 45 C20.5 36 22.5 30 22 24.5 C21.6 19.5 21 15 23 11" stroke-width="2.4"/>
    <path d="M27 45 C27 37 26 31 26 25.5" stroke-width="1.8"/>
    <path d="M21 33 C24 31 26 30 27 27" stroke-width="1.2"/>
    <path d="M22 26.5 C18 23.5 15 21.5 11 20.5" stroke-width="1.6"/>
    <path d="M23.5 22 C28 19 32 17 36 15" stroke-width="1.6"/>
    <path d="M21.6 31.5 C17 30.5 13 30.5 9 32" stroke-width="1.4"/>
    <path d="M26.4 29.5 C31 28.5 35 29.5 39 32" stroke-width="1.4"/>
    <path d="M11 20.5 L8 16.5 M11 20.5 L12 15.5" stroke-width="1"/>
    <path d="M36 15 L39.5 11.5 M36 15 L34.5 10.5" stroke-width="1"/>
    <path d="M9 32 L5.5 29.5" stroke-width="1"/>
    <path d="M39 32 L42.5 29" stroke-width="1"/>
    <path d="M17 45 Q24 42.8 31 45" stroke-width="1.3"/>`,
};

export function propSVG(id) {
  const body = PROPS[id] || '';
  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.7"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}

export default propSVG;
