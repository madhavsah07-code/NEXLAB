// packages/frontend/src/pages/student/Sandbox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, Terminal, ChevronDown, X, Copy, Check, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Lazy load Monaco Editor
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

// Setup Monaco
import { setupMonaco } from '../../lib/monaco-config';

// Correct CDN URL for Pyodide
const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

interface Language {
  id: string;
  name: string;
  extension: string;
  sample: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  executed: boolean;
  language?: string;
  executionTime?: string;
}

export const Sandbox: React.FC = () => {
  const [languages] = useState<Language[]>([
    {
      id: 'javascript',
      name: 'JavaScript',
      extension: 'js',
      sample: `// Welcome to NexLab JavaScript Sandbox!
// Write your JavaScript code here

console.log("Hello, World!");
console.log("This is JavaScript running in NexLab!");

// Try a simple calculation
const x = 10;
const y = 20;
console.log(\`Sum: \${x + y}\`);`
    },
    {
      id: 'python',
      name: 'Python',
      extension: 'py',
      sample: `# Welcome to NexLab Python Sandbox!
# Write your Python code here

print("Hello, World!")
print("This is Python running in NexLab!")

# Try a simple calculation
x = 10
y = 20
print(f"Sum: {x + y}")`
    }
  ]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [code, setCode] = useState<string>('');
  const [stdin, setStdin] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [isPyodideLoaded, setIsPyodideLoaded] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);

  // Monaco loading states
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const [monacoError, setMonacoError] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Monaco
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        await setupMonaco();
        setIsMonacoReady(true);
      } catch (error: any) {
        console.error('Failed to load Monaco:', error);
        setMonacoError(true);
        setIsMonacoReady(true);
        toast.error('Code editor failed to load. Using fallback editor.');
      }
    };
    loadMonaco();
  }, []);

  // Parse input utility
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
      return trimmed.split(',').map((val: string) => {
        const v = val.trim();
        if ((v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))) {
          return v.slice(1, -1);
        }
        const num = Number(v);
        return isNaN(num) ? v : num;
      });
    }

    const num = Number(trimmed);
    return isNaN(num) ? trimmed : num;
  };

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

    const defaultLang = languages.find(l => l.id === 'javascript');
    if (defaultLang) {
      setCode(defaultLang.sample);
    }
    setIsLoading(false);

    return () => clearTimeout(timer);
  }, []);

  // Drag functionality
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const percentage = (mouseX / rect.width) * 100;
      if (percentage > 20 && percentage < 80) {
        setEditorWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (languageId: string) => {
    const lang = languages.find(l => l.id === languageId);
    if (lang) {
      setSelectedLanguage(languageId);
      setCode(lang.sample);
      setResult(null);
    }
    setIsLanguageDropdownOpen(false);
  };

  // Execute JavaScript
  const executeJavaScript = (code: string, input: string): Promise<{ output: string; error: string; success: boolean }> => {
    return new Promise((resolve) => {
      let capturedOutput = '';
      let capturedError = '';

      try {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
          capturedOutput += args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ') + '\n';
        };
        console.error = (...args) => {
          capturedError += args.map(arg => String(arg)).join(' ') + '\n';
        };
        console.warn = (...args) => {
          capturedOutput += args.map(arg => String(arg)).join(' ') + '\n';
        };

        const parsedInput = parseInput(input);
        let argStr = '';
        if (Array.isArray(parsedInput)) {
          argStr = JSON.stringify(parsedInput);
        } else if (typeof parsedInput === 'string') {
          argStr = `"${parsedInput}"`;
        } else {
          argStr = String(parsedInput);
        }

        const functionMatch = code.match(/function\s+(\w+)\s*\(/);
        const varMatch = code.match(/(?:var|let|const)\s+(\w+)\s*=\s*function/);
        const arrowMatch = code.match(/(?:var|let|const)\s+(\w+)\s*=\s*\(/);
        const functionName = functionMatch?.[1] || varMatch?.[1] || arrowMatch?.[1] || null;

        if (!functionName) {
          const func = new Function(code);
          const result = func();
          if (result !== undefined && result !== null) {
            capturedOutput += String(result) + '\n';
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
          const func = new Function(wrapperCode);
          func();
        }

        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;

        resolve({
          output: capturedOutput.trim(),
          error: capturedError.trim(),
          success: true,
        });
      } catch (error: any) {
        resolve({
          output: capturedOutput.trim(),
          error: error.message || 'Execution error',
          success: false,
        });
      }
    });
  };

  // Execute Python
  const executePython = async (code: string, input: string): Promise<{ output: string; error: string; success: boolean }> => {
    if (!isPyodideLoaded || !pyodide) {
      return {
        output: '',
        error: pyodideError || 'Python runtime is not available. Please refresh and try again.',
        success: false,
      };
    }

    try {
      const parsedInput = parseInput(input);
      let argStr = '';
      if (Array.isArray(parsedInput)) {
        argStr = JSON.stringify(parsedInput);
      } else if (typeof parsedInput === 'string') {
        argStr = `"${parsedInput}"`;
      } else {
        argStr = String(parsedInput);
      }

      const functionMatch = code.match(/def\s+(\w+)\s*\(/);
      const functionName = functionMatch?.[1] || null;

      let wrapperCode = code;
      if (functionName) {
        wrapperCode = `
${code}

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
        success: true,
      };
    } catch (error: any) {
      pyodide.runPython('sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__');
      return {
        output: '',
        error: error.message || 'Python execution error',
        success: false,
      };
    }
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first.');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    const startTime = performance.now();

    try {
      let output = '';
      let error = '';
      let success = false;

      switch (selectedLanguage) {
        case 'javascript':
          ({ output, error, success } = await executeJavaScript(code, stdin));
          break;
        case 'python':
          ({ output, error, success } = await executePython(code, stdin));
          break;
        default:
          throw new Error('Unsupported language');
      }

      const executionTime = ((performance.now() - startTime) / 1000).toFixed(2);

      setResult({
        success,
        output,
        error,
        executed: true,
        language: selectedLanguage,
        executionTime: `${executionTime}s`,
      });

      if (success) {
        toast.success('✅ Code executed successfully!');
      } else {
        toast.error(`❌ ${error || 'Execution failed'}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Execution failed');
      setResult({
        success: false,
        output: '',
        error: error.message || 'Execution failed',
        executed: false,
        language: selectedLanguage,
        executionTime: '0s',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyOutput = () => {
    const text = result?.output || result?.error || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Output copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearOutput = () => {
    setResult(null);
  };

  const toggleOutputMaximize = () => {
    setIsOutputMaximized((current) => !current);
  };

  const getLanguageColor = (languageId: string) => {
    const colors: Record<string, string> = {
      python: 'bg-[#1951FC]',
      javascript: 'bg-[#3781FC]',
    };
    return colors[languageId] || 'bg-[#1951FC]';
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading sandbox..." />;
  }

  const currentLanguage = languages.find(l => l.id === selectedLanguage);

  return (
    <div className="h-full w-full bg-[#000000] overflow-hidden">
      <div className="h-full w-full flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#FFFFFF] flex items-center gap-2">
              <Terminal className="w-8 h-8 text-[#1951FC]" />
              Code Sandbox
            </h1>
            <p className="text-[#CBE9FD] mt-1">Write, test, and run code in multiple languages</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#03195B] border border-[#0B2CB1] rounded-lg hover:border-[#1951FC]/30 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${getLanguageColor(selectedLanguage)}`} />
                <span className="font-medium text-[#FFFFFF]">{currentLanguage?.name || 'Select Language'}</span>
                <ChevronDown className={`w-4 h-4 text-[#CBE9FD] transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#03195B] border border-[#0B2CB1] rounded-lg shadow-lg py-1 z-10 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#0B2CB1] transition-colors flex items-center gap-2 ${
                        selectedLanguage === lang.id ? 'bg-[#1951FC]/10 text-[#1951FC]' : 'text-[#CBE9FD]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${getLanguageColor(lang.id)}`} />
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="primary"
              onClick={handleExecute}
              disabled={isExecuting}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Code
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div ref={containerRef} className="flex-1 flex flex-col min-h-0 gap-0">
          <div className="flex-1 min-h-[500px] lg:min-h-[700px] min-w-0 flex flex-row bg-[#03195B] border border-[#0B2CB1] rounded-xl overflow-hidden shadow-sm">

            {/* Editor Section */}
            {!isOutputMaximized && (
              <div
                className="flex flex-col min-h-0 min-w-0 overflow-hidden"
                style={{ width: `${editorWidth}%` }}
              >
                <div className="px-4 py-2 border-b border-[#0B2CB1] flex items-center justify-between bg-[#03195B] flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getLanguageColor(selectedLanguage)}`} />
                    <span className="text-sm font-medium text-[#FFFFFF] truncate">
                      {currentLanguage?.name || 'Code Editor'}
                    </span>
                    <span className="text-xs text-[#5BB8FB] flex-shrink-0">
                      .{currentLanguage?.extension || 'txt'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5BB8FB] flex-shrink-0">
                    <span>⌘ + Enter to run</span>
                  </div>
                </div>

                <div className="flex-1 min-h-0 min-w-0 bg-[#03195B]">
                  {!monacoError && isMonacoReady ? (
                    <React.Suspense
                      fallback={<LoadingSpinner size="sm" text="Loading editor..." />}
                    >
                      <MonacoEditor
                        height="100%"
                        width="100%"
                        language={selectedLanguage}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          automaticLayout: true,
                          tabSize: 2,
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          suggestOnTriggerCharacters: true,
                          quickSuggestions: true,
                          padding: { top: 12, bottom: 12 },
                        }}
                        loading={<LoadingSpinner size="sm" text="Loading editor..." />}
                      />
                    </React.Suspense>
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
              </div>
            )}

            {/* Vertical Resize Divider */}
            {!isOutputMaximized && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize editor and output panels"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                className="group relative flex-shrink-0 w-1.5 bg-[#0B2CB1] hover:bg-[#1951FC] cursor-col-resize transition-colors flex items-center justify-center"
              >
                <div className="h-12 w-1 bg-[#5BB8FB] group-hover:bg-[#1951FC] rounded-full transition-colors" />
              </div>
            )}

            {/* Output Section */}
            <div
              className={`flex flex-col min-h-0 min-w-0 bg-[#03195B] ${
                isOutputMaximized ? 'w-full' : 'flex-1'
              }`}
            >
              <div className="px-4 py-2 border-b border-[#0B2CB1] flex items-center justify-between bg-[#000000] flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-4 h-4 text-[#CBE9FD] flex-shrink-0" />
                  <span className="text-sm font-medium text-[#FFFFFF]">Output</span>
                  {result && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      result.success
                        ? 'bg-[#1951FC]/10 text-[#1951FC] border border-[#1951FC]/20'
                        : 'bg-[#5BB8FB]/10 text-[#5BB8FB] border border-[#5BB8FB]/20'
                    }`}>
                      {result.success ? 'Success' : 'Error'}
                    </span>
                  )}
                  {pyodideLoading && (
                    <span className="text-xs text-[#5BB8FB] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading Python...
                    </span>
                  )}
                  {pyodideError && (
                    <span className="text-xs text-[#5BB8FB] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Python unavailable
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="stdin"
                    className="w-24 px-2 py-1 text-xs bg-[#000000] border border-[#0B2CB1] rounded text-[#FFFFFF] placeholder-[#5BB8FB] focus:outline-none focus:ring-1 focus:ring-[#1951FC]"
                  />

                  {result && (
                    <>
                      <button
                        onClick={handleCopyOutput}
                        className="p-1 text-[#CBE9FD] hover:text-[#FFFFFF] transition-colors"
                        title="Copy output"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-[#1951FC]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={handleClearOutput}
                        className="p-1 text-[#CBE9FD] hover:text-[#FFFFFF] transition-colors"
                        title="Clear output"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={toggleOutputMaximize}
                    className="p-1 text-[#CBE9FD] hover:text-[#FFFFFF] transition-colors"
                    title={isOutputMaximized ? 'Show editor' : 'Maximize output'}
                  >
                    {isOutputMaximized ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div
                ref={outputRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-[#000000] min-h-0"
              >
                {!result && (
                  <p className="text-[#5BB8FB] italic">Run your code to see output here...</p>
                )}

                {result && (
                  <div className="space-y-3">
                    {result.output && (
                      <div>
                        <div className="text-xs text-[#CBE9FD] mb-1">STDOUT:</div>
                        <pre className="text-[#FFFFFF] whitespace-pre-wrap bg-[#03195B] p-3 rounded-lg">
                          {result.output}
                        </pre>
                      </div>
                    )}

                    {result.error && (
                      <div>
                        <div className="text-xs text-[#5BB8FB] mb-1">STDERR:</div>
                        <pre className="text-[#5BB8FB] whitespace-pre-wrap bg-[#03195B] p-3 rounded-lg">
                          {result.error}
                        </pre>
                      </div>
                    )}

                    {!result.success && result.executed && (
                      <div className="pt-2">
                        <div className="text-xs text-[#5BB8FB] mb-1">Error:</div>
                        <pre className="text-[#5BB8FB] whitespace-pre-wrap bg-[#03195B] p-3 rounded-lg">
                          {result.error || 'Execution failed'}
                        </pre>
                      </div>
                    )}

                    {result.executed && (
                      <div className="pt-3 border-t border-[#0B2CB1] flex flex-wrap items-center gap-4 text-xs text-[#CBE9FD]">
                        {result.executionTime && (
                          <span>
                            Time: <span className="text-[#FFFFFF]">{result.executionTime}</span>
                          </span>
                        )}
                        {result.language && (
                          <span>
                            Language: <span className="text-[#FFFFFF]">{result.language}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#5BB8FB] text-center flex-shrink-0 mt-2">
            <kbd className="px-2.5 py-1 bg-[#03195B] border border-[#0B2CB1] rounded text-xs">⌘ + Enter</kbd>
            {' '}to run code • Supports JavaScript and Python
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sandbox;