import { AgentStatus, AGENT_STATUS_LABEL } from '@/types';

interface Props {
  status: AgentStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showLabel = true, size = 'sm' }: Props) {
  const configs: Record<AgentStatus, { ledClass: string; chipClass: string; animClass: string }> = {
    idle: {
      ledClass: 'bg-accent-green',
      chipClass: 'bg-accent-green/15 text-accent-green',
      animClass: 'animate-pulse-green',
    },
    busy: {
      ledClass: 'bg-accent-orange',
      chipClass: 'bg-accent-orange/15 text-accent-orange',
      animClass: 'animate-pulse-orange',
    },
    paused: {
      ledClass: 'bg-accent-purple',
      chipClass: 'bg-accent-purple/15 text-accent-purple',
      animClass: 'animate-pulse-purple',
    },
    offline: {
      ledClass: 'bg-text-secondary/60',
      chipClass: 'bg-white/5 text-text-secondary',
      animClass: '',
    },
  };
  const c = configs[status];
  const ledSize = size === 'sm' ? 'status-led' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${ledSize} rounded-full ${c.ledClass} ${c.animClass}`} />
      {showLabel && (
        <span className={`chip ${c.chipClass}`}>{AGENT_STATUS_LABEL[status]}</span>
      )}
    </span>
  );
}
