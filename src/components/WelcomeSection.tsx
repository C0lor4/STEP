import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type Point4D = [number, number, number, number];
type ProjectedPoint = { x: number; y: number; w: number };
type ProjectedEdge = { from: ProjectedPoint; to: ProjectedPoint; type: 'outer' | 'inner' | 'hyper' };

const TESSERACT_VERTICES: Point4D[] = [
  [-1, -1, -1, -1],
  [1, -1, -1, -1],
  [1, 1, -1, -1],
  [-1, 1, -1, -1],
  [-1, -1, 1, -1],
  [1, -1, 1, -1],
  [1, 1, 1, -1],
  [-1, 1, 1, -1],
  [-1, -1, -1, 1],
  [1, -1, -1, 1],
  [1, 1, -1, 1],
  [-1, 1, -1, 1],
  [-1, -1, 1, 1],
  [1, -1, 1, 1],
  [1, 1, 1, 1],
  [-1, 1, 1, 1],
];

const TESSERACT_EDGE_INDICES = (() => {
  const edges: { from: number; to: number; type: 'cube' | 'hyper' }[] = [];

  for (let i = 0; i < TESSERACT_VERTICES.length; i++) {
    for (let j = i + 1; j < TESSERACT_VERTICES.length; j++) {
      const differences = TESSERACT_VERTICES[i].reduce((acc, val, idx) => acc + (val === TESSERACT_VERTICES[j][idx] ? 0 : 1), 0);
      if (differences === 1) {
        edges.push({
          from: i,
          to: j,
          type: TESSERACT_VERTICES[i][3] === TESSERACT_VERTICES[j][3] ? 'cube' : 'hyper',
        });
      }
    }
  }

  return edges;
})();

const rotate4DPoint = (point: Point4D, t: number): Point4D => {
  const rotatePair = (a: number, b: number, angle: number): [number, number] => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [a * cos - b * sin, a * sin + b * cos];
  };

  let [x, y, z, w] = point;

  [x, y] = rotatePair(x, y, t * 0.55);
  [x, z] = rotatePair(x, z, t * 0.4);
  [y, w] = rotatePair(y, w, t * 0.5);
  [z, w] = rotatePair(z, w, t * 0.3);

  return [x, y, z, w];
};

const projectPoint = (point: Point4D, baseW: number): ProjectedPoint => {
  const wPerspective = 1 / (1.6 - point[3] * 0.42);
  const x4 = point[0] * wPerspective;
  const y4 = point[1] * wPerspective;
  const z4 = point[2] * wPerspective;

  const depth = 1 / (2.6 - z4 * 0.48);
  const scale = 74;
  const cx = 90;
  const cy = 90;

  return {
    x: cx + x4 * scale * depth,
    y: cy + y4 * scale * depth,
    w: baseW, // preserve original hyper-dimension sign for styling
  };
};

const MagicWord: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const starRefs = useRef<HTMLSpanElement[]>([]);

  const addStarRef = (el: HTMLSpanElement | null) => {
    if (el && !starRefs.current.includes(el)) {
      starRefs.current.push(el);
    }
  };

  useEffect(() => {
    const timeouts: number[] = [];
    const intervals: number[] = [];
    let index = 0;
    const interval = 1000;

    const rand = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const animate = (star: HTMLSpanElement) => {
      star.style.setProperty('--star-left', `${rand(-10, 100)}%`);
      star.style.setProperty('--star-top', `${rand(-40, 80)}%`);

      star.style.animation = 'none';
      void star.offsetWidth;
      star.style.animation = '';
    };

    starRefs.current.forEach((star) => {
      const timeoutId = window.setTimeout(() => {
        animate(star);
        intervals.push(window.setInterval(() => animate(star), interval));
      }, index++ * (interval / 3));

      timeouts.push(timeoutId);
    });

    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
      intervals.forEach((i) => window.clearInterval(i));
      starRefs.current = [];
    };
  }, []);

  return (
    <span className="magic">
      {[0, 1, 2].map((star) => (
        <span key={star} className="magic-star" ref={addStarRef}>
          <svg viewBox="0 0 512 512" aria-hidden="true" focusable="false">
            <path d="M512 255.1c0 11.34-7.406 20.86-18.44 23.64l-171.3 42.78l-42.78 171.1C276.7 504.6 267.2 512 255.9 512s-20.84-7.406-23.62-18.44l-42.66-171.2L18.47 279.6C7.406 276.8 0 267.3 0 255.1c0-11.34 7.406-20.83 18.44-23.61l171.2-42.78l42.78-171.1C235.2 7.406 244.7 0 256 0s20.84 7.406 23.62 18.44l42.78 171.2l171.2 42.78C504.6 235.2 512 244.6 512 255.1z" />
          </svg>
        </span>
      ))}
      <span className="magic-text">{children}</span>
    </span>
  );
};

const WelcomeSection: React.FC = () => {
  const BEAM_EXTRA = 15;
  const UFO_X_BIAS = -60;
  const TRACK_X_OFFSET = -10;
  const ROTATE_FRAME_MS = 33; // throttle cube animation to ~30fps for perf
  const TELEPORT_VANISH_MS = 280;
  const TELEPORT_REAPPEAR_MS = 220;
  const [ufoPosition, setUfoPosition] = useState({ x: 32, y: 32 });
  const [ufoReady, setUfoReady] = useState(false);
  const [beamActive, setBeamActive] = useState(false);
  const [beamLength, setBeamLength] = useState(320 + BEAM_EXTRA);
  const [jonLifted, setJonLifted] = useState(false);
  const [isApproaching, setIsApproaching] = useState(false);
  const [isTeleporting, setIsTeleporting] = useState(false);
  const [teleportPhase, setTeleportPhase] = useState<'idle' | 'vanishing' | 'reappearing'>('idle');
  const [projectedPoints, setProjectedPoints] = useState<ProjectedPoint[]>(() =>
    TESSERACT_VERTICES.map((v) => projectPoint(v, v[3]))
  );
  const [showSurprisedFace, setShowSurprisedFace] = useState(false);
  const projectedEdges = useMemo<ProjectedEdge[]>(
    () =>
      projectedPoints.length
        ? TESSERACT_EDGE_INDICES.map((edge) => {
            const from = projectedPoints[edge.from];
            const to = projectedPoints[edge.to];
            const layer: ProjectedEdge['type'] =
              edge.type === 'hyper' ? 'hyper' : from.w > 0 && to.w > 0 ? 'inner' : 'outer';
            return { from, to, type: layer };
          })
        : [],
    [projectedPoints]
  );
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const jonRef = useRef<HTMLSpanElement>(null);
  const teleportTimers = useRef<number[]>([]);
  const UFO_SIZE = { width: 176, height: 176 };
  const BEAM_OFFSET = 120; // distance from UFO top to beam start
  const HEADER_BUFFER = 96; // keep UFO below the fixed header

  const clampToSection = useCallback(
    (x: number, y: number) => {
      const sectionRect = sectionRef.current?.getBoundingClientRect();
      const width = sectionRect?.width ?? window.innerWidth;
      const height = sectionRect?.height ?? window.innerHeight;
      const marginX = 24;
      const marginTop = HEADER_BUFFER;
      const marginBottom = 24;

      const maxX = Math.max(width - UFO_SIZE.width - marginX, marginX);
      const maxY = Math.max(height - UFO_SIZE.height - marginBottom, marginTop);

      return {
        x: Math.min(Math.max(x, marginX), maxX),
        y: Math.min(Math.max(y, marginTop), maxY),
      };
    },
    [HEADER_BUFFER, UFO_SIZE.height, UFO_SIZE.width]
  );

  const getRandomPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 32, y: 32 };

    const sectionRect = sectionRef.current?.getBoundingClientRect();
    const width = sectionRect?.width ?? window.innerWidth;
    const height = sectionRect?.height ?? window.innerHeight;
    const marginX = 32;
    const marginTop = HEADER_BUFFER;
    const marginBottom = 32;

    const maxX = Math.max(width - UFO_SIZE.width - marginX * 2, 0);
    const maxY = Math.max(height - UFO_SIZE.height - marginTop - marginBottom, 0);

    const x = marginX + Math.random() * maxX;
    const y = marginTop + Math.random() * maxY;

    return clampToSection(x + UFO_X_BIAS, y);
  }, [HEADER_BUFFER, UFO_X_BIAS, clampToSection, UFO_SIZE.height, UFO_SIZE.width]);

  const getInitialPosition = useCallback(() => {
    if (typeof window === 'undefined' || !sectionRef.current) return getRandomPosition();

    const sectionRect = sectionRef.current.getBoundingClientRect();
    const headingRect = headingRef.current?.getBoundingClientRect();

    if (headingRect) {
      const yMin = headingRect.top - sectionRect.top - UFO_SIZE.height - 30;
      const yMax = headingRect.top - sectionRect.top - UFO_SIZE.height - 10;
      const y = yMin + Math.random() * Math.max(yMax - yMin, 0);
      const x =
        headingRect.right - sectionRect.left - UFO_SIZE.width * 0.55 + Math.random() * UFO_SIZE.width * 0.1;
      return clampToSection(x + UFO_X_BIAS, y);
    }

    return getRandomPosition();
  }, [UFO_SIZE.height, UFO_X_BIAS, clampToSection, getRandomPosition]);

  const clearTeleportTimers = useCallback(() => {
    teleportTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    teleportTimers.current = [];
  }, []);

  const triggerTeleport = useCallback(
    (nextPosition?: { x: number; y: number }, onComplete?: () => void) => {
      if (typeof window === 'undefined') return;

      clearTeleportTimers();
      const destination = nextPosition ?? getRandomPosition();

      setBeamActive(false);
      setJonLifted(false);
      setIsTeleporting(true);
      setTeleportPhase('vanishing');

      teleportTimers.current.push(
        window.setTimeout(() => {
          setUfoPosition(destination);
          setTeleportPhase('reappearing');

          teleportTimers.current.push(
            window.setTimeout(() => {
              setTeleportPhase('idle');
              setIsTeleporting(false);
              onComplete?.();
            }, TELEPORT_REAPPEAR_MS)
          );
        }, TELEPORT_VANISH_MS)
      );
    },
    [TELEPORT_REAPPEAR_MS, TELEPORT_VANISH_MS, clearTeleportTimers, getRandomPosition]
  );

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const pos = getInitialPosition();
    setUfoPosition(pos);
    const timer = window.setTimeout(() => setUfoReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, [getInitialPosition]);

  useEffect(() => {
    if (typeof window === 'undefined' || !ufoReady) return;

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    let teleportTimeout: number | undefined;

    const scheduleTeleport = () => {
      teleportTimeout = window.setTimeout(() => {
        if (!isApproaching) {
          triggerTeleport();
        }
        scheduleTeleport();
      }, rand(1000, 3000));
    };

    scheduleTeleport();

    return () => {
      if (teleportTimeout) window.clearTimeout(teleportTimeout);
      clearTeleportTimers();
    };
  }, [clearTeleportTimers, isApproaching, triggerTeleport, ufoReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduced.matches) {
      setProjectedPoints(TESSERACT_VERTICES.map((v) => projectPoint(v, v[3])));
      return;
    }

    let frameId: number;
    let lastTime = 0;
    const animate = (now: number) => {
      if (document.visibilityState === 'hidden') {
        frameId = requestAnimationFrame(animate);
        return;
      }

      if (now - lastTime >= ROTATE_FRAME_MS) {
        lastTime = now;
        const t = now / 1000;
        const rotated = TESSERACT_VERTICES.map((v) => projectPoint(rotate4DPoint(v, t), v[3]));
        setProjectedPoints(rotated);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [ROTATE_FRAME_MS]);

  useEffect(() => {
    if (typeof window === 'undefined' || !ufoReady) return;

    const timeouts: number[] = [];

    const approachJon = () => {
      if (!jonRef.current || !sectionRef.current) return;
      setIsApproaching(true);
      timeouts.forEach((t) => window.clearTimeout(t));
      timeouts.length = 0;

      const initiate = () => {
        const rect = jonRef.current!.getBoundingClientRect();
        const sectionRect = sectionRef.current!.getBoundingClientRect();
        const targetX = rect.left - sectionRect.left + rect.width / 2 - UFO_SIZE.width / 2 + TRACK_X_OFFSET;
        const targetY = rect.top - sectionRect.top - UFO_SIZE.height - 46; // hover above text

        const { x, y } = clampToSection(targetX, targetY);

        const beamTop = y + BEAM_OFFSET;
        const jonBottom = rect.bottom - sectionRect.top;
        const distanceToJon = jonBottom - beamTop;
        setBeamLength(Math.max(distanceToJon + BEAM_EXTRA, 80));

        const beamDelay = 200; // start beam shortly after reappearing
        const liftDelay = 550;
        const beamOffDelay = 1800;
        const exitDelay = 2700;

        triggerTeleport({ x, y }, () => {
          timeouts.push(
            window.setTimeout(() => {
              setBeamActive(true);
            }, beamDelay)
          );

          timeouts.push(
            window.setTimeout(() => {
              setJonLifted(true);
            }, liftDelay)
          );

          timeouts.push(
            window.setTimeout(() => {
              setBeamActive(false);
              setJonLifted(false);
            }, beamOffDelay)
          );

          timeouts.push(
            window.setTimeout(() => {
              triggerTeleport(getRandomPosition(), () => setIsApproaching(false));
            }, exitDelay)
          );
        });
      };

      timeouts.push(window.setTimeout(initiate, 1500));
    };

    const startDelay = 5000;
    const approachInterval = 10000;
    let intervalId: number | undefined;

    const kickoff = window.setTimeout(() => {
      approachJon();
      intervalId = window.setInterval(approachJon, approachInterval);
    }, startDelay);
    timeouts.push(kickoff);

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [getRandomPosition, clampToSection, ufoReady, triggerTeleport]);

  useEffect(() => {
    let timer: number | undefined;
    if (beamActive) {
      timer = window.setTimeout(() => setShowSurprisedFace(true), 500);
    } else {
      setShowSurprisedFace(false);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [beamActive]);

  return (
    <section
      id="welcome"
      ref={sectionRef}
      className="min-h-screen bg-[#18181B] flex items-center justify-center relative overflow-hidden"
    >
      <motion.div
        className={`ufo ${beamActive ? 'ufo--beam' : ''} ${teleportPhase === 'vanishing' ? 'ufo--vanishing' : ''} ${teleportPhase === 'reappearing' ? 'ufo--reappearing' : ''} z-50 pointer-events-none`}
        style={{ top: 0, left: 0 }}
        initial={{ x: ufoPosition.x, y: ufoPosition.y, opacity: 0 }}
        animate={{
          x: ufoPosition.x,
          y: ufoPosition.y,
          rotate: beamActive ? -4 : 0,
          opacity: ufoReady ? (teleportPhase === 'vanishing' ? 0 : 1) : 0,
          scale: teleportPhase === 'vanishing' ? 0.08 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 120,
          damping: 18,
          mass: 1,
          // Jump instantly on teleport; otherwise spring
          x: isTeleporting ? { type: 'tween', duration: 0 } : undefined,
          y: isTeleporting ? { type: 'tween', duration: 0 } : undefined,
          opacity:
            teleportPhase === 'vanishing'
              ? { duration: TELEPORT_VANISH_MS / 1000, ease: 'easeIn' }
              : teleportPhase === 'reappearing'
                ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0.35, ease: 'easeInOut' },
          scale:
            teleportPhase !== 'idle'
              ? {
                  duration: (teleportPhase === 'vanishing' ? TELEPORT_VANISH_MS : TELEPORT_REAPPEAR_MS) / 1000,
                  ease: teleportPhase === 'vanishing' ? 'easeIn' : [0.22, 1, 0.36, 1],
                }
              : undefined,
        }}
      >
        <div className="ufo__tesseract">
          <svg className="ufo__tesseract-svg" viewBox="0 0 180 180" role="presentation" aria-hidden="true">
            <circle cx="90" cy="90" r="76" className="ufo__frame" />
            {projectedEdges.map((edge, idx) => (
              <line
                key={`edge-${idx}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                className={`ufo__edge ${
                  edge.type === 'hyper'
                    ? 'ufo__edge--hyper'
                    : edge.type === 'inner'
                      ? 'ufo__edge--inner'
                      : 'ufo__edge--outer'
                }`}
              />
            ))}
          </svg>
        </div>
        <div
          className={`ufo__teleport-star ${
            teleportPhase === 'vanishing'
              ? 'ufo__teleport-star--out'
              : teleportPhase === 'reappearing'
                ? 'ufo__teleport-star--in'
                : ''
          }`}
          aria-hidden="true"
        />
        <div
          className="ufo__beam"
          style={{
            height: beamLength,
            top: BEAM_OFFSET,
            transform: beamActive ? 'translateX(-50%) scaleY(1) rotate(4deg)' : 'translateX(-50%) scaleY(0.26) rotate(0deg)',
          }}
        >
          <div className="ufo__beam-lines" />
        </div>
      </motion.div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h1
            ref={headingRef}
            className="text-[clamp(1.8rem,10.5vw,4.8rem)] md:text-8xl font-bold tracking-[0.04em] sm:tracking-[0.1em] md:tracking-[0.2em] text-white mb-8"
          >
            <MagicWord>WELCOME</MagicWord>
          </h1>
          <div className="w-full max-w-[18rem] md:max-w-[22rem] lg:max-w-[26rem] h-px bg-zinc-400 mx-auto mb-8"></div>
          <h2 className="text-base sm:text-xl md:text-2xl tracking-[0.04em] sm:tracking-[0.1em] md:tracking-[0.15em] text-zinc-300 mb-12 font-light">
            By{' '}
            <span className="relative inline-flex items-center justify-center gap-1">
              <span className={`jon-beam ${beamActive ? 'jon-beam--active' : ''}`} aria-hidden="true" />
              <span
                ref={jonRef}
                className={`animated-jon jon-highlight ${beamActive ? 'jon-beamed' : ''} ${jonLifted ? 'jon-lift' : ''}`}
              >
                <span className="jon-letter jon-letter--j">J</span>
                <span className="jon-letter jon-letter--o">o</span>
                <span className="jon-letter jon-letter--n">n</span>
              </span>
              <span className="jon-face">
                <span className={`jon-face__state ${showSurprisedFace ? 'jon-face__state--hidden' : ''}`}>:)</span>
                {showSurprisedFace && (
                  <span className={`jon-face__state jon-face__state--top`}>
                    :O
                  </span>
                )}
              </span>
            </span>
            <span className="sr-only">By Jon</span>
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-lg md:text-xl leading-relaxed text-zinc-300 font-light tracking-wide">
            This website's sole purpose is to share public answers' and my answers for the past{' '}
            <span className="welcome-step-emphasis">STEP</span>, <span className="welcome-step-emphasis">Sixth Term Examination Paper</span> problems.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WelcomeSection;
