import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  result: any;
  problem: any;
}

export const StatusBar: React.FC<StatusBarProps> = ({ result, problem }) => {
  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      accepted: <CheckCircle className="w-4 h-4 text-[#1951FC]" />,
      wrong_answer: <XCircle className="w-4 h-4 text-[#5BB8FB]" />,
      time_limit: <Clock className="w-4 h-4 text-[#3781FC]" />,
      memory_limit: <AlertCircle className="w-4 h-4 text-[#3781FC]" />,
      runtime_error: <XCircle className="w-4 h-4 text-[#5BB8FB]" />,
      compile_error: <XCircle className="w-4 h-4 text-[#5BB8FB]" />,
    };
    return icons[status] || <AlertCircle className="w-4 h-4 text-[#5BB8FB]" />;
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

  return (
    <div className="bg-[#03195B] border-t border-[#0B2CB1] px-4 py-1.5 flex items-center justify-between text-xs text-[#5BB8FB] flex-shrink-0">
      <div className="flex items-center gap-4">
        {result ? (
          <>
            <div className={`flex items-center gap-1.5 ${getStatusColor(result.status)}`}>
              {getStatusIcon(result.status)}
              <span className="font-medium">{getStatusText(result.status)}</span>
            </div>
            {result.runtime !== undefined && (
              <span>Runtime: <span className="text-[#FFFFFF]">{result.runtime}ms</span></span>
            )}
            {result.memory !== undefined && (
              <span>Memory: <span className="text-[#FFFFFF]">{result.memory}MB</span></span>
            )}
            {result.passedTests !== undefined && result.totalTests !== undefined && (
              <span>Tests: <span className={result.passedTests === result.totalTests ? 'text-[#1951FC]' : 'text-[#5BB8FB]'}>
                {result.passedTests}/{result.totalTests}
              </span> passed</span>
            )}
          </>
        ) : (
          <>
            <span>JavaScript</span>
            <span>•</span>
            <span>{problem?.timeLimit || 2000}ms</span>
            <span>•</span>
            <span>{problem?.memoryLimit || 256}MB</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>Ln 1, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};