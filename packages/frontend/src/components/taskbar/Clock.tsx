// packages/frontend/src/components/taskbar/Clock.tsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { TaskbarSize } from '../../core/theme-engine/themeStore';

interface ClockProps {
  size?: TaskbarSize;
}

export const Clock = ({ size = "medium" }: ClockProps) => {
  const [time, setTime] = useState(new Date());

  const sizeConfig = {
    small: { timeSize: "text-xs", dateSize: "text-xs" },
    medium: { timeSize: "text-sm", dateSize: "text-xs" },
    large: { timeSize: "text-base", dateSize: "text-sm" },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  // Format the time nicely, e.g., "4:30 PM"
  return (
    <div className="flex flex-col items-center text-[color:var(--text-primary)]">
      <div className={`${config.timeSize} font-bold tabular-nums tracking-wide`}>
        {format(time, 'h:mm a')}
      </div>
      <div className={`${config.dateSize} font-medium text-[color:var(--text-secondary)] tabular-nums`}>
        {format(time, 'MMM d')}
      </div>
    </div>
  );
};