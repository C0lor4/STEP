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

export type ScoreDistributions = Record<
  number,
  Partial<Record<CompetitionStep, ScoreDistributionData>>
>;
