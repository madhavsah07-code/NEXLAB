// packages/backend/src/modules/quizzes/quiz.model.ts

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion {
  _id?: Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number;
}

export interface IQuiz extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId | null;
  lessonId: string;
  title: string;
  description?: string;
  questions: IQuestion[];
  passingScore: number;
  timeLimit?: number;
  maxAttempts?: number;
  isPublished: boolean;
  order?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  answers: number[];
  score: number;
  passed: boolean;
  startedAt: Date;
  completedAt: Date;
  timeSpent: number;
  attemptNumber: number;
}

const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  options: { 
    type: [String], 
    required: true, 
    validate: [(arr: string[]) => arr.length >= 2, 'At least 2 options required'] 
  },
  correctAnswer: { type: Number, required: true },
  explanation: { type: String },
  points: { type: Number, default: 1 },
});

const QuizSchema = new Schema<IQuiz>(
  {
    courseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Course', 
      required: false,
      index: true 
    },
    lessonId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: { type: [QuestionSchema], required: true },
    passingScore: { type: Number, required: true, default: 60, min: 0, max: 100 },
    timeLimit: { type: Number, default: null },
    maxAttempts: { type: Number, default: 1, min: 1 },
    isPublished: { type: Boolean, default: true }, // ✅ CHANGED: default to true
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: { type: [Number], default: [] },
    score: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    timeSpent: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Compound index for unique attempts
QuizAttemptSchema.index({ quizId: 1, userId: 1, attemptNumber: 1 }, { unique: true });

// Index for tracking attempts
QuizAttemptSchema.index({ quizId: 1, userId: 1 });

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);