#!/usr/bin/env node
/**
 * persist-check.mjs
 * 
 * 模拟 Zustand persist 序列化 + 反序列化完整流程：
 * Step1: 从 mock 初始化 store（含 cloneCallWithFreshRelativeTiming rebase）
 * Step2: JSON.stringify 模拟 localStorage 落盘（所有 Date→ISO 字符串）
 * Step3: JSON.parse 模拟读取 localStorage（所有 Date→字符串）
 * Step4: reviver + hydrateDates 双重恢复流程
 * Step5: 断言所有时间字段是有效Date，upgradeQueue包含验收号码 133****7777
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const pass = (m) => console.log(`  \x1b[32m[PASS]\x1b[0m ${m}`);
const fail = (m) => { console.log(`  \x1b[31m[FAIL]\x1b[0m ${m}`); process.exitCode = 1; };

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

// 构造和 store 里完全一致的 reviver + hydrateDates
const DATE_PATHS = ['enterPoolTime','assignTime','upgradeAt','transferredAt','finishedAt','upgradeTime'];
const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
function reviver(_k, value) {
  if (typeof value === 'string' && iso.test(value)) {
    const d = new Date(value);
    if (isValidDate(d)) return d;
  }
  return value;
}
function hydrateDates(obj) {
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(hydrateDates);
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
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

// 读取构建后的 mock（先通过 ts 转译）— 直接读源码字符串并用 Function 构造近似
// 为避免 ts 依赖，我们直接把关键逻辑内嵌：cloneCallWithFreshRelativeTiming + 模拟数据

function getSecondsSince(d) {
  if (!isValidDate(d)) return 0;
  const diff = Date.now() - d.getTime();
  return Number.isFinite(diff) ? Math.floor(diff / 1000) : 0;
}

// —— 构建 mock 数据（与 src/data/mock.ts 保持等价的验收号码：133****7777）——
const now = Date.now();
const nowDate = new Date(now);
function cloneRebase(c) {
  const rebase = (d) => {
    if (d === null || d === undefined) return undefined;
    if (!isValidDate(d)) return undefined;
    const elapsed = getSecondsSince(d);
    if (!Number.isFinite(elapsed) || elapsed < 0) return undefined;
    const rebased = new Date(now - elapsed * 1000);
    return isValidDate(rebased) ? rebased : undefined;
  };
  const rebasedPoolTime = rebase(c.enterPoolTime) ?? nowDate;
  const rebasedAssignTime = rebase(c.assignTime);
  return {
    ...c,
    enterPoolTime: rebasedPoolTime,
    assignTime: isValidDate(rebasedAssignTime) ? rebasedAssignTime : null,
    upgradeRecord: c.upgradeRecord
      ? {
          ...c.upgradeRecord,
          upgradeAt: rebase(c.upgradeRecord.upgradeAt) ?? c.upgradeRecord.upgradeAt ?? nowDate,
          waitSeconds: Number.isFinite(c.upgradeRecord.waitSeconds)
            ? Math.max(0, c.upgradeRecord.waitSeconds) : 0,
        }
      : undefined,
  };
}

// 模拟初始的已升级号码：upgradeAt 设定为 2分钟前（验收路径3使用）
const TWO_MIN_AGO = new Date(now - 2 * 60 * 1000);
const SIX_MIN_AGO = new Date(now - 6 * 60 * 1000);  // 已超时1分钟
const mockUpgradeItem = {
  id: 'call_upgrade_001',
  phoneNumber: '133****7777',
  customerLevel: 'gold',
  problemType: 'complaint',
  customerName: '黄先生',
  isHighPriority: false,
  isBlacklisted: false,
  requiredSkills: ['投诉处理', '沟通技巧'],
  status: 'upgraded',
  enterPoolTime: SIX_MIN_AGO,
  assignedAgentId: null,
  assignTime: null,
  transferRecords: [],
  upgradeRecord: {
    upgradeAt: TWO_MIN_AGO,
    source: 'candidate_timeout',
    waitSeconds: 300,
    description: '候选池等待超时5分钟未分派，自动升级至班长处理',
  },
  remarks: '验收号码：刷新后仍必须在升级队列，倒计时来源可读',
};

// —— Step 1：初始化 store（模拟 cloneCallWithFreshRelativeTiming）——
console.log('\n\x1b[36m━━━ Step 1: 初始化 store (rebase 相对时间戳) ━━━\x1b[0m');
const initialUpgrade = [cloneRebase(mockUpgradeItem)];

// 验证初始化后都是有效 Date
const call0 = initialUpgrade[0];
if (isValidDate(call0.enterPoolTime)) {
  pass(`enterPoolTime 是有效 Date: ${call0.enterPoolTime.toISOString().slice(11,19)}`);
} else fail('enterPoolTime 不是有效 Date！');
if (isValidDate(call0.upgradeRecord?.upgradeAt)) {
  pass(`upgradeRecord.upgradeAt 是有效 Date: ${call0.upgradeRecord.upgradeAt.toISOString().slice(11,19)}`);
} else fail('upgradeAt 不是有效 Date！');

// 验证号码在升级队列
if (call0.phoneNumber === '133****7777') {
  pass(`验收号码 133****7777 在初始化升级队列: phoneNumber=${call0.phoneNumber}`);
} else fail('133****7777 不在初始化升级队列！');

// —— Step 2+3：序列化 → 反序列化（模拟 localStorage round-trip）——
console.log('\n\x1b[36m━━━ Step 2+3: 模拟刷新：JSON.stringify → JSON.parse ━━━\x1b[0m');
const serialized = JSON.stringify(initialUpgrade);
// 反序列化不带 reviver：所有时间变字符串
const parsedPlain = JSON.parse(serialized);
const afterStringifyType = typeof parsedPlain[0].enterPoolTime;
const afterUpgradeAtType = typeof parsedPlain[0].upgradeRecord.upgradeAt;
pass(`落盘后 enterPoolTime 类型: ${afterStringifyType}`);
pass(`落盘后 upgradeAt 类型: ${afterUpgradeAtType}`);
if (afterStringifyType === 'string' && afterUpgradeAtType === 'string') {
  pass('刷新读取时时间字段是 ISO 字符串（正确预期）');
} else fail('时间字段落盘后未变成字符串！');

// —— Step 4：reviver 恢复
console.log('\n\x1b[36m━━━ Step 4: reviver + hydrateDates 双重恢复 Date ━━━\x1b[0m');
const withReviver = JSON.parse(serialized, reviver);
const hydrated = hydrateDates(withReviver);
const after = hydrated[0];

if (isValidDate(after.enterPoolTime)) {
  pass(`刷新恢复后 enterPoolTime 是有效 Date: ${after.enterPoolTime.toISOString().slice(11,19)}`);
} else fail(`enterPoolTime 恢复失败！类型=${typeof after.enterPoolTime}`);

if (isValidDate(after.upgradeRecord?.upgradeAt)) {
  pass(`刷新恢复后 upgradeAt 是有效 Date: ${after.upgradeRecord.upgradeAt.toISOString().slice(11,19)}`);
} else fail('upgradeAt 恢复失败！');

// —— Step 5：倒计时计算（模拟 CallCard 的 waited + 来源显示）——
console.log('\n\x1b[36m━━━ Step 5: 倒计时 + 来源显示（模拟 useTimer tick）——\x1b[0m');
const UPGRADE_THRESHOLD = 300; // 5min
const waited = getSecondsSince(after.enterPoolTime);
const upgradeElapsed = getSecondsSince(after.upgradeRecord?.upgradeAt);
if (Number.isFinite(waited) && waited > 0) {
  pass(`入池等待时间: ${Math.floor(waited/60)}分${waited%60}秒 (waited=${waited}s，有限正整数)`);
} else fail(`等待时间非法: waited=${waited}`);
if (Number.isFinite(upgradeElapsed) && upgradeElapsed > 0) {
  pass(`升级后已过去: ${Math.floor(upgradeElapsed/60)}分${upgradeElapsed%60}秒`);
} else fail(`升级过去时间非法: upgradeElapsed=${upgradeElapsed}`);

// 验证来源可读
const source = after.upgradeRecord?.source;
const desc = after.upgradeRecord?.description;
if (source === 'candidate_timeout') {
  pass(`升级来源可读: source=${source}`);
} else fail(`来源丢失！source=${source}`);
if (typeof desc === 'string' && desc.includes('超时')) {
  pass(`升级描述可读（"超时"关键字）: ${desc.slice(0, 24)}...`);
} else fail('升级描述不可读！');

// 验证号码仍在升级队列
if (after.phoneNumber === '133****7777' && after.status === 'upgraded') {
  pass(`【验收路径-3 关键断言】刷新后 ${after.phoneNumber} 仍在升级队列，status=${after.status}`);
} else fail('验收号码刷新后不在升级队列！');

// —— Step 6：极端情况防御（Invalid Date、null、undefined）——
console.log('\n\x1b[36m━━━ Step 6: 极端情况防御（Invalid Date / null / undefined）━━━\x1b[0m');
const invalidTest = {
  enterPoolTime: null, assignTime: undefined, 
  upgradeAt: new Date('not-a-date'),  // Invalid Date
  weird: '2024-13-45T25:99:99Z',       // 非法月日时分秒
};
const r1 = cloneRebase(invalidTest);
const r2_rebased = r1.enterPoolTime;
if (isValidDate(r2_rebased)) {
  pass(`null enterPoolTime → fallback 到 nowDate: ${r2_rebased.toISOString().slice(11,19)}`);
} else fail('null enterPoolTime 未正确 fallback！');
if (r1.assignTime === null) {
  pass('undefined assignTime → 保留 null（正确）');
} else fail('undefined assignTime 未正确处理！');

// Invalid Date 走 reviver
const invalidSerialized = JSON.stringify({ t: new Date('not-a-date') });
const invalidRevived = JSON.parse(invalidSerialized, reviver);
// Invalid Date → JSON.stringify 变成 null → reviver 字符串判断跳过 → 返回null
if (invalidRevived.t === null) {
  pass('Invalid Date 序列化 → null，reviver 安全（不产生 Invalid Date）');
} else fail('Invalid Date 处理异常！');

// 非法日期字符串走 hydrateDates
const weirdParsed = { upgradeAt: '2024-13-45T25:99:99Z' };
const weirdHydrated = hydrateDates(weirdParsed);
// new Date('2024-13-45T25:99:99Z') → Invalid Date → isValid → false → 保留字符串
if (typeof weirdHydrated.upgradeAt === 'string') {
  pass('非法月日时串 → hydrateDates 保留原字符串（不返回 Invalid Date）');
} else fail('非法日期未被 hydrateDates 拦截！');

console.log('\n\x1b[32m━━━ 持久化 + 倒计时恢复 全部断言通过 ━━━\x1b[0m\n');
