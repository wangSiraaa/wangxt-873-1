import { useState, useMemo, useEffect } from 'react';
import { ModalBase } from './ModalBase';
import { useAppStore } from '@/store';
import { ArrowRightLeft, XCircle, UserCheck } from 'lucide-react';
import { validateTransferReason, isUpgradeTargetBlocked, canReceiveCall } from '@/rules';
import { StatusBadge } from '../StatusBadge';
import { AGENT_STATUS_LABEL, PROBLEM_TYPE_LABEL, TRANSFER_REASON_OPTIONS } from '@/types';
import { CustomerStars } from '../CustomerStars';
import { formatTime } from '@/utils/time';

export function TransferModal() {
  const modal = useAppStore((s) => s.modal);
  const agents = useAppStore((s) => s.agents);
  const processingQueue = useAppStore((s) => s.processingQueue);
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const closeModal = useAppStore((s) => s.closeModal);
  const transferCall = useAppStore((s) => s.transferCall);
  const showToast = useAppStore((s) => s.showToast);

  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const call = useMemo(
    () => processingQueue.find((c) => c.id === modal?.callId),
    [processingQueue, modal?.callId],
  );
  const currentAgent = call?.assignedAgentId
    ? agents.find((a) => a.id === call.assignedAgentId)
    : null;

  const open = !!modal && modal.type === 'transfer';

  const reasonValidation = useMemo(
    () => validateTransferReason(reason),
    [reason],
  );
  const submitDisabled = !targetAgentId || !reasonValidation.valid;

  useEffect(() => {
    if (!open) {
      setTargetAgentId('');
      setReason('');
      setTouched(false);
    }
  }, [open]);

  if (!open || !call) return null;

  const handleSubmit = () => {
    setTouched(true);
    if (!targetAgentId) {
      showToast('warning', '请选择目标坐席');
      return;
    }
    const check = validateTransferReason(reason);
    if (!check.valid) {
      showToast('error', check.reason || '请填写转派原因（至少5个字符）');
      return;
    }
    const target = agents.find((a) => a.id === targetAgentId);
    if (!target) return;
    const blocked = isUpgradeTargetBlocked(target);
    if (blocked) {
      showToast('error', `无法转派：${blocked}`);
      return;
    }
    const result = transferCall(
      call.id,
      target.id,
      reason.trim(),
      currentRole,
      currentAgentId,
    );
    if (result.success) {
      showToast('success', result.message || '转派成功');
      closeModal();
    } else {
      showToast('error', result.message || '转派失败');
    }
  };

  return (
    <ModalBase
      open
      title={
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-accent-cyan" />
          转派号码
        </div>
      }
      accentColor="cyan"
      onClose={closeModal}
      footer={
        <>
          <button className="btn-ghost" onClick={closeModal}>
            取消
          </button>
          <button
            className={`btn-primary flex items-center gap-1.5 ${
              submitDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleSubmit}
            disabled={submitDisabled}
          >
            <UserCheck className="w-4 h-4" /> 确认转派
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/4 border border-accent-orange/20 rounded-md p-3">
            <p className="text-[10px] text-text-secondary mb-1">当前坐席</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-gradient-orange flex items-center justify-center text-xs font-bold text-white/90">
                {currentAgent?.avatar || '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {currentAgent?.name || '未知'}
                </p>
                {currentAgent && <StatusBadge status={currentAgent.status} size="sm" />}
              </div>
            </div>
          </div>
          <div className="bg-white/4 border border-accent-green/20 rounded-md p-3">
            <p className="text-[10px] text-text-secondary mb-1">客户号码</p>
            <div>
              <p className="text-sm font-semibold font-mono text-text-primary">
                {call.phoneNumber}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CustomerStars level={call.customerLevel} size="sm" />
                <span className="chip bg-accent-cyan/10 text-accent-cyan text-[10px]">
                  {PROBLEM_TYPE_LABEL[call.problemType]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center justify-between">
            <span>目标坐席</span>
            <span className="text-[10px] text-accent-orange">
              ⚠ 离线/暂停坐席不可选
            </span>
          </p>
          <select
            className="form-input w-full"
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
          >
            <option value="">-- 请选择转派目标坐席 --</option>
            {agents
              .filter((a) => a.id !== call.assignedAgentId)
              .map((a) => {
                const blocked = isUpgradeTargetBlocked(a);
                const disabled = !!blocked || !canReceiveCall(a);
                return (
                  <option key={a.id} value={a.id} disabled={disabled}>
                    {a.name} — {AGENT_STATUS_LABEL[a.status]}（负载{' '}
                    {a.currentLoad}/{a.maxLoad}）
                    {disabled && blocked ? ` — ⛔ ${blocked}` : ''}
                  </option>
                );
              })}
          </select>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-1.5 flex items-center justify-between">
            <span>
              转派原因 <span className="text-accent-red">*</span>
            </span>
            <span
              className={`text-[10px] font-mono ${
                reason.length >= 5
                  ? 'text-accent-green'
                  : touched && !reasonValidation.valid
                  ? 'text-accent-red'
                  : 'text-text-secondary/60'
              }`}
            >
              {reason.length} 字符（至少 5 字符）
            </span>
          </p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {TRANSFER_REASON_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setReason(opt)}
                className={`chip transition-all text-[11px] ${
                  reason === opt
                    ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <textarea
            className={`form-input resize-none h-20 ${
              touched && !reasonValidation.valid
                ? '!border-accent-red !shadow-[0_0_0_2px_rgba(239,68,68,0.2)]'
                : ''
            }`}
            placeholder="请详细填写转派原因，例如：坐席技能不匹配、坐席临时有事、客户指定更换等（至少5个字符）..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {touched && !reasonValidation.valid && (
            <p className="text-[11px] text-accent-red mt-1 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> {reasonValidation.reason}
            </p>
          )}
        </div>

        {call.transferRecords && call.transferRecords.length > 0 && (
          <div className="bg-white/3 border border-white/5 rounded-md p-2.5">
            <p className="text-[11px] text-text-secondary/80 mb-1.5 font-semibold">
              历史转派记录（{call.transferRecords.length} 次）
            </p>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {call.transferRecords.map((r, i) => {
                const fromA = agents.find((a) => a.id === r.fromAgentId);
                const toA = agents.find((a) => a.id === r.toAgentId);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[11px] bg-white/2 rounded px-2 py-1"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-accent-cyan/60 flex-shrink-0" />
                    <span className="font-mono text-text-secondary/60">
                      {formatTime(r.transferredAt)}
                    </span>
                    <span className="text-text-primary">
                      {fromA?.name || '?'} → {toA?.name || '?'}
                    </span>
                    <span className="ml-auto text-text-secondary/70 truncate">
                      原因：{r.reason}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ModalBase>
  );
}
