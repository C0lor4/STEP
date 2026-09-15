import { createQuestionSource, getQuestionSourceKey, type QuestionSource } from './answers/types';

const questionSourceIds = [
  '2005_I_Q1',
  '2005_II_Q1',
  '2005_II_Q2',
  '2007_I_Q1',
  '2007_II_Q1',
  '2007_II_Q12',
  '2007_II_Q13',
  '2007_II_Q14',
  '2007_III_Q1',
  '2008_II_Q12',
  '2008_II_Q13',
  '2008_III_Q1',
  '2009_I_Q1',
  '2009_I_Q2',
  '2009_I_Q5',
  '2009_I_Q6',
  '2009_II_Q3',
  '2009_II_Q5',
  '2009_II_Q6',
  '2009_II_Q7',
  '2009_II_Q12',
  '2009_II_Q13',
  '2009_III_Q1',
  '2009_III_Q4',
  '2009_III_Q6',
  '2010_I_Q1',
  '2010_I_Q2',
  '2010_I_Q3',
  '2010_I_Q4',
  '2010_I_Q5',
  '2010_I_Q6',
  '2010_I_Q8',
  '2010_I_Q12',
  '2010_I_Q13',
  '2010_II_Q1',
  '2010_II_Q2',
  '2010_II_Q3',
  '2010_II_Q7',
  '2010_II_Q8',
  '2010_II_Q10',
  '2010_II_Q12',
  '2010_II_Q13',
  '2010_III_Q1',
  '2010_III_Q2',
  '2010_III_Q12',
  '2010_III_Q13',
  '2011_I_Q2',
  '2011_I_Q3',
  '2012_I_Q2',
  '2012_I_Q3',
  '2012_I_Q5',
  '2012_I_Q8',
  '2012_II_Q1',
  '2012_II_Q4',
  '2012_II_Q6',
  '2012_II_Q8',
  '2012_III_Q1',
  '2012_III_Q4',
  '2013_I_Q1',
  '2013_I_Q3',
  '2013_I_Q4',
  '2013_I_Q7',
  '2013_II_Q2',
  '2014_I_Q2',
  '2014_I_Q3',
  '2014_I_Q6',
  '2014_I_Q8',
  '2014_II_Q6',
  '2014_II_Q12',
  '2014_II_Q13',
  '2014_III_Q1',
  '2014_III_Q3',
  '2014_III_Q6',
  '2014_III_Q12',
  '2015_I_Q1',
  '2015_I_Q5',
  '2015_II_Q1',
  '2015_II_Q12',
  '2015_II_Q13',
  '2015_III_Q1',
  '2015_III_Q12',
  '2016_I_Q1',
  '2016_III_Q3',
  '2017_I_Q1',
  '2017_I_Q8',
  '2017_II_Q1',
  '2017_II_Q4',
  '2017_III_Q1',
  '2017_III_Q11',
  '2017_III_Q12',
  '2017_III_Q13',
  '2018_III_Q2',
  '2020_II_Q1',
  '2020_II_Q8',
  '2020_II_Q11',
  '2020_II_Q12',
  '2020_III_Q1',
  '2021_II_Q1',
  '2021_II_Q11',
  '2021_II_Q12',
  '2021_III_Q1',
  '2022_I_Q6',
  '2022_II_Q1',
  '2022_II_Q2',
  '2022_II_Q3',
  '2022_II_Q4',
  '2022_II_Q5',
  '2022_II_Q6',
  '2022_III_Q1',
  '2024_II_Q1',
  '2024_III_Q1',
  '2024_III_Q2',
  '2024_III_Q3',
  '2025_I_Q1',
  '2025_II_Q1',
  '2025_II_Q4',
  '2025_II_Q8',
  '2025_III_Q1',
  '2025_III_Q8'
] as const;

const questionSources: QuestionSource[] = questionSourceIds.map((id) =>
  createQuestionSource(id)
);

/* ------------------------------------------------------------------ *
 * 年份 / 卷别规则集中在这里，不要再散到页面组件里
 * ------------------------------------------------------------------ */

export type StepCode = 'I' | 'II' | 'III';

/** STEP I 在这一年之后停考 */
const LAST_STEP_I_YEAR = 2019;

/** 最新一届有资料的年份（以后新增年份只改这两个常量） */
export const LATEST_PAPER_YEAR = 2025;

/** 收录的年份跨度 */
export const PAPER_YEAR_COUNT = 26;

/** 'STEP 2017' -> 2017；解析不出来返回 null */
export const parseYearTitle = (yearTitle: string): number | null => {
  const year = Number(yearTitle.replace('STEP ', ''));
  return Number.isFinite(year) ? year : null;
};

/** 'STEP II' -> 'II'；不是合法卷别返回 null */
export const parseStepTitle = (stepTitle: string): StepCode | null => {
  const code = stepTitle.replace('STEP ', '');
  return code === 'I' || code === 'II' || code === 'III' ? code : null;
};

/** 该年该卷是否存在（STEP I 在 2019 后停考） */
export const stepExistsInYear = (year: number, step: StepCode) =>
  step !== 'I' || year <= LAST_STEP_I_YEAR;

/** 该年每卷有多少道题 */
export const getQuestionCountForYear = (yearTitle: string): number => {
  const year = parseYearTitle(yearTitle);

  if (year === null) {
    return 12;
  }

  if (year >= 2000 && year <= 2007) {
    return 14;
  }

  if (year >= 2008 && year <= 2018) {
    return 13;
  }

  return 12;
};

const stepFolderByCode: Record<StepCode, string> = {
  I: 'stepI',
  II: 'stepII',
  III: 'stepIII',
};

export const buildProblemPdfPath = (year: string, step: StepCode) =>
  `/downloads/problems/${year} STEP ${step}.pdf`;

export const hasProblemImages = (yearTitle: string, stepTitle: string) => {
  const year = parseYearTitle(yearTitle);
  const step = parseStepTitle(stepTitle);

  if (year === null || step === null) {
    return false;
  }

  return stepExistsInYear(year, step);
};

export const buildProblemImagePath = (
  yearTitle: string,
  stepTitle: string,
  questionNumber: number
) => {
  const year = parseYearTitle(yearTitle);
  const step = parseStepTitle(stepTitle);

  if (year === null || step === null) {
    return null;
  }

  return `/downloads/Split/${year}/${stepFolderByCode[step]}/Q${String(questionNumber).padStart(2, '0')}.png`;
};

/* ------------------------------------------------------------------ *
 * 查找：改成 Map / Set，避免每个题号按钮都线性扫描 78 条记录
 * ------------------------------------------------------------------ */

const questionSourceByKey = new Map<string, QuestionSource>(
  questionSources.map((source) => [getQuestionSourceKey(source), source])
);

/** 有答案的 (年份 + 卷别) 组合，用于判断 Answers 按钮是否可点 */
const paperKeysWithAnswers = new Set<string>(
  questionSources.map((source) => `${source.yearTitle}::${source.stepTitle}`)
);

export const findQuestionSource = (payload: {
  yearTitle: string;
  stepTitle: string;
  questionNumber: number;
}): QuestionSource | null => questionSourceByKey.get(getQuestionSourceKey(payload)) ?? null;

export const hasAnyAnswerSource = (payload: {
  yearTitle: string;
  stepTitle: string;
}) => paperKeysWithAnswers.has(`${payload.yearTitle}::${payload.stepTitle}`);
