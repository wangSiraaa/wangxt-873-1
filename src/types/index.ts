export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  PAUSED = 'paused',
  OFFLINE = 'offline',
}

export enum CallStatus {
  POOL = 'pool',
  PROCESSING = 'processing',
  UPGRADED = 'upgraded',
  FINISHED = 'finished',
  TRANSFERRED_OUT = 'transferred_out',
}

export enum ProblemType {
  CONSULT = 'CONSULT',
  COMPLAINT = 'COMPLAINT',
  TECH = 'TECH',
  BILL = 'BILL',
  OTHER = 'OTHER',
}

export enum CustomerLevel {
  NEW = 1,
  NORMAL = 2,
  SILVER = 3,
  GOLD = 4,
  DIAMOND = 5,
}

export enum UserRole {
  MONITOR = 'monitor',
  AGENT = 'agent',
}

export type SkillTag =
  | '业务知识'
  | '产品知识'
  | '沟通技巧'
  | '投诉处理'
  | '技术知识'
  | '故障排查'
  | '财务知识'
  | '账单系统'
  | '通用服务'
  | '英语能力';

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  skills: SkillTag[];
  status: AgentStatus;
  currentLoad: number;
  maxLoad: number;
}

export interface TransferRecord {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  reason: string;
  transferredAt: Date;
  operatorId: string | null;
}

export interface UpgradeRecord {
  upgradeAt: Date;
  source: 'candidate_timeout' | 'manual_upgrade';
  waitSeconds: number;
  description: string;
}

export interface CallNumber {
  id: string;
  phoneNumber: string;
  customerName?: string;
  problemType: ProblemType;
  requiredSkills: SkillTag[];
  customerLevel: CustomerLevel;
  isHighPriority: boolean;
  isBlacklisted: boolean;
  status: CallStatus;
  assignedAgentId: string | null;
  enterPoolTime: Date;
  assignTime?: Date | null;
  transferRecords: TransferRecord[];
  upgradeRecord?: UpgradeRecord;
  remarks?: string;
  finishedAt?: Date;
  finishReason?: string;
  finalStatus?: CallStatus;
}

export interface ModalState {
  type: 'assign' | 'assign_from_upgrade' | 'transfer' | 'finish' | 'upgrade_detail';
  callId: string;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export interface AppState {
  currentRole: UserRole;
  currentAgentId: string | null;
  upgradeThresholdSeconds: number;
  agents: Agent[];
  poolQueue: CallNumber[];
  processingQueue: CallNumber[];
  upgradeQueue: CallNumber[];
  finishedRecords: CallNumber[];
  modal: ModalState | null;
  toast: ToastMessage | null;
}

export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  [AgentStatus.IDLE]: '空闲',
  [AgentStatus.BUSY]: '忙碌',
  [AgentStatus.PAUSED]: '暂停',
  [AgentStatus.OFFLINE]: '离线',
};

export const CALL_STATUS_LABEL: Record<CallStatus, string> = {
  [CallStatus.POOL]: '候选排队',
  [CallStatus.PROCESSING]: '处理中',
  [CallStatus.UPGRADED]: '已升级',
  [CallStatus.FINISHED]: '已完成',
  [CallStatus.TRANSFERRED_OUT]: '已转出',
};

export const PROBLEM_TYPE_LABEL: Record<ProblemType, string> = {
  [ProblemType.CONSULT]: '业务咨询',
  [ProblemType.COMPLAINT]: '投诉处理',
  [ProblemType.TECH]: '技术支持',
  [ProblemType.BILL]: '账单查询',
  [ProblemType.OTHER]: '其他',
};

export const PROBLEM_TYPE_SKILLS: Record<ProblemType, SkillTag[]> = {
  [ProblemType.CONSULT]: ['业务知识', '产品知识', '沟通技巧'],
  [ProblemType.COMPLAINT]: ['沟通技巧', '投诉处理', '通用服务'],
  [ProblemType.TECH]: ['技术知识', '故障排查', '产品知识'],
  [ProblemType.BILL]: ['财务知识', '账单系统', '产品知识'],
  [ProblemType.OTHER]: ['通用服务', '沟通技巧'],
};

export const CUSTOMER_LEVEL_LABEL: Record<CustomerLevel, string> = {
  [CustomerLevel.NEW]: '新客户',
  [CustomerLevel.NORMAL]: '普通客户',
  [CustomerLevel.SILVER]: '银牌客户',
  [CustomerLevel.GOLD]: '金牌客户',
  [CustomerLevel.DIAMOND]: '钻石VIP',
};

export const TRANSFER_REASON_OPTIONS: string[] = [
  '坐席技能不匹配',
  '客户指定更换坐席',
  '坐席临时有事离开',
  '需班长/专家介入',
  '跨部门协作处理',
  '客户诉求超出服务范围',
];

export const FINISH_REASON_OPTIONS: string[] = [
  '问题已完全解决',
  '客户满意结束通话',
  '客户主动挂断',
  '转其他部门跟进',
  '已升级至班长处理',
  '约定回电时间',
];

export const FINISH_STATUS_OPTIONS: Array<{ value: CallStatus; label: string }> = [
  { value: CallStatus.FINISHED, label: '已完成' },
  { value: CallStatus.TRANSFERRED_OUT, label: '已转出' },
];
