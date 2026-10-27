// packages/frontend/src/components/SubmissionHistory.tsx

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { formatSubmissionDate } from '../utils/dateUtils';

interface SubmissionHistoryProps {
  submissions: any[];
  getStatusIcon: (status: string) => JSX.Element;
  getStatusColor: (status: string) => string;
  problemTitle?: string;
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  getStatusIcon,
  getStatusColor,
  problemTitle,
}) => {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-[#5BB8FB] py-8">
        <FileText className="w-12 h-12 mb-4 opacity-40" />
        <p className="font-medium text-[#CBE9FD]">No submissions yet</p>
        <p className="text-sm">
          {problemTitle
            ? `You haven't submitted any solutions for "${problemTitle}" yet.`
            : 'Submit your solution to see it here.'}
        </p>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      accepted: 'Accepted',
      wrong_answer: 'Wrong Answer',
      time_limit: 'Time Limit Exceeded',
      memory_limit: 'Memory Limit Exceeded',
      runtime_error: 'Runtime Error',
      compile_error: 'Compile Error',
      pending: 'Pending',
    };
    return map[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const map: Record<string, string> = {
      accepted: 'bg-[#1951FC]/20 text-[#1951FC] border-[#1951FC]/30',
      wrong_answer: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
      time_limit: 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30',
      memory_limit: 'bg-[#3781FC]/20 text-[#3781FC] border-[#3781FC]/30',
      runtime_error: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
      compile_error: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
      pending: 'bg-[#5BB8FB]/20 text-[#5BB8FB] border-[#5BB8FB]/30',
    };
    return map[status] || 'bg-[#0B2CB1] text-[#CBE9FD]';
  };

  return (
    <div className="space-y-2">
      {problemTitle && (
        <div className="text-xs text-[#5BB8FB] mb-3">
          Showing submissions for: <span className="text-[#FFFFFF] font-medium">{problemTitle}</span>
        </div>
      )}

      {submissions.slice(0, 20).map((sub, index) => {
        const status = sub.status || 'pending';

        return (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-[#03195B] border border-[#0B2CB1] rounded-lg hover:bg-[#0B2CB1] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {getStatusIcon(status)}
              <div className="min-w-0">
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                  {getStatusDisplay(status)}
                </span>
                {!problemTitle && sub.problemId?.title && (
                  <p className="text-xs text-[#5BB8FB] truncate">{sub.problemId.title}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-[#5BB8FB] mt-0.5">
                  <span>Runtime: {sub.runtime || 0}ms</span>
                  <span>Memory: {sub.memory || 0}MB</span>
                  <span>{sub.passedTests || 0}/{sub.totalTests || 0} tests</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end text-xs text-[#5BB8FB] flex-shrink-0 ml-3">
              {/* ✅ Use IST format */}
              <span>{formatSubmissionDate(sub.createdAt || sub.submittedAt)}</span>
            </div>
          </div>
        );
      })}

      {submissions.length > 20 && (
        <div className="text-center text-xs text-[#5BB8FB] pt-2">
          Showing 20 of {submissions.length} submissions
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;