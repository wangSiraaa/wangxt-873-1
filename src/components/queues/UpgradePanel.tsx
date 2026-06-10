import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { usePermission } from '@/hooks/usePermission';
import { CallCard } from './CallCard';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { sortCallNumbers, applyQuickFilter } from '@/rules';
import { useTimer } from '@/hooks/useTimer';
import { getSecondsSince, formatDuration } from '@/utils/time';
import { useConfig } from '@/config';
import { UserRole, QuickFilterState, DEFAULT_QUICK_FILTER } from '@/types';
import { QuickFilter } from '../QuickFilter';

export function UpgradePanel() {
  const upgradeQueue = useAppStore((s) => s.upgradeQueue);
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const openAssignModalFromUpgrade = useAppStore((s) => s.openAssignModalFromUpgrade);
  const perm = usePermission(currentRole, currentAgentId);
  const tick = useTimer(1000);
  void tick;
  const { UPGRADE_THRESHOLD_SECONDS } = useConfig();

  const [filter, setFilter] = useState<QuickFilterState>({ ...DEFAULT_QUICK_FILTER });

  const filtered = useMemo(() => {
    return applyQuickFilter(upgradeQueue, filter);
  }, [upgradeQueue, filter]);

  const sorted = [...filtered].sort(sortCallNumbers);
  const isMonitor = currentRole === UserRole.MONITOR;

  const totalOverdue = upgradeQueue.reduce(
    (sum, c) => sum + Math.max(0, getSecondsSince(c.enterPoolTime) - UPGRADE_THRESHOLD_SECONDS),
    0,
  );

  return (
    <div className="glass-panel p-4 flex-1 min-h-0 flex flex-col border-accent-red/20 border-t-4">
      <div className="section-title">
        <AlertTriangle className="w-4 h-4 text-accent-red" />
        <span className="text-accent-red">升级队列</span>
        <span className="text-xs text-text-secondary ml-auto flex items-center gap-3">
          <span>
            共 <span className="text-accent-red font-mono">{upgradeQueue.length}</span> 个
          </span>
          {upgradeQueue.length > 0 && (
            <span className="text-accent-orange">
              超时累计 {formatDuration(totalOverdue)}
            </span>
          )}
        </span>
      </div>

      <QuickFilter
        filter={filter}
        onChange={setFilter}
        totalCount={upgradeQueue.length}
        filteredCount={filtered.length}
      />

      <div className={`text-[11px] mb-2 leading-relaxed ${
        isMonitor ? 'text-accent-red/80' : 'text-text-secondary/60'
      }`}>
        {isMonitor
          ? '⚠ 班长专属：等待超时的号码，请尽快分派处理（可点击分派坐席）'
          : '普通坐席无权限操作此队列；等待超时号码自动移入此处，需班长处理'}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary/50 py-12">
            <ShieldCheck className="w-8 h-8 mb-2 opacity-40 text-accent-green" />
            <p className="text-sm">升级队列为空</p>
            <p className="text-xs mt-1 opacity-60">无超时未分派的号码</p>
          </div>
        ) : (
          sorted.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              variant="upgrade"
              extra={
                isMonitor ? (
                  <button
                    className="btn-primary w-full flex items-center justify-center gap-1.5 text-xs py-1.5"
                    onClick={() => openAssignModalFromUpgrade(call.id)}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> 班长分派
                  </button>
                ) : (
                  <div className="text-xs text-text-secondary/50 text-center py-1 italic">
                    （需班长权限才可分派）
                  </div>
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
