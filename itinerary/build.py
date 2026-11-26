"""画面（出張管理）のソースから行程の部品を組み立てる。
使い方: python3 build.py <画面の html> <出力の js>
CSS は .tl まわりのルールだけを抜き出し、セレクタの頭に .fsit を付ける。
:root の変数は .fsit に、ダークの変数は .fsit.dk に写す（部品が表示先の地の色を見て dk を付ける）。
"""
import re, sys, json

src = open(sys.argv[1], encoding="utf-8").read()
out = sys.argv[2]

css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", src, re.S))
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)

# トップレベルのルールに分ける（@media は中身ごと）
def split_rules(s):
    rules, i, n = [], 0, len(s)
    while i < n:
        j = s.find("{", i)
        if j < 0:
            break
        head = s[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if s[k] == "{": depth += 1
            elif s[k] == "}": depth -= 1
            k += 1
        rules.append((head, s[j + 1:k - 1]))
        i = k
    return rules

KEEP = re.compile(r"(^|[\s,>+~(])\.(tl|tlgrid|tlday|tsub|kari|ctag|mlink|mr|ma|mc|mtk|ms|mo)(?![\w-])")
VAR_KEYS = None

def keep_sel(sel):
    return bool(KEEP.search(" " + sel))

def scope(sel):
    parts = [p.strip() for p in sel.split(",")]
    res = []
    for p in parts:
        p = re.sub(r"^html\s+", "", p)
        res.append(".fsit " + p)
    return ",".join(res)

light, dark, body = {}, {}, []

def take_vars(block, d):
    for m in re.finditer(r"(--[\w-]+)\s*:\s*([^;]+)", block):
        d[m.group(1)] = m.group(2).strip()

for head, block in split_rules(css):
    if head.startswith("@media"):
        if "prefers-color-scheme:dark" in head.replace(" ", ""):
            for h2, b2 in split_rules(block):
                if ":root" in h2:
                    take_vars(b2, dark)
            continue
        inner = [(h2, b2) for h2, b2 in split_rules(block) if keep_sel(h2)]
        if inner:
            body.append(head + "{" + "".join(scope(h2) + "{" + b2.strip() + "}" for h2, b2 in inner) + "}")
        continue
    if head.startswith(":root"):
        if 'data-theme="dark"' in head:
            take_vars(block, dark)
        else:
            take_vars(block, light)
        continue
    if keep_sel(head):
        body.append(scope(head) + "{" + block.strip() + "}")

need = set(re.findall(r"var\((--[\w-]+)", "".join(body)))
# 変数の中で使う変数も拾う
for _ in range(3):
    for k in list(need):
        for v in (light.get(k, ""), dark.get(k, "")):
            need |= set(re.findall(r"var\((--[\w-]+)", v))
lv = ";".join(f"{k}:{light[k]}" for k in sorted(need) if k in light)
dv = ";".join(f"{k}:{dark[k]}" for k in sorted(need) if k in dark)
base = (f".fsit{{{lv};color:var(--ink);font-family:var(--f-body);font-size:14px;line-height:1.6;background:var(--surface);"
        f"border-radius:12px;padding:12px}}.fsit.dk{{{dv}}}.fsit *{{box-sizing:border-box}}"
        ".fsit h4{margin:0;font-weight:700;text-wrap:balance}")
CSS = base + "".join(body)

# JS：行程を描く関数を画面からそのまま写す
def grab(pat):
    m = re.search(pat, src, re.S)
    if not m:
        raise SystemExit("見つからない: " + pat)
    return m.group(0)

js_parts = [
    grab(r"const esc=s=>[^\n]*"),
    grab(r"const md=d=>[^\n]*"),
    grab(r"const WD=[^\n]*"),
    grab(r"const wd=d=>[^\n]*"),
    grab(r"const mapUrl=m=>[^\n]*"),
    grab(r"const mapA=\(text,m\)=>[^\n]*"),
    grab(r"const MODE=\{[^\n]*"),
    grab(r"const MCOL=\{[^\n]*"),
    grab(r"const durFmt=[^\n]*"),
    grab(r"const tmMin=[^\n]*"),
    grab(r"const tmDiff=[^\n]*"),
    grab(r"const durParse=[^\n]*"),
    grab(r"function tlBody\(items,p\)\{.*?\n\}\n"),
    grab(r"const tmS=v=>[^\n]*"),
]
JS = "\n".join(js_parts)

FONT = "https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=IBM+Plex+Mono:wght@400;500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap"

part = f"""/* fs-claude-parts itinerary：出張管理の画面の行程（タイムライン）をチャットで同じ形に描く部品。
   画面のソースから build.py で組み立てる（手で直さない）。 */
(function(){{
if(window.ITIN)return;
{JS}
const CSS={json.dumps(CSS, ensure_ascii=False)};
function addCss(){{if(document.getElementById("fsit-css"))return;const l=document.createElement("link");l.rel="stylesheet";l.href={json.dumps(FONT)};document.head.appendChild(l);const s=document.createElement("style");s.id="fsit-css";s.textContent=CSS;document.head.appendChild(s)}}
function isDark(){{const s=document.createElement("span");s.style.color="var(--text-primary, CanvasText)";document.body.appendChild(s);const c=getComputedStyle(s).color;s.remove();const m=c.match(/\\d+/g);if(!m)return false;const[r,g,b]=m.map(Number);return (r*299+g*587+b*114)/1000>140}}
/* p：db の plans と同じ形（schedule・days・conditions）。opt.el：描く先。opt.dates：出す日（省くと全部） */
window.ITIN=function(p,opt){{opt=opt||{{}};addCss();const el=typeof opt.el==="string"?document.querySelector(opt.el):(opt.el||document.getElementById("it"));
const sch=p.schedule||[];const subs={{}};for(const d of p.days||[])subs[d.date]=d.sub;
let ds=[...new Set(sch.map(x=>x.date))].sort();if(opt.dates)ds=ds.filter(d=>opt.dates.includes(d));
let h='<div class="tlgrid">';for(const d of ds)h+=`<div class="tlday"><h4>${{md(d)}}（${{wd(d)}}）</h4><div class="tsub">${{esc(subs[d]||"")}}</div>${{tlBody(sch.filter(x=>x.date===d),p)}}</div>`;h+='</div>';
el.classList.add("fsit");if(isDark())el.classList.add("dk");el.innerHTML=h;
el.addEventListener("click",e=>{{const a=e.target.closest("a.mlink");if(a&&typeof openLink==="function"){{e.preventDefault();openLink(a.href)}}}})}};
}})();
"""
open(out, "w", encoding="utf-8").write(part)
print("css", len(CSS), "js", len(JS), "part", len(part))
