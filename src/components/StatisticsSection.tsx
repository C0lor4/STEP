import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  loadScoreDistribution,
  type CompetitionStep,
  type GradeCutoffs,
  type GradeKey,
} from '../pages/scoreDistributions';

type TrendPoint = {
  year: number;
  score: number;
};

type TrendData = Record<CompetitionStep, TrendPoint[]>;
type HoveredPoint = {
  step: CompetitionStep;
  year: number;
  score: number;
};
type TrendCutoffRecord = {
  year: number;
  step: CompetitionStep;
  gradeCutoffs: GradeCutoffs | null;
};

const trendYears = Array.from({ length: 26 }, (_, index) => 2025 - index).reverse();
const trendAxisMaxYear = 2026;
const trendSteps: CompetitionStep[] = ['I', 'II', 'III'];

const stepColors: Record<CompetitionStep, string> = {
  I: '#34d399',
  II: '#fbbf24',
  III: '#60a5fa',
};
const hoverSnapDistance = 16;
const hoverReleaseDistance = 24;
const pointTooltipDistance = 10;
const chartXLeftInset = 10;
const gradeCycle: GradeKey[] = ['S', '1', '2', '3'];
const getNextGrade = (current: GradeKey) => {
  const currentIndex = gradeCycle.indexOf(current);
  if (currentIndex === -1 || currentIndex === gradeCycle.length - 1) {
    return gradeCycle[0];
  }
  return gradeCycle[currentIndex + 1];
};

const StatisticsSection: React.FC = () => {
  const [trendCutoffs, setTrendCutoffs] = React.useState<TrendCutoffRecord[]>([]);
  const [isLoadingTrend, setIsLoadingTrend] = React.useState(true);
  const [hoveredStep, setHoveredStep] = React.useState<CompetitionStep | null>(null);
  const [hoveredPoint, setHoveredPoint] = React.useState<HoveredPoint | null>(null);
  const [lockedStep, setLockedStep] = React.useState<CompetitionStep | null>(null);
  const [selectedGrade, setSelectedGrade] = React.useState<GradeKey>('S');
  const [yMinInput, setYMinInput] = React.useState('');
  const [yMaxInput, setYMaxInput] = React.useState('');
  const [appliedYRange, setAppliedYRange] = React.useState<{ min: number; max: number } | null>(
    null
  );
  const [xRange, setXRange] = React.useState<{ min: number; max: number }>({
    min: trendYears[0],
    max: trendAxisMaxYear,
  });
  const [isYRangeLocked, setIsYRangeLocked] = React.useState(false);
  const [editingYBound, setEditingYBound] = React.useState<'min' | 'max' | null>(null);
  const [draggingYBound, setDraggingYBound] = React.useState<{
    bound: 'min' | 'max';
    startClientY: number;
    startMin: number;
    startMax: number;
  } | null>(null);
  const didDragYBoundRef = React.useRef(false);
  const [draggingChart, setDraggingChart] = React.useState<{
    startClientX: number;
    startClientY: number;
    startMinY: number;
    startMaxY: number;
    startMinX: number;
    startMaxX: number;
  } | null>(null);
  const didPanChartRef = React.useRef(false);

  React.useEffect(() => {
    const isDragging = Boolean(draggingChart || draggingYBound);
    if (!isDragging || typeof document === 'undefined') {
      return;
    }

    const { body } = document;
    const previousUserSelect = body.style.userSelect;
    const previousWebkitUserSelect = body.style.webkitUserSelect;
    const previousCursor = body.style.cursor;

    body.style.userSelect = 'none';
    body.style.webkitUserSelect = 'none';
    body.style.cursor = 'grabbing';

    return () => {
      body.style.userSelect = previousUserSelect;
      body.style.webkitUserSelect = previousWebkitUserSelect;
      body.style.cursor = previousCursor;
    };
  }, [draggingChart, draggingYBound]);

  React.useEffect(() => {
    let cancelled = false;

    const loadTrendData = async () => {
      const requests = trendYears.flatMap((year) =>
        trendSteps.map(async (step) => {
          const data = await loadScoreDistribution(year, step);
          return {
            year,
            step,
            gradeCutoffs: data?.gradeCutoffs ?? null,
          };
        })
      );

      const results = await Promise.all(requests);
      if (cancelled) {
        return;
      }

      setTrendCutoffs(results);
      setIsLoadingTrend(false);
    };

    void loadTrendData();

    return () => {
      cancelled = true;
    };
  }, []);

  const trendData = React.useMemo<TrendData>(() => {
    const nextData: TrendData = { I: [], II: [], III: [] };

    for (const item of trendCutoffs) {
      const value = item.gradeCutoffs?.[selectedGrade];
      if (typeof value === 'number') {
        nextData[item.step].push({ year: item.year, score: value });
      }
    }

    for (const step of trendSteps) {
      nextData[step].sort((a, b) => a.year - b.year);
    }

    return nextData;
  }, [selectedGrade, trendCutoffs]);

  const allPoints = React.useMemo(
    () => trendSteps.flatMap((step) => trendData[step]),
    [trendData]
  );
  const hasTrendData = allPoints.length > 0;

  const autoYRange = React.useMemo(() => {
    const minScoreRaw = hasTrendData ? Math.min(...allPoints.map((point) => point.score)) : 0;
    const maxScoreRaw = hasTrendData ? Math.max(...allPoints.map((point) => point.score)) : 1;
    const scorePadding = Math.max(1.2, (maxScoreRaw - minScoreRaw) * 0.18);
    return {
      min: Math.max(0, minScoreRaw - scorePadding),
      max: maxScoreRaw + scorePadding,
    };
  }, [allPoints, hasTrendData]);

  const autoYRangeInt = React.useMemo(
    () => ({
      min: Math.floor(autoYRange.min),
      max: Math.ceil(autoYRange.max),
    }),
    [autoYRange.max, autoYRange.min]
  );

  React.useEffect(() => {
    if (isYRangeLocked) {
      return;
    }
    setAppliedYRange({ min: autoYRangeInt.min, max: autoYRangeInt.max });
    setYMinInput(autoYRangeInt.min.toString());
    setYMaxInput(autoYRangeInt.max.toString());
  }, [autoYRangeInt.max, autoYRangeInt.min, isYRangeLocked]);

  const applyYRange = React.useCallback(() => {
    const nextMin = Number.parseInt(yMinInput, 10);
    const nextMax = Number.parseInt(yMaxInput, 10);

    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax)) {
      if (appliedYRange) {
        setYMinInput(appliedYRange.min.toString());
        setYMaxInput(appliedYRange.max.toString());
      } else {
        setYMinInput(autoYRangeInt.min.toString());
        setYMaxInput(autoYRangeInt.max.toString());
      }
      return;
    }

    const normalizedMin = Math.trunc(nextMin);
    const normalizedMax = Math.trunc(nextMax) <= normalizedMin ? normalizedMin + 1 : Math.trunc(nextMax);
    setAppliedYRange({ min: normalizedMin, max: normalizedMax });
    setIsYRangeLocked(true);
    setYMinInput(normalizedMin.toString());
    setYMaxInput(normalizedMax.toString());
    setHoveredPoint(null);
  }, [appliedYRange, autoYRangeInt.max, autoYRangeInt.min, yMaxInput, yMinInput]);

  const applyYRangeLive = React.useCallback((nextMinInput: string, nextMaxInput: string) => {
    const nextMin = Number.parseInt(nextMinInput, 10);
    const nextMax = Number.parseInt(nextMaxInput, 10);
    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax)) {
      return;
    }
    const normalizedMin = Math.trunc(nextMin);
    const normalizedMax = Math.trunc(nextMax) <= normalizedMin ? normalizedMin + 1 : Math.trunc(nextMax);
    setAppliedYRange({ min: normalizedMin, max: normalizedMax });
    setIsYRangeLocked(true);
    setHoveredPoint(null);
  }, []);

  const cancelEditYRange = React.useCallback(() => {
    if (appliedYRange) {
      setYMinInput(appliedYRange.min.toString());
      setYMaxInput(appliedYRange.max.toString());
    }
    setEditingYBound(null);
  }, [appliedYRange]);

  React.useEffect(() => {
    if (!draggingYBound) {
      return;
    }

    const dragPixelsPerStep = 8;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaSteps = Math.round((draggingYBound.startClientY - event.clientY) / dragPixelsPerStep);
      if (deltaSteps === 0) {
        return;
      }
      didDragYBoundRef.current = true;
      setIsYRangeLocked(true);

      if (draggingYBound.bound === 'min') {
        const nextMin = Math.min(
          draggingYBound.startMax - 1,
          draggingYBound.startMin + deltaSteps
        );
        const nextMax = draggingYBound.startMax;
        setAppliedYRange({ min: nextMin, max: nextMax });
        setYMinInput(nextMin.toString());
        setYMaxInput(nextMax.toString());
      } else {
        const nextMin = draggingYBound.startMin;
        const nextMax = Math.max(
          draggingYBound.startMin + 1,
          draggingYBound.startMax + deltaSteps
        );
        setAppliedYRange({ min: nextMin, max: nextMax });
        setYMinInput(nextMin.toString());
        setYMaxInput(nextMax.toString());
      }

      setHoveredPoint(null);
    };

    const handleMouseUp = () => {
      setDraggingYBound(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingYBound]);

  React.useEffect(() => {
    if (!draggingChart) {
      return;
    }

    const chartWidth = 880;
    const chartHeight = 280;
    const chartPadding = { top: 20, right: 24, bottom: 36, left: 42 };

    const handleMouseMove = (event: MouseEvent) => {
      const dx = event.clientX - draggingChart.startClientX;
      const dy = event.clientY - draggingChart.startClientY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        didPanChartRef.current = true;
      }

      const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
      const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

      const ySpan = draggingChart.startMaxY - draggingChart.startMinY;
      const yShift = (dy / Math.max(1, plotHeight)) * ySpan;
      const nextMinY = Math.trunc(draggingChart.startMinY + yShift);
      const nextMaxYRaw = Math.trunc(draggingChart.startMaxY + yShift);
      const nextMaxY = nextMaxYRaw <= nextMinY ? nextMinY + 1 : nextMaxYRaw;

      const xSpan = draggingChart.startMaxX - draggingChart.startMinX;
      const xShift = (dx / Math.max(1, plotWidth)) * xSpan;
      const nextMinX = draggingChart.startMinX - xShift;
      const nextMaxX = draggingChart.startMaxX - xShift;

      setAppliedYRange({ min: nextMinY, max: nextMaxY });
      setYMinInput(nextMinY.toString());
      setYMaxInput(nextMaxY.toString());
      setIsYRangeLocked(true);
      setXRange({ min: nextMinX, max: nextMaxX <= nextMinX ? nextMinX + 1 : nextMaxX });
      setHoveredPoint(null);
    };

    const handleMouseUp = () => {
      setDraggingChart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingChart]);

  const chartMinScore = isYRangeLocked ? (appliedYRange?.min ?? autoYRangeInt.min) : autoYRangeInt.min;
  const chartMaxScoreBase = isYRangeLocked ? (appliedYRange?.max ?? autoYRangeInt.max) : autoYRangeInt.max;
  const chartMaxScore = chartMaxScoreBase <= chartMinScore ? chartMinScore + 1 : chartMaxScoreBase;

  const resetTrendView = React.useCallback(() => {
    setXRange({ min: trendYears[0], max: trendAxisMaxYear });
    setIsYRangeLocked(false);
    setAppliedYRange({ min: autoYRangeInt.min, max: autoYRangeInt.max });
    setYMinInput(autoYRangeInt.min.toString());
    setYMaxInput(autoYRangeInt.max.toString());
    setEditingYBound(null);
    setDraggingYBound(null);
    setDraggingChart(null);
    setLockedStep(null);
    setHoveredStep(null);
    setHoveredPoint(null);
  }, [autoYRangeInt.max, autoYRangeInt.min]);

  const chartGeometry = React.useMemo(() => {
    const width = 880;
    const height = 280;
    const padding = { top: 20, right: 24, bottom: 36, left: 42 };
    const minYear = xRange.min;
    const maxYear = xRange.max;
    const minScore = chartMinScore;
    const maxScore = chartMaxScore;
    const scoreRange = Math.max(1, maxScore - minScore);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const x = (year: number) =>
      padding.left +
      chartXLeftInset +
      ((year - minYear) / Math.max(1, maxYear - minYear)) * (plotWidth - chartXLeftInset);
    const y = (score: number) => padding.top + (1 - (score - minScore) / scoreRange) * plotHeight;

    return { width, height, padding, minYear, maxYear, minScore, maxScore, x, y };
  }, [chartMaxScore, chartMinScore, xRange.max, xRange.min]);

  const xTicks = React.useMemo(() => {
    const step = 5;
    const ticks: number[] = [];
    const start = Math.ceil(chartGeometry.minYear / step) * step;
    const end = Math.floor(chartGeometry.maxYear / step) * step;
    for (let year = start; year <= end; year += step) {
      ticks.push(year);
    }
    if (
      trendAxisMaxYear >= chartGeometry.minYear &&
      trendAxisMaxYear <= chartGeometry.maxYear &&
      !ticks.includes(trendAxisMaxYear)
    ) {
      ticks.push(trendAxisMaxYear);
    }
    return ticks.sort((a, b) => a - b);
  }, [chartGeometry.maxYear, chartGeometry.minYear]);
  const yTicks = React.useMemo(() => {
    const count = 5;
    const values: number[] = [];
    for (let index = 0; index < count; index += 1) {
      const value =
        chartGeometry.minScore +
        ((chartGeometry.maxScore - chartGeometry.minScore) * index) / (count - 1);
      values.push(value);
    }
    return values;
  }, [chartGeometry.maxScore, chartGeometry.minScore]);

  const buildPath = React.useCallback(
    (points: TrendPoint[]) =>
      points
        .map((point, index) => {
          const command = index === 0 ? 'M' : 'L';
          return `${command} ${chartGeometry.x(point.year).toFixed(2)} ${chartGeometry
            .y(point.score)
            .toFixed(2)}`;
        })
        .join(' '),
    [chartGeometry]
  );

  const getSeriesOpacity = React.useCallback(
    (step: CompetitionStep) => {
      const activeStep = lockedStep ?? hoveredStep;
      if (!activeStep) {
        return 1;
      }
      return activeStep === step ? 1 : 0.18;
    },
    [hoveredStep, lockedStep]
  );

  const getSvgMousePoint = React.useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const scaleX = chartGeometry.width / rect.width;
      const scaleY = chartGeometry.height / rect.height;
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      };
    },
    [chartGeometry.height, chartGeometry.width]
  );

  const findNearestPointOnStep = React.useCallback(
    (step: CompetitionStep, mouseX: number, mouseY: number) => {
      const points = trendData[step];
      if (points.length === 0) {
        return null;
      }

      let best: HoveredPoint | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const point of points) {
        const px = chartGeometry.x(point.year);
        const py = chartGeometry.y(point.score);
        const distance = Math.hypot(mouseX - px, mouseY - py);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { step, year: point.year, score: point.score };
        }
      }

      let nearestLineDistance = bestDistance;
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        const ax = chartGeometry.x(start.year);
        const ay = chartGeometry.y(start.score);
        const bx = chartGeometry.x(end.year);
        const by = chartGeometry.y(end.score);
        const abx = bx - ax;
        const aby = by - ay;
        const abLengthSquared = abx * abx + aby * aby;

        if (abLengthSquared === 0) {
          continue;
        }

        const t = Math.max(
          0,
          Math.min(1, ((mouseX - ax) * abx + (mouseY - ay) * aby) / abLengthSquared)
        );
        const closestX = ax + abx * t;
        const closestY = ay + aby * t;
        const distanceToSegment = Math.hypot(mouseX - closestX, mouseY - closestY);
        if (distanceToSegment < nearestLineDistance) {
          nearestLineDistance = distanceToSegment;
        }
      }

      return { point: best, pointDistance: bestDistance, lineDistance: nearestLineDistance };
    },
    [chartGeometry, trendData]
  );

  const handleChartMouseMove = React.useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (draggingChart) {
        return;
      }
      if (!hasTrendData) {
        return;
      }

      const mouse = getSvgMousePoint(event);

      let activeStep = lockedStep ?? hoveredStep;
      if (!activeStep) {
        let bestStep: CompetitionStep | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const step of trendSteps) {
          const nearest = findNearestPointOnStep(step, mouse.x, mouse.y);
          if (nearest && nearest.lineDistance < bestDistance) {
            bestDistance = nearest.lineDistance;
            bestStep = step;
          }
        }

        if (bestStep && bestDistance <= hoverSnapDistance) {
          activeStep = bestStep;
          setHoveredStep(bestStep);
        }
      }

      if (!activeStep) {
        setHoveredPoint(null);
        return;
      }

      const nearest = findNearestPointOnStep(activeStep, mouse.x, mouse.y);
      if (!nearest || !nearest.point) {
        setHoveredStep(null);
        setHoveredPoint(null);
        return;
      }

      if (nearest.lineDistance <= hoverReleaseDistance) {
        if (nearest.pointDistance <= pointTooltipDistance) {
          setHoveredPoint(nearest.point);
        } else {
          setHoveredPoint(null);
        }
        return;
      }

      setHoveredPoint(null);
      if (!lockedStep) {
        setHoveredStep(null);
      }
    },
    [draggingChart, findNearestPointOnStep, getSvgMousePoint, hasTrendData, hoveredStep, lockedStep]
  );

  const zoomChart = React.useCallback(
    (zoomFactor: number) => {
      const xSpan = chartGeometry.maxYear - chartGeometry.minYear;
      const ySpan = chartGeometry.maxScore - chartGeometry.minScore;
      const minXSpan = 2;
      const maxXSpan = 80;
      const minYSpan = 4;
      const maxYSpan = 300;
      const xNormalized = 0.5;
      const yNormalized = 0.5;

      const nextXSpan = Math.max(minXSpan, Math.min(maxXSpan, xSpan * zoomFactor));
      const nextYSpan = Math.max(minYSpan, Math.min(maxYSpan, ySpan * zoomFactor));

      const xAnchor = chartGeometry.minYear + xNormalized * xSpan;
      const yAnchor = chartGeometry.maxScore - yNormalized * ySpan;

      const nextMinX = xAnchor - xNormalized * nextXSpan;
      const nextMaxX = nextMinX + nextXSpan;
      const nextMaxY = yAnchor + yNormalized * nextYSpan;
      const nextMinY = nextMaxY - nextYSpan;

      const normalizedMinY = Math.trunc(nextMinY);
      const normalizedMaxYRaw = Math.trunc(nextMaxY);
      const normalizedMaxY =
        normalizedMaxYRaw <= normalizedMinY ? normalizedMinY + 1 : normalizedMaxYRaw;

      setXRange({ min: nextMinX, max: nextMaxX });
      setAppliedYRange({ min: normalizedMinY, max: normalizedMaxY });
      setYMinInput(normalizedMinY.toString());
      setYMaxInput(normalizedMaxY.toString());
      setIsYRangeLocked(true);
      setHoveredPoint(null);
    },
    [chartGeometry]
  );

  const hoveredScoreLabel = hoveredPoint ? `Score: ${hoveredPoint.score.toFixed(2)}` : '';
  const tooltipPaddingX = 6;
  const tooltipWidth = hoveredPoint
    ? Math.max(64, hoveredScoreLabel.length * 5.35 + tooltipPaddingX * 2)
    : 0;
  const tooltipHeight = 20;
  const tooltipX = hoveredPoint
    ? Math.min(
        chartGeometry.width - tooltipWidth - 10,
        Math.max(chartGeometry.padding.left + 4, chartGeometry.x(hoveredPoint.year) + 10)
      )
    : 0;
  const tooltipY = hoveredPoint ? Math.max(8, chartGeometry.y(hoveredPoint.score) - 30) : 0;

  return (
    <section id="statistics" className="min-h-screen bg-[#19191B] flex items-center justify-center relative">

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center justify-items-center">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[clamp(1.65rem,8.8vw,3.75rem)] md:text-6xl font-bold tracking-[0.04em] sm:tracking-[0.1em] md:tracking-[0.2em] text-white mb-12 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Link
                  to="/statistics"
                  className="hover:text-zinc-300 transition-colors inline-flex items-center cursor-pointer gap-2"
                >
                  STATISTICS
                </Link>
              </motion.div>
            </h2>
            <div className="w-full max-w-[14rem] md:max-w-[18rem] lg:max-w-[22rem] h-px bg-zinc-400 mx-auto mb-12"></div>
            <div className="mx-auto w-full max-w-5xl mb-8 rounded-2xl border border-zinc-700/70 bg-zinc-900/40 backdrop-blur px-4 py-4 md:px-6 md:py-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs md:text-sm uppercase tracking-[0.2em] text-zinc-300 inline-flex items-center gap-2">
                  <span>Grade</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHoveredPoint(null);
                      setHoveredStep(null);
                      setLockedStep(null);
                      setSelectedGrade((prev) => getNextGrade(prev));
                    }}
                    className="rounded-md border border-emerald-300/60 bg-emerald-300/15 px-2 py-0.5 text-emerald-200 hover:bg-emerald-300/25 transition-colors"
                    aria-label={`Cycle grade cutoff, current ${selectedGrade}`}
                  >
                    {selectedGrade}
                  </button>
                  <span>Score Trend</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.14em] text-zinc-300">
                  {trendSteps.map((step) => (
                    <button
                      type="button"
                      key={step}
                      className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-100"
                      onClick={() => {
                        setHoveredPoint(null);
                        setHoveredStep(null);
                        setLockedStep((prev) => (prev === step ? null : step));
                      }}
                      aria-pressed={lockedStep === step}
                      style={{ opacity: getSeriesOpacity(step) }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stepColors[step] }}
                      />
                      <span>{`STEP ${step}`}</span>
                    </button>
                  ))}
                </div>
              </div>
              {isLoadingTrend ? (
                <div className="h-56 flex items-center justify-center text-sm text-zinc-400">
                  Loading grade trend...
                </div>
              ) : !hasTrendData ? (
                <div className="h-56 flex items-center justify-center text-sm text-zinc-400">
                  No trend data available.
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                  className="w-full h-auto"
                  role="img"
                  aria-label="Trend chart of Grade S score by year"
                  style={{
                    cursor: draggingChart ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    overscrollBehavior: 'contain',
                  }}
                  onMouseDown={(event) => {
                    if (event.button !== 0 || editingYBound) {
                      return;
                    }
                    event.preventDefault();
                    didPanChartRef.current = false;
                    setDraggingChart({
                      startClientX: event.clientX,
                      startClientY: event.clientY,
                      startMinY: chartMinScore,
                      startMaxY: chartMaxScore,
                      startMinX: xRange.min,
                      startMaxX: xRange.max,
                    });
                  }}
                  onClick={() => {
                    if (didPanChartRef.current) {
                      didPanChartRef.current = false;
                      return;
                    }
                    setLockedStep(null);
                    setHoveredStep(null);
                    setHoveredPoint(null);
                  }}
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => {
                    if (!lockedStep) {
                      setHoveredStep(null);
                    }
                    setHoveredPoint(null);
                  }}
                >
                  <line
                    x1={chartGeometry.padding.left}
                    x2={chartGeometry.padding.left}
                    y1={chartGeometry.padding.top}
                    y2={chartGeometry.height - chartGeometry.padding.bottom}
                    stroke="var(--stats-grid-line)"
                    strokeWidth="1"
                  />

                  {yTicks.map((tick, tickIndex) => {
                    const isBottomTick = tickIndex === 0;
                    const isTopTick = tickIndex === yTicks.length - 1;
                    return (
                    <g key={`y-${tick.toFixed(2)}`}>
                      <line
                        x1={chartGeometry.padding.left}
                        x2={chartGeometry.width - chartGeometry.padding.right}
                        y1={chartGeometry.y(tick)}
                        y2={chartGeometry.y(tick)}
                        stroke="var(--stats-grid-line)"
                        strokeWidth="1"
                      />
                      {isBottomTick || isTopTick ? (
                        editingYBound === (isBottomTick ? 'min' : 'max') ? (
                          <foreignObject
                            x={2}
                            y={chartGeometry.y(tick) - 12}
                            width={44}
                            height={24}
                          >
                            <input
                              type="number"
                              autoFocus
                              step={1}
                              value={isBottomTick ? yMinInput : yMaxInput}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                if (isBottomTick) {
                                  setYMinInput(nextValue);
                                  applyYRangeLive(nextValue, yMaxInput);
                                } else {
                                  setYMaxInput(nextValue);
                                  applyYRangeLive(yMinInput, nextValue);
                                }
                              }}
                              onBlur={() => {
                                applyYRange();
                                setEditingYBound(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.currentTarget.blur();
                                }
                                if (event.key === 'Escape') {
                                  cancelEditYRange();
                                }
                              }}
                              className="mt-0.5 h-5 w-full rounded-md border border-emerald-400/80 bg-zinc-900/95 px-1 text-center text-[11px] leading-none text-emerald-200 focus:outline-none focus:border-emerald-300"
                            />
                          </foreignObject>
                        ) : (
                          <foreignObject
                            x={2}
                            y={chartGeometry.y(tick) - 12}
                            width={30}
                            height={24}
                          >
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                didDragYBoundRef.current = false;
                                setDraggingYBound({
                                  bound: isBottomTick ? 'min' : 'max',
                                  startClientY: event.clientY,
                                  startMin: chartMinScore,
                                  startMax: chartMaxScore,
                                });
                              }}
                              onClick={() => {
                                if (didDragYBoundRef.current) {
                                  didDragYBoundRef.current = false;
                                  return;
                                }
                                setEditingYBound(isBottomTick ? 'min' : 'max');
                              }}
                              className="mt-0.5 h-5 w-7 cursor-ns-resize rounded-md border border-emerald-400/80 bg-zinc-900/85 px-0.5 text-center text-[11px] leading-none text-emerald-200 hover:border-emerald-300 hover:text-emerald-100"
                            >
                              {Math.round(tick)}
                            </button>
                          </foreignObject>
                        )
                      ) : (
                        <text
                          x={chartGeometry.padding.left - 8}
                          y={chartGeometry.y(tick) + 4}
                          fill="var(--stats-axis-text)"
                          fontSize="10"
                          textAnchor="end"
                        >
                          {tick.toFixed(1)}
                        </text>
                      )}
                    </g>
                  );
                  })}

                  {xTicks.map((tick) => (
                    <g key={`x-${tick}`}>
                      <line
                        x1={chartGeometry.x(tick)}
                        x2={chartGeometry.x(tick)}
                        y1={chartGeometry.padding.top}
                        y2={chartGeometry.height - chartGeometry.padding.bottom}
                        stroke="var(--stats-grid-line-soft)"
                        strokeWidth="1"
                      />
                      <text
                        x={chartGeometry.x(tick)}
                        y={chartGeometry.height - chartGeometry.padding.bottom + 16}
                        fill="var(--stats-axis-text)"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {tick === trendAxisMaxYear ? '' : tick}
                      </text>
                    </g>
                  ))}

                  {trendSteps.map((step) => {
                    const points = trendData[step];
                    const stepPath = buildPath(points);
                    const opacity = getSeriesOpacity(step);
                    const isActive = (lockedStep ?? hoveredStep) === step;
                    return (
                      <g key={`series-${step}`} style={{ opacity }}>
                        {points.length > 1 && (
                          <>
                            <path
                              d={stepPath}
                              fill="none"
                              stroke={stepColors[step]}
                              strokeWidth={isActive ? 3.8 : 2.7}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                filter: isActive
                                  ? `drop-shadow(0 0 8px ${stepColors[step]})`
                                  : 'none',
                                transition: 'stroke-width 150ms ease, filter 150ms ease',
                              }}
                            />
                            <path
                              d={stepPath}
                              fill="none"
                              stroke="transparent"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ pointerEvents: 'visibleStroke' }}
                              onMouseEnter={() => {
                                if (!lockedStep) {
                                  setHoveredStep(step);
                                }
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                setLockedStep(step);
                                setHoveredStep(step);
                              }}
                            />
                          </>
                        )}

                        {points.map((point) => {
                          const isPointActive =
                            hoveredPoint?.step === step && hoveredPoint?.year === point.year;
                          return (
                            <circle
                              key={`${step}-${point.year}`}
                              cx={chartGeometry.x(point.year)}
                              cy={chartGeometry.y(point.score)}
                              r={isPointActive ? 4.4 : 3}
                              fill={stepColors[step]}
                              style={{
                                filter: isPointActive
                                  ? `drop-shadow(0 0 8px ${stepColors[step]})`
                                  : 'none',
                                transition: 'r 120ms ease, filter 120ms ease',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={() => {
                                if (!lockedStep) {
                                  setHoveredStep(step);
                                }
                                setHoveredPoint({
                                  step,
                                  year: point.year,
                                  score: point.score,
                                });
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                setLockedStep(step);
                                setHoveredStep(step);
                              }}
                            />
                          );
                        })}
                      </g>
                    );
                  })}

                  {hoveredPoint && (
                    <g pointerEvents="none">
                      <rect
                        x={tooltipX}
                        y={tooltipY}
                        width={tooltipWidth}
                        height={tooltipHeight}
                        rx="7"
                        fill="rgba(24,24,27,0.9)"
                        stroke="rgba(161,161,170,0.45)"
                      />
                      <text
                        x={tooltipX + tooltipPaddingX}
                        y={tooltipY + 14}
                        fill="#f4f4f5"
                        fontSize="11"
                      >
                        {hoveredScoreLabel}
                      </text>
                    </g>
                  )}
                </svg>
              )}
              <div className="mt-2 flex items-center justify-between">
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => zoomChart(0.88)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-zinc-500 text-zinc-200 hover:border-zinc-400 hover:text-white"
                    aria-label="Zoom in trend chart"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path d="M8 3.25V12.75M3.25 8H12.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomChart(1.12)}
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-zinc-500 text-zinc-200 hover:border-zinc-400 hover:text-white"
                    aria-label="Zoom out trend chart"
                  >
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path d="M3.25 8H12.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={resetTrendView}
                  className="text-[11px] uppercase tracking-[0.14em] text-red-400 hover:text-red-300 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-6 text-lg md:text-xl leading-relaxed text-zinc-300 font-light tracking-wide max-w-3xl mx-auto text-center">
              <p>
                <Link
                  to="/statistics"
                  className="themed-click-here inline-block text-amber-300 font-semibold underline underline-offset-4 transition-colors hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/70 rounded-sm"
                >
                  Click here
                </Link>{' '}
                to explore score distributions and grade boundaries for past STEP exams.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
