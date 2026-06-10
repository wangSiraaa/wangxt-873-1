import { UserRole, UserRole as Role } from '@/types';
import { useAppStore } from '@/store';
import { usePermission } from '@/hooks/usePermission';
import { Shield, Users, Download, RefreshCw, Headphones } from 'lucide-react';

export function TopBar() {
  const currentRole = useAppStore((s) => s.currentRole);
  const currentAgentId = useAppStore((s) => s.currentAgentId);
  const agents = useAppStore((s) => s.agents);
  const setRole = useAppStore((s) => s.setRole);
  const setCurrentAgentId = useAppStore((s) => s.setCurrentAgentId);
  const showToast = useAppStore((s) => s.showToast);
  const exportToCSV = useAppStore((s) => s.exportToCSV);
  const resetData = useAppStore((s) => s.resetData);
  const perm = usePermission(currentRole, currentAgentId);

  const handleExport = () => {
    const r = exportToCSV();
    showToast(r.success ? 'success' : 'error', r.message || '');
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据到初始状态吗？此操作不可撤销。')) {
      resetData();
      showToast('success', '数据已重置到初始模拟状态');
    }
  };

  return (
    <div className="sticky top-0 z-40 glass-panel border-b border-border-glass/60 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-cyan border border-border-glass flex items-center justify-center shadow-glow-cyan">
            <Headphones className="w-5 h-5 text-accent-cyan" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary leading-tight">
              问询坐席分流调度台
            </h1>
            <p className="text-[11px] text-text-secondary leading-tight">
              Call Center Dispatch Console · Local Mock
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 mx-2" />

        <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
          <button
            onClick={() => setRole(UserRole.MONITOR)}
            className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1 ${
              currentRole === Role.MONITOR
                ? 'bg-accent-cyan text-white shadow-glow-cyan font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 班长
          </button>
          <button
            onClick={() => setRole(UserRole.AGENT)}
            className={`px-3 py-1 text-xs rounded-full transition-all flex items-center gap-1 ${
              currentRole === Role.AGENT
                ? 'bg-accent-green text-white shadow-glow-green font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 普通坐席
          </button>
        </div>

        {currentRole === Role.AGENT && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">当前身份:</span>
            <select
              className="form-input w-auto py-1 text-xs"
              value={currentAgentId || ''}
              onChange={(e) => setCurrentAgentId(e.target.value || null)}
            >
              <option value="">-- 请选择坐席身份 --</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="btn-ghost flex items-center gap-1.5"
          onClick={handleReset}
          title="重置为初始模拟数据"
        >
          <RefreshCw className="w-4 h-4" /> 重置数据
        </button>
        <button
          className={`btn-primary flex items-center gap-1.5 ${
            perm.canExport() ? '' : 'opacity-40 cursor-not-allowed'
          }`}
          onClick={handleExport}
          disabled={!perm.canExport()}
        >
          <Download className="w-4 h-4" /> 导出当班记录
        </button>
      </div>
    </div>
  );
}
