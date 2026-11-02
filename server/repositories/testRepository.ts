export interface MockTestItem {
  id: string;
  title: string;
  batchId: string;
  batchName: string;
  durationMinutes: number;
  totalMarks: number;
  approvalRequired: boolean;
  proctoringEnabled: boolean;
  maxFlags: number;
  questions: Array<{
    id: string;
    prompt: string;
    type: 'single_mcq' | 'multiple_mcq' | 'true_false';
    options: string[];
    correctAnswer: string;
    marks: number;
    negativeMarks: number;
  }>;
}

export const activeTestsStore: MockTestItem[] = [
  {
    id: 'test-dsa-101',
    title: 'Data Structures & Algorithms Mock Exam',
    batchId: 'b1-java-mastery',
    batchName: 'Java Full Stack & DSA Spring 2026',
    durationMinutes: 45,
    totalMarks: 40,
    approvalRequired: true,
    proctoringEnabled: true,
    maxFlags: 5,
    questions: [
      {
        id: 'q1',
        prompt: 'Which data structure follows the First-In, First-Out (FIFO) principle?',
        type: 'single_mcq',
        options: ['Stack', 'Queue', 'Binary Tree', 'Graph'],
        correctAnswer: 'Queue',
        marks: 10,
        negativeMarks: 2,
      },
      {
        id: 'q2',
        prompt: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
        type: 'single_mcq',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correctAnswer: 'O(log n)',
        marks: 10,
        negativeMarks: 2,
      },
      {
        id: 'q3',
        prompt: 'A HashMap in Java provides O(1) time complexity for get and put operations on average.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        marks: 10,
        negativeMarks: 0,
      },
      {
        id: 'q4',
        prompt: 'Which algorithm is typically used to find the shortest path in an unweighted graph?',
        type: 'single_mcq',
        options: ['Breadth-First Search (BFS)', 'Depth-First Search (DFS)', 'Prim Algorithm', 'Kruskal Algorithm'],
        correctAnswer: 'Breadth-First Search (BFS)',
        marks: 10,
        negativeMarks: 2,
      },
    ],
  },
];
