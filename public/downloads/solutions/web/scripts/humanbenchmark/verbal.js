// https://humanbenchmark.com/tests/verbal-memory

(function() {
    const seen = new Set();
    let last = '';
    
    const timer = setInterval(() => {
        const word = document.querySelector('.word')?.textContent.trim();
        if (!word || word === last) return;
        last = word;
        
        const btns = [...document.querySelectorAll('button')];
        const seenBtn = btns.find(b => b.textContent === 'SEEN');
        const newBtn = btns.find(b => b.textContent === 'NEW');
        if (!seenBtn || !newBtn) return;
        
        if (seen.has(word)) {
            console.log(`"${word}" - SEEN`);
            seenBtn.click();
        } else {
            seen.add(word);
            console.log(`"${word}" - NEW (${seen.size})`);
            newBtn.click();
        }
    }, 1);
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Alt') {
            clearInterval(timer);
            console.log('Forced Stop');
        }
    });
})();