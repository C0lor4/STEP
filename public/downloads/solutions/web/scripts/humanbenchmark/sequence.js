// https://humanbenchmark.com/tests/sequence
(function() {
    const origST = window.setTimeout;
    const origSI = window.setInterval;
    window.setTimeout = (cb, d, ...a) => origST(cb, Math.min(10, d), ...a);
    window.setInterval = (cb, d, ...a) => origSI(cb, Math.min(10, d), ...a);
    
    let sequence = [];
    let lastActive = -1;
    let clicking = false;
    let running = true;
    
    const clickSquare = (el) => {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };
    
    const timer = origSI(() => {
        if (!running) return;
        
        const sqList = document.querySelectorAll('.square');
        const activeIdx = [...sqList].findIndex(s => s.classList.contains('active'));
        const level = parseInt(document.querySelector('.css-4rar09 span:last-child')?.textContent) || 0;
        
        if (clicking) return;
        
        if (activeIdx !== -1 && activeIdx !== lastActive) {
            if (sequence.length >= level) sequence = [];
            sequence.push(activeIdx);
            lastActive = activeIdx;
        }
        
        if (activeIdx === -1) lastActive = -1;
        
        if (activeIdx === -1 && sequence.length === level && level > 0) {
            clicking = true;
            
            sequence.forEach((idx, i) => {
                origST(() => {
                    clickSquare(sqList[idx]);
                    if (i === sequence.length - 1) {
                        origST(() => {
                            sequence = [];
                            clicking = false;
                        }, 1);
                    }
                }, 2);
            });
        }
    }, 2);

    window.addEventListener('keydown', e => {
        if (e.key === 'Alt') {
            running = false;
            clicking = false;
            sequence = [];
            clearInterval(timer);
            window.setTimeout = origST;
            window.setInterval = origSI;
            console.log('Forced Stop');
        }
    });
})();