// https://humanbenchmark.com/tests/typing

// V1
// (function() {
//     console.log('Auto-Type by Jon :)');
//     const div = document.querySelector('.letters');
//     let text = '';
//     div.querySelectorAll('span').forEach(s => text += s.textContent);
//     div.focus();
    
//     let i = 0;
//     const id = setInterval(() => {
//         if (i >= text.length) { clearInterval(id); console.log('Done!'); return; }
//         ['keydown', 'keypress', 'keyup'].forEach(t => {
//             div.dispatchEvent(new KeyboardEvent(t, { key: text[i], bubbles: true }));
//         });
//         i++;
//     }, 10);
    
//     window.stop = () => { clearInterval(id); console.log('Stopped'); };
// })();

// V2
(function() {
    let id = null;
    
    const startTyping = (e) => {
        
        const div = document.querySelector('.letters');
        if (!div) return;
        
        let text = '';
        div.querySelectorAll('span').forEach(s => text += s.textContent);

        
        let i = 0;
        id = setInterval(() => {
            if (i >= text.length) { 
                clearInterval(id); 
                console.log('Done!');
                return; 
            }
            ['keydown', 'keypress', 'keyup'].forEach(t => {
                div.dispatchEvent(new KeyboardEvent(t, { key: text[i], bubbles: true }));
            });
            i++;
        }, 1);
    };
    
    window.addEventListener('keydown', e => {
        if (e.key === 'Control') {
            startTyping();
        }
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Alt') {
            if (id) clearInterval(id);
            console.log('Forced Stop');
        }
    });
})();
