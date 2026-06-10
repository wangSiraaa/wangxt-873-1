import { useEffect } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { AgentList } from '@/components/agents/AgentCard';
import { PoolPanel } from '@/components/queues/PoolPanel';
import { ProcessingPanel } from '@/components/queues/ProcessingPanel';
import { UpgradePanel } from '@/components/queues/UpgradePanel';
import { FinishedPanel } from '@/components/queues/FinishedPanel';
import { AssignModal } from '@/components/modals/AssignModal';
import { TransferModal } from '@/components/modals/TransferModal';
import { FinishModal } from '@/components/modals/FinishModal';
import { Toast } from '@/components/Toast';
import { useAppStore } from '@/store';
import { useTimer } from '@/hooks/useTimer';

export default function Home() {
  const checkAndProcessUpgrades = useAppStore((s) => s.checkAndProcessUpgrades);
  const tick = useTimer(1000);

  useEffect(() => {
    void tick;
    const r = checkAndProcessUpgrades();
    if (r && r.length > 0) {
      // 已升级的toast在store内部通过showToast触发
    }
  }, [tick, checkAndProcessUpgrades]);

  return (
    <div className="min-h-screen w-full flex flex-col text-text-primary">
      <TopBar />

      <main className="flex-1 p-4 lg:p-5 space-y-4 max-w-[1920px] mx-auto w-full">
        <StatsCards />

        <div className="grid grid-cols-12 gap-3" style={{ height: 'calc(100vh - 260px)' }}>
          <div className="col-span-3 flex flex-col min-h-0">
            <AgentList />
          </div>

          <div className="col-span-3 flex flex-col min-h-0">
            <PoolPanel />
          </div>

          <div className="col-span-3 flex flex-col min-h-0 space-y-3">
            <div className="flex-1 flex flex-col min-h-0">
              <ProcessingPanel />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <UpgradePanel />
            </div>
          </div>

          <div className="col-span-3 flex flex-col min-h-0">
            <FinishedPanel />
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-text-secondary/40 py-2 border-t border-white/5 px-4 font-mono">
        Call Center Dispatch Console · React 18 + TypeScript + Vite 6 + Tailwind 3 + Zustand 5 · Local Mock Mode ·
        数据本地持久化（localStorage）
      </footer>

      <AssignModal />
      <TransferModal />
      <FinishModal />
      <Toast />
    </div>
  );
}
