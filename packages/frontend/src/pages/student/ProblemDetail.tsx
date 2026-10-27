// packages/frontend/src/pages/student/ProblemDetail.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Loader2, Zap, Copy, Check,
  Lightbulb, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Clock, AlertCircle, Terminal,
  ChevronRight, ChevronLeft, Settings, Maximize2, Minimize2, X,
  GripVertical, GripHorizontal, FileText, History, Layers,
  ChevronDown as ChevronDownIcon, Hash
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Import components
import { StatusBar } from '../../components/StatusBar';
import { TestCaseConsole } from '../../components/TestCaseConsole';
import { SubmissionHistory } from '../../components/SubmissionHistory';
import { CodeHistory } from '../../components/CodeHistory';

// Setup Monaco
import { setupMonaco } from '../../lib/monaco-config';

// Correct CDN URL for Pyodide
const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

// Language configurations - Only JavaScript and Python
const SUPPORTED_LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript',
    monacoLanguage: 'javascript',
    extension: 'js',
    icon: '🟡',
    sampleStarter: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
var sumOfTwoNumbers = function(a, b) {
    // Write your solution here
    return 0;
};`
  },
  {
    id: 'python',
    name: 'Python',
    monacoLanguage: 'python',
    extension: 'py',
    icon: '🟢',
    sampleStarter: `def sum_of_two_numbers(a: int, b: int) -> int:
    # Write your solution here
    return 0`
  }
];

interface Problem {
  _id: string;
  problemNumber: number;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples: any[];
  constraints: string[];
  testCases: any[];
  starterCode: {
    javascript: string;
    python: string;
  } | string;
  hints: string[];
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  acceptanceRate?: number;
  totalSubmissions?: number;
}

interface TestResult {
  input: string;
  expected: string;
  got: string;
  passed: boolean;
  isHidden: boolean;
  runtime: number;
  memory: number;
  error: string | null;
}

interface SubmissionResult {
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'memory_limit' | 'runtime_error' | 'compile_error';
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  testResults?: TestResult[];
  isSubmission?: boolean;
  submission?: {
    id: string;
    status: SubmissionResult['status'];
    passedTests: number;
    totalTests: number;
    runtime: number;
    memory: number;
    errorMessage: string;
    createdAt: string;
  };
}

interface Submission {
  _id: string;
  problemId: {
    _id: string;
    title: string;
    difficulty: string;
  } | string;
  userId: string;
  language: string;
  code: string;
  status: string;
  passedTests: number;
  totalTests: number;
  runtime: number;
  memory: number;
  errorMessage?: string;
  createdAt: string;
  submittedAt: string;
}

export const ProblemDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [selectedTestCase, setSelectedTestCase] = useState<number>(0);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'testcases' | 'submissions' | 'history' | 'results'>('testcases');
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [isPyodideLoaded, setIsPyodideLoaded] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Monaco loading states
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [monacoError, setMonacoError] = useState<string | null>(null);

  // Split view states
  const [splitPosition, setSplitPosition] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const verticalDragRef = useRef<HTMLDivElement>(null);
  const horizontalDragRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get problem-specific submissions
  const problemSubmissions = useMemo(() => {
    if (!problem) return [];
    return allSubmissions.filter((sub: Submission) => {
      const problemId = typeof sub.problemId === 'string'
        ? sub.problemId
        : sub.problemId?._id;
      return problemId === problem._id;
    });
  }, [allSubmissions, problem]);

  // Load Monaco
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        await setupMonaco();
        setIsMonacoReady(true);
      } catch (error: any) {
        console.error('Failed to load Monaco:', error);
        setMonacoError(error.message || 'Failed to load code editor');
        setIsMonacoReady(true);
        toast.error('Code editor failed to load. Using fallback editor.');
      }
    };
    loadMonaco();
  }, []);

  // Load Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      setPyodideLoading(true);
      setPyodideError(null);

      try {
        const loadPyodideFn = (window as any).loadPyodide;

        if (typeof loadPyodideFn === 'function') {
          console.log('🔄 Loading Pyodide from jsdelivr...');
          const instance = await loadPyodideFn({
            indexURL: PYODIDE_INDEX_URL,
            fullStdLib: true,
          });

          setPyodide(instance);
          setIsPyodideLoaded(true);
          console.log('✅ Pyodide loaded successfully');
        } else {
          console.log('⏳ Waiting for Pyodide script to load...');

          const waitForPyodide = new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if (typeof (window as any).loadPyodide === 'function') {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 100);

            setTimeout(() => {
              clearInterval(checkInterval);
              resolve(false);
            }, 15000);
          });

          const loaded = await waitForPyodide;

          if (loaded && typeof (window as any).loadPyodide === 'function') {
            const instance = await (window as any).loadPyodide({
              indexURL: PYODIDE_INDEX_URL,
              fullStdLib: true,
            });

            setPyodide(instance);
            setIsPyodideLoaded(true);
            console.log('✅ Pyodide loaded successfully (delayed)');
          } else {
            throw new Error('Pyodide script failed to load. Please refresh and try again.');
          }
        }
      } catch (error: any) {
        console.error('❌ Failed to load Pyodide:', error);
        setPyodideError(error.message || 'Failed to load Python runtime. Please refresh and try again.');
        toast.error('Python runtime failed to load. Some features may be limited.');
      } finally {
        setPyodideLoading(false);
      }
    };

    const timer = setTimeout(() => {
      initPyodide();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (slug) {
      fetchProblem();
      fetchSubmissions();
      loadCodeHistory();
    }
  }, [slug]);

  // Auto-save code to localStorage
  useEffect(() => {
    if (code && slug) {
      const timer = setTimeout(() => {
        localStorage.setItem(`code_${slug}_${selectedLanguage}`, code);
        saveCodeHistory(code);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [code, slug, selectedLanguage]);

  // Get starter code for a specific language
  const getStarterCodeForLanguage = (problem: Problem | null, language: string): string => {
    if (!problem) return '';

    if (problem.starterCode && typeof problem.starterCode === 'object' && !Array.isArray(problem.starterCode)) {
      const code = problem.starterCode[language as keyof typeof problem.starterCode];
      if (code && typeof code === 'string' && code.trim()) {
        return code;
      }
    }

    if (language === 'javascript' && typeof problem.starterCode === 'string') {
      return problem.starterCode;
    }

    const langConfig = SUPPORTED_LANGUAGES.find(l => l.id === language);
    return langConfig?.sampleStarter || '';
  };

  // Load language-specific code from localStorage or problem data
  useEffect(() => {
    if (slug && selectedLanguage) {
      const savedCode = localStorage.getItem(`code_${slug}_${selectedLanguage}`);
      if (savedCode) {
        setCode(savedCode);
      } else if (problem) {
        const starterCode = getStarterCodeForLanguage(problem, selectedLanguage);
        setCode(starterCode);
      }
    }
  }, [selectedLanguage, slug, problem]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProblem = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/problems/${slug}`);
      const data = response.data.data;
      setProblem(data.problem);

      const savedCode = localStorage.getItem(`code_${slug}_${selectedLanguage}`);
      if (savedCode) {
        setCode(savedCode);
      } else {
        const starterCode = getStarterCodeForLanguage(data.problem, selectedLanguage);
        setCode(starterCode);
      }
    } catch (error) {
      console.error('Error fetching problem:', error);
      toast.error('Failed to load problem');
      navigate('/problems');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await api.get('/problems/submissions');
      setAllSubmissions(response.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setAllSubmissions([]);
      }
    }
  };

  const loadCodeHistory = () => {
    const history = localStorage.getItem(`code_history_${slug}_${selectedLanguage}`);
    if (history) {
      try {
        setCodeHistory(JSON.parse(history));
      } catch (e) {
        setCodeHistory([]);
      }
    }
  };

  const saveCodeHistory = (newCode: string) => {
    const lastCode = codeHistory[codeHistory.length - 1];
    if (lastCode === newCode) return;

    const updatedHistory = [...codeHistory, newCode];
    if (updatedHistory.length > 20) {
      updatedHistory.shift();
    }
    setCodeHistory(updatedHistory);
    localStorage.setItem(`code_history_${slug}_${selectedLanguage}`, JSON.stringify(updatedHistory));
  };

  const handleLanguageChange = (languageId: string) => {
    if (languageId === selectedLanguage) {
      setIsLanguageDropdownOpen(false);
      return;
    }
    setSelectedLanguage(languageId);
    setIsLanguageDropdownOpen(false);
    setResult(null);
  };

  const currentLanguage = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // Universal Input Parser
  const parseInput = (input: string): any => {
    if (!input || !input.trim()) return '';

    const trimmed = input.trim();

    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const content = trimmed.slice(1, -1).trim();
      if (!content) return [];
      return content.split(',').map((val: string) => {
        const v = val.trim();
        if ((v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))) {
          return v.slice(1, -1);
        }
        const num = Number(v);
        return isNaN(num) ? v : num;
      });
    }

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((val: string) => {
        const v = val.trim();
        const num = Number(v);
        return isNaN(num) ? v : num;
      });

      if (parts.every((p: any) => typeof p === 'number')) {
        return parts;
      }

      return parts;
    }

    const num = Number(trimmed);
    if (!isNaN(num)) {
      return num;
    }

    return trimmed;
  };

  const isArrayFunction = (code: string): boolean => {
    const arrayKeywords = ['[]', 'arr', 'array', 'nums', 'list'];
    return arrayKeywords.some(keyword => code.includes(keyword));
  };

  const buildArgString = (parsedInput: any, code: string): string => {
    const isSingleNumber = typeof parsedInput === 'number';
    const isArrayInput = Array.isArray(parsedInput);
    const expectsArray = isArrayFunction(code);

    if (isSingleNumber && expectsArray) {
      return JSON.stringify([parsedInput]);
    }

    if (isArrayInput && expectsArray) {
      return JSON.stringify(parsedInput);
    } else if (isArrayInput && parsedInput.length > 1) {
      return parsedInput.map((v: any) => {
        if (typeof v === 'string') return `"${v}"`;
        return String(v);
      }).join(', ');
    } else if (isArrayInput && parsedInput.length === 1) {
      return JSON.stringify(parsedInput);
    } else {
      return typeof parsedInput === 'string' ? `"${parsedInput}"` : String(parsedInput);
    }
  };

  // Execute JavaScript
  const executeJavaScript = (code: string, input: string): Promise<{ output: string; error: string }> => {
    return new Promise((resolve) => {
      let output = '';
      let error = '';

      try {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
          output += args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        };
        console.warn = (...args) => {
          output += args.map(arg => String(arg)).join(' ') + '\n';
        };
        console.error = (...args) => {
          error += args.map(arg => String(arg)).join(' ') + '\n';
        };

        const parsedInput = parseInput(input);
        const argStr = buildArgString(parsedInput, code);

        const functionMatch = code.match(/function\s+(\w+)\s*\(/);
        const varMatch = code.match(/(?:var|let|const)\s+(\w+)\s*=\s*function/);
        const arrowMatch = code.match(/(?:var|let|const)\s+(\w+)\s*=\s*\(/);
        const functionName = functionMatch?.[1] || varMatch?.[1] || arrowMatch?.[1] || null;

        if (!functionName) {
          try {
            const func = new Function(code);
            const result = func();
            if (result !== undefined && result !== null) {
              output += String(result) + '\n';
            }
          } catch (execError: any) {
            error += execError.message || 'Execution error';
          }
        } else {
          const wrapperCode = `
            ${code}

            try {
              const result = ${functionName}(${argStr});
              if (result !== undefined && result !== null) {
                console.log(result);
              }
            } catch (e) {
              console.error(e.message);
            }
          `;

          try {
            const func = new Function(wrapperCode);
            func();
          } catch (execError: any) {
            error += execError.message || 'Execution error';
          }
        }

        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;

        resolve({ output: output.trim(), error: error.trim() });
      } catch (err: any) {
        resolve({ output: output.trim(), error: err.message || 'Execution error' });
      }
    });
  };

  // Execute Python
  const executePython = async (code: string, input: string): Promise<{ output: string; error: string }> => {
    if (!isPyodideLoaded || !pyodide) {
      return {
        output: '',
        error: pyodideError || 'Python runtime is not available. Please refresh and try again.',
      };
    }

    try {
      const parsedInput = parseInput(input);
      const argStr = buildArgString(parsedInput, code);

      const functionMatch = code.match(/def\s+(\w+)\s*\(/);
      const functionName = functionMatch?.[1] || null;

      let wrapperCode = code;

      if (functionName) {
        wrapperCode = `
${code}

# Call the function and print result
if __name__ == "__main__":
    result = ${functionName}(${argStr})
    print(result)
        `;
      }

      if (input) {
        pyodide.runPython(`
import sys
sys.stdin = open('input.txt', 'w')
sys.stdin.write('${input.replace(/'/g, "\\'")}')
sys.stdin.close()
sys.stdin = open('input.txt', 'r')
        `);
      }

      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
      `);

      pyodide.runPython(wrapperCode);

      const stdout = pyodide.runPython('sys.stdout.getvalue()');
      const stderr = pyodide.runPython('sys.stderr.getvalue()');

      pyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');

      return {
        output: stdout.trim(),
        error: stderr.trim(),
      };
    } catch (error: any) {
      pyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
      return {
        output: '',
        error: error.message || 'Python execution error',
      };
    }
  };

  const executeCode = async (code: string, input: string, language: string): Promise<{ output: string; error: string }> => {
    switch (language) {
      case 'javascript':
        return await executeJavaScript(code, input);
      case 'python':
        return await executePython(code, input);
      default:
        return { output: '', error: 'Unsupported language' };
    }
  };

  const executeCodeClientSide = async (
    code: string,
    testCases: any[],
    language: string
  ): Promise<{
    passedTests: number;
    totalTests: number;
    status: string;
    runtime: number;
    memory: number;
    errorMessage?: string;
    testResults: any[];
  }> => {
    const results = [];
    let passedTests = 0;
    let totalTests = testCases.length;
    let status: SubmissionResult['status'] = 'accepted';
    let errorMessage = '';
    let totalRuntime = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const isHidden = testCase.isHidden || false;

      const result: any = {
        input: testCase.input,
        expected: testCase.expectedOutput,
        got: '',
        passed: false,
        isHidden: isHidden,
        runtime: 0,
        memory: 0,
        error: null,
      };

      try {
        const startTime = performance.now();

        const execResult = await executeCode(code, testCase.input, language);

        const runtime = Math.round(performance.now() - startTime);
        result.runtime = runtime;
        totalRuntime += runtime;

        const actualOutput = execResult.output.trim();
        let expectedOutput = testCase.expectedOutput.trim();

        if ((expectedOutput.startsWith('"') && expectedOutput.endsWith('"')) ||
            (expectedOutput.startsWith("'") && expectedOutput.endsWith("'"))) {
          expectedOutput = expectedOutput.slice(1, -1);
        }

        result.got = actualOutput;

        if (actualOutput === expectedOutput) {
          result.passed = true;
          passedTests++;
        } else {
          result.passed = false;
          status = 'wrong_answer';
          errorMessage = `Test case ${i + 1} failed. Expected: "${expectedOutput}", Got: "${actualOutput}"`;
        }

        results.push(result);
      } catch (error: any) {
        result.got = 'Error';
        result.passed = false;
        result.error = error.message || 'Runtime error';
        results.push(result);

        if (!isHidden) {
          status = 'runtime_error';
          errorMessage = error.message || 'Runtime error occurred';
        }
      }
    }

    const avgRuntime = results.length > 0 ? Math.round(totalRuntime / results.length) : 0;

    if (passedTests === totalTests) {
      status = 'accepted';
      errorMessage = '';
    }

    return {
      passedTests,
      totalTests,
      status,
      runtime: avgRuntime,
      memory: 0,
      errorMessage,
      testResults: results,
    };
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write your solution first.');
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: 'Please write your solution first.',
        testResults: [],
        isSubmission: false,
      });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      if (!problem) return;

      const execResult = await executeCodeClientSide(
        code,
        problem.testCases || [],
        selectedLanguage
      );

      setResult({
        ...execResult,
        status: execResult.status as SubmissionResult['status'],
        isSubmission: false,
      });

      if (execResult.status === 'accepted') {
        toast.success('✅ All test cases passed!');
      } else if (execResult.status === 'wrong_answer') {
        toast.error('❌ Some tests failed. Check the results below.');
      }

      if (outputRef.current) {
        outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error: any) {
      console.error('Error running code:', error);
      toast.error('Failed to execute code');
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: error.response?.data?.message || 'Failed to execute code',
        testResults: [],
        isSubmission: false,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getXpForDifficulty = (difficulty: string): number => {
    const map: Record<string, number> = {
      easy: 15,
      medium: 30,
      hard: 50,
    };
    return map[difficulty] || 15;
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write your solution first.');
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: 'Please write your solution first.',
        testResults: [],
        isSubmission: true,
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      if (!problem) return;

      const execResult = await executeCodeClientSide(
        code,
        problem.testCases || [],
        selectedLanguage
      );

      const response = await api.post(`/problems/${slug}/submit`, {
        code: code,
        language: selectedLanguage,
        isSubmission: true,
        result: {
          status: execResult.status,
          passedTests: execResult.passedTests,
          totalTests: execResult.totalTests,
          runtime: execResult.runtime,
          memory: execResult.memory,
          errorMessage: execResult.errorMessage,
          testResults: execResult.testResults,
        },
      });

      setResult({
        ...execResult,
        status: execResult.status as SubmissionResult['status'],
        isSubmission: true,
        submission: response.data.data.submission,
      });

      await fetchSubmissions();
      setActiveTab('results');

      if (execResult.status === 'accepted') {
        const xpGain = getXpForDifficulty(problem.difficulty);
        toast.success(`🎉 Accepted! +${xpGain} XP earned!`);
      } else {
        toast.error(`❌ ${execResult.errorMessage || 'Submission failed'}`);
      }

      if (outputRef.current) {
        outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error: any) {
      console.error('Error submitting:', error);
      toast.error(error.response?.data?.message || 'Failed to submit');
      setResult({
        status: 'runtime_error',
        passedTests: 0,
        totalTests: 0,
        runtime: 0,
        memory: 0,
        errorMessage: error.response?.data?.message || 'Failed to submit',
        testResults: [],
        isSubmission: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    setShowSettings(false);
  };

  const toggleEditorMaximize = () => {
    setIsEditorMaximized(!isEditorMaximized);
    setIsBottomPanelMaximized(false);
  };

  const toggleBottomPanelMaximize = () => {
    setIsBottomPanelMaximized(!isBottomPanelMaximized);
    setIsEditorMaximized(false);
  };

  const resetLayout = () => {
    setIsEditorMaximized(false);
    setIsBottomPanelMaximized(false);
    setSplitPosition(60);
    setLeftWidth(40);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, { text: string; bg: string; label: string }> = {
      easy: { text: 'text-[#1951FC]', bg: 'bg-[#1951FC]/10', label: '🟢 Easy' },
      medium: { text: 'text-[#3781FC]', bg: 'bg-[#3781FC]/10', label: '🟡 Medium' },
      hard: { text: 'text-[#5BB8FB]', bg: 'bg-[#5BB8FB]/10', label: '🔴 Hard' },
    };
    return colors[difficulty] || colors.easy;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      accepted: <CheckCircle className="w-5 h-5 text-[#1951FC]" />,
      wrong_answer: <XCircle className="w-5 h-5 text-[#5BB8FB]" />,
      time_limit: <Clock className="w-5 h-5 text-[#3781FC]" />,
      memory_limit: <AlertCircle className="w-5 h-5 text-[#3781FC]" />,
      runtime_error: <XCircle className="w-5 h-5 text-[#5BB8FB]" />,
      compile_error: <XCircle className="w-5 h-5 text-[#5BB8FB]" />,
    };
    return icons[status] || <AlertCircle className="w-5 h-5 text-[#5BB8FB]" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'accepted') return 'text-[#1951FC]';
    if (status === 'wrong_answer' || status === 'runtime_error' || status === 'compile_error') return 'text-[#5BB8FB]';
    return 'text-[#3781FC]';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      accepted: 'Accepted ✅',
      wrong_answer: 'Wrong Answer ❌',
      time_limit: 'Time Limit Exceeded ⏱️',
      memory_limit: 'Memory Limit Exceeded 💾',
      runtime_error: 'Runtime Error 💥',
      compile_error: 'Compile Error 🔧',
    };
    return texts[status] || status;
  };

  const visibleTestCases = problem?.testCases?.filter((t: any) => !t.isHidden) || [];

  const getTestCaseResult = (index: number) => {
    if (!result?.testResults) return null;
    const visibleResults = result.testResults.filter((r: TestResult) => !r.isHidden);
    return visibleResults[index] || null;
  };

  const getPassedVisibleCount = () => {
    if (!result?.testResults) return 0;
    const visibleResults = result.testResults.filter((r: TestResult) => !r.isHidden);
    return visibleResults.filter((r: TestResult) => r.passed).length;
  };

  const getTotalVisibleCount = () => {
    return visibleTestCases.length;
  };

  const difficultyInfo = getDifficultyBadge(problem?.difficulty || 'easy');

  const editorHeight = isEditorMaximized ? 100 : isBottomPanelMaximized ? 0 : splitPosition;
  const bottomHeight = isBottomPanelMaximized ? 100 : isEditorMaximized ? 0 : 100 - splitPosition;

  const hasResults = result && result.testResults && result.testResults.length > 0;
  const allVisiblePassed = hasResults && getPassedVisibleCount() === getTotalVisibleCount();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading problem..." />;
  }

  if (!problem) {
    return (
      <div className="text-center py-12 bg-[#000000]">
        <p className="text-[#CBE9FD]">Problem not found</p>
        <Button variant="primary" onClick={() => navigate('/problems')} className="mt-4">
          Back to Problems
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#000000] overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-[#03195B] border-b border-[#0B2CB1] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/problems')} className="text-[#CBE9FD] hover:text-[#FFFFFF] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
              <span className="text-[#5BB8FB] font-mono text-sm bg-[#000000] px-2 py-0.5 rounded border border-[#0B2CB1] flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {problem.problemNumber}
              </span>
              {problem.title}
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span className={`${difficultyInfo.text} font-medium`}>
                {difficultyInfo.label}
              </span>
              <span className="text-[#5BB8FB]">•</span>
              <span className="text-[#5BB8FB]">{problem.tags?.join(', ') || 'General'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg hover:border-[#1951FC]/30 transition-colors text-sm"
            >
              <span>{currentLanguage.icon}</span>
              <span className="font-medium text-[#FFFFFF]">{currentLanguage.name}</span>
              <ChevronDownIcon className={`w-4 h-4 text-[#CBE9FD] transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLanguageDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-[#03195B] border border-[#0B2CB1] rounded-lg shadow-lg py-1 z-10 max-h-60 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-[#0B2CB1] transition-colors flex items-center gap-2 text-sm ${
                      selectedLanguage === lang.id ? 'bg-[#1951FC]/10 text-[#1951FC]' : 'text-[#CBE9FD]'
                    }`}
                  >
                    <span>{lang.icon}</span>
                    <span>{lang.name}</span>
                    {selectedLanguage === lang.id && (
                      <span className="ml-auto text-[#1951FC]">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Layout Controls */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={toggleEditorMaximize}
              className={`p-1.5 rounded-lg transition-colors ${
                isEditorMaximized ? 'bg-[#1951FC]/20 text-[#1951FC]' : 'text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
              }`}
              title="Maximize Editor"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleBottomPanelMaximize}
              className={`p-1.5 rounded-lg transition-colors ${
                isBottomPanelMaximized ? 'bg-[#1951FC]/20 text-[#1951FC]' : 'text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#0B2CB1]'
              }`}
              title="Maximize Test Cases"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            {(isEditorMaximized || isBottomPanelMaximized) && (
              <button
                onClick={resetLayout}
                className="p-1.5 text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#0B2CB1] rounded-lg transition-colors"
                title="Reset Layout"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={handleRunCode} disabled={isRunning} className="gap-1 text-xs h-8">
            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1 text-xs h-8">
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex min-h-0">
        {/* LEFT PANEL - Problem Description */}
        <div
          className="flex flex-col bg-[#000000] min-h-0 overflow-hidden"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="bg-[#03195B] border-b border-[#0B2CB1] px-4 py-2 flex items-center justify-between flex-shrink-0">
            <span className="text-sm font-medium text-[#FFFFFF]">Description</span>
            <button onClick={() => setShowDescription(false)} className="text-[#5BB8FB] hover:text-[#FFFFFF] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Problem Statistics */}
              <div className="flex items-center gap-6 text-sm text-[#5BB8FB] pb-4 border-b border-[#0B2CB1]">
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4 text-[#5BB8FB]" />
                  <span className="font-medium text-[#FFFFFF]">#{problem.problemNumber}</span>
                </div>
                <div>
                  <span className="font-medium text-[#FFFFFF]">{problem.acceptanceRate || 45.6}%</span>
                  <span className="ml-1">Acceptance</span>
                </div>
                <div>
                  <span className="font-medium text-[#FFFFFF]">{problem.totalSubmissions || 1284}</span>
                  <span className="ml-1">Submissions</span>
                </div>
                <div>
                  <span className={`font-medium ${difficultyInfo.text}`}>{problem.difficulty}</span>
                  <span className="ml-1">Difficulty</span>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <h2 className="text-sm font-semibold text-[#5BB8FB] uppercase tracking-wider mb-3">Problem</h2>
                <div className="text-[#CBE9FD] whitespace-pre-wrap leading-relaxed text-sm">{problem.description}</div>
              </div>

              {/* Examples */}
              {problem.examples && problem.examples.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#5BB8FB] uppercase tracking-wider mb-3">Examples</h2>
                  {problem.examples.map((example, index) => (
                    <div key={index} className="bg-[#03195B] border border-[#0B2CB1] rounded-lg p-4 mb-3">
                      <div className="mb-2">
                        <span className="text-xs text-[#5BB8FB]">Input:</span>
                        <pre className="text-sm text-[#FFFFFF] bg-[#000000] p-2 rounded mt-1 font-mono">{example.input}</pre>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-[#5BB8FB]">Output:</span>
                        <pre className="text-sm text-[#1951FC] bg-[#000000] p-2 rounded mt-1 font-mono">{example.output}</pre>
                      </div>
                      {example.explanation && (
                        <div>
                          <span className="text-xs text-[#5BB8FB]">Explanation:</span>
                          <p className="text-sm text-[#CBE9FD] mt-1">{example.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#5BB8FB] uppercase tracking-wider mb-3">Constraints</h2>
                  <ul className="space-y-1 text-sm text-[#CBE9FD]">
                    {problem.constraints.map((constraint, index) => (
                      <li key={index} className="list-disc list-inside">• {constraint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Topics/Tags */}
              {problem.tags && problem.tags.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-[#5BB8FB] uppercase tracking-wider mb-3">Related Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full bg-[#0B2CB1] text-[#CBE9FD] text-xs hover:bg-[#1951FC]/20 hover:text-[#1951FC] cursor-pointer transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hints */}
              {problem.hints && problem.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-2 text-sm font-medium text-[#CBE9FD] hover:text-[#FFFFFF] transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Hints
                    {showHints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showHints && (
                    <div className="mt-3 space-y-2">
                      {problem.hints.map((hint, index) => (
                        <div key={index} className="bg-[#1951FC]/5 border border-[#1951FC]/20 rounded-lg p-3 text-sm text-[#CBE9FD]">
                          💡 {hint}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Drag Handle */}
        <div
          className="w-1 flex-shrink-0 bg-[#0B2CB1] hover:bg-[#1951FC] cursor-col-resize transition-colors duration-150 relative group"
          onMouseDown={() => setIsDraggingHorizontal(true)}
          onTouchStart={() => setIsDraggingHorizontal(true)}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-0.5 h-12 bg-[#5BB8FB] group-hover:bg-[#1951FC] rounded-full transition-colors" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-[#1951FC]" />
          </div>
        </div>

        {/* RIGHT PANEL - Editor + Test Cases */}
        <div
          className="flex-1 flex flex-col bg-[#000000] min-h-0"
          style={{ width: `${100 - leftWidth - 0.5}%` }}
        >
          {/* EDITOR SECTION */}
          <div
            className="flex flex-col bg-[#000000] min-h-0"
            style={{
              height: `${editorHeight}%`,
              display: editorHeight === 0 ? 'none' : 'flex',
            }}
          >
            {/* Editor Header */}
            <div className="bg-[#03195B] border-b border-[#0B2CB1] px-4 py-2 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowDescription(true)} className={`text-[#5BB8FB] hover:text-[#FFFFFF] transition-colors ${showDescription ? 'hidden' : ''}`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-sm text-[#CBE9FD]">{currentLanguage.name}</span>
                <span className="text-xs text-[#5BB8FB]">• {problem.timeLimit || 2000}ms • {problem.memoryLimit || 256}MB</span>
                {pyodideLoading && selectedLanguage === 'python' && (
                  <span className="text-xs text-[#5BB8FB] flex items-center gap-1 ml-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading Python...
                  </span>
                )}
                {pyodideError && selectedLanguage === 'python' && (
                  <span className="text-xs text-[#5BB8FB] flex items-center gap-1 ml-2">
                    <AlertCircle className="w-3 h-3" />
                    Python unavailable
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyCode} className="text-[#5BB8FB] hover:text-[#FFFFFF] p-1 rounded hover:bg-[#0B2CB1] transition-colors" title="Copy code">
                  {copied ? <Check className="w-3 h-3 text-[#1951FC]" /> : <Copy className="w-3 h-3" />}
                </button>
                <button onClick={() => setShowSettings(!showSettings)} className="text-[#5BB8FB] hover:text-[#FFFFFF] p-1 rounded hover:bg-[#0B2CB1] transition-colors" title="Settings">
                  <Settings className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="bg-[#03195B] border-b border-[#0B2CB1] p-3 flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-[#5BB8FB]">Font Size:</span>
                {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`text-xs px-2 py-1 rounded ${fontSize === size ? 'bg-[#1951FC] text-white' : 'text-[#CBE9FD] hover:text-[#FFFFFF]'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            {/* Code Editor */}
            <div className="flex-1 min-h-0 bg-[#03195B]">
              {isMonacoReady ? (
                <Editor
                  height="100%"
                  language={currentLanguage.monacoLanguage}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    renderWhitespace: 'selection',
                    padding: { top: 12, bottom: 12 },
                  }}
                  loading={<LoadingSpinner size="sm" text="Loading editor..." />}
                />
              ) : (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-[#03195B] text-[#CBE9FD] font-mono text-sm p-4 resize-none focus:outline-none"
                  placeholder="// Write your code here"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Vertical Drag Handle */}
            {!isEditorMaximized && !isBottomPanelMaximized && (
              <div
                ref={verticalDragRef}
                className="flex-shrink-0 h-1 bg-[#0B2CB1] hover:bg-[#1951FC] cursor-row-resize transition-colors duration-150 relative group"
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-0.5 w-12 bg-[#5BB8FB] group-hover:bg-[#1951FC] rounded-full transition-colors" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripHorizontal className="w-4 h-4 text-[#1951FC]" />
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM PANEL - Test Cases & Results */}
          <div
            className="flex flex-col bg-[#03195B] border-t border-[#0B2CB1] min-h-0"
            style={{
              height: `${bottomHeight}%`,
              display: bottomHeight === 0 ? 'none' : 'flex',
            }}
          >
            {/* Tabs */}
            <div className="flex border-b border-[#0B2CB1] bg-[#000000] flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('testcases')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'testcases' ? 'border-[#1951FC] text-[#1951FC]' : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Test Cases
                {hasResults && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    allVisiblePassed ? 'bg-[#1951FC]/20 text-[#1951FC]' : 'bg-[#5BB8FB]/20 text-[#5BB8FB]'
                  }`}>
                    {getPassedVisibleCount()}/{getTotalVisibleCount()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'results'
                    ? 'border-[#1951FC] text-[#1951FC]'
                    : hasResults
                      ? 'border-[#1951FC]/30 text-[#1951FC]/70 hover:text-[#FFFFFF]'
                      : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Results
                {hasResults && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    allVisiblePassed ? 'bg-[#1951FC]/20 text-[#1951FC]' : 'bg-[#5BB8FB]/20 text-[#5BB8FB]'
                  }`}>
                    {getPassedVisibleCount()}/{getTotalVisibleCount()}
                  </span>
                )}
                {!hasResults && (
                  <span className="ml-1 text-[#5BB8FB]">(Submit to see)</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'submissions' ? 'border-[#1951FC] text-[#1951FC]' : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Submissions ({problemSubmissions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'history' ? 'border-[#1951FC] text-[#1951FC]' : 'border-transparent text-[#5BB8FB] hover:text-[#FFFFFF]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Code History
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {activeTab === 'testcases' && (
                <TestCaseConsole
                  visibleTestCases={visibleTestCases}
                  result={result}
                  selectedTestCase={selectedTestCase}
                  setSelectedTestCase={setSelectedTestCase}
                  getPassedVisibleCount={getPassedVisibleCount}
                  getTotalVisibleCount={getTotalVisibleCount}
                  getTestCaseResult={getTestCaseResult}
                />
              )}

              {activeTab === 'results' && (
                <ResultsTab
                  result={result}
                  visibleTestCases={visibleTestCases}
                  getTestCaseResult={getTestCaseResult}
                  getPassedVisibleCount={getPassedVisibleCount}
                  getTotalVisibleCount={getTotalVisibleCount}
                  allVisiblePassed={allVisiblePassed ?? false}
                />
              )}

              {activeTab === 'submissions' && (
                <SubmissionHistory
                  submissions={problemSubmissions}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  problemTitle={problem.title}
                />
              )}

              {activeTab === 'history' && (
                <CodeHistory codeHistory={codeHistory} onRestoreCode={setCode} />
              )}
            </div>
          </div>

          {/* Status Bar */}
          <StatusBar result={result} problem={problem} />
        </div>
      </div>
    </div>
  );
};

// Results Tab Component
const ResultsTab: React.FC<{
  result: SubmissionResult | null;
  visibleTestCases: any[];
  getTestCaseResult: (index: number) => any;
  getPassedVisibleCount: () => number;
  getTotalVisibleCount: () => number;
  allVisiblePassed: boolean;
}> = ({
  result,
  visibleTestCases,
  getTestCaseResult,
  getPassedVisibleCount,
  getTotalVisibleCount,
  allVisiblePassed,
}) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#5BB8FB]">
        <FileText className="w-12 h-12 mb-4 opacity-40" />
        <p className="font-medium text-[#CBE9FD]">No results yet</p>
        <p className="text-sm">Submit your solution to see detailed test results</p>
      </div>
    );
  }

  const passedCount = getPassedVisibleCount();
  const totalCount = getTotalVisibleCount();
  const hiddenCount = result.totalTests - totalCount;

  const isSubmission = result.isSubmission !== false;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          isSubmission
            ? 'bg-[#1951FC]/20 text-[#1951FC] border border-[#1951FC]/30'
            : 'bg-[#5BB8FB]/20 text-[#5BB8FB] border border-[#5BB8FB]/30'
        }`}>
          {isSubmission ? '📝 Submission' : '⚡ Run (Not Saved)'}
        </span>
        {!isSubmission && (
          <span className="text-xs text-[#5BB8FB]">
            Results from running code - not counted as submission
          </span>
        )}
      </div>

      <div className={`p-4 rounded-lg border ${
        allVisiblePassed && result.status === 'accepted'
          ? 'bg-[#1951FC]/10 border-[#1951FC]/30'
          : 'bg-[#5BB8FB]/10 border-[#5BB8FB]/30'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {allVisiblePassed && result.status === 'accepted' ? (
              <CheckCircle className="w-6 h-6 text-[#1951FC]" />
            ) : (
              <XCircle className="w-6 h-6 text-[#5BB8FB]" />
            )}
            <div>
              <h3 className="font-semibold text-[#FFFFFF]">
                {allVisiblePassed && result.status === 'accepted' ? '🎉 All Tests Passed!' : 'Some Tests Failed'}
              </h3>
              <p className="text-sm text-[#CBE9FD]">
                {passedCount} of {totalCount} visible tests passed
                {hiddenCount > 0 && ` • ${hiddenCount} hidden test(s)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <span className="block text-xs text-[#5BB8FB]">Runtime</span>
              <span className="font-medium text-[#FFFFFF]">{result.runtime || 0}ms</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-[#5BB8FB]">Memory</span>
              <span className="font-medium text-[#FFFFFF]">{result.memory || 0}MB</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-[#5BB8FB]">Status</span>
              <span className={`font-medium ${getStatusColor(result.status)}`}>
                {getStatusText(result.status)}
              </span>
            </div>
          </div>
        </div>
        {result.errorMessage && (
          <div className="mt-3 p-2 bg-[#000000] rounded-lg border border-[#5BB8FB]/20">
            <span className="text-xs text-[#5BB8FB]">Error:</span>
            <pre className="text-sm text-[#5BB8FB] font-mono whitespace-pre-wrap break-all mt-1">
              {result.errorMessage}
            </pre>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5BB8FB] uppercase tracking-wider">Test Case Details</span>
          <span className="text-xs text-[#5BB8FB]">
            {passedCount}/{totalCount} passed
          </span>
        </div>

        {visibleTestCases.map((testCase, index) => {
          const testResult = getTestCaseResult(index);
          const passed = testResult?.passed || false;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                passed
                  ? 'border-[#1951FC]/30 bg-[#1951FC]/5'
                  : 'border-[#5BB8FB]/30 bg-[#5BB8FB]/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircle className="w-4 h-4 text-[#1951FC]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#5BB8FB]" />
                  )}
                  <span className="text-sm font-medium text-[#FFFFFF]">
                    Test Case {index + 1}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    passed
                      ? 'bg-[#1951FC]/20 text-[#1951FC]'
                      : 'bg-[#5BB8FB]/20 text-[#5BB8FB]'
                  }`}>
                    {passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                {testResult?.runtime !== undefined && (
                  <span className="text-xs text-[#5BB8FB]">{testResult.runtime}ms</span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="bg-[#000000] rounded p-2">
                  <span className="text-[#5BB8FB]">Input:</span>
                  <pre className="text-[#FFFFFF] font-mono mt-0.5 whitespace-pre-wrap break-all">
                    {testCase.input}
                  </pre>
                </div>
                <div className="bg-[#000000] rounded p-2">
                  <span className="text-[#5BB8FB]">Expected:</span>
                  <pre className="text-[#1951FC] font-mono mt-0.5 whitespace-pre-wrap break-all">
                    {testCase.expectedOutput}
                  </pre>
                </div>
                {testResult && (
                  <div className="bg-[#000000] rounded p-2 md:col-span-2">
                    <span className="text-[#5BB8FB]">Your Output:</span>
                    <pre className={`font-mono mt-0.5 whitespace-pre-wrap break-all ${
                      passed ? 'text-[#1951FC]' : 'text-[#5BB8FB]'
                    }`}>
                      {testResult.got || 'No output'}
                    </pre>
                  </div>
                )}
                {testResult?.error && (
                  <div className="bg-[#5BB8FB]/10 rounded p-2 md:col-span-2 border border-[#5BB8FB]/20">
                    <span className="text-[#5BB8FB]">Error:</span>
                    <pre className="text-[#5BB8FB] font-mono mt-0.5 whitespace-pre-wrap break-all">
                      {testResult.error}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div className="p-3 bg-[#000000] rounded-lg border border-[#0B2CB1] text-center">
            <span className="text-xs text-[#5BB8FB]">
              🔒 {hiddenCount} hidden test case(s) not shown
              {result.status === 'accepted' && ' (All passed!)'}
              {result.status === 'wrong_answer' && passedCount === totalCount && ' (Some hidden tests failed)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  if (status === 'accepted') return 'text-[#1951FC]';
  if (status === 'wrong_answer' || status === 'runtime_error' || status === 'compile_error') return 'text-[#5BB8FB]';
  return 'text-[#3781FC]';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    accepted: 'Accepted ✅',
    wrong_answer: 'Wrong Answer ❌',
    time_limit: 'Time Limit Exceeded ⏱️',
    memory_limit: 'Memory Limit Exceeded 💾',
    runtime_error: 'Runtime Error 💥',
    compile_error: 'Compile Error 🔧',
  };
  return texts[status] || status;
};

export default ProblemDetail;