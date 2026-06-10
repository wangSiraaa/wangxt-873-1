import { useAppStore } from '@/store';
import { Clock, Users, CheckCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { getSecondsSince, formatDuration } from '@/utils/time';

interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradientClass: string;
  accentColor: string;
}

export function StatsCards() {
  const poolQueue = useAppStore((s) => s.poolQueue);
  const processingQueue = useAppStore((s) => s.processingQueue);
  const upgradeQueue = useAppStore((s) => s.upgradeQueue);
  const finishedRecords = useAppStore((s) => s.finishedRecords);
  const tick = useTimer(1000);

  const _ = tick;

  const allWaits = poolQueue
    .concat(processingQueue)
    .map((c) => getSecondsSince(c.enterPoolTime));
  const avgWait =
    allWaits.length > 0
      ? Math.round(allWaits.reduce((a, b) => a + b, 0) / allWaits.length)
      : 0;

  const items: StatItem[] = [
    {
      label: '排队中',
      value: poolQueue.length,
      sub: '候选池待分派',
      icon: <ArrowUpDown className="w-5 h-5" />,
      gradientClass: 'bg-gradient-cyan',
      accentColor: 'text-accent-cyan',
    },
    {
      label: '处理中',
      value: processingQueue.length,
      sub: '坐席正在处理',
      icon: <Users className="w-5 h-5" />,
      gradientClass: 'bg-gradient-green',
      accentColor: 'text-accent-green',
    },
    {
      label: '已升级',
      value: upgradeQueue.length,
      sub: '超时待班长指派',
      icon: <AlertCircle className="w-5 h-5" />,
      gradientClass: 'bg-gradient-red',
      accentColor: 'text-accent-red',
    },
    {
      label: '已完成',
      value: finishedRecords.length,
      sub: '当班已归档',
      icon: <CheckCircle2 className="w-5 h-5" />,
      gradientClass: 'bg-gradient-orange',
      accentColor: 'text-accent-orange',
    },
    {
      label: '平均等待',
      value: formatDuration(avgWait),
      sub: '进入池起计时',
      icon: <Clock className="w-5 h-5" />,
      gradientClass: 'bg-gradient-purple',
      accentColor: 'text-accent-purple',
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-4">
      {items.map((it) => (
        <div
          key={it.label}
          className={`relative overflow-hidden glass-panel p-4 card-hover ${it.gradientClass} grain`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-text-secondary mb-1">{it.label}</p>
              <p className={`text-2xl font-bold font-mono ${it.accentColor} tracking-tight`}>
                {it.value}
              </p>
              <p className="text-[11px] text-text-secondary/80 mt-1">{it.sub}</p>
            </div>
            <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${it.accentColor}`}>
              {it.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
