import type { AgentStatus, SkillTag } from '@/types';

export const UPGRADE_THRESHOLD_SECONDS = 300;
export const WARNING_BEFORE_UPGRADE_SECONDS = 30;

export const TRANSFER_REASON_PRESETS: string[] = [
  '坐席技能不匹配',
  '客户指定更换坐席',
  '坐席临时有事离开',
  '需班长/专家介入',
  '跨部门协作处理',
];

export const FINISH_RESULT_OPTIONS: string[] = [
  '问题已完全解决',
  '客户满意结束通话',
  '客户主动挂断',
  '转其他部门跟进',
  '已升级至班长处理',
  '约定回电时间',
];

export const STATUS_COLOR_MAP: Record<AgentStatus | string, string> = {
  idle: '#10B981',
  busy: '#F59E0B',
  paused: '#8B5CF6',
  offline: '#64748B',
};

export const ALL_SKILL_TAGS: SkillTag[] = [
  '业务知识',
  '产品知识',
  '沟通技巧',
  '投诉处理',
  '技术知识',
  '故障排查',
  '财务知识',
  '账单系统',
  '通用服务',
  '英语能力',
];

export const STORAGE_KEY = 'call_center_dispatch_v1';

export const RECOMMEND_SCORE = {
  SKILL_MATCH: 30,
  LOAD_BALANCE: 10,
  IDLE_BONUS: 20,
  BUSY_BONUS: 5,
};

export function useConfig() {
  return {
    UPGRADE_THRESHOLD_SECONDS,
    WARNING_BEFORE_UPGRADE_SECONDS,
    STORAGE_KEY,
    RECOMMEND_SCORE,
    ALL_SKILL_TAGS,
  };
}
