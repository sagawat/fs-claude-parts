/**
 * paint.js：style-spreadsheet の型「標準」を塗る・点検する GAS
 * 決まりの正本：github.com/sagawat/fs-claude-parts の style-spreadsheet/README.md（4-2. に使い方）
 * 置き方：受け口のスプレッドシートに付け、シート「ログ_リクエスト」（7列：番号・状態・種類・設計図・結果・受けた・済んだ。列の見出しは4行目）を置く。
 *         setupTrigger を一度実行して、1分ごとのトリガー（poll）を付ける。
 * 使い方：ログ_リクエスト の表のいちばん上に行を差し込み、種類（塗る／点検）と設計図（JSON）を書き、状態を「待ち」にする。
 *         poll が拾って実行し、結果と状態を書き戻す。
 * 要るもの（appsscript.json）：timeZone Asia/Tokyo、runtimeVersion V8、高度なサービス Google Sheets API（serviceId sheets・v4・識別子 Sheets）
 */

const ST = {
  font: 'Noto Sans JP',
  ink: '#202124', pale: '#5F6368', blue: '#1A73E8',
  sepFill: '#F1F3F4', line: '#E8EAED', head: '#202124',
  tab: { spec: '#4A86E8', wip: '#93C47D', gray: '#D9D9D9' },
  pad: { top: 2, right: 6, bottom: 2, left: 6 },
  logRows: 300,
};

// 列の種類：寄せ・折り返し・太字・表示形式
const COL = {
  id:    { h: 'CENTER', w: 'CLIP', b: true },
  code:  { h: 'CENTER', w: 'CLIP' },
  chip:  { h: 'CENTER', w: 'CLIP' },
  date:  { h: 'CENTER', w: 'CLIP' },   // 表示形式には触らない（本物の日付が通し番号に見えてしまうため）
  name:  { h: 'LEFT',   w: 'CLIP' },
  names: { h: 'LEFT',   w: 'WRAP' },
  text:  { h: 'LEFT',   w: 'WRAP' },
  num:   { h: 'RIGHT',  w: 'CLIP' },
};

/* ---------- 注文の受け付け ---------- */

const ORDER = { sheet: 'ログ_リクエスト', head: 4, c: { no: 1, st: 2, kind: 3, spec: 4, res: 5, got: 6, done: 7 } };

function poll() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(ORDER.sheet);
    const last = sh.getLastRow();
    if (last <= ORDER.head) return;
    const n = last - ORDER.head;
    const vals = sh.getRange(ORDER.head + 1, 1, n, 7).getValues();
    for (let i = vals.length - 1; i >= 0; i--) {   // 新しい行が上に積まれるので、下（古い順）から
      const v = vals[i];
      if (v[ORDER.c.st - 1] !== '待ち') continue;
      const r = ORDER.head + 1 + i;
      sh.getRange(r, ORDER.c.st).setValue('実行中');
      sh.getRange(r, ORDER.c.got).setValue(now_());
      SpreadsheetApp.flush();
      let st = '済', res;
      try {
        const spec = JSON.parse(v[ORDER.c.spec - 1]);
        const kind = v[ORDER.c.kind - 1];
        if (kind === '塗る') res = paint(spec);
        else if (kind === '点検') res = check(spec);
        else throw new Error('種類が「塗る」「点検」でない：' + kind);
      } catch (e) { st = '誤り'; res = String(e && e.stack || e); }
      sh.getRange(r, ORDER.c.res).setValue(String(res).slice(0, 45000));
      sh.getRange(r, ORDER.c.st).setValue(st);
      sh.getRange(r, ORDER.c.done).setValue(now_());
      SpreadsheetApp.flush();
    }
  } finally { lock.releaseLock(); }
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'poll').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('poll').timeBased().everyMinutes(1).create();
}

function now_() { return "'" + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm'); }   // 頭の ' で文字のまま入れる

/* ---------- 設計図 → 塗る区画 ---------- */
/*
 設計図：
 { "file": "<スプレッドシートID>",
   "sheets": [ { "name": "仕様_…", "desc": 2, "widths": [48,160,…],
                 "blocks": [ {"sec": 4},
                             {"table": {"head": 5, "last": 12, "cols": ["id","name","chip","text","chip✎"],
                                        "kind": "一覧|判断", "seps": [6,9], "notes": [13]}} ],
                 "trim": true } ] }
 - cols の種類は COL のキー。末尾に ✎ を付けると依頼した人が書き込む列。
 - ログ_・履歴_ のシートは last を省くと 300 行目まで。
*/

function plan_(sp, meta) {
  const name = sp.name;
  const cat = /^ログ_/.test(name) ? 'log' : /^履歴_/.test(name) ? 'hist' : 'spec';
  const grow = cat !== 'spec';
  const nCol = sp.widths.length;
  const desc = sp.desc || 0;
  const tables = sp.blocks.filter(b => b.table).map(b => b.table);
  const secs = sp.blocks.filter(b => b.sec).map(b => b.sec);
  tables.forEach(t => {
    t.first = t.first || t.head + 1;
    if (!t.last) t.last = grow ? Math.max(ST.logRows, meta.rowCount) : t.head + 1;
    t.kind = t.kind || '一覧';
    t.seps = t.seps || []; t.notes = t.notes || [];
    t.cs = t.cols.map(c => {
      const edit = /✎$/.test(c), k = c.replace(/✎$/, '');
      if (!COL[k]) throw new Error(name + '：列の種類が不明 ' + c);
      return Object.assign({ edit }, COL[k]);
    });
  });
  let lastRow = Math.max(1 + desc + 1, ...secs, ...tables.map(t => Math.max(t.last, ...t.notes)));

  const R = [];   // 区画 {r0,r1,c0,c1,f}（1始まり・両端含む）。後の区画が上書き
  const H = {};   // 行の高さ {行: px}
  const keepH = {}; // 中身に合わせてよい行 {行: 単位px}
  const B = [];   // 罫線

  R.push({ r0: 1, r1: lastRow, c0: 1, c1: nCol, f: { font: ST.font, size: 10, bold: false, color: ST.ink, h: 'LEFT', v: 'TOP', w: 'OVERFLOW_CELL', bg: null }, base: true });
  for (let r = 1; r <= lastRow; r++) H[r] = 21;
  R.push({ r0: 1, r1: 1, c0: 1, c1: nCol, f: { size: 14, bold: true, v: 'MIDDLE' } }); H[1] = 42;
  if (desc) R.push({ r0: 2, r1: 1 + desc, c0: 1, c1: nCol, f: { color: ST.pale } });
  secs.forEach(r => { R.push({ r0: r, r1: r, c0: 1, c1: nCol, f: { size: 11, bold: true, v: 'BOTTOM' } }); H[r] = 30; });

  tables.forEach(t => {
    const nc = t.cs.length, unit = t.kind === '判断' ? 30 : 21, v = t.kind === '判断' ? 'MIDDLE' : 'TOP';
    t.cs.forEach((c, i) => {
      const col = i + 1;
      R.push({ r0: t.head, r1: t.head, c0: col, c1: col, f: { bold: true, v: 'MIDDLE', w: 'WRAP', h: c.h, color: c.edit ? ST.blue : ST.ink, nf: c.edit ? { type: 'TEXT', pattern: '"✎ "@' } : undefined } });
      R.push({ r0: t.first, r1: t.last, c0: col, c1: col, f: { h: c.h, v, w: c.w, bold: !!c.b, nf: c.nf } });
    });
    H[t.head] = 42;
    for (let r = t.first; r <= t.last; r++) { H[r] = unit; keepH[r] = unit; }
    t.notes.forEach(r => R.push({ r0: r, r1: r, c0: 1, c1: nCol, f: { color: ST.pale } }));
    t.seps.forEach(r => R.push({ r0: r, r1: r, c0: 1, c1: nc, f: { size: 11, bold: true, h: 'LEFT', w: 'OVERFLOW_CELL', bg: ST.sepFill } }));
    B.push({ r0: t.head, r1: t.head, c0: 1, c1: nc, bottom: ['SOLID_MEDIUM', ST.head] });
    B.push({ r0: t.first, r1: t.last, c0: 1, c1: nc, bottom: ['SOLID', ST.line], inner: ['SOLID', ST.line] });
  });

  const tab = cat === 'spec' ? (/_仕掛中$/.test(name) ? ST.tab.wip : ST.tab.spec) : ST.tab.gray;
  return { name, cat, nCol, lastRow, R, H, keepH, B, widths: sp.widths,
           frozen: tables.length === 1 ? tables[0].head : 0, tab, hidden: cat === 'hist',
           trim: sp.trim !== false, growTo: grow ? Math.max(ST.logRows, lastRow) : lastRow };
}

/* ---------- 塗る ---------- */

function paint(spec) {
  const ss = Sheets.Spreadsheets.get(spec.file, { fields: 'sheets(properties(sheetId,title,gridProperties),data(rowMetadata(pixelSize)))', includeGridData: true, ranges: spec.sheets.map(s => `'${s.name}'!A:A`) });
  const req = [], out = [];
  spec.sheets.forEach((sp, i) => {
    const s = ss.sheets.find(x => x.properties.title === sp.name);
    if (!s) throw new Error('シートがない：' + sp.name);
    const id = s.properties.sheetId, g = s.properties.gridProperties;
    const P = plan_(sp, g);
    const cur = ((s.data && s.data[0] && s.data[0].rowMetadata) || []).map(m => m.pixelSize);

    // 行・列の数
    if (P.trim && g.columnCount > P.nCol) req.push({ deleteDimension: { range: { sheetId: id, dimension: 'COLUMNS', startIndex: P.nCol, endIndex: g.columnCount } } });
    if (g.rowCount < P.growTo) req.push({ appendDimension: { sheetId: id, dimension: 'ROWS', length: P.growTo - g.rowCount } });
    if (P.trim && g.rowCount > P.growTo) req.push({ deleteDimension: { range: { sheetId: id, dimension: 'ROWS', startIndex: P.growTo, endIndex: g.rowCount } } });

    // シートの属性
    req.push({ updateSheetProperties: { properties: { sheetId: id, hidden: P.hidden, tabColorStyle: { rgbColor: rgb_(P.tab) },
      gridProperties: { hideGridlines: true, frozenRowCount: P.frozen } }, fields: 'hidden,tabColorStyle,gridProperties.hideGridlines,gridProperties.frozenRowCount' } });

    // 書式
    P.R.forEach(z => req.push(repeat_(id, z)));
    // 罫線：表の範囲をいったん消してから引く
    req.push({ updateBorders: Object.assign({ range: gr_(id, 1, P.lastRow, 1, P.nCol) }, nob_()) });
    P.B.forEach(b => {
      const o = { range: gr_(id, b.r0, b.r1, b.c0, b.c1) };
      if (b.bottom) o.bottom = bd_(b.bottom);
      if (b.inner) o.innerHorizontal = bd_(b.inner);
      req.push({ updateBorders: o });
    });

    // 列幅・行の高さ
    P.widths.forEach((w, c) => req.push(dim_(id, 'COLUMNS', c, c + 1, w)));
    Object.keys(P.H).forEach(k => {
      const r = +k; let px = P.H[r];
      const u = P.keepH[r], now = cur[r - 1];
      if (u && now && now >= u && now % u === 0) return;           // 単位の倍数ならそのまま
      if (u && P.cat !== 'spec' && now && now >= u) return;        // ログ・履歴は中身に合わせてよい
      req.push(dim_(id, 'ROWS', r - 1, r, px));
    });
    out.push(`${sp.name}：${P.lastRow}行・${P.nCol}列`);
  });
  Sheets.Spreadsheets.batchUpdate({ requests: req }, spec.file);
  return `塗った（request ${req.length} 件）\n` + out.join('\n');
}

function repeat_(id, z) {
  const f = z.f, u = {}, fl = [];
  const tf = {};
  if (f.font !== undefined) { tf.fontFamily = f.font; fl.push('userEnteredFormat.textFormat.fontFamily'); }
  if (f.size !== undefined) { tf.fontSize = f.size; fl.push('userEnteredFormat.textFormat.fontSize'); }
  if (f.bold !== undefined) { tf.bold = f.bold; fl.push('userEnteredFormat.textFormat.bold'); }
  if (f.color !== undefined) { tf.foregroundColorStyle = { rgbColor: rgb_(f.color) }; fl.push('userEnteredFormat.textFormat.foregroundColorStyle'); }
  if (Object.keys(tf).length) u.textFormat = tf;
  if (f.h) { u.horizontalAlignment = f.h; fl.push('userEnteredFormat.horizontalAlignment'); }
  if (f.v) { u.verticalAlignment = f.v; fl.push('userEnteredFormat.verticalAlignment'); }
  if (f.w) { u.wrapStrategy = f.w; fl.push('userEnteredFormat.wrapStrategy'); }
  if ('bg' in f) { if (f.bg) u.backgroundColorStyle = { rgbColor: rgb_(f.bg) }; fl.push('userEnteredFormat.backgroundColorStyle'); }
  if (f.nf) { u.numberFormat = f.nf; fl.push('userEnteredFormat.numberFormat'); }   // 表示形式は決まりのある列だけ（ほかは触らない）
  if (f.font !== undefined) { u.padding = ST.pad; fl.push('userEnteredFormat.padding'); }
  return { repeatCell: { range: gr_(id, z.r0, z.r1, z.c0, z.c1), cell: { userEnteredFormat: u }, fields: fl.join(',') } };
}

/* ---------- 点検 ---------- */

function check(spec) {
  const fx = 'textFormat(fontFamily,fontSize,bold,foregroundColorStyle),horizontalAlignment,verticalAlignment,wrapStrategy,backgroundColorStyle,numberFormat,borders(bottom),padding';
  const ss = Sheets.Spreadsheets.get(spec.file, {
    includeGridData: true,
    ranges: spec.sheets.map(s => `'${s.name}'`),
    fields: `sheets(properties(title,hidden,tabColorStyle,gridProperties),data(rowMetadata(pixelSize),columnMetadata(pixelSize),rowData(values(userEnteredFormat(${fx})))))`,
  });
  const bad = [];
  spec.sheets.forEach(sp => {
    const s = ss.sheets.find(x => x.properties.title === sp.name);
    if (!s) { bad.push(sp.name + '：シートがない'); return; }
    const P = plan_(sp, s.properties.gridProperties), p = s.properties, g = p.gridProperties, d = s.data[0];
    const say = (where, what, got, want) => bad.push(`${sp.name}!${where} ${what}：${got}（決まり ${want}）`);

    if (!g.hideGridlines) say('', '枠の線', '見える', '隠す');
    if ((g.frozenRowCount || 0) !== P.frozen) say('', '固定の行', g.frozenRowCount || 0, P.frozen);
    if (!!p.hidden !== P.hidden) say('', '隠す', !!p.hidden, P.hidden);
    if (!sameC_(p.tabColorStyle, P.tab)) say('', 'タブの色', hex_(p.tabColorStyle), P.tab);
    if (P.trim && g.columnCount > P.nCol) say('', '列の数', g.columnCount, P.nCol);
    if (g.rowCount < P.growTo) say('', '行の数', g.rowCount, P.growTo + ' 以上');
    if (P.trim && P.cat === 'spec' && g.rowCount > P.lastRow) say('', '行の数', g.rowCount, P.lastRow);

    P.widths.forEach((w, c) => { const now = (d.columnMetadata[c] || {}).pixelSize; if (now !== w) say(a1c_(c + 1), '列幅', now, w); });
    Object.keys(P.H).forEach(k => {
      const r = +k, want = P.H[r], u = P.keepH[r], now = (d.rowMetadata[r - 1] || {}).pixelSize;
      if (u) { if (!(now >= u && (P.cat !== 'spec' || now % u === 0))) say(r + '行', '高さ', now, u + ' の倍数'); }
      else if (now !== want) say(r + '行', '高さ', now, want);
    });

    // セルごとの期待値
    const E = {};
    P.R.forEach(z => { for (let r = z.r0; r <= z.r1; r++) for (let c = z.c0; c <= z.c1; c++) {
      const k = r + ',' + c, f = Object.assign({}, z.f);
      if (z.base) { delete f.h; delete f.v; delete f.w; }   // 空いたセルの寄せ・折り返しは見ない
      E[k] = Object.assign(E[k] || {}, f);
    } });
    const BT = {};
    P.B.forEach(b => { for (let r = b.r0; r <= b.r1; r++) for (let c = b.c0; c <= b.c1; c++) BT[r + ',' + c] = b.bottom[0]; });

    const rows = d.rowData || [];
    const cnt = {};
    for (let r = 1; r <= P.lastRow; r++) for (let c = 1; c <= P.nCol; c++) {
      const e = E[r + ',' + c]; if (!e) continue;
      const u = (((rows[r - 1] || {}).values || [])[c - 1] || {}).userEnteredFormat || {};
      const t = u.textFormat || {}, at = a1c_(c) + r, got = [];
      if (e.font && t.fontFamily !== e.font) got.push(['字の種類', t.fontFamily, e.font]);
      if (e.size && (t.fontSize || 10) !== e.size) got.push(['字の大きさ', t.fontSize, e.size]);
      if (e.bold !== undefined && !!t.bold !== e.bold) got.push(['太字', !!t.bold, e.bold]);
      if (e.color && !sameC_(t.foregroundColorStyle, e.color)) got.push(['字の色', hex_(t.foregroundColorStyle), e.color]);
      if (e.h && (u.horizontalAlignment || 'LEFT') !== e.h) got.push(['横の寄せ', u.horizontalAlignment, e.h]);
      if (e.v && (u.verticalAlignment || 'BOTTOM') !== e.v) got.push(['縦の寄せ', u.verticalAlignment, e.v]);
      if (e.w && (u.wrapStrategy || 'OVERFLOW_CELL') !== e.w) got.push(['折り返し', u.wrapStrategy, e.w]);
      if (e.bg ? !sameC_(u.backgroundColorStyle, e.bg) : (u.backgroundColorStyle && hex_(u.backgroundColorStyle) !== '#FFFFFF')) got.push(['塗り', hex_(u.backgroundColorStyle), e.bg || 'なし']);
      if (e.nf && e.nf.pattern && ((u.numberFormat || {}).pattern !== e.nf.pattern)) got.push(['表示形式', (u.numberFormat || {}).pattern, e.nf.pattern]);
      const pd = u.padding || {};
      if (e.font && (pd.top !== 2 || pd.right !== 6 || pd.bottom !== 2 || pd.left !== 6)) got.push(['余白', [pd.top, pd.right, pd.bottom, pd.left].join('/'), '2/6/2/6']);
      const bs = ((u.borders || {}).bottom || {}).style || 'NONE', bw = BT[r + ',' + c] || 'NONE';
      if (bs !== bw) got.push(['下の線', bs, bw]);
      got.forEach(x => { const key = x[0] + '|' + x[1] + '|' + x[2]; (cnt[key] = cnt[key] || []).push(at); });
    }
    Object.keys(cnt).forEach(key => { const [w, a, b] = key.split('|'); const cs = cnt[key];
      say(cs.length > 6 ? `${cs.slice(0, 6).join(',')} ほか${cs.length - 6}` : cs.join(','), w, a, b); });
  });
  return bad.length ? `ずれ ${bad.length} 件\n` + bad.join('\n') : 'ずれなし';
}

/* ---------- 小物 ---------- */

function gr_(id, r0, r1, c0, c1) { return { sheetId: id, startRowIndex: r0 - 1, endRowIndex: r1, startColumnIndex: c0 - 1, endColumnIndex: c1 }; }
function dim_(id, dim, s, e, px) { return { updateDimensionProperties: { range: { sheetId: id, dimension: dim, startIndex: s, endIndex: e }, properties: { pixelSize: px }, fields: 'pixelSize' } }; }
function bd_(x) { return { style: x[0], colorStyle: { rgbColor: rgb_(x[1]) } }; }
function nob_() { const n = { style: 'NONE' }; return { top: n, bottom: n, left: n, right: n, innerHorizontal: n, innerVertical: n }; }
function rgb_(h) { const n = parseInt(h.slice(1), 16); return { red: (n >> 16 & 255) / 255, green: (n >> 8 & 255) / 255, blue: (n & 255) / 255 }; }
function hex_(cs) {
  const c = cs && cs.rgbColor; if (!c) return cs && cs.themeColor ? 'テーマ:' + cs.themeColor : 'なし';
  return '#' + ['red', 'green', 'blue'].map(k => ('0' + Math.round((c[k] || 0) * 255).toString(16)).slice(-2)).join('').toUpperCase();
}
function sameC_(cs, h) {
  const c = cs && cs.rgbColor; if (!c) return false;
  const w = rgb_(h); return ['red', 'green', 'blue'].every(k => Math.abs((c[k] || 0) - w[k]) <= 2 / 255);
}
function a1c_(c) { let s = ''; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = (c - m - 1) / 26; } return s; }
