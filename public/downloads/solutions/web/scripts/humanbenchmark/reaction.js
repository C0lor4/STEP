// https://humanbenchmark.com/tests/reactiontime
(function() {
    let count = 0;
    const origST = window.setTimeout;
    window.setTimeout = (cb, d, ...a) => origST(cb, Math.min(10,d), ...a);
    const id = setInterval(() => {
        const h1 = document.querySelector('.view-go h1 div');
        if (h1 && h1.textContent === 'Click!') {
            const target = h1.closest('[data-test="true"]');
            ['mousedown', 'click','touchstart', 'touchend'].forEach(eventType => {
                target.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            console.log('Clicked: ' + (++count));
        }
    }, 1);
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Alt') {
            clearInterval(id);
            window.setTimeout = origST
            console.log('Forced Stop');
        }
    });
})();