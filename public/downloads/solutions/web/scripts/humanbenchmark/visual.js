// https://humanbenchmark.com/tests/memory
(function() {
    let activeIndexes = [];
    let clicking = false;
    let lastGridSize = 0;
    const origST = window.setTimeout;
    const origSI = window.setInterval;
    window.setTimeout = (cb, d, ...a) => origST(cb, Math.min(10, d), ...a);
    window.setInterval = (cb, d, ...a) => origSI(cb, Math.min(10, d), ...a);
    
    const clickSquare = (el) => {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };
    
    const timer = setInterval(() => {
        const squares = document.querySelectorAll('.css-hqmwod');
        if (!squares.length) return;
        
        if (squares.length !== lastGridSize) {
            lastGridSize = squares.length;
            activeIndexes = [];
            clicking = false;
        }
        
        const activeSquares = document.querySelectorAll('.css-hqmwod.active');
        
        if (activeSquares.length > 0 && !clicking) {
            activeIndexes = [...squares].map((sq, i) => sq.classList.contains('active') ? i : -1).filter(i => i !== -1);
        }
        
        if (activeSquares.length === 0 && activeIndexes.length > 0 && !clicking) {
            clicking = true;
            
            activeIndexes.forEach((idx, i) => {
                setTimeout(() => {
                    clickSquare(squares[idx]);
                    
                    if (i === activeIndexes.length - 1) {
                        setTimeout(() => {
                            activeIndexes = [];
                            clicking = false;
                        }, 10);
                    }
                }, 2);
            });
        }
    }, 2);
    
    window.addEventListener('keydown', e => {
        if (e.altKey) {
            clearInterval(timer);
            window.setTimeout = origST;
            window.setInterval = origSI;
            console.log('Forced Stop');
        }
    });
})();