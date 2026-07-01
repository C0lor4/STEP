// https://humanbenchmark.com/tests/aim
(function() {
    let count = 0;
    
    const id = setInterval(() => {
        const target = document.querySelector('[data-aim-target="true"]');
        if (target) {
            ['mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(eventType => {
                target.dispatchEvent(new Event(eventType, { bubbles: true }));
            });
            console.log('Clicked: ' + (++count));
        }
    }, 1);
    
    window.stop = () => { clearInterval(id); console.log('Forced Stopped'); };
})();