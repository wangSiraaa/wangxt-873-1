import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppState,
  UserRole,
  Agent,
  CallNumber,
  CallStatus,
  AgentStatus,
  TransferRecord,
  UpgradeRecord,
  ModalState,
} from '@/types';
import {
  MOCK_AGENTS,
  MOCK_POOL_QUEUE,
  MOCK_PROCESSING_QUEUE,
  MOCK_UPGRADE_QUEUE,
  MOCK_FINISHED_RECORDS,
  INITIAL_ROLE,
  INITIAL_CURRENT_AGENT_ID,
  INITIAL_THRESHOLD,
} from '@/data/mock';
import {
  detectUpgrades,
  isUpgradeTargetBlocked,
  sortCallNumbers,
  canReceiveCall,
  validateTransferReason,
} from '@/rules';
import { generateId } from '@/utils/id';
import { STORAGE_KEY } from '@/config';
import { exportRecordsToCSV } from '@/utils/csv';
import {
  getSecondsSince,
  isValidDate,
  safeDate,
} from '@/utils/time';

function reviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (iso.test(value)) {
      const d = new Date(value);
      if (isValidDate(d)) return d;
    }
  }
  return value;
}

const DATE_PATHS = [
  'enterPoolTime',
  'assignTime',
  'upgradeAt',
  'transferredAt',
  'finishedAt',
  'upgradeTime',
];

function hydrateDates(obj: unknown): unknown {
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(hydrateDates);
  }
  if (obj !== null && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (DATE_PATHS.includes(k) && typeof v === 'string') {
        const d = new Date(v);
        out[k] = isValidDate(d) ? d : v;
      } else {
        out[k] = hydrateDates(v);
      }
    }
    return out;
  }
  return obj;
}

function cloneCallWithFreshRelativeTiming(c: CallNumber): CallNumber {
  const now = Date.now();
  const nowDate = new Date(now);
  const rebase = (d?: Date | null): Date | undefined => {
    if (d === null || d === undefined) return undefined;
    if (!isValidDate(d)) return undefined;
    const elapsed = getSecondsSince(d);
    if (!Number.isFinite(elapsed) || elapsed < 0) return undefined;
    const rebased = new Date(now - elapsed * 1000);
    return isValidDate(rebased) ? rebased : undefined;
  };
  const rebasedPoolTime = rebase(c.enterPoolTime) ?? nowDate;
  const rebasedAssignTime = rebase(c.assignTime);
  const rebasedFinishedAt = rebase(c.finishedAt);
  return {
    ...c,
    enterPoolTime: rebasedPoolTime,
    assignTime: isValidDate(rebasedAssignTime) ? rebasedAssignTime : null,
    finishedAt: isValidDate(rebasedFinishedAt) ? rebasedFinishedAt : undefined,
    transferRecords: c.transferRecords.map((t) => ({
      ...t,
      transferredAt: rebase(t.transferredAt) ?? nowDate,
    })),
    upgradeRecord: c.upgradeRecord
      ? {
          ...c.upgradeRecord,
          upgradeAt:
            rebase(c.upgradeRecord.upgradeAt) ??
            (isValidDate(c.upgradeRecord.upgradeAt)
              ? c.upgradeRecord.upgradeAt
              : nowDate),
          waitSeconds: Number.isFinite(c.upgradeRecord.waitSeconds)
            ? Math.max(0, c.upgradeRecord.waitSeconds)
            : 0,
        }
      : undefined,
  };
}

interface AppActions {
  setRole: (role: UserRole) => void;
  setCurrentAgentId: (id: string | null) => void;
  changeAgentStatus: (
    agentId: string,
    status: AgentStatus,
    operatorRole: UserRole,
    operatorAgentId: string | null,
  ) => { success: boolean; message?: string };
  openAssignModal: (callId: string) => void;
  openAssignModalFromUpgrade: (callId: string) => void;
  openTransferModal: (callId: string) => void;
  openFinishModal: (callId: string) => void;
  closeModal: () => void;
  showToast: (type: 'success' | 'error' | 'warning', message: string) => void;
  clearToast: () => void;
  assignCall: (
    callId: string,
    agentId: string,
    operatorRole: UserRole,
    operatorAgentId: string | null,
  ) => { success: boolean; message?: string };
  assignFromUpgrade: (
    callId: string,
    agentId: string,
    operatorRole: UserRole,
    operatorAgentId: string | null,
  ) => { success: boolean; message?: string };
  transferCall: (
    callId: string,
    toAgentId: string,
    reason: string,
    operatorRole: UserRole,
    operatorAgentId: string | null,
  ) => { success: boolean; message?: string };
  finishCall: (
    callId: string,
    finishReason: string,
    finalStatus: CallStatus,
    remarks: string | undefined,
    operatorRole: UserRole,
    operatorAgentId: string | null,
  ) => { success: boolean; message?: string };
  checkAndProcessUpgrades: () => CallNumber[];
  exportToCSV: () => { success: boolean; message?: string };
  resetData: () => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      currentRole: INITIAL_ROLE,
      currentAgentId: INITIAL_CURRENT_AGENT_ID,
      upgradeThresholdSeconds: INITIAL_THRESHOLD,
      agents: MOCK_AGENTS.map((a) => ({ ...a })),
      poolQueue: MOCK_POOL_QUEUE.map((c) => cloneCallWithFreshRelativeTiming(c)),
      processingQueue: MOCK_PROCESSING_QUEUE.map((c) =>
        cloneCallWithFreshRelativeTiming(c),
      ),
      upgradeQueue: MOCK_UPGRADE_QUEUE.map((c) =>
        cloneCallWithFreshRelativeTiming(c),
      ),
      finishedRecords: MOCK_FINISHED_RECORDS.map((c) =>
        cloneCallWithFreshRelativeTiming(c),
      ),
      modal: null,
      toast: null,

      setRole: (role) => set({ currentRole: role }),
      setCurrentAgentId: (id) => set({ currentAgentId: id }),

      changeAgentStatus: (agentId, status, operatorRole, operatorAgentId) => {
        const { agents } = get();
        const target = agents.find((a) => a.id === agentId);
        if (!target) {
          return { success: false, message: '坐席不存在' };
        }
        const isSelf = agentId === operatorAgentId;
        if (!isSelf && operatorRole !== UserRole.MONITOR) {
          return { success: false, message: '普通坐席无权修改他人状态' };
        }
        const newAgents = agents.map((a) =>
          a.id === agentId ? { ...a, status } : a,
        );
        set({ agents: newAgents });
        return { success: true, message: `${target.name} 状态已更新为${status}` };
      },

      openAssignModal: (callId) =>
        set({ modal: { type: 'assign', callId } as ModalState }),
      openAssignModalFromUpgrade: (callId) =>
        set({ modal: { type: 'assign_from_upgrade', callId } as ModalState }),
      openTransferModal: (callId) =>
        set({ modal: { type: 'transfer', callId } as ModalState }),
      openFinishModal: (callId) =>
        set({ modal: { type: 'finish', callId } as ModalState }),
      closeModal: () => set({ modal: null }),

      showToast: (type, message) => {
        set({ toast: { type, message } });
        setTimeout(() => {
          const current = get().toast;
          if (current && current.message === message) {
            set({ toast: null });
          }
        }, 3000);
      },
      clearToast: () => set({ toast: null }),

      assignCall: (callId, agentId, operatorRole, _operatorAgentId) => {
        if (operatorRole !== UserRole.MONITOR) {
          return { success: false, message: '仅班长可执行分派操作' };
        }
        const state = get();
        const agent = state.agents.find((a) => a.id === agentId);
        if (!agent) return { success: false, message: '坐席不存在' };
        const block = isUpgradeTargetBlocked(agent);
        if (block) {
          return { success: false, message: block };
        }
        if (!canReceiveCall(agent)) {
          return { success: false, message: '坐席状态不允许接单' };
        }
        const call = state.poolQueue.find((c) => c.id === callId);
        if (!call) return { success: false, message: '号码不在候选池中' };
        const updatedCall: CallNumber = {
          ...call,
          status: CallStatus.PROCESSING,
          assignedAgentId: agentId,
          assignTime: new Date(),
        };
        const newAgents = state.agents.map((a) =>
          a.id === agentId
            ? {
                ...a,
                currentLoad: Math.min(a.maxLoad, a.currentLoad + 1),
                status: a.status === AgentStatus.IDLE ? AgentStatus.BUSY : a.status,
              }
            : a,
        );
        set({
          poolQueue: state.poolQueue
            .filter((c) => c.id !== callId)
            .sort(sortCallNumbers),
          processingQueue: [...state.processingQueue, updatedCall],
          agents: newAgents,
          modal: null,
        });
        return { success: true, message: `已分派给 ${agent.name}` };
      },

      assignFromUpgrade: (callId, agentId, operatorRole, _operatorAgentId) => {
        if (operatorRole !== UserRole.MONITOR) {
          return { success: false, message: '仅班长可分派升级队列' };
        }
        const state = get();
        const agent = state.agents.find((a) => a.id === agentId);
        if (!agent) return { success: false, message: '坐席不存在' };
        const block = isUpgradeTargetBlocked(agent);
        if (block) {
          return { success: false, message: block };
        }
        const call = state.upgradeQueue.find((c) => c.id === callId);
        if (!call) return { success: false, message: '号码不在升级队列中' };
        const updatedCall: CallNumber = {
          ...call,
          status: CallStatus.PROCESSING,
          assignedAgentId: agentId,
          assignTime: new Date(),
        };
        const newAgents = state.agents.map((a) =>
          a.id === agentId
            ? {
                ...a,
                currentLoad: Math.min(a.maxLoad, a.currentLoad + 1),
                status: a.status === AgentStatus.IDLE ? AgentStatus.BUSY : a.status,
              }
            : a,
        );
        set({
          upgradeQueue: state.upgradeQueue.filter((c) => c.id !== callId),
          processingQueue: [...state.processingQueue, updatedCall],
          agents: newAgents,
          modal: null,
        });
        return {
          success: true,
          message: `[升级队列]已分派给 ${agent.name}`,
        };
      },

      transferCall: (callId, toAgentId, reason, operatorRole, operatorAgentId) => {
        const state = get();
        const call = state.processingQueue.find((c) => c.id === callId);
        if (!call) return { success: false, message: '号码不在处理队列' };
        if (operatorRole !== UserRole.MONITOR) {
          if (call.assignedAgentId !== operatorAgentId) {
            return { success: false, message: '无权转派他人处理中的号码' };
          }
        }
        if (!call.assignedAgentId) {
          return { success: false, message: '原坐席信息缺失' };
        }
        const reasonValidation = validateTransferReason(reason);
        if (!reasonValidation.valid) {
          return { success: false, message: reasonValidation.reason };
        }
        const toAgent = state.agents.find((a) => a.id === toAgentId);
        if (!toAgent) return { success: false, message: '目标坐席不存在' };
        const block = isUpgradeTargetBlocked(toAgent);
        if (block) {
          return { success: false, message: block };
        }
        const fromAgentId = call.assignedAgentId;
        const record: TransferRecord = {
          id: generateId('trans_'),
          fromAgentId,
          toAgentId,
          reason,
          transferredAt: new Date(),
          operatorId:
            operatorRole === UserRole.MONITOR
              ? 'monitor_001'
              : operatorAgentId,
        };
        const newAgents = state.agents.map((a) => {
          if (a.id === fromAgentId) {
            const newLoad = Math.max(0, a.currentLoad - 1);
            return {
              ...a,
              currentLoad: newLoad,
              status:
                newLoad === 0 && a.status === AgentStatus.BUSY
                  ? AgentStatus.IDLE
                  : a.status,
            };
          }
          if (a.id === toAgentId) {
            return {
              ...a,
              currentLoad: Math.min(a.maxLoad, a.currentLoad + 1),
              status:
                a.status === AgentStatus.IDLE ? AgentStatus.BUSY : a.status,
            };
          }
          return a;
        });
        const updatedCall: CallNumber = {
          ...call,
          assignedAgentId: toAgentId,
          assignTime: new Date(),
          transferRecords: [...call.transferRecords, record],
        };
        set({
          processingQueue: state.processingQueue.map((c) =>
            c.id === callId ? updatedCall : c,
          ),
          agents: newAgents,
          modal: null,
        });
        return { success: true, message: `已转派至 ${toAgent.name}` };
      },

      finishCall: (
        callId,
        finishReason,
        finalStatus,
        remarks,
        operatorRole,
        operatorAgentId,
      ) => {
        const state = get();
        const call = state.processingQueue.find((c) => c.id === callId);
        if (!call) return { success: false, message: '号码不存在' };
        if (operatorRole !== UserRole.MONITOR) {
          if (call.assignedAgentId !== operatorAgentId) {
            return { success: false, message: '无权完成他人处理中的号码' };
          }
        }
        if (!finishReason || !finishReason.trim()) {
          return { success: false, message: '请填写处理结果' };
        }
        const agentId = call.assignedAgentId;
        const newAgents = state.agents.map((a) => {
          if (a.id === agentId) {
            const newLoad = Math.max(0, a.currentLoad - 1);
            return {
              ...a,
              currentLoad: newLoad,
              status:
                newLoad === 0 && a.status === AgentStatus.BUSY
                  ? AgentStatus.IDLE
                  : a.status,
            };
          }
          return a;
        });
        const finished: CallNumber = {
          ...call,
          status: finalStatus || CallStatus.FINISHED,
          finalStatus: finalStatus || CallStatus.FINISHED,
          finishReason: finishReason.trim(),
          remarks: remarks ? remarks.trim() : call.remarks,
          finishedAt: new Date(),
        };
        set({
          processingQueue: state.processingQueue.filter((c) => c.id !== callId),
          finishedRecords: [...state.finishedRecords, finished],
          agents: newAgents,
          modal: null,
        });
        return { success: true, message: '处理完成，已归档' };
      },

      checkAndProcessUpgrades: () => {
        const state = get();
        const threshold = state.upgradeThresholdSeconds;
        const upgraded = detectUpgrades(state.poolQueue, threshold);
        if (upgraded.length === 0) return [];
        const upgradedIds = new Set(upgraded.map((u) => u.id));
        const remaining = state.poolQueue.filter(
          (c) => !upgradedIds.has(c.id),
        );
        const now = new Date();
        const moved: CallNumber[] = upgraded.map((c) => {
          const waited = getSecondsSince(c.enterPoolTime);
          const rec: UpgradeRecord = {
            upgradeAt: now,
            source: 'candidate_timeout',
            waitSeconds: waited,
            description: `候选池等待超时${Math.round(waited / 60)}分钟未分派，自动升级至班长处理`,
          };
          return {
            ...c,
            status: CallStatus.UPGRADED,
            upgradeRecord: rec,
          };
        });
        set({
          poolQueue: remaining.sort(sortCallNumbers),
          upgradeQueue: [...state.upgradeQueue, ...moved],
        });
        moved.forEach((c) => {
          get().showToast(
            'warning',
            `⚠ 号码 ${c.phoneNumber} 已等待 ${Math.round(
              getSecondsSince(c.enterPoolTime) / 60,
            )} 分钟，自动进入升级队列`,
          );
        });
        return moved;
      },

      exportToCSV: () => {
        const state = get();
        if (state.currentRole !== UserRole.MONITOR) {
          return { success: false, message: '仅班长可导出当班记录' };
        }
        try {
          exportRecordsToCSV(
            state.poolQueue,
            state.processingQueue,
            state.upgradeQueue,
            state.finishedRecords,
            state.agents,
          );
          return { success: true, message: '当班记录导出成功' };
        } catch (e) {
          return {
            success: false,
            message: '导出失败: ' + (e as Error).message,
          };
        }
      },

      resetData: () => {
        set({
          agents: MOCK_AGENTS.map((a) => ({ ...a })),
          poolQueue: MOCK_POOL_QUEUE.map((c) =>
            cloneCallWithFreshRelativeTiming(c),
          ),
          processingQueue: MOCK_PROCESSING_QUEUE.map((c) =>
            cloneCallWithFreshRelativeTiming(c),
          ),
          upgradeQueue: MOCK_UPGRADE_QUEUE.map((c) =>
            cloneCallWithFreshRelativeTiming(c),
          ),
          finishedRecords: MOCK_FINISHED_RECORDS.map((c) =>
            cloneCallWithFreshRelativeTiming(c),
          ),
          modal: null,
          toast: null,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage, { reviver }),
      partialize: (state) => ({
        currentRole: state.currentRole,
        currentAgentId: state.currentAgentId,
        upgradeThresholdSeconds: state.upgradeThresholdSeconds,
        agents: state.agents,
        poolQueue: state.poolQueue,
        processingQueue: state.processingQueue,
        upgradeQueue: state.upgradeQueue,
        finishedRecords: state.finishedRecords,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          try {
            state.agents = (hydrateDates(state.agents) as Agent[]) || state.agents;
            state.poolQueue =
              (hydrateDates(state.poolQueue) as CallNumber[]) || state.poolQueue;
            state.processingQueue =
              (hydrateDates(state.processingQueue) as CallNumber[]) ||
              state.processingQueue;
            state.upgradeQueue =
              (hydrateDates(state.upgradeQueue) as CallNumber[]) ||
              state.upgradeQueue;
            state.finishedRecords =
              (hydrateDates(state.finishedRecords) as CallNumber[]) ||
              state.finishedRecords;
          } catch (_e) {
            // ignore
          }
        }
      },
    },
  ),
);
