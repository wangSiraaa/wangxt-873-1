import {
  Agent,
  AgentStatus,
  UserRole,
  AGENT_STATUS_LABEL,
} from '@/types';
import { StatusBadge } from '../StatusBadge';
import { UserCog, Users } from 'lucide-react';
import { useAppStore } from '@/store';
import { usePermission } from '@/hooks/usePermission';

interface Props {
  agent: Agent;
}

export function AgentCard({ agent }: Props) {
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const changeAgentStatus = useAppStore((s) => s.changeAgentStatus);
  const showToast = useAppStore((s) => s.showToast);
  const perm = usePermission(currentRole, currentAgentId);

  const isSelf = agent.id === currentAgentId;
  const canChangeThis =
    (isSelf && perm.canChangeOwnStatus()) ||
    (!isSelf && perm.canChangeOtherStatus());

  const loadPct = Math.min(100, (agent.currentLoad / agent.maxLoad) * 100);
  const loadColor =
    loadPct >= 100
      ? 'bg-accent-red'
      : loadPct >= 70
      ? 'bg-accent-orange'
      : 'bg-accent-green';

  const cycleStatus = () => {
    if (!canChangeThis) {
      showToast(
        'error',
        isSelf ? '当前身份无权修改此状态' : '普通坐席无权修改他人状态',
      );
      return;
    }
    const order: AgentStatus[] = [
      AgentStatus.IDLE,
      AgentStatus.BUSY,
      AgentStatus.PAUSED,
      AgentStatus.OFFLINE,
    ];
    const idx = order.indexOf(agent.status);
    const next = order[(idx + 1) % order.length];
    const r = changeAgentStatus(agent.id, next, currentRole, currentAgentId);
    showToast(r.success ? 'success' : 'error', r.message || '');
  };

  return (
    <div
      className={`relative glass-panel p-3 card-hover cursor-pointer ${
        canChangeThis ? '' : 'opacity-90'
      }`}
      onClick={cycleStatus}
      title={
        canChangeThis
          ? '点击切换状态：空闲→忙碌→暂停→离线'
          : '无权修改此坐席状态'
      }
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-sm font-bold ${
              agent.status === AgentStatus.OFFLINE
                ? 'bg-white/5 text-text-secondary/60'
                : 'bg-gradient-cyan text-accent-cyan'
            }`}
          >
            {agent.avatar}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5">
            <StatusBadge status={agent.status} showLabel={false} size="md" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-text-primary">
                {agent.name}
              </span>
              {isSelf && (
                <span title="当前身份">
                  <UserCog className="w-3.5 h-3.5 text-accent-cyan" />
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-secondary font-mono">
              {agent.currentLoad}/{agent.maxLoad}
            </span>
          </div>

          <div className="mt-1.5">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${loadColor}`}
                style={{ width: `${loadPct}%` }}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {agent.skills.slice(0, 3).map((sk) => (
              <span
                key={sk}
                className="chip bg-white/5 text-text-secondary border border-white/5"
              >
                {sk}
              </span>
            ))}
            {agent.skills.length > 3 && (
              <span className="chip bg-white/5 text-text-secondary/60">
                +{agent.skills.length - 3}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={agent.status} />
            {canChangeThis && (
              <span className="text-[10px] text-accent-cyan/70 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-accent-cyan/70" />
                点击切换为
                {(() => {
                  const order: AgentStatus[] = [
                    AgentStatus.IDLE,
                    AgentStatus.BUSY,
                    AgentStatus.PAUSED,
                    AgentStatus.OFFLINE,
                  ];
                  return AGENT_STATUS_LABEL[
                    order[(order.indexOf(agent.status) + 1) % order.length]
                  ];
                })()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentList() {
  const agents = useAppStore((s) => s.agents);
  const currentRole = useAppStore((s) => s.currentRole);
  return (
    <div className="glass-panel p-4 flex-1 min-h-0 flex flex-col">
      <div className="section-title">
        <Users className="w-4 h-4 text-accent-cyan" />
        <span>坐席列表</span>
        <span className="text-xs text-text-secondary ml-auto">
          共 {agents.length} 人 · 当前视角：
          {currentRole === UserRole.MONITOR ? '班长全局' : '普通坐席'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </div>
  );
}
