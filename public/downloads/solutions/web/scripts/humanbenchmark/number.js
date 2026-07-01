// https://humanbenchmark.com/tests/number-memory

(function() {
    let savedNumber = "";
    let running = true;
    
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay, ...args) {
        return originalSetTimeout(callback, 50, ...args);
    };
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
    ).set;
    
    function runNumberMemory() {
        if (!running) return;
        
        const bigNumber = document.querySelector('.big-number');
        if (bigNumber && bigNumber.textContent.trim()) {
            savedNumber = bigNumber.textContent.trim();
            console.log('Memorized: ' + savedNumber);
        }
        
        const input = document.querySelector('input');
        if (input && savedNumber) {
            nativeInputValueSetter.call(input, savedNumber);
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            originalSetTimeout(() => {
                const btn = document.querySelector('button.css-1bnidmp');
                if (btn && btn.innerText.toLowerCase().includes('submit')) {
                    btn.click();
                }
            }, 10);
            
            savedNumber = "";
        }
        
        const btn = document.querySelector('button.css-1bnidmp');
        if (btn && (btn.innerText.toLowerCase().includes('next') || 
            btn.innerText.toLowerCase().includes('start'))) {
            btn.click();
        }
        
        requestAnimationFrame(runNumberMemory);
    }
    
    runNumberMemory();
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Alt') {
            running = false;
            window.setTimeout = originalSetTimeout;
            console.log('Forced Stop');
        }
    });
})();