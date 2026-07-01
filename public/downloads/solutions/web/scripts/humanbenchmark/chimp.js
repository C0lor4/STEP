(function() {
    let sequence = [];
    let clicking = false;
    let running = true;

    const clickTile = (el) => {
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    };

    const runChimpTest = () => {
        if (!running) return;

        const tiles = document.querySelectorAll('[data-cellnumber]');

        if (tiles.length > 0 && !clicking) {
            const tileArray = [...tiles].map(tile => ({
                element: tile,
                number: parseInt(tile.getAttribute('data-cellnumber'))
            }));

            tileArray.sort((a, b) => a.number - b.number);

            if (sequence.length === 0) {
                sequence = tileArray;
            }

            if (sequence.length > 0) {
                clicking = true;

                sequence.forEach((tile, index) => {
                    setTimeout(() => {
                        if (running) {
                            clickTile(tile.element);

                            if (index === sequence.length - 1) {
                                setTimeout(() => {
                                    sequence = [];
                                    clicking = false;

                                    const continueBtn = document.querySelector('button.css-1bnidmp');
                                    if (continueBtn && continueBtn.innerText.toLowerCase().includes('continue')) {
                                        clickTile(continueBtn);
                                    }
                                }, 0);
                            }
                        }
                    }, 0);
                });
            }
        }

        const btn = document.querySelector('button.css-1bnidmp');
        if (btn && (btn.innerText.toLowerCase().includes('start') || 
                   btn.innerText.toLowerCase().includes('continue'))) {
            clickTile(btn);
        }

        requestAnimationFrame(runChimpTest);
    };

    runChimpTest();

    window.addEventListener('keydown', e => {
        if (e.key === 'Alt') {
            running = false;
            clicking = false;
            sequence = [];
            console.log('Forced Stop');
        }
    });
})();