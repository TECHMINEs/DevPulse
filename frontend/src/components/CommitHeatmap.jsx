import React, { useMemo } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { getHeatmapColor } from '../utils/scoreUtils';

const CommitHeatmap = ({ data = [], days = 365 }) => {
  const heatmapData = useMemo(() => {
    // create a map of date -> count
    const countMap = {};
    let maxCount = 0;

    data.forEach(d => {
      const dateStr = d.date?.split('T')[0] || d.date;
      countMap[dateStr] = parseInt(d.count) || 0;
      maxCount = Math.max(maxCount, countMap[dateStr]);
    });

    // generate 52 weeks of data
    const today = new Date();
    const weeks = [];
    let currentDate = startOfWeek(subDays(today, days - 1), { weekStartsOn: 0 });

    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(currentDate, w * 7 + d);
        if (date > today) {
          week.push(null);
          continue;
        }
        const dateStr = format(date, 'yyyy-MM-dd');
        week.push({
          date: dateStr,
          count: countMap[dateStr] || 0,
          dayOfWeek: d,
        });
      }
      weeks.push(week);
    }

    return { weeks, maxCount };
  }, [data, days]);

  const cellSize = 13;
  const cellGap = 3;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="overflow-x-auto py-2">
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex ml-8 mb-1" style={{ gap: '0px' }}>
          {heatmapData.weeks.map((week, wi) => {
            if (wi === 0 || !week[0]) return <div key={wi} style={{ width: cellSize + cellGap }} />;
            const monthIdx = new Date(week[0].date).getMonth();
            const prevMonthIdx = wi > 0 && heatmapData.weeks[wi - 1][0]
              ? new Date(heatmapData.weeks[wi - 1][0].date).getMonth()
              : -1;
            return (
              <div key={wi} style={{ width: cellSize + cellGap }} className="text-[10px] text-surface-500">
                {monthIdx !== prevMonthIdx ? months[monthIdx] : ''}
              </div>
            );
          })}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap: cellGap }}>
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
              <div key={i} className="text-[10px] text-surface-500 flex items-center justify-end"
                style={{ height: cellSize, width: 24 }}>
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex" style={{ gap: cellGap }}>
            {heatmapData.weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: cellGap }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="rounded-sm transition-colors duration-200 hover:ring-1 hover:ring-surface-500 cursor-pointer group relative"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: day ? getHeatmapColor(day.count, heatmapData.maxCount) : 'transparent',
                    }}
                  >
                    {day && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-700 text-surface-200 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {day.count} commit{day.count !== 1 ? 's' : ''} on {day.date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 mt-3 ml-8">
          <span className="text-[10px] text-surface-500 mr-1">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: getHeatmapColor(intensity * heatmapData.maxCount, heatmapData.maxCount),
              }}
            />
          ))}
          <span className="text-[10px] text-surface-500 ml-1">More</span>
        </div>
      </div>
    </div>
  );
};

export default CommitHeatmap;
