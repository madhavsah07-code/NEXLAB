// packages/frontend/src/components/QuizModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, Award, Zap, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

interface Question {
  _id: string;
  question: string;
  options: string[];
}

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
  timeLimit?: number;
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  attemptNumber: number;
  remainingAttempts: number;
}

interface QuizAttempt {
  _id: string;
  startedAt: string;
}

interface QuizModalProps {
  quizId: string;
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (score: number, passed: boolean) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quizId,
  lessonId,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    feedback: any[];
    xpEarned: number;
    remainingAttempts: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuiz();
    }
  }, [isOpen, quizId]);

  useEffect(() => {
    if (quiz?.timeLimit && attempt?.startedAt) {
      const startTime = new Date(attempt.startedAt).getTime();
      const limitMs = quiz.timeLimit * 60 * 1000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.floor((limitMs - elapsed) / 1000));
      setTimeLeft(remaining);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            if (prev === 1) handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, attempt]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/quizzes/attempt/${quizId}`);
      const data = response.data.data;
      setQuiz(data.quiz);
      setAttempt(data.attempt);
      
      // Initialize answers
      const initialAnswers: Record<number, number> = {};
      data.quiz.questions.forEach((_: any, index: number) => {
        initialAnswers[index] = -1;
      });
      setAnswers(initialAnswers);
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to load quiz');
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const allAnswered = Object.values(answers).every((ans) => ans !== -1);
    if (!allAnswered) {
      const confirmSubmit = confirm(
        `You have ${Object.values(answers).filter(a => a === -1).length} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/quizzes/${quizId}/submit`, {
        answers: Object.values(answers),
      });
      
      const data = response.data.data;
      setResult(data);
      setShowResults(true);
      
      if (data.passed) {
        toast.success(`🎉 Congratulations! You passed with ${data.score}%! +${data.xpEarned} XP`);
      } else {
        toast(`📝 You scored ${data.score}%. Keep learning and try again!`);
      }
      
      onComplete?.(data.score, data.passed);
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent mx-auto" />
          <p className="text-[#9CA3A0] mt-4">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (showResults && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm p-4">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#EDEFEE]">Quiz Results</h2>
            <button onClick={onClose} className="text-[#5C6360] hover:text-[#EDEFEE]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Score Display */}
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold ${result.passed ? 'text-[#10B981]' : 'text-[#F87171]'}`}>
              {result.score}%
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {result.passed ? (
                <>
                  <CheckCircle className="w-6 h-6 text-[#10B981]" />
                  <span className="text-lg font-medium text-[#10B981]">Passed! 🎉</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-[#F87171]" />
                  <span className="text-lg font-medium text-[#F87171]">Keep Learning! 📚</span>
                </>
              )}
            </div>
            {result.xpEarned > 0 && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg">
                <Zap className="w-4 h-4 text-[#10B981]" />
                <span className="text-sm font-medium text-[#10B981]">+{result.xpEarned} XP Earned</span>
              </div>
            )}
            {result.remainingAttempts > 0 && !result.passed && (
              <p className="text-sm text-[#5C6360] mt-2">
                You have {result.remainingAttempts} attempt{result.remainingAttempts > 1 ? 's' : ''} remaining
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="space-y-4">
            {result.feedback.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  item.isCorrect
                    ? 'border-[#10B981]/30 bg-[#10B981]/5'
                    : 'border-[#F87171]/30 bg-[#F87171]/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#F87171]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#EDEFEE]">{item.question}</p>
                    <div className="mt-1 space-y-1 text-xs">
                      <p className="text-[#9CA3A0]">
                        Your answer: <span className={item.isCorrect ? 'text-[#10B981]' : 'text-[#F87171]'}>
                          {item.userAnswer}
                        </span>
                      </p>
                      {!item.isCorrect && (
                        <p className="text-[#10B981]">
                          Correct answer: {item.correctAnswer}
                        </p>
                      )}
                      {item.explanation && (
                        <p className="text-[#5C6360] mt-1">{item.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button variant="primary" onClick={onClose} className="w-full mt-6">
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestionData = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.values(answers).filter((ans) => ans !== -1).length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const isFirstQuestion = currentQuestion === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm p-4">
      <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#2A302E]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#EDEFEE]">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-sm text-[#9CA3A0] mt-1">{quiz.description}</p>
              )}
            </div>
            <button onClick={onClose} className="text-[#5C6360] hover:text-[#EDEFEE]">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Info */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#5C6360]">
            <span>Question {currentQuestion + 1} of {totalQuestions}</span>
            <span>•</span>
            <span>{answeredCount} of {totalQuestions} answered</span>
            <span>•</span>
            <span className="text-[#FBBF24]">Pass: {quiz.passingScore}%</span>
            <span>•</span>
            <span>Attempt {quiz.attemptNumber} of {quiz.maxAttempts}</span>
            {timeLeft !== null && (
              <>
                <span>•</span>
                <span className={`flex items-center gap-1 ${timeLeft < 60 ? 'text-[#F87171]' : ''}`}>
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </span>
              </>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full h-1 bg-[#0D0F0F] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#10B981] rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-[#5C6360]">
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
            </div>
            <p className="text-lg font-medium text-[#EDEFEE]">
              {currentQuestionData.question}
            </p>
          </div>

          <div className="space-y-3">
            {currentQuestionData.options.map((option, optionIndex) => {
              const isSelected = answers[currentQuestion] === optionIndex;
              return (
                <button
                  key={optionIndex}
                  onClick={() => handleAnswer(currentQuestion, optionIndex)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                    isSelected
                      ? 'border-[#10B981] bg-[#10B981]/10 text-[#EDEFEE]'
                      : 'border-[#2A302E] hover:border-[#10B981]/30 text-[#9CA3A0] hover:text-[#EDEFEE]'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    isSelected
                      ? 'border-[#10B981] bg-[#10B981] text-white'
                      : 'border-[#2A302E] text-[#5C6360]'
                  }`}>
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="text-sm">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2A302E] flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            {!isLastQuestion && (
              <Button
                variant="secondary"
                onClick={handleNext}
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
            size="sm"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;