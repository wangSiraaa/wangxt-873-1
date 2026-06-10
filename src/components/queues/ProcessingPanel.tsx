import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { usePermission } from '@/hooks/usePermission';
import { CallCard } from './CallCard';
import { ArrowRightLeft, CheckCircle, RefreshCcw } from 'lucide-react';
import { sortCallNumbers, applyQuickFilter } from '@/rules';
import { QuickFilter } from '../QuickFilter';
import { QuickFilterState, DEFAULT_QUICK_FILTER } from '@/types';

export function ProcessingPanel() {
  const processingQueue = useAppStore((s) => s.processingQueue);
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const openTransferModal = useAppStore((s) => s.openTransferModal);
  const openFinishModal = useAppStore((s) => s.openFinishModal);
  const perm = usePermission(currentRole, currentAgentId);

  const [filter, setFilter] = useState<QuickFilterState>({ ...DEFAULT_QUICK_FILTER });

  const filtered = useMemo(() => {
    return applyQuickFilter(processingQueue, filter);
  }, [processingQueue, filter]);

  const sorted = [...filtered].sort(sortCallNumbers);

  return (
    <div className="glass-panel p-4 flex-1 min-h-0 flex flex-col">
      <div className="section-title">
        <RefreshCcw className="w-4 h-4 text-accent-green" />
        <span>处理中队列</span>
        <span className="text-xs text-text-secondary ml-auto">
          共 <span className="text-accent-green font-mono">{processingQueue.length}</span> 个
        </span>
      </div>

      <QuickFilter
        filter={filter}
        onChange={setFilter}
        totalCount={processingQueue.length}
        filteredCount={filtered.length}
      />

      <div className="text-[11px] text-text-secondary/60 mb-2 leading-relaxed">
        坐席正在处理的号码；可转派或完成；操作需验证身份与坐席状态
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary/50 py-12">
            <RefreshCcw className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">暂无处理中号码</p>
            <p className="text-xs mt-1 opacity-60">坐席接听后自动移入此队列</p>
          </div>
        ) : (
          sorted.map((call) => {
            const isMyCall = call.assignedAgentId === currentAgentId;
            const canTransfer = perm.canTransferCall(isMyCall, call.assignedAgentId || null);
            const canFinish = perm.canFinishCall(isMyCall, call.assignedAgentId || null);
            return (
              <CallCard
                key={call.id}
                call={call}
                variant="processing"
                extra={
                  <div className="flex gap-2">
                    <button
                      className={`btn-secondary flex-1 flex items-center justify-center gap-1 text-xs py-1.5 ${
                        canTransfer ? '' : 'opacity-40 cursor-not-allowed'
                      }`}
                      onClick={() => canTransfer && openTransferModal(call.id)}
                      disabled={!canTransfer}
                      title={canTransfer ? '' : '无权转派此号码'}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> 转派
                    </button>
                    <button
                      className={`btn-primary flex-1 flex items-center justify-center gap-1 text-xs py-1.5 ${
                        canFinish ? '' : 'opacity-40 cursor-not-allowed'
                      }`}
                      onClick={() => canFinish && openFinishModal(call.id)}
                      disabled={!canFinish}
                      title={canFinish ? '' : '无权完成此号码'}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> 完成
                    </button>
                  </div>
                }
              />
            );
          })
        )}
      </div>
    </div>
  );
}
