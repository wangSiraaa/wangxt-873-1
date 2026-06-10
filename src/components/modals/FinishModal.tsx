import { useState, useMemo, useEffect } from 'react';
import { ModalBase } from './ModalBase';
import { useAppStore } from '@/store';
import { CheckCircle, ClipboardCheck } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import {
  CallStatus,
  PROBLEM_TYPE_LABEL,
  FINISH_REASON_OPTIONS,
  FINISH_STATUS_OPTIONS,
} from '@/types';
import { CustomerStars } from '../CustomerStars';

export function FinishModal() {
  const modal = useAppStore((s) => s.modal);
  const agents = useAppStore((s) => s.agents);
  const processingQueue = useAppStore((s) => s.processingQueue);
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const closeModal = useAppStore((s) => s.closeModal);
  const finishCall = useAppStore((s) => s.finishCall);
  const showToast = useAppStore((s) => s.showToast);

  const [finalStatus, setFinalStatus] = useState<CallStatus>(CallStatus.FINISHED);
  const [finishReason, setFinishReason] = useState<string>(FINISH_REASON_OPTIONS[0]);
  const [remarks, setRemarks] = useState<string>('');

  const call = useMemo(
    () => processingQueue.find((c) => c.id === modal?.callId),
    [processingQueue, modal?.callId],
  );
  const currentAgent = call?.assignedAgentId
    ? agents.find((a) => a.id === call.assignedAgentId)
    : null;

  const open = !!modal && modal.type === 'finish';

  useEffect(() => {
    if (open) {
      setFinalStatus(CallStatus.FINISHED);
      setFinishReason(FINISH_REASON_OPTIONS[0]);
      setRemarks('');
    }
  }, [open]);

  if (!open || !call) return null;

  const handleSubmit = () => {
    if (!finishReason.trim()) {
      showToast('warning', '请选择或输入处理结果');
      return;
    }
    const result = finishCall(
      call.id,
      finishReason.trim(),
      finalStatus,
      remarks.trim() || undefined,
      currentRole,
      currentAgentId,
    );
    if (result.success) {
      showToast('success', result.message || '处理完成');
      closeModal();
    } else {
      showToast('error', result.message || '操作失败');
    }
  };

  return (
    <ModalBase
      open
      title={
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-accent-green" />
          号码处理完成
        </div>
      }
      accentColor="green"
      onClose={closeModal}
      footer={
        <>
          <button className="btn-ghost" onClick={closeModal}>
            取消
          </button>
          <button
            className="btn-primary flex items-center gap-1.5 !bg-gradient-green"
            onClick={handleSubmit}
          >
            <ClipboardCheck className="w-4 h-4" /> 确认归档
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-white/4 border border-accent-green/15 rounded-md p-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-text-primary text-sm">
              {call.phoneNumber}
            </span>
            <CustomerStars level={call.customerLevel} />
            <span className="chip bg-accent-cyan/10 text-accent-cyan text-[11px]">
              {PROBLEM_TYPE_LABEL[call.problemType]}
            </span>
          </div>
          {currentAgent && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-secondary/70">处理坐席:</span>
              <div className="w-6 h-6 rounded bg-gradient-green flex items-center justify-center text-[11px] font-bold text-white/90">
                {currentAgent.avatar}
              </div>
              <span className="text-text-primary font-medium">{currentAgent.name}</span>
              <StatusBadge status={currentAgent.status} size="sm" />
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5">
            处理状态
          </p>
          <div className="flex gap-2">
            {FINISH_STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-md border transition-all cursor-pointer text-xs ${
                  finalStatus === opt.value
                    ? 'border-accent-green bg-accent-green/8 text-accent-green'
                    : 'border-white/10 bg-white/3 text-text-secondary hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  checked={finalStatus === opt.value}
                  onChange={() => setFinalStatus(opt.value)}
                  className="accent-green-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5">
            处理结果标签
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FINISH_REASON_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setFinishReason(opt)}
                className={`chip transition-all text-[11px] ${
                  finishReason === opt
                    ? 'bg-accent-green/20 text-accent-green border-accent-green/30'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center justify-between">
            <span>处理备注</span>
            <span className="text-[10px] text-text-secondary/60 font-mono">
              {remarks.length}/500
            </span>
          </p>
          <textarea
            className="form-input resize-none h-24"
            placeholder="可填写详细处理过程、客户诉求记录、解决方案、后续跟进事项等（选填）..."
            value={remarks}
            maxLength={500}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>
    </ModalBase>
  );
}
