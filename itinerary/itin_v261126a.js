/* fs-claude-parts itinerary：出張管理の画面の行程（タイムライン）をチャットで同じ形に描く部品。
   画面のソースから build.py で組み立てる（手で直さない）。 */
(function(){
if(window.ITIN)return;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const md=d=>{if(!d)return"";const p=d.split("-");return Number(p[1])+"/"+Number(p[2])};
const WD="日月火水木金土";
const wd=d=>WD[new Date(d+"T00:00:00").getDay()];
const mapUrl=m=>/^https?:/.test(m||"")?m:"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(m);
const mapA=(text,m)=>m?`<a class="mlink" href="${esc(mapUrl(m))}" target="_blank" rel="noopener" title="Google マップで開く">${esc(text)}</a>`:esc(text);
const MODE={rail:["電車","mr"],shinkansen:["新幹線","mr"],air:["飛行機","ma"],car:["車","mc"],bus:["バス","mc"],taxi:["タクシー","mc"],walk:["徒歩","mo"],other:["移動","mo"]};
const MCOL={rail:"var(--m-rail)",shinkansen:"var(--m-rail)",air:"var(--m-air)",car:"var(--m-car)",bus:"var(--m-car)",taxi:"var(--m-car)",walk:"var(--m-other)",other:"var(--m-other)"};
const durFmt=n=>n>=60?`${Math.floor(n/60)}h${n%60?" "+n%60+"m":""}`:`${n}m`;
const tmMin=s=>{const m=String(s||"").match(/^(\d{1,2})[:：](\d{2})/);return m?+m[1]*60+ +m[2]:null};
const tmDiff=(a,b)=>{const x=tmMin(a),y=tmMin(b);return x!=null&&y!=null&&y>=x?y-x:null};
const durParse=s=>{const m=String(s||"").replace(/^約/,"").match(/^(?:(\d+)時間)?(?:(\d+)分)?$/);if(!m||(!m[1]&&!m[2]))return null;return (+(m[1]||0))*60+(+(m[2]||0))};
function tlBody(items,p){
  const cmark=it=>it.cond?`<span class="ctag" title="${esc(((p.conditions||[]).find(c=>c.id===it.cond)||{}).text||"")}">条件</span>`:"";
  const kari=it=>it.tentative||/〈仮〉/.test(it.place||it.title||it.text||"")?'<span class="kari">仮</span>':"";
  const rf=it=>it.rsv?`<span class="rf">${esc(it.rsv)}</span>`:"";
  const xd=(txt,title,cls)=>`<span class="xd${cls?" "+cls:""}" title="${esc(title)}">⏱ ${esc(txt)}</span>`;
  let h='<div class="tl">';
  items.forEach((it,i)=>{
    const nx=items[i+1],pv=items[i-1];const ty=it.type||"stop";
    if(ty==="stop"){
      let cls,lc="";if(nx&&(nx.type==="leg")){cls="";lc=MCOL[nx.mode]||MCOL.other}else if(nx){cls="dot"}else cls="none";
      if(i===0)cls+=" first";
      const st=it.arr&&it.dep?tmDiff(it.arr,it.dep):null;
      const word=pv&&pv.type==="leg"&&nx&&nx.type==="leg"?"乗換":"滞在";
      h+=`<div class="r ctr ${it.arr&&it.dep?"two":""}"><div class="rl ${cls}" style="--lc:${lc}"><span class="nd"></span></div><div class="tm">${it.arr||it.dep||it.pass?(it.arr?`<span>${tmS(it.arr)}</span>`:"")+(st!=null?xd(durFmt(st),word+" "+durFmt(st),"xs"):"")+(it.dep?`<span>${tmS(it.dep)}</span>`:"")+(it.pass?`<span>${tmS(it.pass)}</span>`:""):esc(it.time||"")}</div><div class="pl">${mapA((it.place||it.text||"").replace("〈仮〉",""),it.map)}${kari(it)}${cmark(it)}${rf(it)}</div></div>`;
    }else if(ty==="leg"){
      const m=MODE[it.mode]||MODE.other;
      let d=String(it.dur||"").replace(/^飛行\s*/,""),rest="";const k=d.indexOf("・");if(k>=0){rest=d.slice(k+1);d=d.slice(0,k)}
      const n=durParse(d);const dt=n!=null?durFmt(n):d.replace(/^約/,"");
      h+=`<div class="r"><div class="rl" style="--lc:${MCOL[it.mode]||MCOL.other}"></div><div class="tm">${it.dur?xd(dt,"移動 "+it.dur,"xl"):""}</div><div class="lg"><span class="mt ${m[1]}">${m[0]}</span>${(it.lines||[]).map(esc).join("<br>")}${rf(it)}${rest?`<br>${esc(rest)}`:""}</div></div>`;
    }else if(ty==="wait"){
      const a=pv&&(pv.type||"stop")==="stop"&&pv.arr&&!pv.dep?pv.arr:null,b=nx&&(nx.type||"stop")==="stop"&&nx.dep&&!nx.arr?nx.dep:null;
      const wm=a&&b?tmDiff(a,b):null;const pure=/^待ち\s*[約0-9０-９]/.test(it.text||"");
      if(wm!=null&&pure)h+=`<div class="r wr"><div class="rl dot"></div><div class="tm">${xd(durFmt(wm),it.text||"","xl")}</div><div></div></div>`;
      else if(wm!=null)h+=`<div class="r wr"><div class="rl dot"></div><div class="tm">${xd(durFmt(wm),"待ち "+durFmt(wm),"xl")}</div><div class="wt wt3">${esc(it.text||"")}</div></div>`;
      else h+=`<div class="r"><div class="rl dot"></div><div></div><div class="wt">${esc(it.text||"")}</div></div>`;
    }else{
      h+=`<div class="r"><div class="rl ${nx?"dot":"none"}"></div><div></div><div class="bx ${esc(it.box||"")}"><b>${mapA((it.title||"").replace("〈仮〉",""),it.map)}${kari(it)}${cmark(it)}${rf(it)}</b>${(it.lines||[]).map(l=>`<div>${esc(l)}</div>`).join("")}</div></div>`;
    }
  });
  return h+"</div>";
}

const tmS=v=>{const m=String(v).match(/^([0-9:：]+)([^0-9:：].*)$/);return m?`${esc(m[1])}<small class="tsx">${esc(m[2].replace(/^ごろ$/,"頃"))}</small>`:esc(v)};
const CSS=".fsit{--accent:#333836;--f-body:\"BIZ UDPGothic\",\"Hiragino Sans\",\"Yu Gothic\",sans-serif;--f-display:\"Zen Kaku Gothic New\",\"Hiragino Sans\",\"Yu Gothic\",sans-serif;--f-num:\"IBM Plex Mono\",ui-monospace,Menlo,monospace;--ink:#222222;--kari:#7a4a00;--kari-bg:#fff4e0;--m-air:#2a78c2;--m-car:#c27a14;--m-other:#6b7570;--m-rail:#2f8a57;--m-stay:#8a3f7a;--m-talk:#2b3f8c;--muted:#666664;--need:#A63D2B;--need-bg:#F7E2DC;--rule:#DADAD7;--surface:#FFFFFF;--talk-bd:#c9d1ec;--talk-bg:#eef1f9;color:var(--ink);font-family:var(--f-body);font-size:14px;line-height:1.6;background:var(--surface);border-radius:12px;padding:12px}.fsit.dk{--accent:#D6D8D5;--ink:#E6E6E4;--kari:#e9b866;--kari-bg:#3a2e16;--m-air:#6fb0ee;--m-car:#e6a04a;--m-other:#9aa29e;--m-rail:#5cc28a;--m-stay:#d08cc2;--m-talk:#8fa3e6;--muted:#A0A19E;--need:#F09A88;--need-bg:#3E231D;--rule:#333634;--surface:#1F2120;--talk-bd:#3a4670;--talk-bg:#232a3f}.fsit *{box-sizing:border-box}.fsit h4{margin:0;font-weight:700;text-wrap:balance}.fsit .tl .r{grid-template-columns:18px 64px minmax(0,1fr)!important}.fsit .tl .tm span{display:block;line-height:1.35}.fsit .tl .r.two .nd{top:16px}.fsit .tl .r.two .rl.first::before{top:21px}.fsit .tl .tm small{font-size:10px;color:var(--muted);margin-left:2px;font-family:var(--f-body);font-weight:400}.fsit .tl .ctag,.fsit .tl .kari{display:inline-block;padding:3px 5px;line-height:1.2}.fsit .conds .ci .ctag{margin-left:0}.fsit .conds .ctag,.fsit .conds .kari{padding:5px}.fsit .tlgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:16px;align-items:start}.fsit .tlday h4{font-family:var(--f-display);font-size:16px;margin:0}.fsit .tlday .tsub{font-size:12px;color:var(--muted);margin:0 0 8px}.fsit .tl{border:1px solid var(--rule);border-radius:10px;padding:12px 12px 14px}.fsit .tl .r{display:grid;grid-template-columns:18px 56px minmax(0,1fr);column-gap:8px}.fsit .tl .rl{position:relative}.fsit .tl .rl::before{content:\"\";position:absolute;left:8px;top:0;bottom:0;width:2px;background:var(--lc,var(--muted))}.fsit .tl .rl.dot::before{background:none;border-left:2px dotted var(--rule);width:0}.fsit .tl .rl.none::before{display:none}.fsit .tl .rl.first::before{top:12px}.fsit .tl .nd{position:absolute;left:3px;top:7px;width:12px;height:12px;border-radius:50%;background:var(--surface);border:2px solid var(--muted);z-index:1}.fsit .tl .tm{font-family:var(--f-num);font-size:14px;font-weight:500;padding-top:1px;white-space:nowrap}.fsit .tl .pl{font-weight:700;padding-top:1px;line-height:1.4}.fsit .tl .lg{grid-column:3;padding:4px 0 8px;font-size:12px;color:var(--muted);line-height:1.55}.fsit .tl .mt{display:inline-block;color:#fff;font-size:11px;font-weight:700;border-radius:4px;padding:0 6px;margin-right:6px;vertical-align:1px;background:var(--mc)}.fsit .tl .du{color:var(--ink)}.fsit .tl .bx{grid-column:2/4;margin:6px 0 8px;border:1px solid var(--rule);border-radius:8px;padding:6px 10px;font-size:12px;line-height:1.55}.fsit .tl .bx b{display:block;font-size:13px;color:var(--ink)}.fsit .tl .bx div{color:var(--muted)}.fsit .tl .bx.talk{background:var(--talk-bg);border-color:var(--talk-bd)}.fsit .tl .wt{grid-column:2/4;padding:4px 0 8px;font-size:12px;color:var(--muted)}.fsit .tl .rf{font-family:var(--f-num);font-size:11px;color:var(--muted);border:1px solid var(--rule);border-radius:4px;padding:0 4px;margin-left:6px;font-weight:400;vertical-align:1px}.fsit .kari{font-size:11px;background:var(--kari-bg);color:var(--kari);border-radius:3px;padding:0 5px;margin-left:6px;font-weight:500;vertical-align:1px}.fsit .ctag{font-size:11px;background:var(--need-bg);color:var(--need);border-radius:3px;padding:0 5px;margin-left:6px;font-weight:700;vertical-align:1px}.fsit .mr{--mc:var(--m-rail)}.fsit .ma{--mc:var(--m-air)}.fsit .mc{--mc:var(--m-car)}.fsit .mtk{--mc:var(--m-talk)}.fsit .ms{--mc:var(--m-stay)}.fsit .mo{--mc:var(--m-other)}@media (max-width:600px){.fsit .tlgrid{grid-template-columns:minmax(0,1fr)}}.fsit .tl .tm{white-space:normal}.fsit .tl .tm span{white-space:normal}.fsit .tl .tm small{white-space:nowrap}.fsit .tl .tm .xd{display:block;font-size:11px;font-weight:400;color:var(--muted);font-family:var(--f-body);line-height:1.3;white-space:nowrap;cursor:default}.fsit .tl .tm .xd.xs{margin:2px 0;line-height:1.2}.fsit .tl .tm .xd.xl{padding:0;line-height:1.2}.fsit .tl .r>.tm:has(>.xd.xl){display:flex;align-items:center}.fsit .tl .r:has(>.tm>.xd.xl)>.lg{padding:6px 0;align-self:center}.fsit .tl .r.wr>.tm{padding:6px 0}.fsit .tl .wt.wt3{grid-column:3}.fsit .tl .wt{grid-column:3}.fsit .tl .bx{grid-column:3/4}.fsit .tl .tm span:has(>small.tsx){white-space:nowrap}.fsit .tl .r.ctr{align-items:center}.fsit .tl .r.ctr .pl{padding-top:0}.fsit .tl .r.ctr .rl{align-self:stretch}.fsit .tl .r.ctr .nd{top:50%;transform:translateY(-50%)}.fsit .tl .r.ctr .rl.first::before{top:50%}.fsit .tl .r.two .nd{top:50%}.fsit .tl .r.two .rl.first::before{top:50%}.fsit .mlink{color:inherit;text-decoration:underline dotted;text-decoration-color:var(--muted);text-underline-offset:3px}.fsit .mlink:hover{text-decoration-style:solid;text-decoration-color:currentColor}.fsit .mlink:focus-visible{outline:2px solid var(--accent);outline-offset:1px;border-radius:2px}";
function addCss(){if(document.getElementById("fsit-css"))return;const l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap";document.head.appendChild(l);const s=document.createElement("style");s.id="fsit-css";s.textContent=CSS;document.head.appendChild(s)}
function isDark(){const s=document.createElement("span");s.style.color="var(--text-primary, CanvasText)";document.body.appendChild(s);const c=getComputedStyle(s).color;s.remove();const m=c.match(/\d+/g);if(!m)return false;const[r,g,b]=m.map(Number);return (r*299+g*587+b*114)/1000>140}
/* p：db の plans と同じ形（schedule・days・conditions）。opt.el：描く先。opt.dates：出す日（省くと全部） */
window.ITIN=function(p,opt){opt=opt||{};addCss();const el=typeof opt.el==="string"?document.querySelector(opt.el):(opt.el||document.getElementById("it"));
const sch=p.schedule||[];const subs={};for(const d of p.days||[])subs[d.date]=d.sub;
let ds=[...new Set(sch.map(x=>x.date))].sort();if(opt.dates)ds=ds.filter(d=>opt.dates.includes(d));
let h='<div class="tlgrid">';for(const d of ds)h+=`<div class="tlday"><h4>${md(d)}（${wd(d)}）</h4><div class="tsub">${esc(subs[d]||"")}</div>${tlBody(sch.filter(x=>x.date===d),p)}</div>`;h+='</div>';
el.classList.add("fsit");if(isDark())el.classList.add("dk");el.innerHTML=h;
el.addEventListener("click",e=>{const a=e.target.closest("a.mlink");if(a&&typeof openLink==="function"){e.preventDefault();openLink(a.href)}})};
})();
