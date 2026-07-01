(() => {
    // 1. 永远返回 visible/focused 状态
    try {
        Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
        Object.defineProperty(document, 'webkitVisibilityState', { get: () => 'visible', configurable: true });
    } catch(e) {}

    document.hasFocus = () => true;
    window.onblur = null;
    document.onvisibilitychange = null;

    // 2. 让 activeElement 永远返回 IFRAME 节点
    const fakeIframe = document.createElement('iframe');
    Object.defineProperty(document, 'activeElement', {
        get: () => fakeIframe,
        configurable: true
    });

    // 3. 覆盖原型链，范围更广
    const _ael = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, fn, opts) {

        // blur：丢弃回调，补发 focus，让检测代码永远收不到 blur
        if (type === 'blur' && (this === window || this === document)) {
            return _ael.call(this, type, function(e) {
                setTimeout(() => window.dispatchEvent(new FocusEvent('focus')), 10);
            }, opts);
        }

        // visibilitychange：丢弃回调，重置属性后不执行检测逻辑
        if ((type === 'visibilitychange' || type === 'webkitvisibilitychange') &&
            (this === window || this === document)) {
            return _ael.call(this, type, function(e) {
                Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
                Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
                // 不调用 fn，检测回调被丢弃
            }, opts);
        }

        // mouseleave / mouseout：只屏蔽挂在 window/document 上的
        if ((type === 'mouseleave' || type === 'mouseout') &&
            (this === window || this === document)) {
            return;
        }

        // focus：放行（补发的 focus 需要能正常传递）
        return _ael.call(this, type, fn, opts);
    };

    // 4. 屏蔽 on* 属性赋值
    const noop = () => {};
    ['onblur', 'onfocus', 'onvisibilitychange'].forEach(prop => {
        Object.defineProperty(window, prop, {
            set: () => {},
            get: () => noop,
            configurable: true
        });
    });
    Object.defineProperty(document, 'onvisibilitychange', {
        set: () => {},
        get: () => noop,
        configurable: true
    });

    // 5. WindowSwitch 回调永远收到 show
    Object.defineProperty(window, 'WindowSwitch', {
        set(cls) {
            try {
                const original = cls.prototype.addEventListenerAll;
                if (original) {
                    cls.prototype.addEventListenerAll = function(fn) {
                        return original.call(this, function(status, count) {
                            fn('show', count);
                        });
                    };
                }
                cls.prototype.addEventListener = () => {};
            } catch(e) {}
            Object.defineProperty(window, 'WindowSwitch', { value: cls, writable: true });
        },
        configurable: true
    });

    Object.defineProperty(window, 'windowSwitch', {
        set(instance) {
            try {
                instance.removeEventListenerAll && instance.removeEventListenerAll();
                instance.addEventListener = () => {};
                instance.addEventListenerAll = (fn) => {};
            } catch(e) {}
            Object.defineProperty(window, 'windowSwitch', { value: instance, writable: true });
        },
        configurable: true
    });

    // 6. 拦截 fetch 上报（按实际接口路径修改正则）
    const _fetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : (input?.url ?? '');
        if (/\/rrweb\/|hiddenVisible|switchRecord/.test(url)) {
            return Promise.resolve(new Response('{}', {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        return _fetch.apply(this, arguments);
    };

    // 7. 拦截 XHR 上报
    const _xhrOpen = XMLHttpRequest.prototype.open;
    const _xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._bypassed = /\/rrweb\/|hiddenVisible|switchRecord/.test(url);
        return _xhrOpen.call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function(body) {
        if (this._bypassed) {
            setTimeout(() => {
                Object.defineProperty(this, 'status', { get: () => 200 });
                Object.defineProperty(this, 'readyState', { get: () => 4 });
                Object.defineProperty(this, 'responseText', { get: () => '{}' });
                this.dispatchEvent(new Event('load'));
            }, 10);
            return;
        }
        return _xhrSend.call(this, body);
    };

    // 8. 持续模拟鼠标活动（贝塞尔曲线插值，模拟真实轨迹）
    function simulateMouseMove() {
        const toX = Math.random() * window.innerWidth;
        const toY = Math.random() * window.innerHeight;

        const fromX = simulateMouseMove._x ?? window.innerWidth / 2;
        const fromY = simulateMouseMove._y ?? window.innerHeight / 2;

        // 随机贝塞尔控制点，产生自然弯曲
        const cp1x = fromX + (Math.random() - 0.5) * 200;
        const cp1y = fromY + (Math.random() - 0.5) * 200;
        const cp2x = toX  + (Math.random() - 0.5) * 200;
        const cp2y = toY  + (Math.random() - 0.5) * 200;

        const steps    = 20 + Math.floor(Math.random() * 20); // 20-40 步
        const duration = 400 + Math.random() * 400;           // 400-800ms
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const t = step / steps;
            const u = 1 - t;
            const x = u*u*u*fromX + 3*u*u*t*cp1x + 3*u*t*t*cp2x + t*t*t*toX;
            const y = u*u*u*fromY + 3*u*u*t*cp1y + 3*u*t*t*cp2y + t*t*t*toY;

            document.dispatchEvent(new MouseEvent('mousemove', {
                bubbles: true,
                clientX: Math.round(x),
                clientY: Math.round(y)
            }));

            if (step >= steps) {
                clearInterval(timer);
                simulateMouseMove._x = toX;
                simulateMouseMove._y = toY;
            }
        }, duration / steps);
    }

    function scheduleNextMove() {
        setTimeout(() => {
            simulateMouseMove();
            scheduleNextMove();
        }, 5000 + Math.random() * 5000); // 5-10 秒随机间隔
    }
    scheduleNextMove();

    // 9. 伪装成原生函数
    EventTarget.prototype.addEventListener.toString = () => 'function addEventListener() { [native code] }';
    window.fetch.toString = () => 'function fetch() { [native code] }';

    console.log('[FocusBypass] Active v6');
})();