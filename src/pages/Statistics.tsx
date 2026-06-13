import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import type {
  CompetitionStep,
  GradeCutoffs,
  ScoreBin,
  ScoreDistributionData,
  ScoreDistributions,
} from './scoreDistributions';
import { loadScoreDistribution } from './scoreDistributions';

type SummaryRow = {
  key: string;
  label: string;
  value: string;
  isPercentCycle?: boolean;
};

type GradeRow = {
  key: string;
  label: string;
  value: string;
};

type ScoreDistributionItem = {
  score: number;
  label: number;
  value: number;
  cumulative: number;
};

const formatScore = (value: number) => value.toFixed(2);
const formatGradeScore = (value: number) => value.toFixed(2).replace(/\.00$/, '');

const percentileCycle = [5, 10, 25, 50, 75] as const;

const getNextPercentile = (current: number) => {
  const currentIndex = percentileCycle.indexOf(current as (typeof percentileCycle)[number]);
  if (currentIndex === -1 || currentIndex === percentileCycle.length - 1) {
    return percentileCycle[0];
  }
  return percentileCycle[currentIndex + 1];
};

const buildSummaryRows = (
  bins: ScoreBin[] | null | undefined,
  selectedTopPercentile: number
): SummaryRow[] => {
  if (!bins || bins.length === 0) {
    return [
      { key: 'top-1', label: 'Top 1% Score', value: '-' },
      {
        key: 'top-cycle',
        label: `Top ${selectedTopPercentile}% Score`,
        value: '-',
        isPercentCycle: true,
      },
      { key: 'average', label: 'Average Score', value: '-' },
      { key: 'stddev', label: 'Standard Deviation', value: '-' }
    ];
  }

  const sortedDesc = [...bins].sort((a, b) => b.start - a.start);
  const topThreshold = (percent: number) => {
    const target = percent / 100;
    let cumulative = 0;
    for (const bin of sortedDesc) {
      cumulative += bin.probability;
      if (cumulative >= target) {
        return bin.start;
      }
    }
    return sortedDesc[sortedDesc.length - 1]?.start ?? 0;
  };

  const mean = bins.reduce(
    (sum, bin) => sum + ((bin.start + bin.end) / 2) * bin.probability,
    0
  );
  const variance = bins.reduce((sum, bin) => {
    const midpoint = (bin.start + bin.end) / 2;
    return sum + Math.pow(midpoint - mean, 2) * bin.probability;
  }, 0);
  const stdDev = Math.sqrt(variance);

  return [
    { key: 'top-1', label: 'Top 1% Score', value: formatScore(topThreshold(1)) },
    {
      key: 'top-cycle',
      label: `Top ${selectedTopPercentile}% Score`,
      value: formatScore(topThreshold(selectedTopPercentile)),
      isPercentCycle: true,
    },
    { key: 'average', label: 'Average Score', value: formatScore(mean) },
    { key: 'stddev', label: 'Standard Deviation', value: formatScore(stdDev) }
  ];
};

const buildGradeRows = (gradeCutoffs: GradeCutoffs | null | undefined): GradeRow[] => {
  const gradeKeys = ['S', '1', '2', '3'] as const;

  return gradeKeys.map((grade) => ({
    key: `grade-${grade}`,
    label: `Grade ${grade}`,
    value:
      gradeCutoffs?.[grade] !== undefined ? formatGradeScore(gradeCutoffs[grade] as number) : '-',
  }));
};

const buildDistribution = (bins: ScoreBin[] | null | undefined): ScoreDistributionItem[] => {
  if (!bins) {
    return [];
  }

  let cumulative = 0;
  return bins.map((bin) => {
    cumulative += bin.probability;
    return {
      score: bin.start,
      label: bin.end,
      value: bin.probability,
      cumulative,
    };
  });
};

const yearOptions = Array.from({ length: 27 }, (_, index) => 2026 - index);

const Statistics: React.FC = () => {
  const [activeCompetition, setActiveCompetition] = React.useState<CompetitionStep>('I');
  const [selectedYear, setSelectedYear] = React.useState<number>(2025);
  const [hoveredBarScore, setHoveredBarScore] = React.useState<number | null>(null);
  const [pinnedBarScores, setPinnedBarScores] = React.useState<number[]>([]);
  const [isCumulativeView, setIsCumulativeView] = React.useState(false);
  const [loadedData, setLoadedData] = React.useState<ScoreDistributions>({});
  const [loading, setLoading] = React.useState(false);
  const [selectedTopPercentile, setSelectedTopPercentile] = React.useState<number>(5);
  const isStepIDisabled = selectedYear >= 2020;
  const rawData = loadedData[selectedYear]?.[activeCompetition];
  const [visibleData, setVisibleData] = React.useState<ScoreDistributionData | null>(null);
  const isLoaded = rawData !== undefined;
  const toggleCumulativeView = React.useCallback(() => {
    setHoveredBarScore(null);
    setIsCumulativeView((prev) => !prev);
  }, []);

  React.useEffect(() => {
    let isCancelled = false;

    if (isLoaded) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadScoreDistribution(selectedYear, activeCompetition).then((data) => {
      if (isCancelled) {
        return;
      }

      setLoadedData((prev) => ({
        ...prev,
        [selectedYear]: {
          ...(prev[selectedYear] ?? {}),
          [activeCompetition]: data ?? { bins: [], gradeCutoffs: null },
        },
      }));
      setLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedYear, activeCompetition, isLoaded]);

  React.useEffect(() => {
    if (rawData !== undefined) {
      setVisibleData(rawData);
    }
  }, [rawData]);
  
  React.useEffect(() => {
    if (isStepIDisabled && activeCompetition === 'I') {
      setActiveCompetition('II');
    }
  }, [isStepIDisabled, activeCompetition]);
  
  const visibleDistribution = visibleData?.bins;
  const visibleGradeCutoffs = visibleData?.gradeCutoffs;
  const isShowingCachedData = loading && rawData === undefined && visibleData !== null;
  const shouldShowBlockingLoader = loading && rawData === undefined && visibleData === null;
  const hasData = Boolean(visibleDistribution && visibleDistribution.length > 0);
  const scoreDistribution = React.useMemo<ScoreDistributionItem[]>(
    () => buildDistribution(visibleDistribution),
    [visibleDistribution]
  );
  const maxDistributionValue = React.useMemo(() => {
    if (scoreDistribution.length === 0) {
      return 1;
    }
    const maxValue = Math.max(...scoreDistribution.map((item) => item.value));
    return maxValue === 0 ? 1 : maxValue;
  }, [scoreDistribution]);
  const summaryRows = React.useMemo(
    () => buildSummaryRows(visibleDistribution, selectedTopPercentile),
    [visibleDistribution, selectedTopPercentile]
  );
  const gradeRows = React.useMemo(
    () => buildGradeRows(visibleGradeCutoffs),
    [visibleGradeCutoffs]
  );

  return (
    <>
      <Header />
      <section id="statistics-page" className="min-h-screen bg-[#39393B] flex items-start justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#39393B]/70 via-[#39393B]/78 to-[#39393B]"></div>
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-32 pb-16">
          <div className="text-center mb-10">
            <h1 className="text-[clamp(1.65rem,8.8vw,3.75rem)] md:text-6xl font-bold tracking-[0.04em] sm:tracking-[0.1em] md:tracking-[0.2em] text-white inline-flex items-center gap-3">
              STATISTICS
            </h1>
          </div>

          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/40 backdrop-blur p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="flex-1">
                <label className="text-xs uppercase tracking-[0.2em] text-zinc-400 sm:ml-4 inline-flex items-center gap-2">
                  <span className="pt-1">Date:</span>
                  <div className="relative mt-2">
                    <select
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(Number(event.target.value))}
                      className="w-24 md:w-32 rounded-lg bg-zinc-900/70 border border-zinc-700/70 pl-3 pr-8 py-2 text-sm text-zinc-200 appearance-none cursor-pointer text-center focus:outline-none focus:border-zinc-500"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year} className="text-left">
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </label>
              </div>
              <div className="flex items-center gap-3 text-sm md:text-base tracking-[0.08em] sm:tracking-[0.14em] md:tracking-[0.3em] text-zinc-200">
                <span className="text-xs md:text-sm tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.35em] text-zinc-400">STEP</span>
                {(['I', 'II', 'III'] as const).map((step, index) => {
                  const isDisabled = step === 'I' && isStepIDisabled;
                  const isActive = activeCompetition === step;

                  return (
                    <React.Fragment key={step}>
                      {index > 0 && <span className="text-zinc-500">/</span>}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isDisabled) {
                            setActiveCompetition(step);
                          }
                        }}
                        aria-pressed={isActive}
                        aria-disabled={isDisabled}
                        disabled={isDisabled}
                        className={`relative flex h-7 w-7 items-center justify-center text-xs tracking-normal text-center transition-colors ${
                          isDisabled
                            ? 'text-zinc-400 cursor-not-allowed bg-transparent'
                            : isActive
                            ? 'rounded-full border border-emerald-300 bg-emerald-300/20 text-emerald-100'
                            : 'rounded-full text-zinc-300 hover:text-white'
                        }`}
                      >
                        <span className="relative">
                          {step}
                          {isDisabled && (
                            <span className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-500" />
                          )}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3"></div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/40 backdrop-blur p-6 mb-8">
            <div className="text-sm uppercase tracking-[0.2em] text-zinc-400 mb-4">
              Score Distribution Summary
            </div>
            <div className="w-full max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-fr gap-4 mb-4">
                {summaryRows.map((row) => (
                  <div
                    key={row.key}
                    className="h-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 flex flex-col justify-between"
                  >
                    <div className="text-xs text-zinc-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                      {row.isPercentCycle ? (
                        <>
                          <span>Top</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTopPercentile((prev) => getNextPercentile(prev))
                            }
                            className="rounded-md border border-emerald-300/60 bg-emerald-300/15 px-1.5 py-0.5 text-emerald-200 hover:bg-emerald-300/25 transition-colors"
                            aria-label={`Cycle top percentile, current ${selectedTopPercentile}%`}
                          >
                            {selectedTopPercentile}%
                          </button>
                          <span>Score</span>
                        </>
                      ) : (
                        row.label
                      )}
                    </div>
                    <div className="text-lg text-white font-semibold">{row.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 auto-rows-fr gap-4">
                {gradeRows.map((row) => (
                  <div
                    key={row.key}
                    className="h-full rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 flex flex-col justify-between"
                  >
                    <div className="text-xs text-zinc-400 uppercase tracking-[0.15em] mb-2">
                      {row.label}
                    </div>
                    <div className="text-lg text-white font-semibold">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/40 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm uppercase tracking-[0.2em] text-zinc-400">
                Score Distribution
              </div>
              <div className="flex items-center gap-3">
                {isShowingCachedData && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Loading next data...
                  </span>
                )}
                <span className="text-xs uppercase tracking-[0.35em] text-zinc-300">
                  Cumulative
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isCumulativeView}
                  data-state={isCumulativeView ? 'on' : 'off'}
                  aria-label="Toggle percentile tooltip between raw and cumulative"
                  onClick={toggleCumulativeView}
                  className={`stats-cumulative-toggle relative h-6 w-12 rounded-full border transition ${
                    isCumulativeView
                      ? 'border-emerald-400 bg-emerald-500/20'
                      : 'border-sky-400/70 bg-sky-500/20'
                  }`}
                >
                  <span
                    className={`stats-cumulative-knob absolute left-1 top-0.5 h-4 w-4 rounded-full shadow transition ${
                      isCumulativeView
                        ? 'translate-x-5 bg-emerald-300'
                        : 'translate-x-0 bg-sky-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {shouldShowBlockingLoader ? (
                <div className="h-64 flex items-center justify-center rounded-xl border border-dashed border-zinc-700/70 bg-zinc-900/40 text-sm text-zinc-400">
                  Loading data...
                </div>
              ) : !hasData ? (
                <div className="h-64 flex items-center justify-center rounded-xl border border-dashed border-zinc-700/70 bg-zinc-900/40 text-sm text-zinc-400">
                  No data yet for the selected year and step.
                </div>
              ) : (
                <div className="h-64 flex items-end gap-px relative">
                  {scoreDistribution.map((item) => {
                    const isPinned = pinnedBarScores.includes(item.score);
                    const isHovered = hoveredBarScore === item.score;
                    const shouldShowTooltip = isPinned || isHovered;

                    return (
                      <div
                        key={`${item.score}-${item.label}`}
                        className="flex-1 flex flex-col justify-end h-full relative group"
                      >
                        <div
                          className={`w-full rounded-[1px] bg-gradient-to-t transition-all relative cursor-pointer ${
                            isPinned
                              ? 'from-emerald-600/70 to-emerald-300/90'
                              : 'from-emerald-600/50 to-emerald-300/70 hover:from-emerald-600/70 hover:to-emerald-300/90'
                          }`}
                          style={{ height: `${(item.value / maxDistributionValue) * 100}%` }}
                          onMouseEnter={() => {
                            setHoveredBarScore(item.score);
                          }}
                          onMouseLeave={() => setHoveredBarScore(null)}
                          onClick={() =>
                            setPinnedBarScores((prev) =>
                              prev.includes(item.score)
                                ? prev.filter((score) => score !== item.score)
                                : [...prev, item.score]
                            )
                          }
                        >
                          {shouldShowTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-zinc-800 text-white text-xs rounded whitespace-nowrap z-10 shadow-lg">
                              {(isCumulativeView ? 'Percentile' : 'Percentage')}{' '}
                              {((isCumulativeView ? item.cumulative : item.value) * 100).toFixed(2)}%
                            </div>
                          )}
                        </div>
                        {(item.score === 0 || item.label % 10 === 0) && (
                          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500">
                            {item.score === 0 ? 0 : item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-zinc-800 py-6">
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
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span className="underline underline-offset-2">Discord</span>
            </a>
            <div className="flex items-center md:absolute md:left-1/2 md:-translate-x-1/2">
            <Link
              to="/"
              className="text-zinc-400 hover:text-white transition-colors duration-300 text-sm tracking-wide"
            >
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

export default Statistics;
