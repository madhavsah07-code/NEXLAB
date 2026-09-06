// packages/frontend/src/components/QuizForm.tsx

import React, { useState } from 'react';
import { Plus, Trash2, X, PlusCircle, MinusCircle, Clock, Award, Zap } from 'lucide-react';
import { Button } from './ui/Button';

interface Question {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number;
}

interface QuizFormProps {
  initialData?: {
    _id?: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number;
    maxAttempts: number;
    questions: Question[];
    isPublished?: boolean;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const QuizForm: React.FC<QuizFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [passingScore, setPassingScore] = useState(initialData?.passingScore || 60);
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit?.toString() || '');
  const [maxAttempts, setMaxAttempts] = useState(initialData?.maxAttempts || 1);
  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions || [
      { question: '', options: ['', ''], correctAnswer: 0, explanation: '', points: 1 },
    ]
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: ['', ''], correctAnswer: 0, explanation: '', points: 1 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      alert('You need at least one question');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push('');
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length <= 2) {
      alert('You need at least 2 options');
      return;
    }
    updated[questionIndex].options = updated[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    // Reset correctAnswer if it was the removed option
    if (updated[questionIndex].correctAnswer === optionIndex) {
      updated[questionIndex].correctAnswer = 0;
    } else if (updated[questionIndex].correctAnswer > optionIndex) {
      updated[questionIndex].correctAnswer--;
    }
    setQuestions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }

    if (questions.some(q => !q.question.trim())) {
      alert('All questions must have content');
      return;
    }

    if (questions.some(q => q.options.some(o => !o.trim()))) {
      alert('All options must have content');
      return;
    }

    if (questions.some(q => q.options.length < 2)) {
      alert('Each question must have at least 2 options');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      passingScore,
      timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
      maxAttempts,
      questions: questions.map(q => ({
        ...q,
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-[#EDEFEE] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#10B981]" />
          Quiz Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
              Quiz Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., JavaScript Fundamentals Quiz"
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this quiz covers..."
              rows={2}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Passing Score (%) *
              </label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                min={0}
                max={100}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
                required
              />
              <p className="text-xs text-[#5C6360] mt-1">Minimum score required to pass</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder="No limit"
                min={1}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
              />
              <p className="text-xs text-[#5C6360] mt-1">Leave empty for no time limit</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                <Award className="w-4 h-4 inline mr-1" />
                Max Attempts
              </label>
              <input
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
              />
              <p className="text-xs text-[#5C6360] mt-1">Number of attempts allowed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#EDEFEE]">
              Questions ({questions.length})
            </h3>
            <p className="text-sm text-[#5C6360]">Each question is worth {questions.reduce((sum, q) => sum + (q.points || 1), 0)} total points</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addQuestion} className="gap-1">
            <Plus className="w-4 h-4" />
            Add Question
          </Button>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} className="bg-[#0D0F0F] border border-[#2A302E] rounded-lg p-4 mb-4 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#10B981]">Question {qIndex + 1}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#5C6360]">Points:</span>
                  <input
                    type="number"
                    value={question.points || 1}
                    onChange={(e) => updateQuestion(qIndex, 'points', Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-14 px-2 py-1 text-xs bg-[#161A19] border border-[#2A302E] rounded text-[#EDEFEE]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="p-1 text-[#5C6360] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
                title="Remove question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                  Question *
                </label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                  placeholder="Enter your question..."
                  className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9CA3A0] mb-2">
                  Options * <span className="text-xs text-[#5C6360">(Select the correct answer)</span>
                </label>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={question.correctAnswer === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                      className="w-4 h-4 text-[#10B981] border-[#2A302E] rounded-full focus:ring-[#10B981] bg-[#0D0F0F] flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[qIndex].options[oIndex] = e.target.value;
                        setQuestions(updated);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      className="flex-1 px-4 py-2 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className="p-1 text-[#5C6360] hover:text-[#F87171] rounded-lg transition-colors"
                        title="Remove option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addOption(qIndex)}
                  className="text-xs gap-1 mt-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  Add Option
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                  Explanation (optional)
                </label>
                <input
                  type="text"
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explain why this is the correct answer (shown to students after submission)"
                  className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                />
              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center py-8 text-[#5C6360]">
            <p>No questions added yet.</p>
            <Button type="button" variant="secondary" size="sm" onClick={addQuestion} className="mt-2">
              Add your first question
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : initialData?._id ? 'Update Quiz' : 'Create Quiz'}
        </Button>
      </div>
    </form>
  );
};

export default QuizForm;