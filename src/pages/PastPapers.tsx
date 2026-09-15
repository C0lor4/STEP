import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import { getQuestionSourceKey, type QuestionSource } from './pastpapers/answers/types';
import {
  LATEST_PAPER_YEAR,
  PAPER_YEAR_COUNT,
  buildProblemImagePath,
  buildProblemPdfPath,
  findQuestionSource,
  getQuestionCountForYear,
  hasAnyAnswerSource,
  hasProblemImages,
  stepExistsInYear,
} from './pastpapers/resources';

type DownloadItem = {
  title: string;
  description: string;
  path: string;
  available?: boolean;
};

type PaperItem = {
  title: string;
  problemPath: string;
  answerPath: string;
};

type PaperCollection = {
  title: string;
  papers: PaperItem[];
};

const downloadItems: DownloadItem[] = [
  {
    title: 'Reference Sheet',
    description: 'Useful formulas for calculus and algebra.',
    path: '/pastpapers/formula-sheets',
    available: true,
  },
  {
    title: 'Tips & Tricks',
    description: 'Some important formulas and tips for STEP',
    path: '/pastpapers/tips',
    available: false,
  },
];

const STEP_CODES = ['I', 'II', 'III'] as const;

const buildStepCollection = (year: string): PaperCollection => {
  const yearNumber = Number(year);

  return {
    title: `STEP ${year}`,
    papers: STEP_CODES.filter(
      (code) => Number.isFinite(yearNumber) && stepExistsInYear(yearNumber, code)
    ).map((code) => ({
      title: `STEP ${code}`,
      problemPath: buildProblemPdfPath(year, code),
      answerPath: `/pastpapers/step-${year}/step-${code.toLowerCase()}/solution`,
    })),
  };
};

const paperCollections: PaperCollection[] = Array.from({ length: PAPER_YEAR_COUNT }, (_, i) =>
  buildStepCollection(String(LATEST_PAPER_YEAR - i))
);

const SimpleCard: React.FC<{
  item: DownloadItem;
  delay?: number;
  onOpen?: (path: string) => void;
}> = ({ item, delay = 0, onOpen }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold tracking-wide">{item.title}</h3>
      {!item.available && (
        <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400">Coming soon</span>
      )}
    </div>
    <p className="text-zinc-400 mb-6">{item.description}</p>
    <div className="flex justify-end">
      {item.available ? (
        <button
          type="button"
          onClick={() => onOpen?.(item.path)}
          className="formula-open-btn inline-flex items-center gap-2 rounded-lg border border-emerald-400/90 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 hover:text-emerald-100"
        >
          Open
        </button>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm border-zinc-700 text-zinc-500 cursor-not-allowed"
        >
          Not yet available
        </span>
      )}
    </div>
  </motion.div>
);

type HoverPapersCardProps = {
  collection: PaperCollection;
  delay?: number;
  isPinnedExpanded?: boolean;
  pinnedStepTitle?: string | null;
  selectedStepPath?: string | null;
  detailAreaRef?: React.RefObject<HTMLDivElement | null>;
  interactiveAreaRef?: React.RefObject<HTMLDivElement | null>;
  onYearToggle?: (yearTitle: string) => void;
  onStepToggle?: (payload: {
    yearTitle: string;
    stepTitle: string;
    problemPath: string;
    answerPath: string;
  }) => void;
  onRequestClose?: (yearTitle: string) => void;
};

const HoverPapersCard: React.FC<HoverPapersCardProps> = React.memo(({
  collection,
  delay = 0,
  isPinnedExpanded,
  pinnedStepTitle,
  selectedStepPath,
  detailAreaRef,
  interactiveAreaRef,
  onYearToggle,
  onStepToggle,
  onRequestClose,
}) => {
  const [activePaper, setActivePaper] = React.useState<string | null>(null);
  const [isCardHovered, setIsCardHovered] = React.useState(false);
  const closeStepTimerRef = React.useRef<number | null>(null);
  const collapseHoldTimerRef = React.useRef<number | null>(null);
  const wasPinnedOpenRef = React.useRef(Boolean(isPinnedExpanded));
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [isCollapsing, setIsCollapsing] = React.useState(false);

  const showYearHoverLine = isCardHovered || Boolean(isPinnedExpanded);
  const shouldExpand =
    isCardHovered || Boolean(isPinnedExpanded) || isCollapsing;

  const clearStepCloseTimer = React.useCallback(() => {
    if (closeStepTimerRef.current !== null) {
      window.clearTimeout(closeStepTimerRef.current);
      closeStepTimerRef.current = null;
    }
  }, []);

  const clearCollapseHoldTimer = React.useCallback(() => {
    if (collapseHoldTimerRef.current !== null) {
      window.clearTimeout(collapseHoldTimerRef.current);
      collapseHoldTimerRef.current = null;
    }
  }, []);

  const scheduleStepClose = React.useCallback(() => {
    clearStepCloseTimer();
    clearCollapseHoldTimer();
    setIsCollapsing(true);

    closeStepTimerRef.current = window.setTimeout(() => {
      setActivePaper(null);
      closeStepTimerRef.current = null;
    }, 160);

    collapseHoldTimerRef.current = window.setTimeout(() => {
      setIsCollapsing(false);
      collapseHoldTimerRef.current = null;
    }, 480);
  }, [clearCollapseHoldTimer, clearStepCloseTimer]);

  React.useEffect(() => {
    if (isPinnedExpanded && pinnedStepTitle) {
      clearStepCloseTimer();
      clearCollapseHoldTimer();
      setIsCollapsing(false);
      setActivePaper(pinnedStepTitle);
    } else if (isPinnedExpanded && !pinnedStepTitle) {
      clearStepCloseTimer();
      clearCollapseHoldTimer();
      setIsCollapsing(false);
      setActivePaper(null);
    } else if (wasPinnedOpenRef.current && !isPinnedExpanded) {
      scheduleStepClose();
    }

    wasPinnedOpenRef.current = Boolean(isPinnedExpanded);
  }, [
    clearCollapseHoldTimer,
    clearStepCloseTimer,
    isPinnedExpanded,
    pinnedStepTitle,
    scheduleStepClose,
  ]);

  React.useEffect(() => {
    if (!isPinnedExpanded) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!cardRef.current) {
        return;
      }

      const target = event.target;
      const isInsideCard = target instanceof Node && cardRef.current.contains(target);
      const isInsideDetail =
        target instanceof Node && detailAreaRef?.current?.contains(target);
      const isInsideInteractiveArea =
        target instanceof Node && interactiveAreaRef?.current?.contains(target);

      if (
        target instanceof Node &&
        !isInsideCard &&
        !isInsideDetail &&
        !isInsideInteractiveArea
      ) {
        onRequestClose?.(collection.title);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [collection.title, detailAreaRef, interactiveAreaRef, isPinnedExpanded, onRequestClose]);

  React.useEffect(
    () => () => {
      clearStepCloseTimer();
      clearCollapseHoldTimer();
    },
    [clearCollapseHoldTimer, clearStepCloseTimer]
  );

  const handleLeave = () => {
    setIsCardHovered(false);

    if (isPinnedExpanded && pinnedStepTitle) {
      clearStepCloseTimer();
      clearCollapseHoldTimer();
      setIsCollapsing(false);
      setActivePaper(pinnedStepTitle);
      return;
    }

    if (isPinnedExpanded) {
      clearStepCloseTimer();
      clearCollapseHoldTimer();
      setIsCollapsing(false);
      setActivePaper(null);
      return;
    }

    scheduleStepClose();
  };

  const handleStepSelect = React.useCallback(
    (paper: PaperItem) => {
      onStepToggle?.({
        yearTitle: collection.title,
        stepTitle: paper.title,
        problemPath: paper.problemPath,
        answerPath: paper.answerPath,
      });
    },
    [collection.title, onStepToggle]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={handleLeave}
      ref={cardRef}
      className="group/year relative rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur p-6 min-h-[108px]"
    >
      <div className="relative h-[52px] mb-0.5">
        <button
          type="button"
          onClick={() => onYearToggle?.(collection.title)}
          className={`absolute left-1/2 -translate-x-1/2 text-xl font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
            shouldExpand ? 'top-2 translate-y-0' : 'top-1/2 -translate-y-1/2'
          }`}
        >
          {collection.title}
        </button>
        <div
          className={`year-hover-line absolute left-1/2 -translate-x-1/2 top-[42px] w-8 h-0.5 bg-white/60 transition-opacity duration-200 ${
            showYearHoverLine ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>
      </div>

      <motion.div
        initial={{ maxHeight: 0, opacity: 0, marginTop: 0 }}
        animate={shouldExpand ? { maxHeight: 160, opacity: 1, marginTop: 2 } : { maxHeight: 0, opacity: 0, marginTop: 0 }}
        transition={{ duration: shouldExpand ? 0.25 : 0.5, ease: 'easeInOut' }}
        className="mt-0 grid gap-4 isolate"
        style={{
          gridTemplateColumns: `repeat(${collection.papers.length}, minmax(0, 1fr))`,
          overflow: shouldExpand ? 'visible' : 'hidden',
        }}
      >
        {collection.papers.map((paper, index) => (
          <div
            key={paper.title}
            className="group/paper relative z-0 flex flex-col min-w-0 cursor-pointer"
            style={{ zIndex: activePaper === paper.title ? 10 : index + 1 }}
            onMouseEnter={() => {
              clearStepCloseTimer();
              clearCollapseHoldTimer();
              setIsCollapsing(false);
              setActivePaper(paper.title);
            }}
            onMouseLeave={() => {
              if (isPinnedExpanded && pinnedStepTitle) {
                setActivePaper(pinnedStepTitle);
              }
            }}
            onClick={() => handleStepSelect(paper)}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleStepSelect(paper);
              }}
              className="relative w-full rounded-xl bg-zinc-900/60 py-2 px-4 -mt-1 transition-colors group-hover/paper:border-zinc-700"
            >
              <div className="font-medium text-center transition-colors">
                <span
                  className={`inline-block px-1 pb-0.5 border-b-2 transition-colors ${
                    activePaper === paper.title || selectedStepPath === paper.answerPath
                      ? 'border-emerald-500'
                      : 'border-transparent group-hover/paper:border-emerald-500'
                  }`}
                >
                  {paper.title.replace('STEP ', '')}
                </span>
              </div>
            </button>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
});

HoverPapersCard.displayName = 'HoverPapersCard';

const PastPapers: React.FC = () => {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = React.useState<{
    yearTitle: string;
    stepTitle: string;
    problemPath: string;
    answerPath: string;
  } | null>(null);
  const [expandedSelection, setExpandedSelection] = React.useState<{
    yearTitle: string;
    stepTitle: string | null;
  } | null>(null);
  const [selectedProblemQuestion, setSelectedProblemQuestion] = React.useState<number | null>(null);
  const [selectedQuestionSource, setSelectedQuestionSource] = React.useState<QuestionSource | null>(null);
  const [answerFrameHeight, setAnswerFrameHeight] = React.useState(720);
  const [columnCount, setColumnCount] = React.useState(3);
  const [isLeavingPage, setIsLeavingPage] = React.useState(false);
  const answerFrameRef = React.useRef<HTMLIFrameElement | null>(null);
  const answerFrameResizeObserverRef = React.useRef<ResizeObserver | null>(null);
  const detailAreaRef = React.useRef<HTMLDivElement | null>(null);
  const interactiveAreaRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const getColumnCount = () => {
      if (window.innerWidth >= 1024) {
        return 3;
      }

      if (window.innerWidth >= 640) {
        return 2;
      }

      return 1;
    };

    const updateColumns = () => setColumnCount(getColumnCount());
    updateColumns();
    window.addEventListener('resize', updateColumns);

    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const effectiveSelection = expandedSelection ?? selectedStep;
  const activeAnswerIndex = selectedStep
    ? paperCollections.findIndex((collection) => collection.title === selectedStep.yearTitle)
    : -1;
  // 详情面板插在被选中年份所在那一行的后面，其余年份保持原样显示
  const activeAnswerRow = activeAnswerIndex >= 0 ? Math.floor(activeAnswerIndex / columnCount) : -1;
  const selectedQuestionCount = selectedStep ? getQuestionCountForYear(selectedStep.yearTitle) : 12;
  // 整卷是否有题目图，与题号无关，提到渲染循环外只算一次
  const selectedHasProblemImages = selectedStep
    ? hasProblemImages(selectedStep.yearTitle, selectedStep.stepTitle)
    : false;

  // 让下面几个 useCallback 能读到最新选中状态，同时保持函数引用稳定
  // （引用一变，被 memo 包住的 26 张卡片就会全部重渲染）
  const selectionRef = React.useRef({ expanded: expandedSelection, step: selectedStep });
  selectionRef.current = { expanded: expandedSelection, step: selectedStep };

  const handleYearToggle = React.useCallback((yearTitle: string) => {
    setSelectedStep(null);
    setSelectedProblemQuestion(null);
    setSelectedQuestionSource(null);
    setExpandedSelection((prev) =>
      prev?.yearTitle === yearTitle && prev.stepTitle === null ? null : { yearTitle, stepTitle: null }
    );
  }, []);

  const handleStepToggle = React.useCallback(
    (payload: { yearTitle: string; stepTitle: string; problemPath: string; answerPath: string }) => {
      const prev = selectionRef.current.step;
      const isSameStep =
        prev?.yearTitle === payload.yearTitle && prev.stepTitle === payload.stepTitle;

      setSelectedProblemQuestion(null);
      setSelectedQuestionSource(null);
      setExpandedSelection(null);
      setSelectedStep(isSameStep ? null : payload);
    },
    []
  );

  const handleRequestClose = React.useCallback((yearTitle: string) => {
    const { expanded, step } = selectionRef.current;

    if (expanded?.yearTitle !== yearTitle && step?.yearTitle !== yearTitle) {
      return;
    }

    setExpandedSelection(null);
    setSelectedStep(null);
    setSelectedProblemQuestion(null);
    setSelectedQuestionSource(null);
  }, []);

  const handleOpenDownload = React.useCallback(
    (path: string) => {
      setIsLeavingPage(true);
      window.setTimeout(() => {
        navigate(path);
      }, 260);
    },
    [navigate]
  );

  const syncAnswerFrameHeight = React.useCallback(() => {
    const frame = answerFrameRef.current;

    if (!frame) {
      return;
    }

    const frameDocument = frame.contentDocument ?? frame.contentWindow?.document;

    if (!frameDocument) {
      return;
    }

    const nextHeight = Math.ceil(
      Math.max(
        frameDocument.body.scrollHeight,
        frameDocument.body.offsetHeight,
        frameDocument.body.getBoundingClientRect().height,
        frameDocument.documentElement.scrollHeight,
        frameDocument.documentElement.offsetHeight,
        frameDocument.documentElement.getBoundingClientRect().height
      )
    );

    if (nextHeight <= 0) {
      return;
    }

    setAnswerFrameHeight(nextHeight);
  }, []);

  const handleAnswerFrameLoad = React.useCallback(() => {
    answerFrameResizeObserverRef.current?.disconnect();

    const frame = answerFrameRef.current;
    const frameDocument = frame?.contentDocument ?? frame?.contentWindow?.document;

    if (!frame || !frameDocument) {
      return;
    }

    syncAnswerFrameHeight();
    window.requestAnimationFrame(syncAnswerFrameHeight);
    window.setTimeout(syncAnswerFrameHeight, 120);
    window.setTimeout(syncAnswerFrameHeight, 360);

    const observer = new ResizeObserver(() => {
      syncAnswerFrameHeight();
    });

    observer.observe(frameDocument.documentElement);
    observer.observe(frameDocument.body);
    answerFrameResizeObserverRef.current = observer;
  }, [syncAnswerFrameHeight]);

  React.useEffect(() => {
    if (!selectedQuestionSource) {
      answerFrameResizeObserverRef.current?.disconnect();
      answerFrameResizeObserverRef.current = null;
      return;
    }

    setAnswerFrameHeight(720);
  }, [selectedQuestionSource]);

  React.useEffect(() => {
    if (!selectedQuestionSource) {
      return;
    }

    const handleResize = () => syncAnswerFrameHeight();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [selectedQuestionSource, syncAnswerFrameHeight]);

  React.useEffect(
    () => () => {
      answerFrameResizeObserverRef.current?.disconnect();
    },
    []
  );

  const renderDetailPanel = () => {
    if (!selectedStep) {
      return null;
    }

    return (
    <motion.div
      key={`${selectedStep.answerPath}-question-row`}
      ref={detailAreaRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="col-span-1 sm:col-span-2 lg:col-span-3 mt-0"
    >
      <div className="flex w-full flex-col items-center gap-3">
        <div className="grid w-fit max-w-full grid-cols-[132px,max-content] items-center gap-3">
          <a
            href={selectedStep.problemPath}
            target="_blank"
            rel="noreferrer"
            title="Open all problems"
            className="pastpaper-tab-btn pastpaper-tab-btn-available inline-flex w-[132px] shrink-0 whitespace-nowrap items-center justify-center rounded-lg border border-amber-300/35 bg-amber-300/5 px-4 py-2 text-sm font-medium tracking-[0.12em] text-amber-300 transition-colors hover:border-amber-200/50 hover:bg-amber-300/10 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
          >
            Problems
          </a>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: selectedQuestionCount }, (_, index) => index + 1).map((questionNumber) => {
              const isActiveProblem = selectedProblemQuestion === questionNumber;

              return (
                <button
                  key={`${selectedStep.answerPath}-problem-q-${questionNumber}`}
                  type="button"
                  disabled={!selectedHasProblemImages}
                  onClick={() => {
                    if (!selectedHasProblemImages) {
                      return;
                    }

                    setSelectedQuestionSource(null);
                    setSelectedProblemQuestion((prev) =>
                      prev === questionNumber ? null : questionNumber
                    );
                  }}
                  className={`question-circle-btn ${
                    selectedHasProblemImages ? 'question-circle-btn-available' : 'question-circle-btn-unavailable'
                  } ${isActiveProblem ? 'question-circle-btn-active' : ''}`}
                >
                  Q{questionNumber}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid w-fit max-w-full grid-cols-[132px,max-content] items-center gap-3">
          <button
            type="button"
            disabled={!hasAnyAnswerSource(selectedStep)}
            onClick={() => {
              setSelectedProblemQuestion(null);
              setSelectedQuestionSource(null);
            }}
            className={`pastpaper-tab-btn pastpaper-answer-tab-btn inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] transition-colors ${
              hasAnyAnswerSource(selectedStep)
                ? 'pastpaper-tab-btn-available w-[132px] shrink-0 whitespace-nowrap rounded-lg border border-amber-300/35 bg-amber-300/5 px-4 py-2 text-sm font-medium tracking-[0.12em] text-amber-300 hover:border-amber-200/50 hover:bg-amber-300/10 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/70'
                : 'pastpaper-tab-btn-unavailable w-[132px] cursor-not-allowed rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm font-medium tracking-[0.12em] text-zinc-500'
            }`}
          >
            Answers
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: selectedQuestionCount }, (_, index) => index + 1).map((questionNumber) => {
              const matchedSource = findQuestionSource({
                yearTitle: selectedStep.yearTitle,
              stepTitle: selectedStep.stepTitle,
              questionNumber,
            });
            const isActive =
              matchedSource !== null &&
              selectedQuestionSource !== null &&
              getQuestionSourceKey(selectedQuestionSource) === getQuestionSourceKey(matchedSource);

            return (
              <button
                key={`${selectedStep.answerPath}-answer-q-${questionNumber}`}
                type="button"
                disabled={!matchedSource}
                onClick={() =>
                  setSelectedQuestionSource((prev) => {
                    setSelectedProblemQuestion(null);

                    return matchedSource !== null &&
                      prev !== null &&
                      getQuestionSourceKey(prev) === getQuestionSourceKey(matchedSource)
                      ? null
                      : matchedSource;
                  })
                }
                className={`question-circle-btn ${
                  matchedSource ? 'question-circle-btn-available' : 'question-circle-btn-unavailable'
                } ${isActive ? 'question-circle-btn-active' : ''}`}
              >
                Q{questionNumber}
              </button>
            );
          })}
        </div>
        </div>

        <div className="flex w-full justify-center">
          <button
            type="button"
            onClick={() => {
              setSelectedProblemQuestion(null);
              setSelectedQuestionSource(null);
              setExpandedSelection({
                yearTitle: selectedStep.yearTitle,
                stepTitle: null,
                });
                setSelectedStep(null);
            }}
            className="pastpaper-back-btn rounded-lg border border-sky-500/60 bg-sky-500/10 px-5 py-2 text-sm font-medium text-sky-200 transition-colors hover:bg-sky-500/20 hover:text-sky-100"
          >
            Back
          </button>
        </div>
      </div>

      {selectedProblemQuestion !== null && (
        <div className="mx-auto mt-4 w-full max-w-5xl">
          <div className="pastpaper-answer-title mb-4 text-center text-xl font-semibold text-emerald-200">
            {`${selectedStep.yearTitle.replace('STEP ', '')} ${selectedStep.stepTitle.replace(
              'STEP ',
              ''
            )} Q${selectedProblemQuestion} Question`}
          </div>
          <img
            src={buildProblemImagePath(
              selectedStep.yearTitle,
              selectedStep.stepTitle,
              selectedProblemQuestion
            ) ?? undefined}
            alt={`${selectedStep.yearTitle} ${selectedStep.stepTitle} Q${selectedProblemQuestion} question`}
            className="mx-auto block h-auto w-full bg-white object-contain"
          />
        </div>
      )}

      {selectedQuestionSource && (
        <div className="mx-auto mt-4 w-full max-w-5xl">
          <div className="pastpaper-answer-title mb-4 text-center text-xl font-semibold text-emerald-200">
            {selectedQuestionSource.title}
          </div>
          <iframe
            key={selectedQuestionSource.htmlPath}
            ref={answerFrameRef}
            title={selectedQuestionSource.title}
            src={selectedQuestionSource.htmlPath}
            onLoad={handleAnswerFrameLoad}
            scrolling="no"
            className="block w-full border-0 bg-white"
            style={{ height: `${answerFrameHeight}px` }}
          />
        </div>
      )}
    </motion.div>
    );
  };

  return (
    <>
      <Header />
      <motion.section
        id="pastpapers-page"
        className="min-h-screen bg-zinc-900 text-white relative overflow-hidden"
        initial={{ opacity: 1, y: 0 }}
        animate={isLeavingPage ? { opacity: 0, y: -14 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0">
          <div className="w-full h-full bg-[radial-gradient(circle_at_18%_22%,rgba(99,102,241,0.12),transparent_44%),radial-gradient(circle_at_82%_78%,rgba(45,212,191,0.1),transparent_48%),#0f1117]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,18,24,0.76)_0%,rgba(16,18,24,0.64)_24%,rgba(16,18,24,0.56)_50%,rgba(16,18,24,0.62)_76%,rgba(16,18,24,0.8)_100%)]"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-[0.15em] mb-4">STEP Past Papers</h1>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
              Many answers are yet not published, please wait for them to be added.
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-emerald-200/90">Click or hover over I / II / III to explore.</p>
              <p className="text-sm text-emerald-200/90 inline-flex items-center justify-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/80 bg-emerald-500/10 text-[10px] font-semibold">
                  Q
                </span>
                Green circled = available.
              </p>
            </div>
          </motion.div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto px-2">
              {downloadItems.slice(0, 2).map((item, idx) => (
                <div key={item.title} className="w-full sm:w-1/2">
                  <SimpleCard item={item} delay={idx * 0.05} onOpen={handleOpenDownload} />
                </div>
              ))}
            </div>

            <div ref={interactiveAreaRef} className="-mx-8 sm:-mx-14 lg:-mx-20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 px-8 sm:px-14 lg:px-20 items-start">
                {paperCollections.map((collection, idx) => {
                  const isSelectedYear = effectiveSelection?.yearTitle === collection.title;
                  const pinnedStepTitle = isSelectedYear ? effectiveSelection?.stepTitle ?? null : null;
                  // 该卡片是否是「选中年份那一行」的最后一张：详情面板插在它后面
                  const isEndOfActiveRow =
                    selectedStep !== null &&
                    activeAnswerRow >= 0 &&
                    Math.floor(idx / columnCount) === activeAnswerRow &&
                    ((idx + 1) % columnCount === 0 || idx === paperCollections.length - 1);

                  return (
                    <React.Fragment key={collection.title}>
                      <motion.div layout initial={false} transition={{ duration: 0.22, ease: 'easeOut' }}>
                        <HoverPapersCard
                          collection={collection}
                          delay={(idx + 1) * 0.05}
                          isPinnedExpanded={isSelectedYear}
                          pinnedStepTitle={pinnedStepTitle}
                          selectedStepPath={selectedStep?.answerPath ?? null}
                          detailAreaRef={isSelectedYear ? detailAreaRef : undefined}
                          interactiveAreaRef={interactiveAreaRef}
                          onYearToggle={handleYearToggle}
                          onStepToggle={handleStepToggle}
                          onRequestClose={handleRequestClose}
                        />
                      </motion.div>
                      {isEndOfActiveRow && renderDetailPanel()}
                    </React.Fragment>
                  );
                })}

                {/* 详情面板由 renderDetailPanel() 插入到选中年份所在行之后 */}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <footer className="bg-black border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <a
              href="https://discord.gg/nppbSpPJZ4"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 transition-all duration-300 text-xs tracking-wide group"
              style={{ color: '#60a5fa' }}
            >
              <svg className="w-5 h-5 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="underline underline-offset-2">Discord</span>
            </a>
            <div className="flex items-center md:absolute md:left-1/2 md:-translate-x-1/2">
              <Link to="/" className="text-zinc-400 hover:text-white transition-colors duration-300 text-sm tracking-wide">
                Home Page
              </Link>
            </div>
            <div className="hidden md:block w-[170px]" aria-hidden="true"></div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default PastPapers;

