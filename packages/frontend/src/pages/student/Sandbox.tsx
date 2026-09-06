// packages/frontend/src/pages/student/Sandbox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Play, Loader2, Terminal, ChevronDown, X, Copy, Check, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// ✅ Lazy load Monaco Editor - only loads when Sandbox is visited
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

// ✅ Setup Monaco only when the component mounts (user visits Sandbox)
const setupMonaco = () => {
  // Dynamic import to avoid loading Monaco on pages that don't need it
  import('../../lib/monaco-config').then(({ setupMonaco }) => {
    setupMonaco();
  });
};

// ✅ Correct CDN URL for Pyodide
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
  // ✅ Setup Monaco when Sandbox mounts
  useEffect(() => {
    setupMonaco();
  }, []);

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
  const [editorError, setEditorError] = useState(false);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [pyodideError, setPyodideError] = useState<string | null>(null);
  const [isPyodideLoaded, setIsPyodideLoaded] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Parse input utility
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

  // ✅ Load Pyodide
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

  // ✅ Execute JavaScript
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

  // ✅ Execute Python
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

  // ✅ Execute code based on language
  const handleExecute = async () => {
    if (!code.trim()) {
      alert('Please write some code first.');
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
    } catch (error: any) {
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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearOutput = () => {
    setResult(null);
  };

  const handleEditorError = () => {
    setEditorError(true);
    console.warn('Monaco Editor failed to load, using fallback editor');
  };

  const toggleOutputMaximize = () => {
    setIsOutputMaximized((current) => !current);
  };

  const getLanguageColor = (languageId: string) => {
    const colors: Record<string, string> = {
      python: 'bg-[#10B981]',
      javascript: 'bg-[#FBBF24]',
    };
    return colors[languageId] || 'bg-[#10B981]';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-[#0D0F0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#10B981] border-t-transparent" />
      </div>
    );
  }

  const currentLanguage = languages.find(l => l.id === selectedLanguage);

  return (
    <div className="h-full w-full bg-[#0D0F0F] overflow-hidden">
      <div className="h-full w-full flex flex-col px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#EDEFEE] flex items-center gap-2">
              <Terminal className="w-8 h-8 text-[#10B981]" />
              Code Sandbox
            </h1>
            <p className="text-[#9CA3A0] mt-1">Write, test, and run code in multiple languages</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#161A19] border border-[#2A302E] rounded-lg hover:border-[#10B981]/30 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full ${getLanguageColor(selectedLanguage)}`} />
                <span className="font-medium text-[#EDEFEE]">{currentLanguage?.name || 'Select Language'}</span>
                <ChevronDown className={`w-4 h-4 text-[#9CA3A0] transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#161A19] border border-[#2A302E] rounded-lg shadow-lg py-1 z-10 max-h-60 overflow-y-auto">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#1E2322] transition-colors flex items-center gap-2 ${
                        selectedLanguage === lang.id ? 'bg-[#10B981]/10 text-[#10B981]' : 'text-[#9CA3A0]'
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
          <div className="flex-1 min-h-[500px] lg:min-h-[700px] min-w-0 flex flex-row bg-[#161A19] border border-[#2A302E] rounded-xl overflow-hidden shadow-sm">

            {/* Editor Section */}
            {!isOutputMaximized && (
              <div
                className="flex flex-col min-h-0 min-w-0 overflow-hidden"
                style={{ width: `${editorWidth}%` }}
              >
                <div className="px-4 py-2 border-b border-[#2A302E] flex items-center justify-between bg-[#1A1D1E] flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getLanguageColor(selectedLanguage)}`} />
                    <span className="text-sm font-medium text-[#EDEFEE] truncate">
                      {currentLanguage?.name || 'Code Editor'}
                    </span>
                    <span className="text-xs text-[#5C6360] flex-shrink-0">
                      .{currentLanguage?.extension || 'txt'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5C6360] flex-shrink-0">
                    <span>⌘ + Enter to run</span>
                  </div>
                </div>

                <div className="flex-1 min-h-0 min-w-0 bg-[#1E1E1E]">
                  {!editorError ? (
                    <React.Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full bg-[#1E1E1E]">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#10B981] border-t-transparent" />
                        </div>
                      }
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
                      />
                    </React.Suspense>
                  ) : (
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-full bg-[#1E1E1E] text-[#D4D4D4] font-mono text-sm p-4 resize-none focus:outline-none border-0"
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
                className="group relative flex-shrink-0 w-1.5 bg-[#2A302E] hover:bg-[#10B981] cursor-col-resize transition-colors flex items-center justify-center"
              >
                <div className="h-12 w-1 bg-[#5C6360] group-hover:bg-[#10B981] rounded-full transition-colors" />
              </div>
            )}

            {/* Output Section */}
            <div
              className={`flex flex-col min-h-0 min-w-0 bg-[#1A1D1E] ${
                isOutputMaximized ? 'w-full' : 'flex-1'
              }`}
            >
              <div className="px-4 py-2 border-b border-[#2A302E] flex items-center justify-between bg-[#0D0F0F] flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-4 h-4 text-[#9CA3A0] flex-shrink-0" />
                  <span className="text-sm font-medium text-[#EDEFEE]">Output</span>
                  {result && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      result.success
                        ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                        : 'bg-[#F87171]/10 text-[#F87171] border border-[#F87171]/20'
                    }`}>
                      {result.success ? 'Success' : 'Error'}
                    </span>
                  )}
                  {pyodideLoading && (
                    <span className="text-xs text-[#60A5FA] flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading Python...
                    </span>
                  )}
                  {pyodideError && (
                    <span className="text-xs text-[#F87171] flex items-center gap-1">
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
                    className="w-24 px-2 py-1 text-xs bg-[#0D0F0F] border border-[#2A302E] rounded text-[#EDEFEE] placeholder-[#5C6360] focus:outline-none focus:ring-1 focus:ring-[#10B981]"
                  />

                  {result && (
                    <>
                      <button
                        onClick={handleCopyOutput}
                        className="p-1 text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
                        title="Copy output"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-[#10B981]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={handleClearOutput}
                        className="p-1 text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
                        title="Clear output"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={toggleOutputMaximize}
                    className="p-1 text-[#9CA3A0] hover:text-[#EDEFEE] transition-colors"
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
                className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-[#0D0F0F] min-h-0"
              >
                {!result && (
                  <p className="text-[#5C6360] italic">Run your code to see output here...</p>
                )}

                {result && (
                  <div className="space-y-3">
                    {result.output && (
                      <div>
                        <div className="text-xs text-[#9CA3A0] mb-1">STDOUT:</div>
                        <pre className="text-[#EDEFEE] whitespace-pre-wrap bg-[#161A19] p-3 rounded-lg">
                          {result.output}
                        </pre>
                      </div>
                    )}

                    {result.error && (
                      <div>
                        <div className="text-xs text-[#F87171] mb-1">STDERR:</div>
                        <pre className="text-[#F87171] whitespace-pre-wrap bg-[#161A19] p-3 rounded-lg">
                          {result.error}
                        </pre>
                      </div>
                    )}

                    {!result.success && result.executed && (
                      <div className="pt-2">
                        <div className="text-xs text-[#F87171] mb-1">Error:</div>
                        <pre className="text-[#F87171] whitespace-pre-wrap bg-[#161A19] p-3 rounded-lg">
                          {result.error || 'Execution failed'}
                        </pre>
                      </div>
                    )}

                    {result.executed && (
                      <div className="pt-3 border-t border-[#2A302E] flex flex-wrap items-center gap-4 text-xs text-[#9CA3A0]">
                        {result.executionTime && (
                          <span>
                            Time: <span className="text-[#EDEFEE]">{result.executionTime}</span>
                          </span>
                        )}
                        {result.language && (
                          <span>
                            Language: <span className="text-[#EDEFEE]">{result.language}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#5C6360] text-center flex-shrink-0 mt-2">
            <kbd className="px-2.5 py-1 bg-[#161A19] border border-[#2A302E] rounded text-xs">⌘ + Enter</kbd>
            {' '}to run code • Supports JavaScript and Python
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sandbox;