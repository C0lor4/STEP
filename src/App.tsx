import React, { Suspense, lazy, useEffect, useState } from 'react';
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Moon, MousePointer2, Sun } from 'lucide-react';
import {
  startSparkleTrail,
  stopSparkleTrail,
} from './utils/sparkleTrail';

// 首页保持静态导入（它是首屏，懒加载反而多一次往返）；其余路由按需加载
import Home from './pages/Home';

const NotFound = lazy(() => import('./pages/NotFound'));
const PastPapers = lazy(() => import('./pages/PastPapers'));
const Statistics = lazy(() => import('./pages/Statistics'));
const FormulaSheets = lazy(() => import('./pages/FormulaSheets'));

const RouteFallback: React.FC = () => (
  <div className="min-h-screen bg-zinc-900" aria-busy="true" />
);

type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'stepfurther-theme';
const TRAIL_STORAGE_KEY = 'stepfurther-trail-open';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return 'dark';
};

const getInitialTrailOpen = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(TRAIL_STORAGE_KEY) === 'true';
};

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [trailOpen, setTrailOpen] = useState<boolean>(getInitialTrailOpen);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (trailOpen) {
      startSparkleTrail();
    } else {
      stopSparkleTrail();
    }

    window.localStorage.setItem(TRAIL_STORAGE_KEY, String(trailOpen));
  }, [trailOpen]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleTrail = () => {
    setTrailOpen((prev) => !prev);
  };

  return (
    <Theme appearance={theme} radius="large" scaling="100%">
      <Router>
        <ScrollToTop />
        <main className="min-h-screen font-inter">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/pastpapers" element={<PastPapers />} />
              <Route path="/pastpapers/formula-sheets" element={<FormulaSheets />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </main>
        <div className="fixed right-4 bottom-4 z-[70] flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTrail}
            aria-label={`Turn mouse trail ${trailOpen ? 'off' : 'on'}`}
            aria-pressed={trailOpen}
            className="p-1.5 transition"
          >
            <span
              className={`relative block h-14 w-8 rounded-full border transition ${
                theme === 'dark'
                  ? 'border-white/25 bg-white/10'
                  : 'border-slate-400/60 bg-white/70'
              }`}
            >
              <span
                className={`absolute left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  trailOpen
                    ? theme === 'light'
                      ? 'translate-y-0 bg-sky-600 text-white'
                      : 'translate-y-0 bg-sky-100 text-sky-600'
                    : theme === 'light'
                      ? 'translate-y-6 bg-slate-200 text-slate-500'
                      : 'translate-y-6 bg-zinc-700 text-zinc-300'
                }`}
              >
                <MousePointer2 size={14} />
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'light'}
            className="p-1.5 transition"
          >
            <span
              className={`relative block h-14 w-8 rounded-full border transition ${
                theme === 'dark'
                  ? 'border-white/25 bg-white/10'
                  : 'border-slate-400/50 bg-slate-900/10'
              }`}
            >
              <span
                className={`absolute left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  theme === 'light'
                    ? 'translate-y-6 bg-amber-100 text-amber-500'
                    : 'translate-y-0 bg-slate-900 text-sky-300'
                }`}
              >
                <Sun
                  size={14}
                  className={`absolute transition-all duration-400 ${
                    theme === 'light'
                      ? 'opacity-100 rotate-0 scale-100'
                      : 'opacity-0 -rotate-45 scale-75'
                  }`}
                />
                <Moon
                  size={14}
                  className={`absolute transition-all duration-400 ${
                    theme === 'dark'
                      ? 'opacity-100 rotate-0 scale-100'
                      : 'opacity-0 rotate-45 scale-75'
                  }`}
                />
              </span>
            </span>
          </button>
        </div>

      </Router>
    </Theme>
  );
}

export default App;
