import { useState, useMemo, useEffect } from 'react';
import { ModalBase } from './ModalBase';
import { useAppStore } from '@/store';
import { UserPlus, CheckCircle2, XCircle, Target } from 'lucide-react';
import { getRecommendedAgents, isUpgradeTargetBlocked, canReceiveCall } from '@/rules';
import { StatusBadge } from '../StatusBadge';
import { AGENT_STATUS_LABEL, PROBLEM_TYPE_LABEL } from '@/types';
import { CustomerStars } from '../CustomerStars';

export function AssignModal() {
  const modal = useAppStore((s) => s.modal);
  const agents = useAppStore((s) => s.agents);
  const poolQueue = useAppStore((s) => s.poolQueue);
  const processingQueue = useAppStore((s) => s.processingQueue);
  const upgradeQueue = useAppStore((s) => s.upgradeQueue);
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const closeModal = useAppStore((s) => s.closeModal);
  const assignCall = useAppStore((s) => s.assignCall);
  const assignFromUpgrade = useAppStore((s) => s.assignFromUpgrade);
  const showToast = useAppStore((s) => s.showToast);

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const isUpgrade = modal?.type === 'assign_from_upgrade';
  const call = useMemo(() => {
    const allCalls = [...poolQueue, ...processingQueue, ...upgradeQueue];
    return allCalls.find((c) => c.id === modal?.callId);
  }, [poolQueue, processingQueue, upgradeQueue, modal?.callId]);

  const recommended = useMemo(() => {
    if (!call) return [];
    return getRecommendedAgents(call, agents, 3);
  }, [call, agents]);

  const open =
    !!modal && (modal.type === 'assign' || modal.type === 'assign_from_upgrade');

  useEffect(() => {
    if (open && recommended[0] && !selectedAgentId) {
      setSelectedAgentId(recommended[0].agent.id);
    }
    if (!open) {
      setSelectedAgentId('');
    }
  }, [open, recommended[0]?.agent.id]);

  if (!open || !call) return null;

  const handleSubmit = () => {
    if (!selectedAgentId) {
      showToast('warning', '请选择目标坐席');
      return;
    }
    const target = agents.find((a) => a.id === selectedAgentId);
    if (!target) return;
    const blocked = isUpgradeTargetBlocked(target);
    if (blocked) {
      showToast('error', `无法分派：${blocked}`);
      return;
    }
    const action = isUpgrade ? assignFromUpgrade : assignCall;
    const result = action(call.id, target.id, currentRole, currentAgentId);
    if (result.success) {
      showToast('success', result.message || '分派成功');
      setSelectedAgentId('');
      closeModal();
    } else {
      showToast('error', result.message || '分派失败');
    }
  };

  return (
    <ModalBase
      open
      title={
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-accent-cyan" />
          {isUpgrade ? '班长分派（升级队列）' : '分派号码到坐席'}
        </div>
      }
      accentColor={isUpgrade ? 'red' : 'cyan'}
      onClose={closeModal}
      footer={
        <>
          <button className="btn-ghost" onClick={closeModal}>
            取消
          </button>
          <button
            className="btn-primary flex items-center gap-1.5"
            onClick={handleSubmit}
          >
            <UserPlus className="w-4 h-4" /> 确认分派
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-white/4 border border-white/10 rounded-md p-3 space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold text-text-primary">
              {call.phoneNumber}
            </span>
            <CustomerStars level={call.customerLevel} />
            {call.isHighPriority && (
              <span className="chip bg-accent-purple/15 text-accent-purple text-xs">
                VIP
              </span>
            )}
          </div>
          <div className="text-xs text-text-secondary flex items-center gap-2 flex-wrap">
            <span className="chip bg-accent-cyan/10 text-accent-cyan">
              {PROBLEM_TYPE_LABEL[call.problemType]}
            </span>
            <span>所需技能:</span>
            {call.requiredSkills.map((sk) => (
              <span key={sk} className="chip bg-white/5 text-text-secondary">
                {sk}
              </span>
            ))}
          </div>
        </div>

        {recommended.length > 0 && (
          <div>
            <p
              className="text-xs font-semibold text-text-secondary mb-2 flex items-center
              gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
              智能推荐 TOP {recommended.length}
            </p>
            <div className="space-y-1.5">
              {recommended.map((rec) => {
                const blockedReason = isUpgradeTargetBlocked(rec.agent);
                const disabled = !!blockedReason || !canReceiveCall(rec.agent);
                return (
                  <label
                    key={rec.agent.id}
                    className={`flex items-center gap-3 p-2.5 rounded-md border transition-all cursor-pointer ${
                      selectedAgentId === rec.agent.id
                        ? 'border-accent-cyan bg-accent-cyan/8 shadow-glow-cyan'
                        : disabled
                        ? 'border-white/5 bg-white/2 opacity-60 cursor-not-allowed'
                        : 'border-white/10 bg-white/3 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="agent"
                      disabled={disabled}
                      checked={selectedAgentId === rec.agent.id}
                      onChange={() =>
                        !disabled && setSelectedAgentId(rec.agent.id)
                      }
                      className="accent-cyan-500"
                    />
                    <div
                      className="w-8 h-8 rounded-md bg-gradient-cyan text-accent-cyan
                      flex items-center justify-center text-xs font-bold flex-shrink-0"
                    >
                      {rec.agent.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {rec.agent.name}
                        </span>
                        <StatusBadge status={rec.agent.status} size="sm" />
                        <span
                          className="chip bg-accent-green/15 text-accent-green
                          text-[10px] font-mono ml-auto"
                        >
                          匹配 {rec.matchPercent}%
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1 mt-0.5 flex-wrap"
                      >
                        {rec.matchTags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="chip bg-accent-cyan/10 text-accent-cyan text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                        <span
                          className="text-[10px] text-text-secondary/60 ml-auto
                          font-mono"
                        >
                          负载 {rec.agent.currentLoad}/{rec.agent.maxLoad}
                        </span>
                      </div>
                    </div>
                    {blockedReason && (
                      <div
                        className="flex-shrink-0 text-[10px] text-accent-red/80
                        max-w-[120px] text-right"
                      >
                        <XCircle className="w-3 h-3 inline mr-0.5" />
                        {blockedReason}
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">
            全部坐席（离线/暂停已自动禁用）
          </p>
          <select
            className="form-input w-full"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            <option value="">-- 请选择坐席 --</option>
            {agents.map((a) => {
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
      </div>
    </ModalBase>
  );
}
