export type CompetitionStep = 'I' | 'II' | 'III';

export type ScoreBin = {
  start: number;
  end: number;
  probability: number;
};

export type GradeKey = 'S' | '1' | '2' | '3';

export type GradeCutoffs = Partial<Record<GradeKey, number>>;

export type ScoreDistributionData = {
  bins: ScoreBin[];
  gradeCutoffs: GradeCutoffs | null;
};

type RawScoreRow = {
  score: number;
  height?: number;
  probability: number;
};

const toScoreBins = (data: RawScoreRow[]): ScoreBin[] =>
  data.map((item) => ({
    start: item.score,
    end: item.score + 1,
    probability: item.probability,
  }));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRawScoreRow = (value: unknown): value is RawScoreRow => {
  if (!isObject(value)) {
    return false;
  }

  return typeof value.score === 'number' && typeof value.probability === 'number';
};

const readGradeCutoffs = (value: unknown): GradeCutoffs | null => {
  if (!isObject(value)) {
    return null;
  }

  const keys: GradeKey[] = ['S', '1', '2', '3'];
  const parsed = keys.reduce<GradeCutoffs>((result, key) => {
    const entry = value[key];
    if (typeof entry === 'number') {
      result[key] = entry;
    }
    return result;
  }, {});

  return Object.keys(parsed).length > 0 ? parsed : null;
};

export async function loadScoreDistribution(
  year: number,
  step: CompetitionStep
): Promise<ScoreDistributionData | null> {
  const url = `/downloads/stats/${year}_${step}.json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      return null;
    }

    const gradeCutoffs = readGradeCutoffs(data[0]);
    const scoreRows = data.filter(isRawScoreRow);

    return {
      bins: toScoreBins(scoreRows),
      gradeCutoffs,
    };
  } catch {
    return null;
  }
}


/* ------------------------------------------------------------------ *
 * 趋势图用的 grade cutoffs
 *
 * 旧做法：26 年 x 3 卷 = 78 个 fetch 在首页挂载时并发发出，而每个 JSON
 * 里只用到 gradeCutoffs 一个字段，bins 全部丢弃。
 * 新做法：优先读一个合并好的索引文件（几 KB，一次请求）；
 *        索引不存在时自动回退到旧的逐个拉取，保证不会白屏。
 *
 * 索引文件用 scripts/build-cutoffs.mjs 生成，格式：
 *   { "2025": { "II": { "S": 85, "1": 70 }, "III": { ... } }, ... }
 * ------------------------------------------------------------------ */

export type GradeCutoffRecord = {
  year: number;
  step: CompetitionStep;
  gradeCutoffs: GradeCutoffs | null;
};

const CUTOFF_INDEX_URL = '/downloads/stats/cutoffs.json';

const parseCutoffIndex = (raw: unknown): GradeCutoffRecord[] | null => {
  if (!isObject(raw)) {
    return null;
  }

  const records: GradeCutoffRecord[] = [];

  for (const [yearKey, byStep] of Object.entries(raw)) {
    const year = Number(yearKey);
    if (!Number.isFinite(year) || !isObject(byStep)) {
      continue;
    }

    for (const step of ['I', 'II', 'III'] as const) {
      if (step in byStep) {
        records.push({ year, step, gradeCutoffs: readGradeCutoffs(byStep[step]) });
      }
    }
  }

  return records.length > 0 ? records : null;
};

export async function loadGradeCutoffs(
  years: readonly number[],
  steps: readonly CompetitionStep[]
): Promise<GradeCutoffRecord[]> {
  try {
    const response = await fetch(CUTOFF_INDEX_URL);
    if (response.ok) {
      const parsed = parseCutoffIndex((await response.json()) as unknown);
      if (parsed) {
        return parsed;
      }
    }
  } catch {
    // 索引缺失或损坏 -> 走下面的回退
  }

  return Promise.all(
    years.flatMap((year) =>
      steps.map(async (step) => ({
        year,
        step,
        gradeCutoffs: (await loadScoreDistribution(year, step))?.gradeCutoffs ?? null,
      }))
    )
  );
}

export type ScoreDistributions = Record<
  number,
  Partial<Record<CompetitionStep, ScoreDistributionData>>
>;
