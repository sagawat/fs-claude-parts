/* fs-claude-parts dealview v261126a: freee の取引一覧の画面に似せた取引の表（c03-deal-view）。CSS とスクリプトを1本にしたもの。決まりは dealview/README.md */
(function(){
if(window.DV)return;
var CSS=".dv{--b:#323232;--s:#6E6B6B;--ln:#E6E6E6;--out:#DC1E32;--in:#285AC8;--lk:#285AC8;--pc:#6E0F19;--pb:#FAD2D7;--ic:#004B1E;--ib:#CDEBD7;--tc:#825A0F;--tb:#FFF0D2;--cc:#6E6B6B;--cb:#EEEEEE;--old:#9A9797;background:#FFFFFF;color:var(--b);border-radius:8px;padding:4px 10px 6px;font-size:14px;line-height:1.45;margin:0 0 10px}\n"+
".dv.dk{--b:#E6E6E6;--s:#A6A3A3;--ln:#3A3A3A;--out:#FF6B78;--in:#7FA2F0;--lk:#8FB0FF;--pc:#F7C2CA;--pb:#4A1C24;--ic:#B4E3C3;--ib:#1B3D27;--tc:#F2D296;--tb:#3E3012;--cc:#BDBABA;--cb:#333333;--old:#7A7777;background:transparent;border:0.5px solid var(--ln)}\n"+
".dv *{box-sizing:border-box}.dv>*{min-width:0}\n"+
".dv .dvt{font-size:13px;font-weight:500;padding:4px 0 2px}\n"+
".dv .hd,.dv .dl{display:grid;grid-template-columns:46px 44px 34px minmax(0,1fr) 96px;column-gap:8px;align-items:start}\n"+
".dv .hd{font-size:11px;color:var(--s);border-bottom:1px solid var(--ln);padding:5px 0 4px}\n"+
".dv .dl{border-bottom:1px solid var(--ln);padding:7px 0}\n"+
".dv .ls{display:flex;flex-direction:column;gap:6px;min-width:0}\n"+
".dv .ln,.dv .hl{display:grid;grid-template-columns:92px 100px minmax(0,1fr);column-gap:8px;min-width:0}\n"+
".dv .hd .hl{display:grid}\n"+
".dv .bd{display:inline-block;border:1px solid;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:500;line-height:1.3;white-space:nowrap}\n"+
".dv .o{color:var(--out);border-color:var(--out)}.dv .i{color:var(--in);border-color:var(--in)}.dv .tr{color:var(--s);border-color:var(--s)}\n"+
".dv .sm{font-size:12px;color:var(--s);overflow-wrap:anywhere}\n"+
".dv .ac{overflow-wrap:anywhere}\n"+
".dv .am{font-weight:500;text-align:right;white-space:nowrap}.dv .am .sm{font-weight:400;display:block;white-space:normal}\n"+
".dv a{color:var(--lk);text-decoration:none}.dv a:hover{text-decoration:underline}\n"+
".dv .ch{display:inline-block;border-radius:4px;padding:1px 4px;font-size:12px;margin:0 3px 2px 0;line-height:1.4}\n"+
".dv .p{color:var(--pc);background:var(--pb)}.dv .it{color:var(--ic);background:var(--ib)}.dv .tg{color:var(--tc);background:var(--tb)}.dv .cm{color:var(--cc);background:var(--cb);font-size:11px}\n"+
".dv .nt{font-size:12px;line-height:1.5;min-width:0;overflow-wrap:anywhere}.dv .nt i,.dv .sm i,.dv .du i{font-size:13px;vertical-align:-2px;margin-right:3px}\n"+
".dv .du{color:var(--s);font-size:12px}.dv .dd{display:block}\n"+
".dv s{color:var(--old)}.dv s.ch{text-decoration:line-through}\n"+
".dv .ft{font-size:12px;color:var(--s);padding:6px 0 2px;overflow-wrap:anywhere}\n"+
".dv .tw .hd,.dv .tw .dl{grid-template-columns:46px 64px minmax(0,1fr) minmax(0,1fr) 110px}\n"+
".dv .top{display:none}\n"+
"@media (max-width:560px){.dv .hd{display:none}.dv .dl{display:block;padding:9px 0}.dv .dl>.c1,.dv .dl>.c2,.dv .dl>.c3,.dv .dl>.c5{display:none}\n"+
".dv .top{display:flex;align-items:center;gap:8px;margin-bottom:5px}.dv .top .w{margin-left:auto;text-align:right}.dv .top .dd{display:inline;margin-left:4px}\n"+
".dv .ln{grid-template-columns:minmax(0,1fr) auto;row-gap:2px}.dv .ln .am .sm{display:none}.dv .ln .nt{grid-column:1/3}.dv .ln .tx{display:inline}\n"+
".dv .tw .dl{display:grid;grid-template-columns:auto auto minmax(0,1fr);grid-template-areas:\"d b a\" \"f f f\" \"t t t\" \"n n n\";column-gap:8px;row-gap:3px;align-items:center}.dv .tw .dl>*{display:block!important}.dv .tw .c1{grid-area:d}.dv .tw .c2{grid-area:b}.dv .tw .c5{grid-area:a}.dv .tw .c3{grid-area:f}.dv .tw .c4{grid-area:t}.dv .tw .dl>.nt{grid-area:n;grid-column:auto!important}}\n"+
".dv .tx{display:none;margin-left:6px}";
var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
var E=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var md=function(d){if(!d)return'';var p=String(d).split('-');return p.length===3?(+p[1])+'/'+(+p[2]):String(d)};
var yen=function(n){return Number(n).toLocaleString('ja-JP')};
var isArr=Array.isArray;
var nw=function(x){return isArr(x)?x[1]:x};
function isDark(){var s=document.createElement('span');s.style.color='var(--text-primary, CanvasText)';document.body.appendChild(s);var c=getComputedStyle(s).color;s.remove();var m=c.match(/\d+/g);if(!m)return false;return(m[0]*299+m[1]*587+m[2]*114)/1000>140}
function V(x,f){f=f||E;if(isArr(x))return '<s>'+f(x[0])+'</s> → '+f(x[1]);return f(x)}
var URL_DEAL='https://secure.freee.co.jp/deals/standards?record_id=';
function amt(o,d,l){var a=l.amt;var lk=(o.mode==='after'||o.mode==='past')&&d.id;var f=function(v){return yen(v)};
 var t=isArr(a)?'<s>'+yen(a[0])+'</s> → '+(lk?'<a href="'+URL_DEAL+d.id+'" target="_blank" rel="noopener">'+yen(a[1])+'</a>':yen(a[1])):(lk?'<a href="'+URL_DEAL+d.id+'" target="_blank" rel="noopener">'+yen(a)+'</a>':yen(a));return t}
function chips(l){var h='';
 if(l.partner!=null)h+=isArr(l.partner)?'<s class="ch p">'+E(l.partner[0])+'</s>'+(l.partner[1]?'<span class="ch p">'+E(l.partner[1])+'</span>':''):'<span class="ch p">'+E(l.partner)+'</span>';
 if(l.item!=null)h+=isArr(l.item)?'<s class="ch it">'+E(l.item[0])+'</s>'+(l.item[1]?'<span class="ch it">'+E(l.item[1])+'</span>':''):'<span class="ch it">'+E(l.item)+'</span>';
 (l.tags||[]).forEach(function(t){h+='<span class="ch tg">'+E(t)+'</span>'});
 (l.rmTags||[]).forEach(function(t){h+='<s class="ch tg">'+E(t)+'</s>'});
 return h?'<div>'+h+'</div>':''}
function note(l,d,first){var h=chips(l);
 if(l.memo!=null&&l.memo!==''||l.common)h+='<div><i class="ti ti-pencil" aria-hidden="true"></i>'+(l.memo!=null?V(l.memo):'')+(l.common?' <span class="ch cm">共通</span>':'')+'</div>';
 if(first&&d.desc)h+='<div class="sm"><i class="ti ti-credit-card" aria-hidden="true"></i>'+E(d.desc)+'</div>';
 return '<div class="nt">'+h+'</div>'}
function due(o,d){var done=o.mode!=='plan'&&(isArr(d.done)?d.done[1]:d.done);var ic=done?'<i class="ti ti-check" aria-label="決済済み"></i>':'<i class="ti ti-clock" aria-label="未決済"></i>';
 if(isArr(d.done))ic=(d.done[0]?'<i class="ti ti-check" aria-hidden="true"></i>':'<i class="ti ti-clock" aria-hidden="true"></i>')+'→'+ic;
 return '<span class="du">'+ic+(d.due&&nw(d.due)!==nw(d.date)?'<span class="dd">'+V(d.due,md)+'</span>':'')+'</span>'}
function kind(d){var k=nw(d.kind);return '<span class="bd '+(k==='in'?'i':'o')+'">'+(k==='in'?'収入':'支出')+'</span>'}
function wal(d){return d.wallet?V(d.wallet):'—'}
function dealsHTML(o){var ds=(o.deals||[]).slice().sort(function(a,b){return nw(b.date)<nw(a.date)?-1:nw(b.date)>nw(a.date)?1:0});
 var h='<div class="hd"><span>収支</span><span>発生日</span><span>期日</span><span class="hl"><span>勘定科目</span><span style="text-align:right">金額・税区分</span><span>取引先・品目・メモタグ・備考</span></span><span>決済口座</span></div>';
 var sin=0,sout=0;
 ds.forEach(function(d){var k=nw(d.kind);
  var ls=(d.lines||[]).map(function(l,i){var a=nw(l.amt);if(k==='in')sin+=a;else sout+=a;
   return '<div class="ln"><span class="ac">'+V(l.acct)+'<span class="tx sm">'+(l.tax!=null?V(l.tax):'')+'</span></span><span class="am">'+amt(o,d,l)+'<span class="sm">'+(l.tax!=null?V(l.tax):'')+'</span></span>'+note(l,d,i===0)+'</div>'}).join('');
  h+='<div class="dl"><div class="top">'+kind(d)+'<span class="sm">'+V(d.date,md)+'</span>'+due(o,d)+'<span class="sm w">'+wal(d)+'</span></div>'+
   '<span class="c1">'+kind(d)+'</span><span class="c2 sm">'+V(d.date,md)+'</span><span class="c3">'+due(o,d)+'</span><div class="ls">'+ls+'</div><span class="c5 sm">'+wal(d)+'</span></div>'});
 var parts=[];if(sin)parts.push('収入 '+yen(sin));if(sout)parts.push('支出 '+yen(sout));
 var ft=(o.foot!==false)?ds.length+'件'+(parts.length?'（'+parts.join('・')+'）':''):'';
 if(o.common)ft+=(ft?'｜':'')+'<span class="ch cm">共通</span> '+E(o.common);
 if(ft)h+='<div class="ft">'+ft+'</div>';
 return h}
function trHTML(o){var ts=(o.transfers||[]).slice().sort(function(a,b){return nw(b.date)<nw(a.date)?-1:1});
 var h='<div class="tw"><div class="hd"><span>振替日</span><span></span><span>振替元</span><span>振替先</span><span style="text-align:right">金額</span></div>';
 ts.forEach(function(t){var a=isArr(t.amt)?'<s>'+yen(t.amt[0])+'</s> → '+yen(t.amt[1]):yen(t.amt);
  if(t.url&&(o.mode==='after'||o.mode==='past'))a=isArr(t.amt)?'<s>'+yen(t.amt[0])+'</s> → <a href="'+E(t.url)+'" target="_blank" rel="noopener">'+yen(t.amt[1])+'</a>':'<a href="'+E(t.url)+'" target="_blank" rel="noopener">'+yen(t.amt)+'</a>';
  h+='<div class="dl"><span class="c1 sm">'+V(t.date,md)+'</span><span class="c2"><span class="bd tr">口座振替</span></span><span class="c3">'+V(t.from)+'</span><span class="c4">→ '+V(t.to)+'</span><span class="c5 am">'+a+'</span>'+(t.memo||t.desc?'<div class="nt" style="grid-column:3/6">'+(t.memo?'<div><i class="ti ti-pencil" aria-hidden="true"></i>'+V(t.memo)+'</div>':'')+(t.desc?'<div class="sm"><i class="ti ti-credit-card" aria-hidden="true"></i>'+E(t.desc)+'</div>':'')+'</div>':'')+'</div>'});
 if(o.foot!==false)h+='<div class="ft">'+ts.length+'件</div>';
 return h+'</div>'}
window.DV=function(o){o=o||{};o.mode=o.mode||'after';
 var el=typeof o.el==='string'?document.querySelector(o.el):(o.el||document.getElementById('dv'));if(!el)return;
 var h=o.title?'<div class="dvt">'+E(o.title)+'</div>':'';
 if(o.deals&&o.deals.length)h+=dealsHTML(o);
 if(o.transfers&&o.transfers.length)h+=trHTML(o);
 el.classList.add('dv');var dk=o.theme==='dark'||(o.theme!=='light'&&isDark());el.classList.toggle('dk',dk);el.innerHTML=h};
})();
