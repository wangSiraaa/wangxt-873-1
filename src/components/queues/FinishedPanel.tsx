import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { CallCard } from './CallCard';
import { ClipboardList, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatTime } from '@/utils/time';
import { CallStatus, CALL_STATUS_LABEL, QuickFilterState, DEFAULT_QUICK_FILTER } from '@/types';
import { applyQuickFilter } from '@/rules';
import { QuickFilter } from '../QuickFilter';

export function FinishedPanel() {
  const finishedRecords = useAppStore((s) => s.finishedRecords);

  const [filter, setFilter] = useState<QuickFilterState>({ ...DEFAULT_QUICK_FILTER });

  const filtered = useMemo(() => {
    return applyQuickFilter(finishedRecords, filter);
  }, [finishedRecords, filter]);

  return (
    <div className="glass-panel p-4 flex-1 min-h-0 flex flex-col">
      <div className="section-title">
        <ClipboardList className="w-4 h-4 text-accent-orange" />
        <span>当班已完成</span>
        <span className="text-xs text-text-secondary ml-auto">
          共 <span className="text-accent-orange font-mono">{finishedRecords.length}</span> 条
        </span>
      </div>

      <QuickFilter
        filter={filter}
        onChange={setFilter}
        totalCount={finishedRecords.length}
        filteredCount={filtered.length}
      />

      <div className="text-[11px] text-text-secondary/60 mb-2 leading-relaxed">
        已处理归档号码，含转派历史、升级记录和处理结果，可导出CSV
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary/50 py-12">
            <ClipboardList className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">暂无完成记录</p>
            <p className="text-xs mt-1 opacity-60">号码完成后会归档到此</p>
          </div>
        ) : (
          filtered.map((call) => {
            const hasTransfer = call.transferRecords && call.transferRecords.length > 0;
            const hasUpgrade = !!call.upgradeRecord;
            return (
              <div key={call.id}>
                <CallCard call={call} variant="finished" />
                <div className="mt-1 bg-white/3 border border-white/5 rounded px-3 py-2 mb-3 flex items-center flex-wrap gap-3 text-[11px]">
                  <span
                    className={`chip ${
                      call.finalStatus === CallStatus.FINISHED
                        ? 'bg-accent-green/15 text-accent-green'
                        : 'bg-accent-purple/15 text-accent-purple'
                    }`}
                  >
                    {call.finalStatus ? CALL_STATUS_LABEL[call.finalStatus] : '已处理'}
                  </span>
                  {hasTransfer && (
                    <span className="flex items-center gap-1 text-accent-cyan/80">
                      <ArrowRightLeft className="w-3 h-3" />
                      转派 {call.transferRecords!.length} 次
                    </span>
                  )}
                  {hasUpgrade && (
                    <span className="flex items-center gap-1 text-accent-red/80">
                      <AlertTriangle className="w-3 h-3" /> 曾升级
                    </span>
                  )}
                  <span className="text-text-secondary/70 font-mono ml-auto">
                    完成于 {formatTime(call.finishedAt!)}
                    {call.finishReason && ` · ${call.finishReason}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
