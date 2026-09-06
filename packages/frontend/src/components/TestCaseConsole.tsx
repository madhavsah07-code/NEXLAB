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
    return <p className="text-sm text-[#5C6360]">No test cases available</p>;
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
        <span className="text-xs text-[#5C6360]">Test Cases</span>
        {hasResult && (
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${
              getPassedVisibleCount() === getTotalVisibleCount() && result.status === 'accepted'
                ? 'text-[#10B981]' 
                : 'text-[#F87171]'
            }`}>
              {getPassedVisibleCount()} / {getTotalVisibleCount()} visible passed
              {result.totalTests > getTotalVisibleCount() && 
                ` (${result.totalTests} total)`
              }
            </span>
            {result.status && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                result.status === 'accepted'
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-[#F87171]/20 text-[#F87171] border border-[#F87171]/30'
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
                  ? 'border-[#10B981]/50 bg-[#10B981]/5' 
                  : hasResultForTest 
                    ? passed 
                      ? 'border-[#10B981]/30 bg-[#0D0F0F]' 
                      : 'border-[#F87171]/30 bg-[#0D0F0F]'
                    : 'border-[#2A302E] bg-[#0D0F0F]'
              } hover:border-[#10B981]/30 transition-colors`}
            >
              {/* Test Case Header - Clickable */}
              <div 
                className={`p-3 cursor-pointer flex items-center justify-between ${
                  isSelected ? 'bg-[#10B981]/10 rounded-t-lg' : ''
                }`}
                onClick={() => setSelectedTestCase(index)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {!hasResultForTest ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#2A302E] flex items-center justify-center">
                        <span className="text-xs text-[#5C6360]">{index + 1}</span>
                      </div>
                    ) : passed ? (
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#F87171]" />
                    )}
                  </div>

                  {/* Test Case Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#EDEFEE]">
                        Test Case {index + 1}
                      </span>
                      {hasResultForTest && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          passed 
                            ? 'bg-[#10B981]/20 text-[#10B981]' 
                            : 'bg-[#F87171]/20 text-[#F87171]'
                        }`}>
                          {passed ? 'Passed ✅' : 'Failed ❌'}
                        </span>
                      )}
                      {testResult?.runtime !== undefined && testResult.runtime > 0 && (
                        <span className="text-xs text-[#5C6360]">
                          {testResult.runtime}ms
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#5C6360] truncate">
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
                  className="p-1 text-[#5C6360] hover:text-[#EDEFEE] transition-colors flex-shrink-0"
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
                <div className="p-3 pt-0 border-t border-[#2A302E] space-y-2">
                  {/* Input */}
                  <div className="bg-[#0D0F0F] rounded-lg p-2">
                    <span className="text-xs text-[#5C6360]">Input:</span>
                    <pre className="text-sm text-[#EDEFEE] font-mono mt-1 whitespace-pre-wrap break-all">
                      {testCase.input}
                    </pre>
                  </div>

                  {/* Expected Output */}
                  <div className="bg-[#0D0F0F] rounded-lg p-2">
                    <span className="text-xs text-[#5C6360]">Expected Output:</span>
                    <pre className="text-sm text-[#10B981] font-mono mt-1 whitespace-pre-wrap break-all">
                      {testCase.expectedOutput}
                    </pre>
                  </div>

                  {/* Actual Output - Only if executed */}
                  {hasResultForTest && (
                    <div className="bg-[#0D0F0F] rounded-lg p-2">
                      <span className="text-xs text-[#5C6360]">Your Output:</span>
                      <pre className={`text-sm font-mono mt-1 whitespace-pre-wrap break-all ${
                        passed ? 'text-[#10B981]' : testResult.got ? 'text-[#F87171]' : 'text-[#5C6360] italic'
                      }`}>
                        {testResult.got || 'No output'}
                      </pre>
                    </div>
                  )}

                  {/* Error Message */}
                  {hasResultForTest && testResult.error && (
                    <div className="bg-[#F87171]/10 rounded-lg p-2 border border-[#F87171]/20">
                      <span className="text-xs text-[#F87171]">Error:</span>
                      <pre className="text-sm text-[#F87171] font-mono mt-1 whitespace-pre-wrap break-all">
                        {testResult.error}
                      </pre>
                    </div>
                  )}

                  {/* Runtime Info */}
                  {hasResultForTest && testResult.runtime !== undefined && (
                    <div className="flex items-center gap-4 text-xs text-[#5C6360]">
                      <span>⏱️ Runtime: <span className="text-[#EDEFEE]">{testResult.runtime}ms</span></span>
                      {testResult.memory !== undefined && (
                        <span>💾 Memory: <span className="text-[#EDEFEE]">{testResult.memory}MB</span></span>
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
            ? 'bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]'
            : 'bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171]'
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
        <div className="mt-2 text-xs text-[#5C6360]">
          <span>🔒 {result.totalTests - visibleTestCases.length} hidden test case(s) not shown</span>
          {result.status === 'accepted' && (
            <span className="ml-2 text-[#10B981]">(All passed!)</span>
          )}
          {result.status === 'wrong_answer' && getPassedVisibleCount() === getTotalVisibleCount() && (
            <span className="ml-2 text-[#F87171]">(Some hidden tests failed)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCaseConsole;