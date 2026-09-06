// packages/frontend/src/pages/admin/ProblemForm.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, X, Code2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

// ✅ Lazy load Monaco Editor only when needed
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

// ✅ Setup Monaco only when ProblemForm mounts
const setupMonaco = () => {
  import('../../lib/monaco-config').then(({ setupMonaco }) => {
    setupMonaco();
  });
};

// ✅ Updated schema with JavaScript and Python only
const problemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  examples: z.array(z.object({
    input: z.string().min(1, 'Input is required'),
    output: z.string().min(1, 'Output is required'),
    explanation: z.string().optional(),
  })),
  constraints: z.array(z.string()).default([]),
  testCases: z.array(z.object({
    input: z.string().min(1, 'Input is required'),
    expectedOutput: z.string().min(1, 'Expected output is required'),
    isHidden: z.boolean().default(false),
  })),
  starterCode: z.object({
    javascript: z.string().default(''),
    python: z.string().default(''),
  }),
  solutionCode: z.string().default(''),
  hints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  timeLimit: z.number().min(100).default(2000),
  memoryLimit: z.number().min(16).default(256),
});

type ProblemFormData = z.infer<typeof problemSchema>;

// ✅ Default starter code for JavaScript and Python
const DEFAULT_STARTER_CODE = {
  javascript: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
var sumOfTwoNumbers = function(a, b) {
    // Write your solution here
    return 0;
};`,
  python: `def sum_of_two_numbers(a: int, b: int) -> int:
    # Write your solution here
    return 0`
};

export const ProblemForm: React.FC = () => {
  // ✅ Setup Monaco when ProblemForm mounts
  useEffect(() => {
    setupMonaco();
  }, []);

  const { problemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!problemId);
  const [activeLanguageTab, setActiveLanguageTab] = useState<'javascript' | 'python'>('javascript');

  const { register, control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProblemFormData>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      difficulty: 'easy',
      description: '',
      examples: [{ input: '', output: '', explanation: '' }],
      constraints: [],
      testCases: [{ input: '', expectedOutput: '', isHidden: false }],
      starterCode: DEFAULT_STARTER_CODE,
      solutionCode: '',
      hints: [],
      tags: [],
      timeLimit: 2000,
      memoryLimit: 256,
    },
  });

  const { fields: exampleFields, append: appendExample, remove: removeExample } = useFieldArray({
    control,
    name: 'examples',
  });

  const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({
    control,
    name: 'testCases',
  });

  const tags = watch('tags') || [];
  const hints = watch('hints') || [];
  const constraints = watch('constraints') || [];
  const starterCode = watch('starterCode');

  useEffect(() => {
    if (problemId) {
      fetchProblem();
    }
  }, [problemId]);

  const fetchProblem = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/problems/admin/${problemId}`);
      const problem = response.data.data;
      
      const starterCode = {
        javascript: problem.starterCode?.javascript || DEFAULT_STARTER_CODE.javascript,
        python: problem.starterCode?.python || DEFAULT_STARTER_CODE.python,
      };
      
      reset({
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        examples: problem.examples || [{ input: '', output: '', explanation: '' }],
        constraints: problem.constraints || [],
        testCases: problem.testCases || [{ input: '', expectedOutput: '', isHidden: false }],
        starterCode: starterCode,
        solutionCode: problem.solutionCode || '',
        hints: problem.hints || [],
        tags: problem.tags || [],
        timeLimit: problem.timeLimit || 2000,
        memoryLimit: problem.memoryLimit || 256,
      });
    } catch (error) {
      console.error('Error fetching problem:', error);
      navigate('/admin/problems');
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data: ProblemFormData) => {
    setLoading(true);
    try {
      if (problemId) {
        await api.put(`/problems/${problemId}`, data);
      } else {
        await api.post('/problems', data);
      }
      navigate('/admin/problems');
    } catch (error: any) {
      console.error('Error saving problem:', error);
      alert(error.response?.data?.message || 'Failed to save problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const input = document.getElementById('tagInput') as HTMLInputElement;
    if (input && input.value.trim() && !tags.includes(input.value.trim())) {
      setValue('tags', [...tags, input.value.trim()]);
      input.value = '';
    }
  };

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter(t => t !== tag));
  };

  const addHint = () => {
    const input = document.getElementById('hintInput') as HTMLInputElement;
    if (input && input.value.trim()) {
      setValue('hints', [...hints, input.value.trim()]);
      input.value = '';
    }
  };

  const removeHint = (index: number) => {
    setValue('hints', hints.filter((_, i) => i !== index));
  };

  const addConstraint = () => {
    const input = document.getElementById('constraintInput') as HTMLInputElement;
    if (input && input.value.trim()) {
      setValue('constraints', [...constraints, input.value.trim()]);
      input.value = '';
    }
  };

  const removeConstraint = (index: number) => {
    setValue('constraints', constraints.filter((_, i) => i !== index));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/problems')}
          className="p-2 hover:bg-[#1E2322] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#9CA3A0]" />
        </button>
        <h1 className="text-2xl font-bold text-[#EDEFEE]">
          {problemId ? 'Edit Problem' : 'Create New Problem'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EDEFEE] mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Title *
              </label>
              <input
                {...register('title')}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                placeholder="e.g., Sum of Two Numbers"
              />
              {errors.title && (
                <p className="text-[#F87171] text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Difficulty *
              </label>
              <select
                {...register('difficulty')}
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {errors.difficulty && (
                <p className="text-[#F87171] text-xs mt-1">{errors.difficulty.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
              Description *
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] font-mono text-sm"
              placeholder="Describe the problem in detail..."
            />
            {errors.description && (
              <p className="text-[#F87171] text-xs mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#EDEFEE]">Examples</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendExample({ input: '', output: '', explanation: '' })}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Example
            </Button>
          </div>

          {exampleFields.map((field, index) => (
            <div key={field.id} className="bg-[#0D0F0F] border border-[#2A302E] rounded-lg p-4 mb-4 relative">
              <button
                type="button"
                onClick={() => removeExample(index)}
                className="absolute top-2 right-2 p-1 text-[#5C6360] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Input *
                  </label>
                  <input
                    {...register(`examples.${index}.input`)}
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] font-mono text-sm"
                    placeholder="e.g., a = 5, b = 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Output *
                  </label>
                  <input
                    {...register(`examples.${index}.output`)}
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] font-mono text-sm"
                    placeholder="e.g., 15"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                  Explanation (optional)
                </label>
                <input
                  {...register(`examples.${index}.explanation`)}
                  className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                  placeholder="Explain the example..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Constraints */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EDEFEE] mb-4">Constraints</h2>
          <div className="flex gap-2 mb-3">
            <input
              id="constraintInput"
              onKeyDown={(e) => e.key === 'Enter' && addConstraint()}
              className="flex-1 px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
              placeholder="Add a constraint..."
            />
            <Button type="button" variant="secondary" size="sm" onClick={addConstraint}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {constraints.map((constraint, index) => (
              <span key={index} className="flex items-center gap-1 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full text-sm text-[#EDEFEE]">
                {constraint}
                <button
                  type="button"
                  onClick={() => removeConstraint(index)}
                  className="text-[#5C6360] hover:text-[#F87171] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Test Cases */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#EDEFEE]">Test Cases</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendTestCase({ input: '', expectedOutput: '', isHidden: false })}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Test Case
            </Button>
          </div>

          {testCaseFields.map((field, index) => (
            <div key={field.id} className="bg-[#0D0F0F] border border-[#2A302E] rounded-lg p-4 mb-4 relative">
              <button
                type="button"
                onClick={() => removeTestCase(index)}
                className="absolute top-2 right-2 p-1 text-[#5C6360] hover:text-[#F87171] hover:bg-[#F87171]/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Input *
                  </label>
                  <input
                    {...register(`testCases.${index}.input`)}
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] font-mono text-sm"
                    placeholder="e.g., 5, 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                    Expected Output *
                  </label>
                  <input
                    {...register(`testCases.${index}.expectedOutput`)}
                    className="w-full px-4 py-2.5 bg-[#161A19] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360] font-mono text-sm"
                    placeholder="e.g., 15"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center">
                <label className="flex items-center gap-2 text-sm text-[#9CA3A0]">
                  <input
                    {...register(`testCases.${index}.isHidden`)}
                    type="checkbox"
                    className="w-4 h-4 text-[#10B981] border-[#2A302E] rounded focus:ring-[#10B981] bg-[#0D0F0F]"
                  />
                  Hidden Test Case (not shown to students)
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Language-Specific Starter Code */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#EDEFEE] mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#10B981]" />
            Starter Code
          </h2>
          <p className="text-sm text-[#9CA3A0] mb-4">Provide starter code for each language</p>

          {/* Language Tabs - Only JavaScript and Python */}
          <div className="flex gap-2 mb-4 border-b border-[#2A302E]">
            {['javascript', 'python'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLanguageTab(lang as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeLanguageTab === lang
                    ? 'border-[#10B981] text-[#10B981]'
                    : 'border-transparent text-[#5C6360] hover:text-[#EDEFEE]'
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>

          {/* Starter Code Editor for Active Language */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
              {activeLanguageTab.charAt(0).toUpperCase() + activeLanguageTab.slice(1)} Starter Code
            </label>
            <textarea
              {...register(`starterCode.${activeLanguageTab}`)}
              rows={8}
              className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] font-mono text-sm"
              placeholder={`Enter ${activeLanguageTab} starter code...`}
            />
            <p className="text-xs text-[#5C6360] mt-1">
              This code will be shown to students when they select {activeLanguageTab}
            </p>
          </div>
        </div>

        {/* Hints & Tags */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[#EDEFEE] mb-4">Hints</h2>
              <div className="flex gap-2 mb-3">
                <input
                  id="hintInput"
                  onKeyDown={(e) => e.key === 'Enter' && addHint()}
                  className="flex-1 px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                  placeholder="Add a hint..."
                />
                <Button type="button" variant="secondary" size="sm" onClick={addHint}>
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {hints.map((hint, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#0D0F0F] border border-[#2A302E] rounded-lg p-3 text-sm text-[#9CA3A0]">
                    <span>💡 {hint}</span>
                    <button
                      type="button"
                      onClick={() => removeHint(index)}
                      className="text-[#5C6360] hover:text-[#F87171] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#EDEFEE] mb-4">Tags</h2>
              <div className="flex gap-2 mb-3">
                <input
                  id="tagInput"
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE] placeholder-[#5C6360]"
                  placeholder="Add a tag..."
                />
                <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full text-sm text-[#EDEFEE]">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-[#5C6360] hover:text-[#F87171] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Time & Memory Limits */}
        <div className="bg-[#161A19] border border-[#2A302E] rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Time Limit (ms)
              </label>
              <input
                {...register('timeLimit', { valueAsNumber: true })}
                type="number"
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9CA3A0] mb-1.5">
                Memory Limit (MB)
              </label>
              <input
                {...register('memoryLimit', { valueAsNumber: true })}
                type="number"
                className="w-full px-4 py-2.5 bg-[#0D0F0F] border border-[#2A302E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-[#10B981] text-[#EDEFEE]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/problems')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : problemId ? 'Update Problem' : 'Create Problem'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProblemForm;