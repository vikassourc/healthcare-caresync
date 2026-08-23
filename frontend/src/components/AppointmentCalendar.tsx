import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AppointmentCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  highlightedDates?: Date[];
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onSelectDate,
  highlightedDates = []
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const hasEvent = (day: Date) =>
    highlightedDates.some((hDay) => isSameDay(new Date(hDay), day));

  return (
    <div className="card-glass rounded-[28px] p-6 sm:p-7 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif font-normal text-sage-900 text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-sage-100 text-ink-muted hover:text-sage-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-sage-100 text-ink-muted hover:text-sage-900 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="text-xs font-bold text-ink-muted/60 py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasDot = hasEvent(day);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`relative h-10 w-10 mx-auto flex flex-col items-center justify-center rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                !isCurrentMonth
                  ? 'text-ink-muted/30'
                  : isSelected
                  ? 'bg-sage-900 text-white shadow-md'
                  : isToday(day)
                  ? 'bg-sage-100 text-sage-900'
                  : 'text-ink hover:bg-sage-100/70'
              }`}
            >
              <span>{format(day, 'd')}</span>
              {hasDot && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-sage-700 absolute bottom-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
