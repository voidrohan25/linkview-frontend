export interface QuestionEvaluation {
  questionId: string;
  type: 'single_mcq' | 'multiple_mcq' | 'true_false' | 'short_answer';
  studentAnswer: unknown;
  correctAnswer: unknown;
  marks: number;
  negativeMarks: number;
}

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  perQuestionBreakdown: Array<{
    questionId: string;
    isCorrect: boolean;
    awardedMarks: number;
  }>;
}

/**
 * Authoritative Server-Side Scoring Engine
 * Pure function with zero browser dependencies to prevent tampering.
 */
export function calculateAttemptScore(evaluations: QuestionEvaluation[]): ScoreResult {
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const perQuestionBreakdown = evaluations.map((item) => {
    maxScore += Number(item.marks || 1);
    const ans = item.studentAnswer;

    // Check if unanswered
    if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
      unansweredCount++;
      return {
        questionId: item.questionId,
        isCorrect: false,
        awardedMarks: 0,
      };
    }

    let isCorrect = false;

    if (item.type === 'single_mcq' || item.type === 'true_false' || item.type === 'short_answer') {
      const studentStr = String(ans).trim().toLowerCase();
      const correctStr = String(item.correctAnswer).trim().toLowerCase();
      isCorrect = studentStr === correctStr;
    } else if (item.type === 'multiple_mcq') {
      if (Array.isArray(ans) && Array.isArray(item.correctAnswer)) {
        const sortedStudent = [...ans].map(String).sort();
        const sortedCorrect = [...item.correctAnswer].map(String).sort();
        isCorrect =
          sortedStudent.length === sortedCorrect.length &&
          sortedStudent.every((val, idx) => val === sortedCorrect[idx]);
      }
    }

    let awardedMarks = 0;
    if (isCorrect) {
      awardedMarks = Number(item.marks || 1);
      correctCount++;
    } else {
      awardedMarks = -Math.abs(Number(item.negativeMarks || 0));
      incorrectCount++;
    }

    totalScore += awardedMarks;

    return {
      questionId: item.questionId,
      isCorrect,
      awardedMarks,
    };
  });

  return {
    totalScore: Math.max(0, Math.round(totalScore * 100) / 100),
    maxScore: Math.round(maxScore * 100) / 100,
    correctCount,
    incorrectCount,
    unansweredCount,
    perQuestionBreakdown,
  };
}
