import { CallNumber, PROBLEM_TYPE_LABEL } from '@/types';
import { CustomerStars } from '../CustomerStars';
import { useTimer } from '@/hooks/useTimer';
import { getSecondsSince, formatDuration, formatTime } from '@/utils/time';
import { useConfig } from '@/config';
import { isWarningCloseToUpgrade } from '@/rules';
import { Phone, AlertTriangle, Zap, History } from 'lucide-react';
import { CUSTOMER_LEVEL_LABEL } from '@/types';
import { useAppStore } from '@/store';

interface Props {
  call: CallNumber;
  extra?: React.ReactNode;
  variant?: 'pool' | 'processing' | 'upgrade' | 'finished';
}

export function CallCard({ call, extra, variant = 'pool' }: Props) {
  const agents = useAppStore((s) => s.agents);
  const tick = useTimer(1000);
  const { UPGRADE_THRESHOLD_SECONDS } = useConfig();
  void tick;

  const agent = call.assignedAgentId
    ? agents.find((a) => a.id === call.assignedAgentId)
    : null;

  const waited = getSecondsSince(call.enterPoolTime);
  const remaining = Math.max(0, UPGRADE_THRESHOLD_SECONDS - waited);
  const isWarn = variant !== 'finished' && isWarningCloseToUpgrade(waited, UPGRADE_THRESHOLD_SECONDS);
  const isOverdue = variant !== 'finished' && waited >= UPGRADE_THRESHOLD_SECONDS;

  const borderSide =
    variant === 'upgrade'
      ? 'border-l-accent-red animate-border-flash'
      : call.isHighPriority
      ? 'border-l-accent-purple'
      : call.isBlacklisted
      ? 'border-l-accent-red'
      : 'border-l-accent-cyan';

  return (
    <div
      className={`relative glass-panel p-3 border-l-4 ${borderSide} card-hover`}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 pt-0.5">
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center border ${
              call.isBlacklisted
                ? 'bg-accent-red/10 border-accent-red/30'
                : call.isHighPriority
                ? 'bg-accent-purple/10 border-accent-purple/30'
                : 'bg-gradient-cyan border-accent-cyan/20'
            }`}
          >
            <Phone
              className={`w-4 h-4 ${
                call.isBlacklisted
                  ? 'text-accent-red'
                  : call.isHighPriority
                  ? 'text-accent-purple'
                  : 'text-accent-cyan'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-sm font-bold text-text-primary truncate">
                {call.phoneNumber}
              </span>
              <CustomerStars level={call.customerLevel} />
              {call.isHighPriority && (
                <span className="chip bg-accent-purple/15 text-accent-purple flex items-center gap-0.5">
                  <Zap className="w-3 h-3" /> VIP高优
                </span>
              )}
              {call.isBlacklisted && (
                <span className="chip bg-accent-red/15 text-accent-red flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" /> 黑名单
                </span>
              )}
            </div>

            {variant !== 'finished' && (
              <div className="flex-shrink-0 text-right">
                <div
                  className={`font-mono text-xs font-bold tabular-nums ${
                    isOverdue
                      ? 'text-accent-red animate-pulse-red'
                      : isWarn
                      ? 'text-accent-orange animate-breath-warn'
                      : 'text-accent-green'
                  }`}
                >
                  {variant === 'upgrade'
                    ? `已超时 ${formatDuration(waited - UPGRADE_THRESHOLD_SECONDS)}`
                    : isOverdue
                    ? '触发升级'
                    : `剩余 ${formatDuration(remaining)}`}
                </div>
                <div className="text-[10px] text-text-secondary/70 font-mono">
                  等 {formatDuration(waited)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary">
            <span className="chip bg-accent-cyan/10 text-accent-cyan">
              {PROBLEM_TYPE_LABEL[call.problemType]}
            </span>
            <span className="flex items-center gap-0.5">
              <History className="w-3 h-3" />
              {CUSTOMER_LEVEL_LABEL[call.customerLevel]}
            </span>
            <span className="font-mono text-[10px] text-text-secondary/60">
              入池 {formatTime(call.enterPoolTime)}
            </span>
            {agent && (
              <span className="text-accent-green">
                → {agent.name}
              </span>
            )}
          </div>

          {call.remarks && (
            <div className="mt-1.5 text-xs text-text-secondary/70 bg-white/3 px-2 py-1 rounded border border-white/5">
              备注: {call.remarks}
            </div>
          )}

          {variant === 'upgrade' && call.upgradeRecord && (
            <div className="mt-2 bg-accent-red/5 border border-accent-red/20 rounded px-2 py-1.5">
              <div className="text-[11px] text-accent-red/90 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                升级原因：等待超 {Math.round(UPGRADE_THRESHOLD_SECONDS / 60)} 分钟未分派
              </div>
              <div className="text-[10px] text-text-secondary/70 mt-0.5 font-mono">
                升级于 {formatTime(call.upgradeRecord.upgradeAt)} · 来源：
                {call.upgradeRecord.source}
              </div>
            </div>
          )}

          {extra && <div className="mt-2">{extra}</div>}
        </div>
      </div>
    </div>
  );
}
