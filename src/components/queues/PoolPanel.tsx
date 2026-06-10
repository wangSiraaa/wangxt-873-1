import { useAppStore } from '@/store';
import { usePermission } from '@/hooks/usePermission';
import { sortCallNumbers } from '@/rules';
import { CallCard } from './CallCard';
import { ArrowUpDown, UserPlus } from 'lucide-react';
import { useConfig } from '@/config';
import { useTimer } from '@/hooks/useTimer';
import { getSecondsSince } from '@/utils/time';

export function PoolPanel() {
  const poolQueue = useAppStore((s) => s.poolQueue);
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const openAssignModal = useAppStore((s) => s.openAssignModal);
  const perm = usePermission(currentRole, currentAgentId);
  const { UPGRADE_THRESHOLD_SECONDS } = useConfig();
  const tick = useTimer(1000);
  void tick;

  const sorted = [...poolQueue].sort(sortCallNumbers);

  const nearUpgrade = poolQueue.filter(
    (c) => getSecondsSince(c.enterPoolTime) >= UPGRADE_THRESHOLD_SECONDS - 30,
  ).length;

  return (
    <div className="glass-panel p-4 flex-1 min-h-0 flex flex-col">
      <div className="section-title">
        <ArrowUpDown className="w-4 h-4 text-accent-cyan" />
        <span>候选排队池</span>
        <span className="text-xs text-text-secondary ml-auto flex items-center gap-3">
          <span>
            共 <span className="text-accent-cyan font-mono">{poolQueue.length}</span> 个
          </span>
          {nearUpgrade > 0 && (
            <span className="text-accent-orange animate-breath-warn">
              ⚠ {nearUpgrade} 个接近超时
            </span>
          )}
        </span>
      </div>

      <div className="text-[11px] text-text-secondary/60 mb-2 leading-relaxed">
        排序规则：VIP高优 → 客户星级 → 入池时间；超过 {UPGRADE_THRESHOLD_SECONDS / 60} 分钟自动升级到班长
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary/50 py-12">
            <ArrowUpDown className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">候选池暂无号码</p>
            <p className="text-xs mt-1 opacity-60">新呼叫将自动进入此处</p>
          </div>
        ) : (
          sorted.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              variant="pool"
              extra={
                perm.canAssignAny() && (
                  <button
                    className="btn-primary w-full flex items-center justify-center gap-1.5 text-xs py-1.5"
                    onClick={() => openAssignModal(call.id)}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> 分派坐席
                  </button>
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
