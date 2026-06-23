# Past Papers Answer Workflow

杩欎唤鏂囨。鏄粰鍚庣画缁存姢 `Past Papers` 绛旀鐢ㄧ殑锛岄噸鐐硅鏄庯細

- `solutions` 鐩綍鎬庝箞鏀炬枃浠?- `html` 鎬庝箞鍐?- 鍓嶇鎬庝箞娉ㄥ唽绛旀
- 鍑洪棶棰樻椂鍏堟煡浠€涔?
## 1. 鐩稿叧鐩綍

- TeX 婧愭枃浠讹細`public/downloads/solutions/*.tex`
- HTML 绛旀椤碉細`public/downloads/solutions/web/*.html`
- 绛旀娉ㄥ唽琛細`src/pages/pastpapers/resources.ts`
- 绛旀绫诲瀷宸ュ叿锛歚src/pages/pastpapers/answers/types.ts`
- 椤甸潰涓婚€昏緫锛歚src/pages/PastPapers.tsx`

## 2. 鍛藉悕瑙勫垯

绛旀鏂囦欢缁熶竴鐢ㄨ繖绉嶆牸寮忥細

- `YYYY_STEP_QN.tex`
- `YYYY_STEP_QN.html`

渚嬪瓙锛?
- `2017_II_Q1.tex`
- `2017_II_Q1.html`
- `2017_III_Q12.tex`

鍏朵腑 `STEP` 鍙兘鏄細

- `I`
- `II`
- `III`

杩欎釜鏍煎紡蹇呴』鍖归厤 [types.ts](/f:/project/src/pages/pastpapers/answers/types.ts:1) 閲岀殑姝ｅ垯锛?
```ts
/^(\d{4})_(I|II|III)_Q(\d+)$/
```

濡傛灉鍛藉悕涓嶅锛屽墠绔笉浼氳瘑鍒€?
## 3. 鏂板涓€涓瓟妗堢殑姝ラ

浠?`2018 II Q3` 涓轰緥銆?
1. 鏂板缓 TeX锛?   `public/downloads/solutions/2018_II_Q3.tex`
2. 鏂板缓 HTML锛?   `public/downloads/solutions/web/2018_II_Q3.html`
3. 鍦?[resources.ts](/f:/project/src/pages/pastpapers/resources.ts:1) 鐨?`questionSourceIds` 閲屽姞锛?
```ts
'2018_II_Q3'
```

4. 璺戠被鍨嬫鏌ワ細

```powershell
npx tsc -p tsconfig.json --noEmit
```

5. 鎵撳紑椤甸潰鎵嬪姩妫€鏌ワ細
   `STEP 2018 -> STEP II -> Q3`

## 4. HTML 妯℃澘瑕佹眰

寤鸿鐩存帴鐓х幇鏈夋枃浠舵妱缁撴瀯锛屾瘮濡傦細

- [2017_II_Q1.html](/f:/project/public/downloads/solutions/web/2017_II_Q1.html:1)
- [2017_II_Q4.html](/f:/project/public/downloads/solutions/web/2017_II_Q4.html:1)
- [2017_III_Q12.html](/f:/project/public/downloads/solutions/web/2017_III_Q12.html:1)

鏈€灏戣鍖呭惈锛?
- `MathJax` 閰嶇疆
- `tex-chtml.js`
- `<main>` 瀹瑰櫒
- `.math-block` 鏍峰紡

缃戦〉閲岀殑鏁板鍐欐硶瑕佹眰锛?
- 琛屽唴鍏紡鐢?`\(...\)`
- 灞曠ず鍏紡鐢?`\[...\]`

涓嶈鍦?HTML 閲岀户缁敤锛?
- `$...$`
- `$$...$$`

鍥犱负褰撳墠椤甸潰閰嶇疆鍙惎鐢ㄤ簡 `\(...\)` 鍜?`\[...\]`銆?


### 4.1 HTML 鍐呭蹇呴』瀵瑰簲 TeX

HTML 鏄悓鍚?TeX 鐨勭綉椤垫帓鐗堢増鏈紝涓嶆槸閲嶆柊鍐欑瓟妗堛€?
- 涓嶈鎿呰嚜澧炲姞 TeX 閲屾病鏈夌殑鍙ュ瓙銆佽В閲娿€佹€荤粨銆佺粨璁烘垨缃插悕鍐呭銆?- 涓嶈鎿呰嚜鈥滀慨姝ｂ€濆師 TeX 鐨勬暟瀛︽楠わ紱濡傛灉鍙戠幇 TeX 鏈夌枒浼奸敊璇紝鍏堟敼 TeX 鎴栬闂淮鎶よ€咃紝鍐嶅悓姝?HTML銆?- 鍏佽鐨勬敼鍔ㄥ彧闄愪簬 HTML / MathJax 蹇呴渶杞崲锛屼緥濡?`$...$` 杞?`\(...\)`銆乣$$...$$` 杞?`\[...\]`銆丠TML 涓?`<` 鍐欐垚 `&lt;` 浠ラ伩鍏嶆覆鏌撻敊璇€?
## 5. TeX 杞?HTML 鏃舵渶瀹规槗韪╃殑鍧?
### 5.1 `\qquad` 鏄剧ず鎴愭櫘閫氭枃瀛?
閿欒鍐欐硶锛?
```tex
When $n=0$, \qquad $I_0 = ...
```

鍘熷洜锛?
- `\qquad` 鍦ㄦ暟瀛︾幆澧冨闈?- PDF 閲岀殑 LaTeX 鍙兘杩樿兘杩?- HTML 閲岀殑 MathJax 涓嶄細澶勭悊鏁板鐜澶栫殑 TeX 鍛戒护

姝ｇ‘鍐欐硶锛?
```tex
When $n=0$, $\qquad I_0 = ...
```

鎴栬€呭湪 HTML 閲岋細

```html
<p>When \(n=0\), \(\qquad I_0 = ...\)</p>
```

### 5.2 涓€閮ㄥ垎鍏紡娌℃覆鏌?
鍏堟鏌ユ槸涓嶆槸鎶?TeX 鍛戒护鍐欏埌浜嗘暟瀛︾幆澧冨闈紝姣斿锛?
- `\qquad`
- `\therefore`
- `\because`

杩欎簺閮藉簲璇ユ斁杩涘悓涓€涓暟瀛﹀潡閲屻€?

### 5.3 HTML 鏁板渲鏌撳け鏁
- 濡傛灉 HTML 閲岀殑鏁板鍧楃獊鐒舵病鏈夋覆鏌擄紝鐢氳嚦鎶? `\[` / `\begin{aligned}` 鍘熸牱鏄剧ず鍑烘潵锛屽厛鏌?HTML 鏁板鍐呭閲屾槸鍚︽湁娌℃湁杞箟鐨? `<`銆?
- 鍦?HTML 鏁板鍧楅噷锛? `x<0` 蹇呴』鍐欐垚 `x&lt;0`锛? `-2<x<0` 蹇呴』鍐欐垚 `-2&lt;x&lt;0`锛屽惁鍒欐祻瑙堝櫒浼氭妸 `<...` 褰撴垚 HTML锛屽鑷?MathJax 鍧楄鐮村潖銆?
- `>` 閫氬父涓嶉渶瑕佽浆涔夛紝浣? `<` 鍦?HTML 鏁板閲屽簲榛樿鍐欐垚 `&lt;`銆?
- `tikzpicture` / `pgfplots` 涓嶈兘鐩存帴鏀捐繘 HTML 缁欑綉椤垫覆鏌撱€?HTML 闇€瑕佸浘褰㈡椂锛岃鏀规垚 `svg`銆?`img` 鎴栧叾浠栫綉椤甸粯璁ゅ浘褰㈡柟寮忋€?

### 5.4 `Hence,` / `Thus,` 鍚庨潰 boxed 缁撹鐨勫眳涓棶棰?
- 濡傛灉 TeX 鐢ㄧ殑鏄? `Hence,\hfill $\boxed{...}$\hfill` 杩欑鍐欐硶锛?HTML 涓嶈鐢ㄧ畝鍗曠殑 `&emsp;` 鎴栬€? `float:right` 鍘诲亣瑁呭眳涓€?
- 鎺ㄨ崘鍦?HTML 閲岀敤涓夊垪甯冨眬锛氬乏杈规槸 `Hence,`锛屼腑闂寸敤 `justify-self:center` 鎽嗘斁 `\(\boxed{...}\)`锛屽彸杈圭暀绌恒€傝繖鏍锋墠鑳藉悓鏃朵繚鐣欏墠缂€鏂囧瓧鍜岃 boxed 缁撹鐪熸灞呬腑銆?
### 5.5 椤甸潰搴曢儴鍑虹幇澶у潡鐧藉簳

杩欓€氬父涓嶆槸绛旀 HTML 鏈韩鐨勯棶棰橈紝鑰屾槸 iframe 楂樺害娌￠噸鏂扮缉鍥炲幓銆?
鐩稿叧浠ｇ爜鍦細

- [PastPapers.tsx](/f:/project/src/pages/PastPapers.tsx:379)

濡傛灉鍒囨崲鐭瓟妗堝悗搴曚笅鐣欏緢澶х┖鐧斤紝浼樺厛鏌ヨ繖閲岀殑 iframe 楂樺害鍚屾閫昏緫銆?
## 6. 鐜板湪鐨勭瓟妗堟敞鍐屾柟寮?
鐜板湪涓嶅啀缁欐瘡閬撻鍗曠嫭寤鸿繖绉嶉噸澶嶆枃浠讹細

```ts
import { createQuestionSource } from './types';

const answer2017IIQ1 = createQuestionSource('2017_II_Q1');

export default answer2017IIQ1;
```

鐜板湪缁熶竴鍦?[resources.ts](/f:/project/src/pages/pastpapers/resources.ts:1) 閲岀淮鎶わ細

```ts
const questionSourceIds = ['2017_II_Q1', '2017_II_Q4', '2017_III_Q12'] as const;
```

鏂板绛旀鏃讹紝鍙敼杩欎釜鏁扮粍銆?
## 7. 蹇€熸鏌ユ竻鍗?
鏂板鎴栦慨鏀圭瓟妗堝悗锛岃嚦灏戞鏌ヤ笅闈㈠嚑椤癸細

1. `tex` 鏂囦欢鍚嶅涓嶅
2. `html` 鏂囦欢鍚嶅涓嶅
3. `resources.ts` 閲屾湁娌℃湁鍔犲搴?ID
4. HTML 閲屾槸鍚︾敤浜?`\(...\)` / `\[...\]`
5. 鏈夋病鏈夋妸 `\qquad`銆乣\therefore` 涔嬬被鍐欏埌鏁板鐜澶栭潰
6. HTML 鍐呭鏄惁閫愰」瀵瑰簲鍚屽悕 TeX锛屾病鏈夋柊澧?TeX 涓笉瀛樺湪鐨勬枃瀛楁垨鏁板姝ラ
7. 椤甸潰閲屽搴旈鍙锋槸鍚﹀彉鎴愬彲鐐瑰嚮
8. 鐐瑰紑鍚庡叕寮忔槸鍚︽覆鏌撴甯?9. 鍒囨崲鍒板埆鐨勯鍚?iframe 楂樺害鏄惁姝ｅ父鏀剁缉

## 8. 鎺ㄨ崘鍋氭硶

- 鍏堝啓濂?`.tex`
- 鍐嶆墜宸ユ暣鐞嗕竴浠藉共鍑€鐨?`.html`
- 涓嶈鐩存帴鎶婃暣浠?LaTeX 鍘熸牱濉炶繘 HTML
- 灏介噺澶嶇敤鐜版湁 HTML 缁撴瀯锛屽埆姣忛閮藉彂鏄庢柊鏍峰紡
- 鏂板绛旀鍚庣珛鍗冲仛涓€娆℃墜鍔ㄧ偣鍑绘鏌?
## 9. 褰撳墠宸茬煡鍙弬鑰冩枃浠?
- [public/downloads/solutions/2017_II_Q1.tex](/f:/project/public/downloads/solutions/2017_II_Q1.tex:1)
- [public/downloads/solutions/web/2017_II_Q1.html](/f:/project/public/downloads/solutions/web/2017_II_Q1.html:1)
- [public/downloads/solutions/2017_II_Q4.tex](/f:/project/public/downloads/solutions/2017_II_Q4.tex:1)
- [public/downloads/solutions/web/2017_II_Q4.html](/f:/project/public/downloads/solutions/web/2017_II_Q4.html:1)
- [public/downloads/solutions/2017_III_Q12.tex](/f:/project/public/downloads/solutions/2017_III_Q12.tex:1)
- [public/downloads/solutions/web/2017_III_Q12.html](/f:/project/public/downloads/solutions/web/2017_III_Q12.html:1)

