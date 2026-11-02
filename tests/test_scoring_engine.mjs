import { calculateAttemptScore } from '../server/scoring/engine.ts';

console.log('🧪 Testing Authoritative Server-Side Scoring Engine...');

// Test 1: All correct
const allCorrect = [
  { questionId: 'q1', type: 'single_mcq', studentAnswer: 'Queue', correctAnswer: 'Queue', marks: 10, negativeMarks: 2 },
  { questionId: 'q2', type: 'true_false', studentAnswer: 'True', correctAnswer: 'True', marks: 10, negativeMarks: 0 },
];
const res1 = calculateAttemptScore(allCorrect);
console.log('Test 1 (All Correct): Score =', res1.totalScore, '/', res1.maxScore);
if (res1.totalScore !== 20 || res1.correctCount !== 2) throw new Error('Test 1 Failed');

// Test 2: One correct, one incorrect with negative marking
const mixed = [
  { questionId: 'q1', type: 'single_mcq', studentAnswer: 'Queue', correctAnswer: 'Queue', marks: 10, negativeMarks: 2 },
  { questionId: 'q2', type: 'single_mcq', studentAnswer: 'Stack', correctAnswer: 'Queue', marks: 10, negativeMarks: 2 },
];
const res2 = calculateAttemptScore(mixed);
console.log('Test 2 (Mixed with Negative Marks): Score =', res2.totalScore, '/', res2.maxScore);
if (res2.totalScore !== 8 || res2.correctCount !== 1 || res2.incorrectCount !== 1) throw new Error('Test 2 Failed');

// Test 3: Unanswered question does not incur negative marks
const withUnanswered = [
  { questionId: 'q1', type: 'single_mcq', studentAnswer: null, correctAnswer: 'Queue', marks: 10, negativeMarks: 2 },
  { questionId: 'q2', type: 'single_mcq', studentAnswer: 'Queue', correctAnswer: 'Queue', marks: 10, negativeMarks: 2 },
];
const res3 = calculateAttemptScore(withUnanswered);
console.log('Test 3 (With Unanswered): Score =', res3.totalScore, '/', res3.maxScore);
if (res3.totalScore !== 10 || res3.unansweredCount !== 1) throw new Error('Test 3 Failed');

console.log('✅ Scoring Engine Tests Passed 100%!');
