// packages/shared/src/problem.types.ts

export type Difficulty = 'easy' | 'medium' | 'hard';
export type SubmissionStatus = 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface IExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface IProblem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  description: string;
  examples: IExample[];
  constraints: string[];
  testCases: ITestCase[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
  };
  solutionCode: string;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IProblemSubmission {
  _id: string;
  problemId: string | IProblem;
  userId: string;
  language: string;
  code: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  submittedAt: string;
  createdAt: string;
}

export interface ITestResult {
  input: string;
  expected: string;
  got: string;
  passed: boolean;
  isHidden: boolean;
  runtime: number;
  memory: number;
  error: string | null;
}

export interface ISubmissionResult {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  testResults?: ITestResult[];
  isSubmission?: boolean;
  submission?: {
    id: string;
    status: SubmissionStatus;
    passedTests: number;
    totalTests: number;
    runtime: number;
    memory: number;
    errorMessage: string;
    createdAt: string;
  };
}

export interface IProblemFormData {
  title: string;
  difficulty: Difficulty;
  description: string;
  examples: IExample[];
  constraints: string[];
  testCases: ITestCase[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
  };
  solutionCode: string;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
}

export interface IProblemListData {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  acceptanceRate?: number;
  totalSubmissions?: number;
  isSolved?: boolean;
  createdAt: string;
  isPublished: boolean;
}