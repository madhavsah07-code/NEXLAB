// packages/frontend/src/components/QuizModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  X, Clock, CheckCircle, XCircle, Award, Zap, AlertCircle, 
  ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw,
  FileText, BarChart3, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
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

interface FeedbackItem {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  points?: number;
}

interface QuizResult {
  score: number;
  passed: boolean;
  feedback: FeedbackItem[];
  xpEarned: number;
  remainingAttempts: number;
  attemptId?: string;
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
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);
  
  // ✅ New: Track if quiz is already completed
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedResult, setCompletedResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuiz();
    }
  }, [isOpen, quizId]);

  useEffect(() => {
    if (quiz?.timeLimit && attempt?.startedAt && !isCompleted) {
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
  }, [quiz, attempt, isCompleted]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      // ✅ First, check if the quiz is already completed
      const attemptsResponse = await api.get('/quizzes/attempts', {
        params: { quizId }
      });
      
      const attempts = attemptsResponse.data.data || [];
      const completedAttempt = attempts.find((a: any) => a.completedAt && a.quizId === quizId);
      
      if (completedAttempt) {
        // ✅ Quiz is already completed - show results
        console.log('✅ Quiz already completed, showing results');
        setIsCompleted(true);
        
        // Fetch the quiz details to show in review mode
        const quizResponse = await api.get(`/quizzes/public/${quizId}`);
        setQuiz(quizResponse.data.data);
        
        // Fetch the attempt details to get the result
        const resultResponse = await api.get(`/quizzes/attempt/${quizId}`);
        const data = resultResponse.data.data;
        
        // Construct result from attempt data
        const feedback = quizResponse.data.data.questions.map((q: any, index: number) => {
          const userAnswerIndex = completedAttempt.answers?.[index] ?? -1;
          const isCorrect = userAnswerIndex === q.correctAnswer;
          return {
            question: q.question,
            userAnswer: userAnswerIndex === -1 ? 'Not answered' : q.options[userAnswerIndex] || 'Invalid',
            correctAnswer: q.options[q.correctAnswer],
            isCorrect,
            explanation: q.explanation,
          };
        });
        
        setCompletedResult({
          score: completedAttempt.score || 0,
          passed: completedAttempt.passed || false,
          feedback,
          xpEarned: 0,
          remainingAttempts: 0,
        });
        setShowResults(true);
        setLoading(false);
        return;
      }
      
      // ✅ Quiz not completed - start normally
      console.log('✅ Quiz not completed, starting fresh');
      const response = await api.get(`/quizzes/attempt/${quizId}`);
      const data = response.data.data;
      setQuiz(data.quiz);
      setAttempt(data.attempt);
      setIsCompleted(false);
      
      // Initialize answers
      const initialAnswers: Record<number, number> = {};
      data.quiz.questions.forEach((_: any, index: number) => {
        initialAnswers[index] = -1;
      });
      setAnswers(initialAnswers);
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      
      // ✅ If the error is "already passed", try to fetch the result
      if (error.response?.data?.message?.includes('already passed') || 
          error.response?.data?.message?.includes('already completed')) {
        console.log('✅ Quiz already completed (caught from error), showing results');
        setIsCompleted(true);
        
        try {
          // Fetch quiz details
          const quizResponse = await api.get(`/quizzes/public/${quizId}`);
          setQuiz(quizResponse.data.data);
          
          // Fetch attempts to get the result
          const attemptsResponse = await api.get('/quizzes/attempts', {
            params: { quizId }
          });
          
          const attempts = attemptsResponse.data.data || [];
          const completedAttempt = attempts.find((a: any) => a.completedAt);
          
          if (completedAttempt) {
            const feedback = quizResponse.data.data.questions.map((q: any, index: number) => {
              const userAnswerIndex = completedAttempt.answers?.[index] ?? -1;
              const isCorrect = userAnswerIndex === q.correctAnswer;
              return {
                question: q.question,
                userAnswer: userAnswerIndex === -1 ? 'Not answered' : q.options[userAnswerIndex] || 'Invalid',
                correctAnswer: q.options[q.correctAnswer],
                isCorrect,
                explanation: q.explanation,
              };
            });
            
            setCompletedResult({
              score: completedAttempt.score || 0,
              passed: completedAttempt.passed || false,
              feedback,
              xpEarned: 0,
              remainingAttempts: 0,
            });
            setShowResults(true);
          }
        } catch (error2) {
          console.error('Error fetching completed quiz:', error2);
          toast.error('Failed to load quiz results');
          onClose();
        }
        setLoading(false);
        return;
      }
      
      toast.error(error.response?.data?.message || 'Failed to load quiz');
      onClose();
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const allAnswered = Object.values(answers).every((ans) => ans !== -1);
    if (!allAnswered) {
      const unansweredCount = Object.values(answers).filter(a => a === -1).length;
      const confirmSubmit = confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
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
        toast.error(`📝 You scored ${data.score}%. Keep learning and try again!`);
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
    if (isReviewMode) {
      if (reviewQuestionIndex < (quiz?.questions.length || 0) - 1) {
        setReviewQuestionIndex(reviewQuestionIndex + 1);
      }
    } else {
      if (currentQuestion < (quiz?.questions.length || 0) - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (isReviewMode) {
      if (reviewQuestionIndex > 0) {
        setReviewQuestionIndex(reviewQuestionIndex - 1);
      }
    } else {
      if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1);
      }
    }
  };

  const toggleExplanation = (index: number) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleStartReview = () => {
    setIsReviewMode(true);
    setReviewQuestionIndex(0);
  };

  const handleExitReview = () => {
    setIsReviewMode(false);
    setReviewQuestionIndex(0);
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

  // ✅ Show results with review option (using either result or completedResult)
  if (showResults && (result || completedResult)) {
    const displayResult = result || completedResult;
    if (!displayResult) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0F0F]/80 backdrop-blur-sm p-4">
        <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#2A302E] flex-shrink-0">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-xl font-bold text-[#EDEFEE]">
                {isCompleted ? 'Quiz Results (Completed)' : 'Quiz Results'}
              </h2>
            </div>
            <button onClick={onClose} className="text-[#5C6360] hover:text-[#EDEFEE]">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Score Display */}
          <div className="p-6 border-b border-[#2A302E] flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${displayResult.passed ? 'text-[#10B981]' : 'text-[#F87171]'}`}>
                  {displayResult.score}%
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {displayResult.passed ? (
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
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {displayResult.xpEarned > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg">
                    <Zap className="w-5 h-5 text-[#10B981]" />
                    <span className="text-sm font-medium text-[#10B981]">+{displayResult.xpEarned} XP</span>
                  </div>
                )}
                <div className="text-sm text-[#5C6360]">
                  <span className="font-medium text-[#EDEFEE]">
                    {displayResult.feedback.filter(f => f.isCorrect).length}
                  </span> / {displayResult.feedback.length} correct
                </div>
                {!displayResult.passed && displayResult.remainingAttempts > 0 && (
                  <div className="text-sm text-[#5C6360]">
                    Attempts left: <span className="font-medium text-[#FBBF24]">{displayResult.remainingAttempts}</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="text-sm text-[#5C6360]">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Completed
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Review Mode vs Summary */}
          {isReviewMode && quiz ? (
            // Review Mode - Show questions with answers
            <div className="flex-1 overflow-y-auto p-6">
              {quiz.questions.length > 0 && reviewQuestionIndex < quiz.questions.length && (
                <div className="space-y-4">
                  {/* Question Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePrevious}
                        disabled={reviewQuestionIndex === 0}
                        className="p-2 text-[#5C6360] hover:text-[#EDEFEE] disabled:opacity-50 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium text-[#9CA3A0]">
                        Question {reviewQuestionIndex + 1} of {quiz.questions.length}
                      </span>
                      <button
                        onClick={handleNext}
                        disabled={reviewQuestionIndex === quiz.questions.length - 1}
                        className="p-2 text-[#5C6360] hover:text-[#EDEFEE] disabled:opacity-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleExitReview}
                      className="text-sm text-[#10B981] hover:text-[#34D399] transition-colors"
                    >
                      <EyeOff className="w-4 h-4 inline mr-1" />
                      Exit Review
                    </button>
                  </div>

                  {/* Question */}
                  <div className="bg-[#0D0F0F] rounded-xl p-6 border border-[#2A302E]">
                    <div className="mb-4">
                      <span className="text-xs font-medium text-[#5C6360]">
                        Question {reviewQuestionIndex + 1} of {quiz.questions.length}
                      </span>
                      <p className="text-lg font-medium text-[#EDEFEE] mt-1">
                        {quiz.questions[reviewQuestionIndex].question}
                      </p>
                    </div>

                    {(() => {
                      const feedback = displayResult.feedback[reviewQuestionIndex];

                      return (
                        <>
                    <div className="space-y-2">
                      {quiz.questions[reviewQuestionIndex].options.map((option, optionIndex) => {
                        const isSelected = feedback?.userAnswer === option;
                        const isCorrect = feedback?.isCorrect;
                        const isCorrectAnswer = feedback?.correctAnswer === option;

                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 ${
                              isSelected && isCorrect
                                ? 'border-[#10B981] bg-[#10B981]/10'
                                : isSelected && !isCorrect
                                ? 'border-[#F87171] bg-[#F87171]/10'
                                : isCorrectAnswer && !isSelected
                                ? 'border-[#10B981]/50 bg-[#10B981]/5'
                                : 'border-[#2A302E]'
                            }`}
                          >
                            <span className={`text-sm ${
                              isSelected && isCorrect ? 'text-[#10B981]' :
                              isSelected && !isCorrect ? 'text-[#F87171]' :
                              isCorrectAnswer ? 'text-[#10B981]' :
                              'text-[#5C6360]'
                            }`}>
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            <span className="text-sm text-[#EDEFEE]">{option}</span>
                            {isCorrectAnswer && !isSelected && (
                              <CheckCircle className="w-4 h-4 text-[#10B981] ml-auto" />
                            )}
                            {isSelected && isCorrect && (
                              <CheckCircle className="w-4 h-4 text-[#10B981] ml-auto" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-[#F87171] ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {feedback?.explanation && (
                      <div className="mt-4 p-4 bg-[#161A19] rounded-lg border border-[#2A302E]">
                        <button
                          onClick={() => toggleExplanation(reviewQuestionIndex)}
                          className="flex items-center gap-2 text-sm font-medium text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                        >
                          {expandedExplanations[reviewQuestionIndex] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <span>Explanation</span>
                          <span className="text-xs text-[#5C6360]">
                            {feedback.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                          </span>
                        </button>
                        {expandedExplanations[reviewQuestionIndex] && (
                          <p className="mt-2 text-sm text-[#9CA3A0] leading-relaxed">
                            {feedback.explanation}
                          </p>
                        )}
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Summary View - Show all results
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {displayResult.feedback.map((item, index) => (
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
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[#2A302E] flex-shrink-0">
            <div className="text-sm text-[#5C6360]">
              {isReviewMode ? (
                <span>Reviewing answers</span>
              ) : (
                <span>{displayResult.passed ? '✅ Passed' : '❌ Failed'}</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              {!isReviewMode && (
                <Button variant="primary" onClick={handleStartReview} className="gap-2">
                  <Eye className="w-4 h-4" />
                  Review Answers
                </Button>
              )}
              {isReviewMode && (
                <Button variant="secondary" onClick={handleExitReview}>
                  <EyeOff className="w-4 h-4 inline mr-1" />
                  Back to Summary
                </Button>
              )}
            </div>
          </div>
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
      <div className="bg-[#161A19] border border-[#2A302E] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#2A302E] flex-shrink-0">
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-[#5C6360]">
                Question {currentQuestion + 1} of {totalQuestions}
              </span>
              <span className="text-xs text-[#5C6360]">•</span>
              <span className="text-xs text-[#5C6360]">
                {answeredCount > currentQuestion ? '✅ Answered' : '⏳ Not answered'}
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
        <div className="p-6 border-t border-[#2A302E] flex items-center justify-between flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              className="p-2 text-[#5C6360] hover:text-[#EDEFEE] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {!isLastQuestion && (
              <button
                onClick={handleNext}
                className="p-2 text-[#5C6360] hover:text-[#EDEFEE] transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
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