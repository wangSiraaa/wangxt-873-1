import { Star } from 'lucide-react';
import { CustomerLevel } from '@/types';

interface Props {
  level: CustomerLevel;
  size?: 'sm' | 'md';
}

export function CustomerStars({ level, size = 'sm' }: Props) {
  const count = Number(level) || 1;
  const sizePx = size === 'sm' ? 12 : 14;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          width={sizePx}
          height={sizePx}
          fill={i < count ? '#F59E0B' : 'transparent'}
          stroke={i < count ? '#F59E0B' : 'rgba(148,163,184,0.4)'}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}
