import {
  Agent,
  CallNumber,
  PROBLEM_TYPE_LABEL,
  CUSTOMER_LEVEL_LABEL,
} from '@/types';
import { formatDateTime } from './time';

export function exportRecordsToCSV(
  poolQueue: CallNumber[],
  processingQueue: CallNumber[],
  upgradeQueue: CallNumber[],
  finishedRecords: CallNumber[],
  agents?: Agent[],
): void {
  const allRecords: CallNumber[] = [
    ...poolQueue,
    ...processingQueue,
    ...upgradeQueue,
    ...finishedRecords,
  ];

  const agentNameMap = new Map<string, string>();
  (agents || []).forEach((a) => agentNameMap.set(a.id, a.name));

  const statusLabel: Record<string, string> = {
    pool: '候选池',
    processing: '处理中',
    upgraded: '已升级',
    finished: '已完成',
    transferred_out: '已转出',
  };

  const headers = [
    '号码',
    '客户姓名',
    '问题类型',
    '客户等级',
    '状态',
    '分派坐席',
    '进入池时间',
    '分派时间',
    '完成时间',
    '升级时间',
    '转派次数',
    '是否升级',
    '处理备注',
    '处理结果',
  ];

  const rows = allRecords.map((call) => [
    call.phoneNumber,
    call.customerName ?? '',
    PROBLEM_TYPE_LABEL[call.problemType],
    CUSTOMER_LEVEL_LABEL[call.customerLevel],
    statusLabel[call.status] || call.status,
    call.assignedAgentId ? agentNameMap.get(call.assignedAgentId) || call.assignedAgentId : '',
    call.enterPoolTime ? formatDateTime(call.enterPoolTime) : '',
    call.assignTime ? formatDateTime(call.assignTime) : '',
    call.finishedAt ? formatDateTime(call.finishedAt) : '',
    call.upgradeRecord?.upgradeAt ? formatDateTime(call.upgradeRecord.upgradeAt) : '',
    call.transferRecords?.length ?? 0,
    call.upgradeRecord ? '是' : '否',
    call.remarks ?? '',
    call.finishReason ?? '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','),
    )
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const now = new Date();
  const stamp = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now
    .getHours()
    .toString()
    .padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  link.download = `当班记录_${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
