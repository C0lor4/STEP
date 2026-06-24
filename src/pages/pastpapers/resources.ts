import { createQuestionSource, type QuestionSource } from './answers/types';

const questionSourceIds = [
  '2005_II_Q1',
  '2005_II_Q2',
  '2010_II_Q2',
  '2010_II_Q10',
  '2010_III_Q12',
  '2010_III_Q13',
  '2014_II_Q12',
  '2014_II_Q13',
  '2014_III_Q12',
  '2015_II_Q13',
  '2015_II_Q12',
  '2015_II_Q1',
  '2015_III_Q12',
  '2016_I_Q1',
  '2016_III_Q3',
  '2017_II_Q1',
  '2017_II_Q4',
  '2017_III_Q1',
  '2017_III_Q11',
  '2017_III_Q12',
  '2017_III_Q13',
  '2018_III_Q2',
  '2025_II_Q1',
  '2025_II_Q4',
  '2025_II_Q8',
  '2025_III_Q1',
] as const;

const questionSources: QuestionSource[] = questionSourceIds.map((id) =>
  createQuestionSource(id)
);

const stepFolderByTitle: Record<string, string> = {
  'STEP I': 'stepI',
  'STEP II': 'stepII',
  'STEP III': 'stepIII',
};

export const buildProblemPdfPath = (year: string, step: 'I' | 'II' | 'III') =>
  `/downloads/problems/${year} STEP ${step}.pdf`;

export const hasProblemImages = (yearTitle: string, stepTitle: string) => {
  const year = Number(yearTitle.replace('STEP ', ''));

  if (!Number.isFinite(year)) {
    return false;
  }

  if (stepTitle === 'STEP I') {
    return year <= 2019;
  }

  return stepTitle === 'STEP II' || stepTitle === 'STEP III';
};

export const buildProblemImagePath = (
  yearTitle: string,
  stepTitle: string,
  questionNumber: number
) => {
  const year = yearTitle.replace('STEP ', '');
  const stepFolder = stepFolderByTitle[stepTitle];

  if (!stepFolder) {
    return null;
  }

  return `/downloads/Split/${year}/${stepFolder}/Q${String(questionNumber).padStart(2, '0')}.png`;
};

export const findQuestionSource = (payload: {
  yearTitle: string;
  stepTitle: string;
  questionNumber: number;
}) =>
  questionSources.find(
    (source) =>
      source.yearTitle === payload.yearTitle &&
      source.stepTitle === payload.stepTitle &&
      source.questionNumber === payload.questionNumber
  ) ?? null;

export const hasAnyAnswerSource = (payload: {
  yearTitle: string;
  stepTitle: string;
}) =>
  questionSources.some(
    (source) =>
      source.yearTitle === payload.yearTitle &&
      source.stepTitle === payload.stepTitle
  );
