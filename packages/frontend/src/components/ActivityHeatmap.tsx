// packages/frontend/src/components/ActivityHeatmap.tsx

import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { Calendar } from 'lucide-react';
import 'react-calendar-heatmap/dist/styles.css';
import { formatISTDateOnly } from '../utils/dateUtils';

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  // ✅ Use IST date for end date
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);

  const endDate = new Date(istNow);
  const startDate = new Date(istNow);
  startDate.setFullYear(startDate.getFullYear() - 1);

  return (
    <div className="bg-[#03195B] border border-[#0B2CB1] rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#1951FC]" />
        <h3 className="text-sm font-medium text-[#FFFFFF]">Coding Activity</h3>
        <span className="text-xs text-[#5BB8FB] ml-auto">Last 365 days (IST)</span>
      </div>
      <div className="overflow-x-auto">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={data}
          classForValue={(value) => {
            if (!value || value.count === 0) return 'color-empty';
            if (value.count === 1) return 'color-scale-1';
            if (value.count === 2) return 'color-scale-2';
            if (value.count === 3) return 'color-scale-3';
            if (value.count === 4) return 'color-scale-4';
            return 'color-scale-5';
          }}
          gutterSize={2}
          showWeekdayLabels={true}
          weekdayLabels={['S', 'M', 'T', 'W', 'T', 'F', 'S']}
        />
      </div>
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-xs text-[#5BB8FB]">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-[#000000]" />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }} />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.4)' }} />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.6)' }} />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.8)' }} />
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1951FC' }} />
        </div>
        <span className="text-xs text-[#5BB8FB]">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;