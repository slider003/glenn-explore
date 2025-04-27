import { Button } from '../../../shared/components/ui/button';
import { startOfDay, subDays, startOfMonth, endOfDay } from 'date-fns';

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ selectedRange, onRangeChange }: TimeRangeSelectorProps) {
  const timeRanges: TimeRange[] = [
    {
      label: 'Today',
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date())
    },
    {
      label: 'Yesterday',
      startDate: startOfDay(subDays(new Date(), 1)),
      endDate: endOfDay(subDays(new Date(), 1))
    },
    {
      label: 'Last 7 Days',
      startDate: startOfDay(subDays(new Date(), 7)),
      endDate: endOfDay(new Date())
    },
    {
      label: 'Last 30 Days',
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date())
    },
    {
      label: 'This Month',
      startDate: startOfMonth(new Date()),
      endDate: endOfDay(new Date())
    }
  ];

  return (
    <div className="flex items-center gap-2 mb-6">
      <div className="text-sm font-medium text-muted-foreground mr-2">Time Range:</div>
      <div className="flex gap-2">
        {timeRanges.map((range) => (
          <Button
            key={range.label}
            variant={selectedRange.label === range.label ? "secondary" : "outline"}
            size="sm"
            onClick={() => onRangeChange(range)}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
