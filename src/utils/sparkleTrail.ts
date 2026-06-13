declare global {
  interface Window {
    __sparkleTrailCleanup?: () => void;
  }
}

export const isSparkleTrailOpen = () =>
  typeof window !== 'undefined' && typeof window.__sparkleTrailCleanup === 'function';

export const stopSparkleTrail = () => {
  if (typeof window === 'undefined') return;
  window.__sparkleTrailCleanup?.();
};

export const toggleSparkleTrail = () => {
  if (isSparkleTrailOpen()) {
    stopSparkleTrail();
    return false;
  }

  startSparkleTrail();
  return true;
};

export const startSparkleTrail = () => {
  if (typeof window === 'undefined') return () => {};
  if (window.__sparkleTrailCleanup) return window.__sparkleTrailCleanup;

  const originPosition = { x: 0, y: 0 };
  const last = {
    starTimestamp: Date.now(),
    starPosition: originPosition,
    mousePosition: originPosition,
  };

  const config = {
    starAnimationDuration: 1500,
    minimumTimeBetweenStars: 250,
    minimumDistanceBetweenStars: 75,
    colors: ['102 178 255', '180 220 255'],
    sizes: ['1.4rem', '1rem', '0.6rem'],
    animations: ['fall-1', 'fall-2', 'fall-3'],
    symbols: ['\u222b', '\u2202', '\u03a3', '\u03c0', '\u221e', '\u03b1', '\u03b2', '\u03b3', '\u03bb', '\u0394', '\u03b8', '\u03bc', '\u03c6', '\u03c8', '\u220f'],
  };

  let count = 0;

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const selectRandom = <T,>(items: T[]) => items[rand(0, items.length - 1)];
  const withUnit = (value: number, unit: string) => `${value}${unit}`;
  const px = (value: number) => withUnit(value, 'px');
  const ms = (value: number) => withUnit(value, 'ms');

  const calcDistance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const diffX = b.x - a.x;
    const diffY = b.y - a.y;
    return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  };

  const calcElapsedTime = (start: number, end: number) => end - start;

  const appendElement = (element: HTMLElement) => document.body.appendChild(element);
  const removeElement = (element: HTMLElement, delay: number) =>
    setTimeout(() => element.remove(), delay);

  const createStar = (position: { x: number; y: number }) => {
    const star = document.createElement('span');
    const color = selectRandom(config.colors);
    const symbol = selectRandom(config.symbols);

    star.className = 'star';
    star.textContent = symbol;
    star.style.left = px(position.x);
    star.style.top = px(position.y);
    star.style.fontSize = selectRandom(config.sizes);
    star.style.color = `rgb(${color})`;
    star.style.textShadow = `0px 0px 1.5rem rgb(${color} / 0.5)`;
    star.style.animationName = config.animations[count++ % 3];
    star.style.animationDuration = ms(config.starAnimationDuration);

    appendElement(star);
    removeElement(star, config.starAnimationDuration);
  };

  const updateLastStar = (position: { x: number; y: number }) => {
    last.starTimestamp = Date.now();
    last.starPosition = position;
  };

  const updateLastMousePosition = (position: { x: number; y: number }) => {
    last.mousePosition = position;
  };

  const adjustLastMousePosition = (position: { x: number; y: number }) => {
    if (last.mousePosition.x === 0 && last.mousePosition.y === 0) {
      last.mousePosition = position;
    }
  };

  const handleOnMove = (event: MouseEvent | Touch) => {
    const mousePosition = { x: event.clientX, y: event.clientY };

    adjustLastMousePosition(mousePosition);

    const now = Date.now();
    const hasMovedFarEnough =
      calcDistance(last.starPosition, mousePosition) >= config.minimumDistanceBetweenStars;
    const hasBeenLongEnough =
      calcElapsedTime(last.starTimestamp, now) > config.minimumTimeBetweenStars;

    if (hasMovedFarEnough || hasBeenLongEnough) {
      createStar(mousePosition);
      updateLastStar(mousePosition);
    }

    updateLastMousePosition(mousePosition);
  };

  const onMouseMove = (e: MouseEvent) => handleOnMove(e);
  const onTouchMove = (e: TouchEvent) => handleOnMove(e.touches[0]);
  const onLeave = () => updateLastMousePosition(originPosition);

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove);
  document.body.addEventListener('mouseleave', onLeave);

  const cleanup = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
    document.body.removeEventListener('mouseleave', onLeave);
    window.__sparkleTrailCleanup = undefined;
  };

  window.__sparkleTrailCleanup = cleanup;
  return cleanup;
};
