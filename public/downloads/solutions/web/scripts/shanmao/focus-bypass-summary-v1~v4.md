# Focus Bypass 总结文档

---

## 一、目标网站的检测策略

网站使用了一套叫 `WindowSwitch` 的自定义检测系统，结合 `rrweb` 录屏库。

### 检测方式（三重）

| 检测方式 | 具体实现 |
|---------|---------|
| `visibilitychange` 事件 | 监听标签页切换 |
| `window blur` 事件 | 监听窗口失去焦点，条件：`activeElement.nodeName != 'IFRAME'` |
| `window focus` 事件 | 监听窗口重新获得焦点 |

### 检测到切屏后做什么
1. 记录**离开时间**，POST 到 `/rrweb/recordHiddenVisible`
2. 记录**返回时间**和**中断时长**，再次 POST
3. 用 `rrweb` 全程录屏，压缩上传到 OSS 服务器
4. 页面显示警告弹窗："系统后台已记录这次切屏"

---

## 二、各版本策略

---

### V1 — Console 手动粘贴
**方法：** 直接在浏览器 Console 粘贴 JS 代码，用 `Object.defineProperty` 覆盖 `visibilityState`，用 `setInterval` 模拟鼠标移动。

**失败原因：**
- 页面加载完才执行，`windowSwitch.js` 的监听器早已注册无法撤销
- `Object.defineProperty` 在 Console 里报错：`Cannot redefine property: visibilityState`（属性已被锁定）

---

### V2 — Chrome 扩展（硬拦截）
**方法：** 打包成 Chrome 扩展，用 `run_at: document_start` + `world: MAIN` 在页面 JS 之前注入，直接**屏蔽**所有敏感事件。

```javascript
// 丢弃所有敏感事件，让监听器永远注册不上
window.addEventListener = function(type, fn, opts) {
    if (BLOCKED.has(type)) return; // 直接丢弃
    return _winAEL(type, fn, opts);
};

// 拦截 WindowSwitch 类赋值，清空其方法
Object.defineProperty(window, 'WindowSwitch', {
    set(cls) {
        cls.prototype.addEventListener = function() {};
        cls.prototype.addEventListenerAll = function() {};
    }
});
```

**结果：** 成功阻断检测。

**缺点：**
- `addEventListener.toString()` 暴露被篡改，容易被检测到
- 行为过于粗暴，网站可以验证原生函数特征发现异常

---

### V3 — Chrome 扩展（误导伪装）
**方法：** 不拦截事件，而是**伪造返回值**，让网站的回调收到假数据。

```javascript
// visibilitychange 触发时，回调读到的值永远是 visible
document.addEventListener('visibilitychange', function(e) {
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
    fn.call(this, e); // 正常触发，但读到假值
});

// blur 触发后 50ms 补发 focus，模拟立刻回来
window.addEventListener('blur', function(e) {
    fn.call(this, e);
    setTimeout(() => window.dispatchEvent(new FocusEvent('focus')), 50);
});

// WindowSwitch 回调中把 hidden 替换成 show
cls.prototype.addEventListenerAll = function(fn) {
    return original.call(this, function(status, count) {
        fn('show', count); // 永远告诉网站是 show
    });
};

// 伪装 toString 防止被检测
window.addEventListener.toString = () => 'function addEventListener() { [native code] }';
```

**结果：** 部分成功——网站知道离开了，但**中断时长显示 NaN**（时间计算被干扰）。

**失败原因：**
`WindowSwitch` 的 `blur` 监听条件是：
```javascript
if (this.focus && document.activeElement.nodeName != 'IFRAME')
```
`blur` 事件还是触发了 `callback('hidden')`，服务端收到了离开记录。V3 对 `blur` 的补发 `focus` 来不及阻止第一次 `hidden` 的上传。

---

### V4 — Chrome 扩展（IFRAME 欺骗）
**方法：** 针对 `WindowSwitch` 的 `blur` 检测条件，让 `document.activeElement` 永远返回一个假的 `iframe`，使条件永远不成立。

```javascript
// 核心：伪造 activeElement 为 IFRAME
// WindowSwitch 检测条件: activeElement.nodeName != 'IFRAME'
// 永远返回 iframe，条件永远不成立，callback('hidden') 永远不触发
const fakeIframe = document.createElement('iframe');
Object.defineProperty(document, 'activeElement', {
    get: () => fakeIframe,
    configurable: true
});
```

结合 V3 的所有策略：
- `visibilityState` 永远返回 `visible`
- `visibilitychange` 回调读到假值
- `blur` 补发 `focus`
- `WindowSwitch` 回调永远收到 `show`
- `toString()` 伪装成原生函数

**原理：**
```javascript
// WindowSwitch 源码里的 blur 监听
window.addEventListener('blur', function() {
    // fakeIframe.nodeName === 'IFRAME'，所以这个 if 永远不成立
    if (this.focus && document.activeElement.nodeName != 'IFRAME') {
        callback('hidden') // ← 永远不会执行到这里
    }
});
```

---

## 三、版本对比

| 版本 | 方式 | 结果 | 关键问题 |
|------|------|------|---------|
| V1 | Console 粘贴 | ❌ 失败 | 执行太晚，属性无法重定义 |
| V2 | 扩展硬拦截 | ✅ 成功 | toString 暴露篡改痕迹 |
| V3 | 扩展误导伪装 | ⚠️ 部分成功 | blur 仍触发 hidden，时间 NaN |
| V4 | 扩展 IFRAME 欺骗 | ✅ 更隐蔽 | 针对 WindowSwitch 条件精准破解 |

---

## 四、技术关键点

| 问题 | 原因 |
|------|------|
| Console 没用 | 执行太晚，监听器已注册 |
| Tampermonkey 没用 | 隔离沙盒，改不到页面 JS 环境 |
| 扩展 V1 被 CSP 拦截 | 用 `<script>` 标签注入被网站 CSP 策略阻断 |
| 扩展 V2+ 有效 | `world: MAIN` 绕过 CSP，`document_start` 保证时机 |

---

## 五、潜在风险（未来可能被检测）

| 检测手段 | 说明 | 能否绕过 |
|---------|------|---------|
| 服务端心跳 | 定期发请求，停止则判定离开 | ❌ 前端无法绕过 |
| 验证原生函数 | 检测 `addEventListener` 是否被篡改 | ✅ V3/V4 已伪装 toString |
| `Document.prototype` getter | 绕过覆盖的属性读真实值 | ❌ 难以防御 |
| iframe 内部检测 | 检测 iframe 内的 focus 状态 | ⚠️ 需具体分析 |
