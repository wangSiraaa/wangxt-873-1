import {
  Agent,
  AgentStatus,
  CallNumber,
  UserRole,
  SkillTag,
  ProblemType,
  PROBLEM_TYPE_SKILLS,
  QuickFilterState,
} from '@/types';
import {
  RECOMMEND_SCORE,
  WARNING_BEFORE_UPGRADE_SECONDS,
  UPGRADE_THRESHOLD_SECONDS,
} from '@/config';
import { getSecondsSince } from '@/utils/time';

export function canReceiveCall(agent: Agent): boolean {
  return agent.status === AgentStatus.IDLE || agent.status === AgentStatus.BUSY;
}

export function isAgentAvailable(agent: Agent): boolean {
  return canReceiveCall(agent) && agent.currentLoad < agent.maxLoad;
}

export function validateTransferReason(reason: string): { valid: boolean; reason?: string } {
  if (!reason || reason.trim().length === 0) {
    return { valid: false, reason: '请填写转派原因，不得为空' };
  }
  if (reason.trim().length < 5) {
    return { valid: false, reason: '转派原因至少需要5个字符' };
  }
  return { valid: true };
}

type ActionType =
  | 'assign'
  | 'assignAny'
  | 'transfer'
  | 'transferOwn'
  | 'finish'
  | 'finishOwn'
  | 'upgradeAssign'
  | 'export'
  | 'changeOwnStatus'
  | 'changeOtherStatus';

export function checkPermission(
  role: UserRole,
  action: ActionType,
): boolean {
  switch (action) {
    case 'assign':
    case 'assignAny':
    case 'upgradeAssign':
    case 'transfer':
    case 'finish':
    case 'export':
    case 'changeOtherStatus':
      return role === UserRole.MONITOR;
    case 'transferOwn':
    case 'finishOwn':
    case 'changeOwnStatus':
      return true;
    default:
      return false;
  }
}

export function sortCallNumbers(a: CallNumber, b: CallNumber): number {
  if (a.isBlacklisted && !b.isBlacklisted) return -1;
  if (b.isBlacklisted && !a.isBlacklisted) return 1;
  if (a.isHighPriority !== b.isHighPriority) {
    return a.isHighPriority ? -1 : 1;
  }
  if (a.customerLevel !== b.customerLevel) {
    return b.customerLevel - a.customerLevel;
  }
  return new Date(a.enterPoolTime).getTime() - new Date(b.enterPoolTime).getTime();
}

export interface RecommendationResult {
  agent: Agent;
  score: number;
  matchPercent: number;
  matchTags: string[];
}

export function getRecommendedAgents(
  call: CallNumber,
  agents: Agent[],
  topN: number = 3,
): RecommendationResult[] {
  const requiredSkills: SkillTag[] = call.requiredSkills.length > 0
    ? call.requiredSkills
    : PROBLEM_TYPE_SKILLS[call.problemType] || [];
  const maxPossibleScore =
    requiredSkills.length * RECOMMEND_SCORE.SKILL_MATCH +
    (agents[0]?.maxLoad || 3) * RECOMMEND_SCORE.LOAD_BALANCE +
    RECOMMEND_SCORE.IDLE_BONUS;

  const results = agents
    .map((agent) => {
      let score = 0;
      if (!canReceiveCall(agent)) {
        return null;
      }
      if (agent.currentLoad >= agent.maxLoad) {
        return null;
      }
      const matchTags = agent.skills.filter((s) => requiredSkills.includes(s));
      score += matchTags.length * RECOMMEND_SCORE.SKILL_MATCH;
      const loadDiff = agent.maxLoad - agent.currentLoad;
      score += Math.max(0, loadDiff) * RECOMMEND_SCORE.LOAD_BALANCE;
      if (agent.status === AgentStatus.IDLE) {
        score += RECOMMEND_SCORE.IDLE_BONUS;
      } else if (agent.status === AgentStatus.BUSY) {
        score += RECOMMEND_SCORE.BUSY_BONUS;
      }
      const matchPercent = Math.max(
        0,
        Math.min(100, Math.round((score / maxPossibleScore) * 100)),
      );
      return { agent, score, matchPercent, matchTags: matchTags as import('@/types').SkillTag[] };
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.score - a.score) as RecommendationResult[];
  return results.slice(0, topN);
}

export function detectUpgrades(
  pool: CallNumber[],
  thresholdSeconds: number = UPGRADE_THRESHOLD_SECONDS,
): CallNumber[] {
  return pool.filter((call) => {
    const waited = getSecondsSince(call.enterPoolTime);
    return waited >= thresholdSeconds;
  });
}

export function isWarningCloseToUpgrade(
  waitedSeconds: number,
  thresholdSeconds: number = UPGRADE_THRESHOLD_SECONDS,
  warnSeconds: number = WARNING_BEFORE_UPGRADE_SECONDS,
): boolean {
  const remaining = thresholdSeconds - waitedSeconds;
  return remaining > 0 && remaining <= warnSeconds;
}

export function isUpgradeTargetBlocked(agent: Agent): string | null {
  if (agent.status === AgentStatus.OFFLINE) {
    return '该坐席当前离线，无法接单';
  }
  if (agent.status === AgentStatus.PAUSED) {
    return '该坐席已暂停，无法接单';
  }
  if (agent.currentLoad >= agent.maxLoad) {
    return '该坐席已达最大处理负载';
  }
  return null;
}

export function canUserOperateCall(
  role: UserRole,
  currentAgentId: string | null,
  call: CallNumber,
  operation: 'finish' | 'transfer',
): boolean {
  if (role === UserRole.MONITOR) return true;
  if (operation === 'finish' || operation === 'transfer') {
    return call.assignedAgentId === currentAgentId;
  }
  return false;
}

export function applyQuickFilter(
  calls: CallNumber[],
  filter: QuickFilterState,
): CallNumber[] {
  return calls.filter((call) => {
    if (filter.problemType && call.problemType !== filter.problemType) {
      return false;
    }
    if (filter.customerLevel && call.customerLevel !== filter.customerLevel) {
      return false;
    }
    if (filter.isHighPriority !== null) {
      if (filter.isHighPriority && !call.isHighPriority && !call.isBlacklisted) {
        return false;
      }
      if (!filter.isHighPriority && (call.isHighPriority || call.isBlacklisted)) {
        return false;
      }
    }
    return true;
  });
}
