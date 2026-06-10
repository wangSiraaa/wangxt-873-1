import {
  Agent,
  CallNumber,
  AgentStatus,
  CallStatus,
  ProblemType,
  CustomerLevel,
  UserRole,
  PROBLEM_TYPE_SKILLS,
  TransferRecord,
  UpgradeRecord,
} from '@/types';
import { generateId } from '@/utils/id';
import { UPGRADE_THRESHOLD_SECONDS } from '@/config';

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

function secondsAgo(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

export const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent_001',
    name: '李娜',
    avatar: '李',
    skills: ['业务知识', '产品知识', '沟通技巧', '英语能力'],
    status: AgentStatus.IDLE,
    currentLoad: 0,
    maxLoad: 3,
  },
  {
    id: 'agent_002',
    name: '王伟',
    avatar: '王',
    skills: ['投诉处理', '沟通技巧', '通用服务'],
    status: AgentStatus.BUSY,
    currentLoad: 2,
    maxLoad: 3,
  },
  {
    id: 'agent_003',
    name: '张伟',
    avatar: '张',
    skills: ['技术知识', '故障排查', '产品知识'],
    status: AgentStatus.IDLE,
    currentLoad: 1,
    maxLoad: 3,
  },
  {
    id: 'agent_004',
    name: '刘芳',
    avatar: '刘',
    skills: ['财务知识', '账单系统', '产品知识', '业务知识'],
    status: AgentStatus.PAUSED,
    currentLoad: 0,
    maxLoad: 3,
  },
  {
    id: 'agent_005',
    name: '陈静',
    avatar: '陈',
    skills: ['业务知识', '产品知识', '沟通技巧', '投诉处理'],
    status: AgentStatus.OFFLINE,
    currentLoad: 0,
    maxLoad: 3,
  },
  {
    id: 'agent_006',
    name: '赵强',
    avatar: '赵',
    skills: ['技术知识', '故障排查', '英语能力'],
    status: AgentStatus.BUSY,
    currentLoad: 3,
    maxLoad: 3,
  },
  {
    id: 'agent_007',
    name: '孙丽',
    avatar: '孙',
    skills: ['沟通技巧', '通用服务', '业务知识'],
    status: AgentStatus.IDLE,
    currentLoad: 0,
    maxLoad: 3,
  },
  {
    id: 'agent_008',
    name: '周明',
    avatar: '周',
    skills: ['财务知识', '账单系统', '通用服务'],
    status: AgentStatus.IDLE,
    currentLoad: 1,
    maxLoad: 3,
  },
];

function makeCall(opts: Partial<CallNumber> & {
  phoneNumber: string;
  problemType: ProblemType;
  customerLevel: CustomerLevel;
}): CallNumber {
  const skills = PROBLEM_TYPE_SKILLS[opts.problemType] || [];
  return {
    id: generateId('call_'),
    requiredSkills: skills,
    isHighPriority: false,
    isBlacklisted: false,
    status: CallStatus.POOL,
    assignedAgentId: null,
    enterPoolTime: minutesAgo(5),
    transferRecords: [],
    remarks: opts.remarks,
    ...opts,
  };
}

function makeTransfer(fromId: string, toId: string, reason: string, minutesAgoN: number): TransferRecord {
  return {
    id: generateId('trans_'),
    fromAgentId: fromId,
    toAgentId: toId,
    reason,
    transferredAt: minutesAgo(minutesAgoN),
    operatorId: null,
  };
}

export const MOCK_POOL_QUEUE: CallNumber[] = [
  makeCall({
    phoneNumber: '138****8888',
    problemType: ProblemType.BILL,
    customerLevel: CustomerLevel.DIAMOND,
    isHighPriority: true,
    customerName: '王总（钻石VIP）',
    enterPoolTime: secondsAgo(60),
    remarks: 'VIP专线，账单异议，上月多扣费需紧急核实',
  }),
  makeCall({
    phoneNumber: '139****6666',
    problemType: ProblemType.COMPLAINT,
    customerLevel: CustomerLevel.GOLD,
    customerName: '张先生',
    enterPoolTime: secondsAgo(UPGRADE_THRESHOLD_SECONDS - 90),
    remarks: '投诉：服务态度问题，要求主管回电',
  }),
  makeCall({
    phoneNumber: '137****2222',
    problemType: ProblemType.TECH,
    customerLevel: CustomerLevel.SILVER,
    customerName: '李女士',
    enterPoolTime: secondsAgo(180),
    remarks: 'APP无法登录，已尝试清除缓存无效',
  }),
  makeCall({
    phoneNumber: '186****0001',
    problemType: ProblemType.CONSULT,
    customerLevel: CustomerLevel.NORMAL,
    customerName: '赵先生',
    enterPoolTime: secondsAgo(90),
  }),
  makeCall({
    phoneNumber: '135****4444',
    problemType: ProblemType.OTHER,
    customerLevel: CustomerLevel.NORMAL,
    customerName: '刘女士',
    isBlacklisted: true,
    enterPoolTime: secondsAgo(240),
    remarks: '⚠ 历史3次骚扰记录：重复询问同一问题',
  }),
  makeCall({
    phoneNumber: '188****9999',
    problemType: ProblemType.CONSULT,
    customerLevel: CustomerLevel.NEW,
    customerName: '新客户',
    enterPoolTime: secondsAgo(30),
  }),
];

export const MOCK_PROCESSING_QUEUE: CallNumber[] = [
  {
    ...makeCall({
      phoneNumber: '136****1234',
      problemType: ProblemType.TECH,
      customerLevel: CustomerLevel.GOLD,
      customerName: '技术-金先生',
      isHighPriority: false,
      status: CallStatus.PROCESSING,
      assignedAgentId: 'agent_003',
      enterPoolTime: minutesAgo(8),
      assignTime: minutesAgo(6),
    }),
    transferRecords: [
      makeTransfer('agent_006', 'agent_003', '坐席赵强已达最大负载，需转派给张伟（技术支持）', 4),
    ],
    remarks: '客户反映系统卡顿，已转派给技术岗张伟',
  },
  {
    ...makeCall({
      phoneNumber: '151****5678',
      problemType: ProblemType.BILL,
      customerLevel: CustomerLevel.SILVER,
      customerName: '账单-银女士',
      status: CallStatus.PROCESSING,
      assignedAgentId: 'agent_002',
      enterPoolTime: minutesAgo(10),
      assignTime: minutesAgo(7),
    }),
  },
  {
    ...makeCall({
      phoneNumber: '150****3333',
      problemType: ProblemType.CONSULT,
      customerLevel: CustomerLevel.NORMAL,
      customerName: '咨询-普通',
      status: CallStatus.PROCESSING,
      assignedAgentId: 'agent_002',
      enterPoolTime: minutesAgo(4),
      assignTime: minutesAgo(2),
    }),
  },
];

export const MOCK_UPGRADE_QUEUE: CallNumber[] = [
  (() => {
    const call = makeCall({
      phoneNumber: '133****7777',
      problemType: ProblemType.COMPLAINT,
      customerLevel: CustomerLevel.GOLD,
      customerName: '投诉超时-黄先生',
      isHighPriority: true,
      status: CallStatus.UPGRADED,
      assignedAgentId: null,
      enterPoolTime: secondsAgo(UPGRADE_THRESHOLD_SECONDS + 120),
    });
    const waited = UPGRADE_THRESHOLD_SECONDS;
    const upgradeRec: UpgradeRecord = {
      upgradeAt: secondsAgo(120),
      source: 'candidate_timeout',
      waitSeconds: waited,
      description: `候选池等待超时${Math.round(waited / 60)}分钟未分派，自动升级至班长处理`,
    };
    return {
      ...call,
      upgradeRecord: upgradeRec,
      remarks: '⚠ 此号码用于验收测试"刷新后已升级号码仍在升级队列"',
    };
  })(),
];

export const MOCK_FINISHED_RECORDS: CallNumber[] = [
  (() => {
    const c = makeCall({
      phoneNumber: '189****1111',
      problemType: ProblemType.CONSULT,
      customerLevel: CustomerLevel.SILVER,
      customerName: '已完成-咨询',
      status: CallStatus.FINISHED,
      assignedAgentId: 'agent_001',
      enterPoolTime: minutesAgo(25),
      assignTime: minutesAgo(22),
      finishReason: '问题已完全解决',
      finalStatus: CallStatus.FINISHED,
      finishedAt: minutesAgo(15),
    });
    return {
      ...c,
      upgradeRecord: ((): UpgradeRecord => ({
        upgradeAt: minutesAgo(20),
        source: 'manual_upgrade' as const,
        waitSeconds: 300,
        description: '客户要求班长介入，手动升级',
      }))(),
    };
  })(),
  (() => {
    const c = makeCall({
      phoneNumber: '177****2345',
      problemType: ProblemType.BILL,
      customerLevel: CustomerLevel.NORMAL,
      customerName: '已完成-账单+转派',
      status: CallStatus.FINISHED,
      assignedAgentId: 'agent_008',
      enterPoolTime: minutesAgo(40),
      assignTime: minutesAgo(37),
      finishReason: '客户满意结束通话',
      finalStatus: CallStatus.FINISHED,
      finishedAt: minutesAgo(25),
    });
    return {
      ...c,
      transferRecords: [
        makeTransfer('agent_004', 'agent_008', '坐席刘芳因临时有事需转派给周明', 35),
      ],
    };
  })(),
];

export const INITIAL_ROLE = UserRole.MONITOR;
export const INITIAL_CURRENT_AGENT_ID: string | null = null;
export const INITIAL_THRESHOLD = UPGRADE_THRESHOLD_SECONDS;
