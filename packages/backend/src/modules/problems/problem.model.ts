// packages/backend/src/modules/problems/problem.model.ts

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface IProblem extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  testCases: ITestCase[];
  starterCode: {
    javascript: string;
    python: string;
    java: string;
  }; // ✅ Changed to object with language-specific code
  solutionCode: string;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  isPublished: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProblemSubmission extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId;
  userId: Types.ObjectId;
  language: string;
  code: string;
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  submittedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false },
});

const ExampleSchema = new Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String },
});

// ✅ Updated ProblemSchema with language-specific starter code
const ProblemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, sparse: true },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'], 
      required: true 
    },
    description: { type: String, required: true },
    examples: [ExampleSchema],
    constraints: { type: [String], default: [] },
    testCases: [TestCaseSchema],
    starterCode: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      java: { type: String, default: '' },
    },
    solutionCode: { type: String, default: '' },
    hints: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    timeLimit: { type: Number, default: 2000 },
    memoryLimit: { type: Number, default: 256 },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-generate slug from title
ProblemSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

ProblemSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.title && !update.slug) {
    update.slug = update.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const ProblemSubmissionSchema = new Schema<IProblemSubmission>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compile_error'],
      default: 'pending'
    },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    runtime: { type: Number, default: 0 },
    memory: { type: Number, default: 0 },
    errorMessage: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);
export const ProblemSubmission = mongoose.model<IProblemSubmission>('ProblemSubmission', ProblemSubmissionSchema);