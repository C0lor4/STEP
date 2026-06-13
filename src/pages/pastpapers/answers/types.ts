export type QuestionSource = {
  id: string;
  yearTitle: string;
  stepTitle: string;
  questionNumber: number;
  title: string;
  texPath: string;
  htmlPath: string;
};

const QUESTION_SOURCE_ID_PATTERN = /^(\d{4})_(I|II|III)_Q(\d+)$/;

export const getQuestionSourceKey = (
  source: Pick<QuestionSource, 'yearTitle' | 'stepTitle' | 'questionNumber'>
) => `${source.yearTitle}::${source.stepTitle}::${source.questionNumber}`;

export const createQuestionSource = (id: string): QuestionSource => {
  const match = QUESTION_SOURCE_ID_PATTERN.exec(id);

  if (!match) {
    throw new Error(`Invalid question source id: ${id}`);
  }

  const [, year, step, questionNumberText] = match;
  const questionNumber = Number(questionNumberText);

  return {
    id,
    yearTitle: `STEP ${year}`,
    stepTitle: `STEP ${step}`,
    questionNumber,
    title: `${year} ${step} Q${questionNumber} Answer`,
    texPath: `/downloads/solutions/${id}.tex`,
    htmlPath: `/downloads/solutions/web/${id}.html`,
  };
};
