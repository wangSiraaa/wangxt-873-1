import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  accentColor?: 'cyan' | 'green' | 'red' | 'purple' | 'orange';
}

const accentMap = {
  cyan: 'border-accent-cyan',
  green: 'border-accent-green',
  red: 'border-accent-red',
  purple: 'border-accent-purple',
  orange: 'border-accent-orange',
};

export function ModalBase({
  open,
  title,
  onClose,
  children,
  footer,
  icon,
  accentColor = 'cyan',
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-0 z-50 modal-backdrop animate-fade-in flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col glass-panel border-t-4 ${accentMap[accentColor]} shadow-2xl animate-slide-up shadow-glow-cyan`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-base font-semibold text-text-primary">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
