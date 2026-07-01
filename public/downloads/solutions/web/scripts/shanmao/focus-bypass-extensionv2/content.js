(() => {
    // 1. Override visibility properties
    try {
        Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
        Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
        Object.defineProperty(document, 'webkitVisibilityState', { get: () => 'visible', configurable: true });
    } catch(e) {}

    document.hasFocus = () => true;

    // 2. Block events
    const BLOCKED = new Set([
        'visibilitychange', 'webkitvisibilitychange',
        'blur', 'focus', 'mouseleave', 'mouseout',
        'fullscreenchange', 'webkitfullscreenchange'
    ]);

    const _winAEL = window.addEventListener.bind(window);
    const _docAEL = document.addEventListener.bind(document);

    window.addEventListener = function(type, fn, opts) {
        if (BLOCKED.has(type)) return;
        return _winAEL(type, fn, opts);
    };
    document.addEventListener = function(type, fn, opts) {
        if (BLOCKED.has(type)) return;
        return _docAEL(type, fn, opts);
    };

    // 3. Intercept WindowSwitch before it initialises
    Object.defineProperty(window, 'WindowSwitch', {
        set(cls) {
            try {
                cls.prototype.addEventListener = function() {};
                cls.prototype.addEventListenerAll = function() {};
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
                instance.addEventListenerAll = () => {};
            } catch(e) {}
            Object.defineProperty(window, 'windowSwitch', { value: instance, writable: true });
        },
        configurable: true
    });

    // 4. Simulate activity
    setInterval(() => {
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    }, 10000);

    console.log('[FocusBypass] Active');
})();
