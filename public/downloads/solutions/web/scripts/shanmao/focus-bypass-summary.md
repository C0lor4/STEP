# Focus Bypass 总结文档

---

## 一、目标网站的检测策略

网站使用了一套叫 `WindowSwitch` 的自定义检测系统，结合 `rrweb` 录屏库。

### 检测方式（三重）

| 检测方式 | 具体实现 |
|---------|---------|
| `visibilitychange` 事件 | 监听标签页切换 |
| `window blur` 事件 | 监听窗口失去焦点 |
| `window focus` 事件 | 监听窗口重新获得焦点 |

### 检测到切屏后做什么

1. 记录**离开时间**，POST 到 `/rrweb/recordHiddenVisible`
2. 记录**返回时间**和**中断时长**，再次 POST
3. 用 `rrweb` 全程录屏，压缩上传到 OSS 服务器
4. 页面显示警告弹窗："系统后台已记录这次切屏"

### 检测逻辑入口文件
- `windowSwitch.js` — 切屏检测核心
- `rrweb-all.min.js` — 录屏库
- `RecordScreen` 类 — 整合录屏+切屏检测

---

## 二、V2 策略：硬拦截

### 核心思路
**直接屏蔽**所有相关事件，让网站的监听器永远注册不上。

### 具体做法

```javascript
// 1. 覆盖 visibility 属性
Object.defineProperty(document, 'hidden', { get: () => false });
Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });

// 2. 替换 addEventListener，丢弃敏感事件
window.addEventListener = function(type, fn, opts) {
    if (BLOCKED.has(type)) return; // 直接丢弃
    return _winAEL(type, fn, opts);
};

// 3. 拦截 WindowSwitch 类赋值，清空其方法
Object.defineProperty(window, 'WindowSwitch', {
    set(cls) {
        cls.prototype.addEventListener = function() {};
        cls.prototype.addEventListenerAll = function() {};
    }
});
```

### 优点
- 简单直接，完全阻断检测

### 缺点
- `addEventListener.toString()` 返回自定义函数，容易被检测到篡改
- 行为异常明显，网站可以通过验证原生函数特征发现

---

## 三、V3 策略：误导伪装（推荐）

### 核心思路
**不拦截事件，而是伪造返回值**，让网站认为用户一直在 focus 状态。

### 具体做法

```javascript
// 1. visibilitychange 触发时，让回调读到的值永远是 visible
document.addEventListener('visibilitychange', function(e) {
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
    fn.call(this, e); // 正常触发，但读到假值
});

// 2. blur 触发时，50ms 后补发 focus，模拟立刻回来
window.addEventListener('blur', function(e) {
    fn.call(this, e);
    setTimeout(() => window.dispatchEvent(new FocusEvent('focus')), 50);
});

// 3. WindowSwitch 回调中，把 hidden 替换成 show
cls.prototype.addEventListenerAll = function(fn) {
    return original.call(this, function(status, count) {
        fn('show', count); // 永远告诉网站是 show
    });
};

// 4. 伪装 toString，防止被检测篡改
window.addEventListener.toString = () => 'function addEventListener() { [native code] }';
```

### 优点
- 事件正常触发，网站感知不到被拦截
- `toString()` 伪装成原生函数，更难被发现
- 对 `WindowSwitch` 的处理更精准，直接替换回调的状态值

### 缺点
- 如果网站用**服务端心跳**检测，前端绕过无效
- 如果网站读取 `Document.prototype` 上的原始 getter，仍可能拿到真实值

---

## 四、技术关键点

### 为什么 Console 粘贴没用
页面加载完后再执行，`windowSwitch.js` 的监听器早已注册，无法撤销。

### 为什么 Tampermonkey 没用
运行在**隔离沙盒**（isolated world），和页面 JS 是两个独立环境，改不到页面的对象。

### 为什么 Chrome 扩展有效
- `run_at: document_start` — 在任何页面 JS 之前注入
- `world: MAIN` — 直接运行在页面的 JS 环境，绕过 CSP 限制
- `all_frames: true` — 覆盖所有窗口包括 popup

---

## 五、潜在风险（未来可能被检测）

| 检测手段 | 说明 | 是否能绕过 |
|---------|------|----------|
| 服务端心跳 | 定期发请求，停止则判定离开 | ❌ 前端无法绕过 |
| 验证原生函数 | 检测 `addEventListener` 是否被篡改 | ✅ V3 已伪装 toString |
| `Document.prototype` getter | 绕过被覆盖的属性读真实值 | ❌ 难以防御 |
| iframe 检测 | 检测 iframe 内的 focus 状态 | ⚠️ 需具体分析 |
