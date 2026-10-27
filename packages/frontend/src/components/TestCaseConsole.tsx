// packages/frontend/src/components/TestCaseConsole.tsx

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface TestCaseConsoleProps {
  visibleTestCases: any[];
  result: any;
  selectedTestCase: number;
  setSelectedTestCase: (index: number) => void;
  getPassedVisibleCount: () => number;
  getTotalVisibleCount: () => number;
  getTestCaseResult: (index: number) => any;
}

export const TestCaseConsole: React.FC<TestCaseConsoleProps> = ({
  visibleTestCases,
  result,
  selectedTestCase,
  setSelectedTestCase,
  getPassedVisibleCount,
  getTotalVisibleCount,
  getTestCaseResult,
}) => {
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});

  if (visibleTestCases.length === 0) {
    return <p className="text-sm text-[#5BB8FB]">No test cases available</p>;
  }

  const toggleExpand = (index: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const hasResult = result !== null && result !== undefined;

  return (
    <div>
      {/* Summary Bar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-xs text-[#5BB8FB]">Test Cases</span>
        {hasResult && (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${
              getPassedVisibleCount() === getTotalVisibleCount() && result.status === 'accepted'
                ? 'text-[#1951FC]'
                : 'text-[#5BB8FB]'
            }`}>
              {getPassedVisibleCount()} / {getTotalVisibleCount()} visible passed
              {result.totalTests > getTotalVisibleCount() &&
                ` (${result.totalTests} total)`
              }
            </span>
            {result.status && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                result.status === 'accepted'
                  ? 'bg-[#1951FC]/20 text-[#1951FC] border border-[#1951FC]/30'
                  : 'bg-[#5BB8FB]/20 text-[#5BB8FB] border border-[#5BB8FB]/30'
              }`}>
                {result.status === 'accepted' ? '✅ Accepted' : '❌ Failed'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Test Case List */}
      <div className="space-y-2">
        {visibleTestCases.map((testCase: any, index: number) => {
          const testResult = getTestCaseResult(index);
          const hasResultForTest = testResult !== null && testResult !== undefined;
          const passed = hasResultForTest && testResult.passed;
          const isSelected = selectedTestCase === index;
          const isExpanded = expandedResults[index] || false;

          return (
            <div
              key={index}
              className={`rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'border-[#1951FC]/50 bg-[#1951FC]/5'
                  : hasResultForTest
                    ? passed
                      ? 'border-[#1951FC]/30 bg-[#000000]'
                      : 'border-[#5BB8FB]/30 bg-[#000000]'
                    : 'border-[#0B2CB1] bg-[#000000]'
              } hover:border-[#1951FC]/30 transition-colors`}
            >
              {/* Test Case Header - Clickable */}
              <div
                className={`p-3 cursor-pointer flex items-center justify-between ${
                  isSelected ? 'bg-[#1951FC]/10 rounded-t-lg' : ''
                }`}
                onClick={() => setSelectedTestCase(index)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {!hasResultForTest ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#0B2CB1] flex items-center justify-center">
                        <span className="text-xs text-[#5BB8FB]">{index + 1}</span>
                      </div>
                    ) : passed ? (
                      <CheckCircle className="w-5 h-5 text-[#1951FC]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#5BB8FB]" />
                    )}
                  </div>

                  {/* Test Case Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#FFFFFF]">
                        Test Case {index + 1}
                      </span>
                      {hasResultForTest && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          passed
                            ? 'bg-[#1951FC]/20 text-[#1951FC]'
                            : 'bg-[#5BB8FB]/20 text-[#5BB8FB]'
                        }`}>
                          {passed ? 'Passed ✅' : 'Failed ❌'}
                        </span>
                      )}
                      {testResult?.runtime !== undefined && testResult.runtime > 0 && (
                        <span className="text-xs text-[#5BB8FB]">
                          {testResult.runtime}ms
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5BB8FB] truncate">
                      Input: {testCase.input.substring(0, 50)}
                      {testCase.input.length > 50 && '...'}
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(index);
                  }}
                  className="p-1 text-[#5BB8FB] hover:text-[#FFFFFF] transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-3 pt-0 border-t border-[#0B2CB1] space-y-2">
                  {/* Input */}
                  <div className="bg-[#000000] rounded-lg p-2">
                    <span className="text-xs text-[#5BB8FB]">Input:</span>
                    <pre className="text-sm text-[#FFFFFF] font-mono mt-1 whitespace-pre-wrap break-all">
                      {testCase.input}
                    </pre>
                  </div>

                  {/* Expected Output */}
                  <div className="bg-[#000000] rounded-lg p-2">
                    <span className="text-xs text-[#5BB8FB]">Expected Output:</span>
                    <pre className="text-sm text-[#1951FC] font-mono mt-1 whitespace-pre-wrap break-all">
                      {testCase.expectedOutput}
                    </pre>
                  </div>

                  {/* Actual Output - Only if executed */}
                  {hasResultForTest && (
                    <div className="bg-[#000000] rounded-lg p-2">
                      <span className="text-xs text-[#5BB8FB]">Your Output:</span>
                      <pre className={`text-sm font-mono mt-1 whitespace-pre-wrap break-all ${
                        passed ? 'text-[#1951FC]' : testResult.got ? 'text-[#5BB8FB]' : 'text-[#5BB8FB] italic'
                      }`}>
                        {testResult.got || 'No output'}
                      </pre>
                    </div>
                  )}

                  {/* Error Message */}
                  {hasResultForTest && testResult.error && (
                    <div className="bg-[#5BB8FB]/10 rounded-lg p-2 border border-[#5BB8FB]/20">
                      <span className="text-xs text-[#5BB8FB]">Error:</span>
                      <pre className="text-sm text-[#5BB8FB] font-mono mt-1 whitespace-pre-wrap break-all">
                        {testResult.error}
                      </pre>
                    </div>
                  )}

                  {/* Runtime Info */}
                  {hasResultForTest && testResult.runtime !== undefined && (
                    <div className="flex items-center gap-4 text-xs text-[#5BB8FB]">
                      <span>⏱️ Runtime: <span className="text-[#FFFFFF]">{testResult.runtime}ms</span></span>
                      {testResult.memory !== undefined && (
                        <span>💾 Memory: <span className="text-[#FFFFFF]">{testResult.memory}MB</span></span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Message */}
      {hasResult && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          getPassedVisibleCount() === getTotalVisibleCount() && result.status === 'accepted'
            ? 'bg-[#1951FC]/10 border border-[#1951FC]/20 text-[#1951FC]'
            : 'bg-[#5BB8FB]/10 border border-[#5BB8FB]/20 text-[#5BB8FB]'
        }`}>
          {getPassedVisibleCount() === getTotalVisibleCount() && result.status === 'accepted' ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>🎉 All {result.totalTests} test cases passed!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>
                {getPassedVisibleCount()} of {getTotalVisibleCount()} visible test cases passed.
                {result.totalTests > getTotalVisibleCount() &&
                  ` ${result.totalTests - getTotalVisibleCount()} hidden test(s) not shown.`
                }
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hidden Test Cases Info */}
      {result && result.totalTests > visibleTestCases.length && (
        <div className="mt-2 text-xs text-[#5BB8FB]">
          <span>🔒 {result.totalTests - visibleTestCases.length} hidden test case(s) not shown</span>
          {result.status === 'accepted' && (
            <span className="ml-2 text-[#1951FC]">(All passed!)</span>
          )}
          {result.status === 'wrong_answer' && getPassedVisibleCount() === getTotalVisibleCount() && (
            <span className="ml-2 text-[#5BB8FB]">(Some hidden tests failed)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCaseConsole;