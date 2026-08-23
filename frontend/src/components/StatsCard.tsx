import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatTile {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

interface StatsCardProps {
  tiles: StatTile[];
}

export const StatsCard: React.FC<StatsCardProps> = ({ tiles }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {tiles.map((tile, idx) => {
        const Icon = tile.icon;
        return (
          <div
            key={idx}
            className="card-glass rounded-[24px] p-5 shadow-glass border border-white/80 bg-white/75 backdrop-blur-xl flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-serif font-normal text-sage-900 tracking-tight">{tile.value}</p>
              <p className="text-xs text-ink-muted font-medium">{tile.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
