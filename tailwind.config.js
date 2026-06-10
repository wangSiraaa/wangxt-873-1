/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'bg-primary': '#0F172A',
        'bg-panel': '#1E293B',
        'bg-card': '#334155',
        'accent-cyan': '#06B6D4',
        'accent-orange': '#F59E0B',
        'accent-red': '#EF4444',
        'accent-green': '#10B981',
        'accent-purple': '#8B5CF6',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'border-glass': 'rgba(6, 182, 212, 0.2)',
      },
      boxShadow: {
        'glow-green': '0 0 0 2px rgba(16, 185, 129, 0.4), 0 0 12px rgba(16, 185, 129, 0.3)',
        'glow-orange': '0 0 0 2px rgba(245, 158, 11, 0.4), 0 0 12px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 0 2px rgba(139, 92, 246, 0.4), 0 0 12px rgba(139, 92, 246, 0.3)',
        'glow-red': '0 0 0 2px rgba(239, 68, 68, 0.4), 0 0 12px rgba(239, 68, 68, 0.3)',
        'glow-cyan': '0 0 0 1px rgba(6, 182, 212, 0.3), 0 0 16px rgba(6, 182, 212, 0.2)',
        'card-float': '0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-cyan': 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.02) 100%)',
        'gradient-green': 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.03) 100%)',
        'gradient-orange': 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.03) 100%)',
        'gradient-red': 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.03) 100%)',
        'gradient-purple': 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.03) 100%)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'pulse-orange': 'pulseOrange 1.6s ease-in-out infinite',
        'pulse-purple': 'pulsePurple 1.4s ease-in-out infinite',
        'breath-warn': 'breathWarn 1.2s ease-in-out infinite',
        'border-flash': 'borderFlash 0.9s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.6), 0 0 6px rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 0 5px rgba(16, 185, 129, 0), 0 0 16px rgba(16, 185, 129, 0.6)' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.6), 0 0 6px rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 0 5px rgba(245, 158, 11, 0), 0 0 16px rgba(245, 158, 11, 0.6)' },
        },
        pulsePurple: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.6), 0 0 6px rgba(139, 92, 246, 0.4)' },
          '50%': { boxShadow: '0 0 0 5px rgba(139, 92, 246, 0), 0 0 16px rgba(139, 92, 246, 0.6)' },
        },
        breathWarn: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        borderFlash: {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.9)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.2)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
