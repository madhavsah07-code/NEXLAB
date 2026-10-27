// packages/frontend/src/pages/admin/AdminBulkImport.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Download, FileJson, CheckCircle, XCircle, AlertCircle,
  Trash2, Copy, Check, ArrowLeft, Sparkles, RefreshCw,
  ChevronDown, ChevronUp, FileText, Code2, Loader2
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';

interface ImportError {
  index: number;
  title: string;
  error: string;
  data?: any;
}

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  problems: any[];
  errors: ImportError[];
}

export const AdminBulkImport: React.FC = () => {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Record<number, boolean>>({});
  const [template, setTemplate] = useState<any>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const response = await api.get('/problems/import/template');
      setTemplate(response.data.data);
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const handleValidate = async () => {
    if (!jsonInput.trim()) {
      setValidationErrors(['Please enter JSON data to validate']);
      setIsValid(false);
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);
    setIsValid(null);

    try {
      const response = await api.post('/problems/import/validate', {
        jsonData: jsonInput,
      });

      if (response.data.success) {
        setIsValid(true);
        setValidationErrors([]);
      } else {
        setIsValid(false);
        setValidationErrors(response.data.errors || ['Invalid JSON structure']);
      }
    } catch (error: any) {
      setIsValid(false);
      setValidationErrors([error.response?.data?.message || 'Validation failed']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      alert('Please enter JSON data to import');
      return;
    }

    if (!confirm('Are you sure you want to import these problems? This action cannot be undone.')) {
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const response = await api.post('/problems/import/bulk', {
        jsonData: jsonInput,
      });

      setResult(response.data.data);

      if (response.data.success) {
        alert(`✅ Successfully imported ${response.data.data.imported} problems!`);
      } else {
        alert(`⚠️ Imported ${response.data.data.imported} problems, ${response.data.data.failed} failed. Check the errors below.`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert(error.response?.data?.message || 'Failed to import problems');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Try to parse to validate
        JSON.parse(content);
        setJsonInput(content);
        setIsValid(null);
        setValidationErrors([]);
        setResult(null);
      } catch (error: any) {
        alert(`Invalid JSON file: ${error.message}`);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    if (!template) return;

    const blob = new Blob(
      [JSON.stringify(template.template, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'problem_import_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadErrors = () => {
    if (!result || result.errors.length === 0) return;

    const errorData = {
      summary: {
        total: result.total,
        imported: result.imported,
        failed: result.failed,
        timestamp: new Date().toISOString(),
      },
      errors: result.errors,
    };

    const blob = new Blob(
      [JSON.stringify(errorData, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyTemplate = () => {
    if (!template) return;
    navigator.clipboard.writeText(JSON.stringify(template.template, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleErrorExpand = (index: number) => {
    setExpandedErrors(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch {
      alert('Invalid JSON format');
    }
  };

  const clearAll = () => {
    setJsonInput('');
    setIsValid(null);
    setValidationErrors([]);
    setResult(null);
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#0B2CB1]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/problems')}
            className="p-2 hover:bg-[#0B2CB1] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#CBE9FD]" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] flex items-center gap-2">
              <FileJson className="w-8 h-8 text-[#1951FC]" />
              Bulk Import Problems
            </h1>
            <p className="text-[#CBE9FD] mt-1">Import multiple coding problems at once using JSON</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadTemplate}
            className="gap-1"
            disabled={!template}
          >
            <Download className="w-4 h-4" />
            Template
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyTemplate}
            className="gap-1"
            disabled={!template}
          >
            {copied ? <Check className="w-4 h-4 text-[#1951FC]" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Import Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* JSON Input */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-[#0B2CB1] bg-[#03195B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileJson className="w-4 h-4 text-[#1951FC]" />
                <span className="font-medium text-[#FFFFFF]">JSON Data</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={formatJSON}
                  className="text-xs text-[#CBE9FD] hover:text-[#FFFFFF] transition-colors"
                  title="Format JSON"
                >
                  <Code2 className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-[#CBE9FD] hover:text-[#5BB8FB] transition-colors"
                  title="Clear"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setIsValid(null);
                  setValidationErrors([]);
                  setResult(null);
                }}
                placeholder={`[
  {
    "title": "Sum of Two Numbers",
    "difficulty": "easy",
    "description": "Write a function that adds two numbers.",
    "testCases": [
      {
        "input": "5, 10",
        "expectedOutput": "15"
      }
    ]
  }
]`}
                className="w-full h-[400px] px-4 py-3 bg-[#000000] text-[#FFFFFF] font-mono text-sm resize-none focus:outline-none"
                spellCheck={false}
              />
              {/* Upload Overlay */}
              <div className="absolute bottom-3 right-3">
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="px-3 py-1.5 bg-[#03195B] border border-[#0B2CB1] rounded-lg text-xs text-[#CBE9FD] hover:text-[#FFFFFF] hover:border-[#1951FC]/30 transition-colors flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Upload JSON
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          {isValid !== null && (
            <div className={`p-4 rounded-lg border ${
              isValid
                ? 'bg-[#1951FC]/10 border-[#1951FC]/30'
                : 'bg-[#5BB8FB]/10 border-[#5BB8FB]/30'
            }`}>
              <div className="flex items-center gap-2">
                {isValid ? (
                  <CheckCircle className="w-5 h-5 text-[#1951FC]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#5BB8FB]" />
                )}
                <span className="font-medium text-[#FFFFFF]">
                  {isValid ? '✅ JSON is valid' : '❌ JSON has errors'}
                </span>
              </div>
              {validationErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm text-[#5BB8FB]">• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={handleValidate}
              disabled={isValidating || !jsonInput.trim()}
              className="gap-2"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isValidating ? 'Validating...' : 'Validate JSON'}
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={isImporting || !jsonInput.trim() || isValid === false}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? 'Importing...' : 'Import Problems'}
            </Button>
          </div>

          {/* Import Results */}
          {result && (
            <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-[#FFFFFF] mb-3">Import Results</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#000000] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#FFFFFF]">{result.total}</p>
                  <p className="text-xs text-[#5BB8FB]">Total</p>
                </div>
                <div className="bg-[#000000] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#1951FC]">{result.imported}</p>
                  <p className="text-xs text-[#5BB8FB]">Imported ✅</p>
                </div>
                <div className="bg-[#000000] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-[#5BB8FB]">{result.failed}</p>
                  <p className="text-xs text-[#5BB8FB]">Failed ❌</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#5BB8FB]">Errors ({result.errors.length})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadErrors}
                      className="text-xs gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Errors
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div
                        key={index}
                        className="bg-[#000000] border border-[#5BB8FB]/20 rounded-lg overflow-hidden"
                      >
                        <div
                          className="p-3 cursor-pointer hover:bg-[#0B2CB1] transition-colors flex items-center justify-between"
                          onClick={() => toggleErrorExpand(index)}
                        >
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-[#5BB8FB]" />
                            <span className="text-sm text-[#FFFFFF]">
                              #{error.index + 1}: {error.title || 'Untitled'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#5BB8FB]">{error.error}</span>
                            {expandedErrors[index] ? (
                              <ChevronUp className="w-4 h-4 text-[#5BB8FB]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#5BB8FB]" />
                            )}
                          </div>
                        </div>
                        {expandedErrors[index] && error.data && (
                          <div className="p-3 pt-0 border-t border-[#0B2CB1]">
                            <pre className="text-xs text-[#CBE9FD] font-mono whitespace-pre-wrap break-all bg-[#000000] p-2 rounded">
                              {JSON.stringify(error.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Info & Template */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Guide */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1951FC]" />
              Quick Guide
            </h3>
            <div className="space-y-3 text-sm text-[#CBE9FD]">
              <div className="flex items-start gap-2">
                <span className="text-[#1951FC] font-bold">1.</span>
                <span>Prepare your JSON data (use the template below)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1951FC] font-bold">2.</span>
                <span>Paste or upload your JSON in the editor</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1951FC] font-bold">3.</span>
                <span>Click <strong>Validate JSON</strong> to check for errors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1951FC] font-bold">4.</span>
                <span>Click <strong>Import Problems</strong> to bulk create</span>
              </div>
            </div>
          </div>

          {/* Template Preview */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowTemplate(!showTemplate)}
              className="w-full px-5 py-3 flex items-center justify-between hover:bg-[#0B2CB1] transition-colors"
            >
              <span className="font-semibold text-[#FFFFFF] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1951FC]" />
                Template Preview
              </span>
              {showTemplate ? (
                <ChevronUp className="w-4 h-4 text-[#5BB8FB]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5BB8FB]" />
              )}
            </button>
            {showTemplate && template && (
              <div className="p-4 pt-0 border-t border-[#0B2CB1]">
                <pre className="text-xs text-[#CBE9FD] font-mono whitespace-pre-wrap break-all bg-[#000000] p-3 rounded max-h-[400px] overflow-y-auto">
                  {JSON.stringify(template.template, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Schema Info */}
          <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-[#FFFFFF] mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#1951FC]" />
              Supported Fields
            </h3>
            <div className="space-y-2 text-xs text-[#CBE9FD]">
              <div><span className="text-[#1951FC] font-medium">title</span> <span className="text-[#5BB8FB]">(required)</span> - Problem title</div>
              <div><span className="text-[#1951FC] font-medium">difficulty</span> <span className="text-[#5BB8FB]">(required)</span> - easy | medium | hard</div>
              <div><span className="text-[#1951FC] font-medium">description</span> <span className="text-[#5BB8FB]">(required)</span> - Problem description</div>
              <div><span className="text-[#1951FC] font-medium">testCases</span> <span className="text-[#5BB8FB]">(required)</span> - Array of test cases</div>
              <div><span className="text-[#1951FC] font-medium">examples</span> - Array of examples</div>
              <div><span className="text-[#1951FC] font-medium">constraints</span> - Array of constraints</div>
              <div><span className="text-[#1951FC] font-medium">starterCode</span> - Starter code template</div>
              <div><span className="text-[#1951FC] font-medium">solutionCode</span> - Official solution</div>
              <div><span className="text-[#1951FC] font-medium">hints</span> - Array of hints</div>
              <div><span className="text-[#1951FC] font-medium">tags</span> - Array of tags</div>
              <div><span className="text-[#1951FC] font-medium">timeLimit</span> - Time limit in ms (default: 2000)</div>
              <div><span className="text-[#1951FC] font-medium">memoryLimit</span> - Memory limit in MB (default: 256)</div>
              <div><span className="text-[#1951FC] font-medium">isPublished</span> - Publish immediately (default: false)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};