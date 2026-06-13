# Past Papers Answer Workflow

这份文档是给后续维护 `Past Papers` 答案用的，重点说明：

- `solutions` 目录怎么放文件
- `html` 怎么写
- 前端怎么注册答案
- 出问题时先查什么

## 1. 相关目录

- TeX 源文件：`public/downloads/solutions/*.tex`
- HTML 答案页：`public/downloads/solutions/web/*.html`
- 答案注册表：`src/pages/pastpapers/resources.ts`
- 答案类型工具：`src/pages/pastpapers/answers/types.ts`
- 页面主逻辑：`src/pages/PastPapers.tsx`

## 2. 命名规则

答案文件统一用这种格式：

- `YYYY_STEP_QN.tex`
- `YYYY_STEP_QN.html`

例子：

- `2017_II_Q1.tex`
- `2017_II_Q1.html`
- `2017_III_Q12.tex`

其中 `STEP` 只能是：

- `I`
- `II`
- `III`

这个格式必须匹配 [types.ts](/f:/project/src/pages/pastpapers/answers/types.ts:1) 里的正则：

```ts
/^(\d{4})_(I|II|III)_Q(\d+)$/
```

如果命名不对，前端不会识别。

## 3. 新增一个答案的步骤

以 `2018 II Q3` 为例。

1. 新建 TeX：
   `public/downloads/solutions/2018_II_Q3.tex`
2. 新建 HTML：
   `public/downloads/solutions/web/2018_II_Q3.html`
3. 在 [resources.ts](/f:/project/src/pages/pastpapers/resources.ts:1) 的 `questionSourceIds` 里加：

```ts
'2018_II_Q3'
```

4. 跑类型检查：

```powershell
npx tsc -p tsconfig.json --noEmit
```

5. 打开页面手动检查：
   `STEP 2018 -> STEP II -> Q3`

## 4. HTML 模板要求

建议直接照现有文件抄结构，比如：

- [2017_II_Q1.html](/f:/project/public/downloads/solutions/web/2017_II_Q1.html:1)
- [2017_II_Q4.html](/f:/project/public/downloads/solutions/web/2017_II_Q4.html:1)
- [2017_III_Q12.html](/f:/project/public/downloads/solutions/web/2017_III_Q12.html:1)

最少要包含：

- `MathJax` 配置
- `tex-chtml.js`
- `<main>` 容器
- `.math-block` 样式

网页里的数学写法要求：

- 行内公式用 `\(...\)`
- 展示公式用 `\[...\]`

不要在 HTML 里继续用：

- `$...$`
- `$$...$$`

因为当前页面配置只启用了 `\(...\)` 和 `\[...\]`。



### 4.1 HTML 内容必须对应 TeX

HTML 是同名 TeX 的网页排版版本，不是重新写答案。

- 不要擅自增加 TeX 里没有的句子、解释、总结、结论或署名内容。
- 不要擅自“修正”原 TeX 的数学步骤；如果发现 TeX 有疑似错误，先改 TeX 或询问维护者，再同步 HTML。
- 允许的改动只限于 HTML / MathJax 必需转换，例如 `$...$` 转 `\(...\)`、`$$...$$` 转 `\[...\]`、HTML 中 `<` 写成 `&lt;` 以避免渲染错误。

## 5. TeX 转 HTML 时最容易踩的坑

### 5.1 `\qquad` 显示成普通文字

错误写法：

```tex
When $n=0$, \qquad $I_0 = ...
```

原因：

- `\qquad` 在数学环境外面
- PDF 里的 LaTeX 可能还能过
- HTML 里的 MathJax 不会处理数学环境外的 TeX 命令

正确写法：

```tex
When $n=0$, $\qquad I_0 = ...
```

或者在 HTML 里：

```html
<p>When \(n=0\), \(\qquad I_0 = ...\)</p>
```

### 5.2 一部分公式没渲染

先检查是不是把 TeX 命令写到了数学环境外面，比如：

- `\qquad`
- `\therefore`
- `\because`

这些都应该放进同一个数学块里。

### 5.3 页面底部出现大块白底

这通常不是答案 HTML 本身的问题，而是 iframe 高度没重新缩回去。

相关代码在：

- [PastPapers.tsx](/f:/project/src/pages/PastPapers.tsx:379)

如果切换短答案后底下留很大空白，优先查这里的 iframe 高度同步逻辑。

## 6. 现在的答案注册方式

现在不再给每道题单独建这种重复文件：

```ts
import { createQuestionSource } from './types';

const answer2017IIQ1 = createQuestionSource('2017_II_Q1');

export default answer2017IIQ1;
```

现在统一在 [resources.ts](/f:/project/src/pages/pastpapers/resources.ts:1) 里维护：

```ts
const questionSourceIds = ['2017_II_Q1', '2017_II_Q4', '2017_III_Q12'] as const;
```

新增答案时，只改这个数组。

## 7. 快速检查清单

新增或修改答案后，至少检查下面几项：

1. `tex` 文件名对不对
2. `html` 文件名对不对
3. `resources.ts` 里有没有加对应 ID
4. HTML 里是否用了 `\(...\)` / `\[...\]`
5. 有没有把 `\qquad`、`\therefore` 之类写到数学环境外面
6. HTML 内容是否逐项对应同名 TeX，没有新增 TeX 中不存在的文字或数学步骤
7. 页面里对应题号是否变成可点击
8. 点开后公式是否渲染正常
9. 切换到别的题后 iframe 高度是否正常收缩

## 8. 推荐做法

- 先写好 `.tex`
- 再手工整理一份干净的 `.html`
- 不要直接把整份 LaTeX 原样塞进 HTML
- 尽量复用现有 HTML 结构，别每题都发明新样式
- 新增答案后立即做一次手动点击检查

## 9. 当前已知可参考文件

- [public/downloads/solutions/2017_II_Q1.tex](/f:/project/public/downloads/solutions/2017_II_Q1.tex:1)
- [public/downloads/solutions/web/2017_II_Q1.html](/f:/project/public/downloads/solutions/web/2017_II_Q1.html:1)
- [public/downloads/solutions/2017_II_Q4.tex](/f:/project/public/downloads/solutions/2017_II_Q4.tex:1)
- [public/downloads/solutions/web/2017_II_Q4.html](/f:/project/public/downloads/solutions/web/2017_II_Q4.html:1)
- [public/downloads/solutions/2017_III_Q12.tex](/f:/project/public/downloads/solutions/2017_III_Q12.tex:1)
- [public/downloads/solutions/web/2017_III_Q12.html](/f:/project/public/downloads/solutions/web/2017_III_Q12.html:1)
