import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  placeholder?: string;
  height?: string;
  showLineNumbers?: boolean;
  onRun?: () => void;
  onSubmit?: () => void;
  isRunning?: boolean;
  isSubmitting?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
  placeholder = '// Write your code here...',
  height = '400px',
  showLineNumbers = true,
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(lines);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }

    // Cmd/Ctrl + Enter to run
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRun) onRun();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset to original code?')) {
      onChange('');
    }
  };

  // Get language-specific keywords for highlighting
  const getHighlightedCode = (code: string): string => {
    if (!code) return '';

    const keywords = [
      'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
      'case', 'break', 'continue', 'const', 'let', 'var', 'new', 'this',
      'class', 'extends', 'super', 'import', 'export', 'default', 'from',
      'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
      'typeof', 'instanceof', 'void', 'delete', 'in', 'of',
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
    ];

    const builtins = [
      'console', 'log', 'error', 'warn', 'info', 'debug',
      'Array', 'Object', 'String', 'Number', 'Boolean', 'Function',
      'Math', 'Date', 'RegExp', 'Map', 'Set', 'Promise', 'Symbol',
      'JSON', 'parse', 'stringify'
    ];

    let highlighted = code;

    // Highlight strings
    highlighted = highlighted.replace(
      /(".*?"|'.*?'|`.*?`)/g,
      '<span class="text-[#CBE9FD]">$1</span>'
    );

    // Highlight comments
    highlighted = highlighted.replace(
      /(\/\/.*$)/gm,
      '<span class="text-[#5BB8FB]">$1</span>'
    );

    // Highlight keywords
    const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(
      keywordRegex,
      '<span class="text-[#3781FC]">$1</span>'
    );

    // Highlight builtins
    const builtinRegex = new RegExp(`\\b(${builtins.join('|')})\\b`, 'g');
    highlighted = highlighted.replace(
      builtinRegex,
      '<span class="text-[#CBE9FD]">$1</span>'
    );

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b(\d+\.?\d*)\b/g,
      '<span class="text-[#CBE9FD]">$1</span>'
    );

    // Highlight function calls
    highlighted = highlighted.replace(
      /\b(\w+)\s*\(/g,
      '<span class="text-[#CBE9FD]">$1</span>('
    );

    return highlighted;
  };

  return (
    <div className="bg-[#03195B] rounded-lg border border-[#0B2CB1] overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#0B2CB1] border-b border-[#0B2CB1] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#5BB8FB]">
            {language.charAt(0).toUpperCase() + language.slice(1)}
          </span>
          <span className="text-xs text-[#5BB8FB]">|</span>
          <span className="text-xs text-[#5BB8FB]">
            {lineCount} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onRun && (
            <button
              onClick={onRun}
              disabled={isRunning}
              className="px-3 py-1 text-xs bg-[#1951FC] text-white rounded hover:bg-[#03195B] transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-3 py-1 text-xs bg-[#1951FC] text-white rounded hover:bg-[#03195B] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#1951FC] rounded transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-[#1951FC]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-[#5BB8FB] hover:text-[#FFFFFF] hover:bg-[#1951FC] rounded transition-colors"
            title="Reset code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="relative overflow-hidden"
        style={{ height }}
      >
        <div className="flex h-full">
          {/* Line Numbers */}
          {showLineNumbers && (
            <div className="bg-[#03195B] text-[#5BB8FB] text-sm font-mono py-3 px-3 select-none text-right min-w-[50px] border-r border-[#0B2CB1] overflow-hidden">
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div key={i + 1} className="leading-6">{i + 1}</div>
              ))}
            </div>
          )}

          {/* Code Area */}
          <div className="flex-1 relative">
            {/* Syntax Highlighted Pre */}
            <pre
              className="absolute inset-0 py-3 px-4 font-mono text-sm leading-6 text-[#CBE9FD] pointer-events-none overflow-auto whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: getHighlightedCode(value) || '<span class="text-[#5BB8FB]">// Write your code here...</span>' }}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              placeholder={placeholder}
              className="absolute inset-0 w-full h-full py-3 px-4 font-mono text-sm leading-6 text-transparent caret-white bg-transparent resize-none focus:outline-none"
              style={{
                color: 'transparent',
                tabSize: 2,
              }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#1951FC] px-4 py-1 flex items-center justify-between text-xs text-white">
        <span>JavaScript</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};