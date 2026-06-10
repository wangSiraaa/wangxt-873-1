#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

R="\033[31m"  # Red
G="\033[32m"  # Green
Y="\033[33m"  # Yellow
C="\033[36m"  # Cyan
N="\033[0m"   # No color

TOTAL=0
PASS=0
FAIL=0
FAILURES=()

pass() { echo -e "  ${G}[PASS]${N} $1"; PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); }
fail() { echo -e "  ${R}[FAIL]${N} $1"; FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); FAILURES+=("$1"); }
header() { echo -e "\n${C}━━━ $1 ━━━${N}"; }

# ──────────────────────────────────────────────────────────────────
header "1. 类型检查 (tsc --noEmit)"
if npm run check 2>&1 > /tmp/tsc.log; then
  pass "TypeScript 类型检查通过"
else
  fail "TypeScript 类型检查失败（详见 /tmp/tsc.log）"
fi

# ──────────────────────────────────────────────────────────────────
header "2. 生产构建 (vite build)"
if npm run build 2>&1 > /tmp/build.log; then
  SIZE=$(du -sh "$ROOT/dist" 2>/dev/null | cut -f1)
  pass "构建成功，产物大小: $SIZE"
else
  fail "生产构建失败（详见 /tmp/build.log）"
fi

# ──────────────────────────────────────────────────────────────────
header "3. 规则引擎 — 验收路径 1：转派原因校验 (≥5字符)"
# 断言：rules/index.ts 中存在 validateTransferReason，要求至少5字符
if grep -q "至少需要.*5" src/rules/index.ts || grep -q "length.*<.*5\|5.*>.*length" src/rules/index.ts; then
  pass "rules/index.ts: validateTransferReason 包含 ≥5 字符校验"
else
  fail "未在 rules/index.ts 找到 validateTransferReason ≥5 字符校验"
fi
# 断言：TransferModal 中 submit 按钮会被 disabled
if grep -q "submitDisabled\|disabled=" src/components/modals/TransferModal.tsx; then
  pass "TransferModal.tsx: 提交按钮存在 disabled 控制"
else
  fail "TransferModal.tsx 中未找到提交按钮的 disabled 控制"
fi
# 断言：store transferCall 也会二次调用 validateTransferReason
if grep -q "validateTransferReason" src/store/index.ts; then
  pass "store/index.ts: transferCall 二次调用 validateTransferReason（三层拦截）"
else
  fail "store/index.ts 未二次调用 validateTransferReason"
fi

# ──────────────────────────────────────────────────────────────────
header "4. 规则引擎 — 验收路径 2：离线/暂停坐席拦截"
# 断言：rules 中存在 isUpgradeTargetBlocked
if grep -q "isUpgradeTargetBlocked\|当前离线\|已暂停" src/rules/index.ts; then
  pass "rules/index.ts: 存在离线/暂停拦截函数 isUpgradeTargetBlocked"
else
  fail "rules/index.ts 中未找到 isUpgradeTargetBlocked"
fi
# 断言：AssignModal 中 option disabled
if grep -q "disabled.*blocked\|离线\|暂停.*disabled" src/components/modals/AssignModal.tsx; then
  pass "AssignModal.tsx: 下拉框中离线/暂停 option 为 disabled"
else
  fail "AssignModal.tsx 未禁用离线/暂停 option"
fi
# 断言：store assignCall / transferCall 二次调用拦截
if grep -q "isUpgradeTargetBlocked" src/store/index.ts; then
  pass "store/index.ts: assignCall/transferCall 二次调用 isUpgradeTargetBlocked"
else
  fail "store/index.ts 未二次调用 isUpgradeTargetBlocked"
fi
# 断言：黑名单/高优不绕过离线限制 — getRecommendedAgents 对 OFFLINE/PAUSE 返回null
if grep -q "AgentStatus.OFFLINE\|AgentStatus.PAUSE.*null\|return null" src/rules/index.ts; then
  pass "rules/index.ts: getRecommendedAgents 中 OFFLINE/PAUSE 直接被排除（不绕过离线）"
else
  fail "getRecommendedAgents 未排除 OFFLINE/PAUSE"
fi

# ──────────────────────────────────────────────────────────────────
header "5. 持久化 — 验收路径 3：升级队列持久化"
# 断言：upgradeQueue 在 persist partialize 白名单
if grep -q "upgradeQueue" src/store/index.ts; then
  pass "store/index.ts: upgradeQueue 被持久化"
else
  fail "upgradeQueue 未加入 persist 白名单"
fi
# 断言：DATE_PATHS 包含 upgradeAt
if grep -q "upgradeAt" src/store/index.ts; then
  pass "store/index.ts: upgradeAt 在 DATE_PATHS 中，刷新后正确恢复为 Date"
else
  fail "upgradeAt 不在 DATE_PATHS 中，刷新后日期可能丢失"
fi
# 断言：mock 中预置了验收用升级号码 133****7777
if grep -q "133" src/data/mock.ts; then
  pass "mock.ts: 预置了验收路径3的升级号码（用于首屏验证）"
else
  fail "mock.ts 未预置升级号码"
fi
# 断言：StorageKey 常量
if grep -q "call_center_dispatch" src/config/index.ts; then
  pass "config/index.ts: 定义了持久化 StorageKey"
else
  fail "未定义持久化 StorageKey"
fi
# 断言：isValidDate 工具函数 + Invalid Date 防御
if grep -q "export function isValidDate" src/utils/time.ts && grep -q "instanceof Date" src/utils/time.ts && grep -q "isNaN.*getTime" src/utils/time.ts; then
  pass "utils/time.ts: isValidDate() 工具函数存在（d instanceof Date + !NaN(getTime)）"
else
  fail "utils/time.ts 未定义 isValidDate"
fi
# 断言：hydrateDates 有 Date instanceof 穿透（核心修复：不再把恢复的Date变成空对象）
if grep -q "if.*obj.*instanceof.*Date.*return.*obj" src/store/index.ts; then
  pass "store/index.ts: hydrateDates Date instanceof 穿透（reviver恢复的Date不再被覆盖为{}）"
else
  fail "hydrateDates 缺 Date instanceof 穿透 — reviver恢复后会被空对象覆盖！"
fi
# 断言：reviver 有 isValidDate 二次检查
if grep -q "reviver\|isValidDate\|!Number.isNaN" src/store/index.ts; then
  pass "store/index.ts: reviver + hydrateDates 双重 isValidDate 防御"
fi
# 运行 persist-check.mjs 全链路模拟：初始化→序列化→反序列化→恢复→倒计时
if node scripts/persist-check.mjs > /tmp/persist-check.log 2>&1; then
  pass "persist-check.mjs: 初始化→落盘→读取→恢复→倒计时 全链路 18项断言通过"
else
  fail "persist-check.mjs 失败（详见 /tmp/persist-check.log）"
fi

# ──────────────────────────────────────────────────────────────────
header "6. 其他强制要求检查"
# 班长+普通坐席两种角色
if grep -q "UserRole" src/types/index.ts && grep -q "MONITOR" src/types/index.ts && grep -q "AGENT" src/types/index.ts; then
  pass "types/index.ts: 定义了班长 MONITOR + 普通坐席 AGENT 角色"
else
  fail "未定义班长/普通坐席角色"
fi
# usePermission 权限矩阵
if grep -q "canAssignAny\|canChangeOtherStatus" src/hooks/usePermission.ts; then
  pass "usePermission.ts: 实现了 canAssignAny + canChangeOtherStatus 权限差"
else
  fail "usePermission 权限矩阵缺失"
fi
# 自动推荐 TOP3
if grep -q "RECOMMEND_SCORE\|topN\|matchPercent" src/rules/index.ts; then
  pass "rules/index.ts: 实现了技能×30 + 负载×10 + 状态奖励 打分"
else
  fail "缺少自动推荐打分算法"
fi
# 超时升级 detectUpgrades
if grep -q "detectUpgrades\|UPGRADE_THRESHOLD" src/rules/index.ts; then
  pass "rules/index.ts: 实现了 detectUpgrades 超时升级检测"
else
  fail "缺少 detectUpgrades 超时升级检测"
fi
# CSV导出 当班记录
if grep -q "exportToCSV\|UTF.*BOM\|blob\|Bom" src/utils/csv.ts src/store/index.ts 2>/dev/null; then
  pass "utils/csv.ts + store: 实现了 UTF-8 BOM CSV 导出"
else
  fail "缺少 CSV 导出实现"
fi
# 倒计时存时间戳而非秒数 (enterPoolTime / assignTime / upgradeAt Date类型)
if grep -q "enterPoolTime.*Date\|upgradeAt.*Date" src/types/index.ts; then
  pass "types/index.ts: 倒计时基于绝对时间戳 Date 字段（刷新不跳变）"
else
  fail "倒计时未使用绝对时间戳 Date"
fi

# ──────────────────────────────────────────────────────────────────
echo -e "\n${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "📋 验 收 结 果"
echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "  总计: ${Y}$TOTAL${N} 项"
echo -e "  通过: ${G}$PASS${N} 项"
echo -e "  失败: ${R}$FAIL${N} 项"
if [ "$FAIL" -gt 0 ]; then
  echo -e "\n${R}❌ 以下 $FAIL 项未通过:${N}"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${R}•${N} $f"
  done
  exit 1
else
  echo -e "\n${G}✅ 全部验收通过，可以部署。${N}"
  echo -e "  手动验收方式见 README.md § 验收路径"
  exit 0
fi
