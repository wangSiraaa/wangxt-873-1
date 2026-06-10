import { useAppStore } from '@/store';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  if (!toast) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-accent-green" />,
    warning: <AlertTriangle className="w-5 h-5 text-accent-orange" />,
    error: <XCircle className="w-5 h-5 text-accent-red" />,
  };

  const bgMap = {
    success: 'bg-gradient-green border-accent-green/40',
    warning: 'bg-gradient-orange border-accent-orange/40',
    error: 'bg-gradient-red border-accent-red/40',
  };

  return (
    <div
      className={`fixed top-20 right-6 z-[60] glass-panel px-4 py-3 flex items-center gap-3 animate-slide-up border shadow-glow-cyan cursor-pointer ${bgMap[toast.type]}`}
      onClick={clearToast}
    >
      {iconMap[toast.type]}
      <span className="text-sm text-text-primary font-medium">{toast.message}</span>
    </div>
  );
}
