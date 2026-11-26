# itinerary：出張計画の行程

出張管理（C03_出張 の画面）の出張計画の行程（タイムライン）を、チャットの表示機能で画面と同じ形に描く部品。旅程を検討するスレッドで、承認の前に行程を見せるときに使う（手順はスキル c03-trip-plan 6.）。

今の版：`itinerary/itin_v261126a.js`（画面の版107 から組み立てた）

```html
<div id="it"></div>
<script src="https://cdn.jsdelivr.net/gh/sagawat/fs-claude-parts@main/itinerary/itin_v261126a.js"></script>
<script>
(function g(){if(typeof ITIN!=='function')return setTimeout(g,100);ITIN({days:[...],conditions:[...],schedule:[...]})})();
</script>
```

## 1. 渡すもの

- `ITIN(p, opt)`。`p` は db の plans と同じ形で、使うのは `schedule`（行程の項目）・`days`（日ごとの `sub`）・`conditions`（条件の札の中身）だけ。ほかの欄は渡さなくてよい。
- `schedule` の項目は `type` で分かれる：`stop`（地点。`arr`・`dep`・`pass`・`place`・`map`）／`leg`（移動。`mode`・`dur`・`lines`）／`box`（枠。`box`・`title`・`lines`）／`wait`（待ち。`text`）。どの項目も `date` を持ち、`tentative`（〈仮〉の札）・`cond`（条件の札）・`rsv`（予約の番号）を付けられる。項目の決まりは db の項目案の 2-6。
- `opt.el`：描く先（省くと `#it`）。`opt.dates`：出す日の配列（省くと全部）。

## 2. 見た目

- 描き方（JS）と見た目（CSS）は画面のソースからそのまま抜き出している。CSS はすべて `.fsit` の中に閉じ込め、表示機能の CSS とぶつからないようにした。
- 字は画面と同じ Google Fonts（BIZ UDPゴシック・Zen Kaku Gothic New・IBM Plex Mono）を読み込む。
- ダークモードは、表示先の字の色（`--text-primary`）の明るさを見て `.fsit.dk` に切り替える。
- 地図のリンクは、表示機能の `openLink` があればそれで開く（確認の画面を挟む）。
- 表示機能の幅（約680px）では、2日分は縦に並ぶ（画面は幅があれば横に2列）。

## 3. 作り直し方

部品は手で直さない。画面（出張管理）の版を上げて行程の描き方や見た目が変わったら、画面のソースから作り直す。

1. 画面のソースを、アーティファクトの read_file（paths）で作業場所に保存する。
2. `python3 build.py <画面の html> itin_v<YYMMDD><a,b,c>.js` を流し、`node --check` を通す。
3. 同じ出張計画を、画面の CSS で描いたものと部品で描いたものを、同じ幅（600・1000・330px）で撮って画素を比べる（明るい画面・暗い画面とも）。
4. 新しい版のファイルを足し（古い版は消さない）、この README の「今の版」と、スキル c03-trip-plan の読み込みの1行を直す。

build.py は `.tl` まわりのセレクタ（`tl`・`tlgrid`・`tlday`・`tsub`・`kari`・`ctag`・`mlink` と移動の色の `mr`・`ma`・`mc`・`mtk`・`ms`・`mo`）を含むルールと、そこで使う色の変数だけを拾う。画面で行程に新しいクラスを足したときは、build.py の `KEEP` にも足す。
