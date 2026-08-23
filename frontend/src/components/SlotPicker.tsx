import React from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { SlotInfo } from '../types';

interface SlotPickerProps {
  slots: SlotInfo[];
  selectedSlot: SlotInfo | null;
  onSelectSlot: (slot: SlotInfo) => void;
  isLoading?: boolean;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center text-ink-muted">
        <Clock className="w-6 h-6 animate-spin text-sage-700" />
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="py-8 text-center bg-white/60 rounded-2xl p-6 text-sm text-ink-muted border border-sage-200">
        No consultation slots available for this date. Please select another day.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((slot, idx) => {
        const isSelected = selectedSlot && slot.startTime === selectedSlot.startTime;
        const timeLabel = format(new Date(slot.startTime), 'hh:mm a');

        return (
          <button
            key={idx}
            disabled={!slot.available}
            onClick={() => onSelectSlot(slot)}
            className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
              !slot.available
                ? 'bg-sage-100/50 text-ink-muted/40 cursor-not-allowed line-through'
                : isSelected
                ? 'bg-sage-900 text-white shadow-pill scale-[1.02]'
                : 'bg-white/80 hover:bg-sage-100/80 border border-sage-200 text-ink hover:text-sage-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 opacity-70" />
            {timeLabel}
          </button>
        );
      })}
    </div>
  );
};
