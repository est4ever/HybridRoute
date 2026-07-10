import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  glowColor?: 'local' | 'remote' | 'accent';
  subtitle?: string;
}

export default function MetricCard({
  label,
  value,
  icon,
  trend,
  glowColor,
  subtitle,
}: MetricCardProps) {
  const glowClass = glowColor === 'local'
    ? 'glow-cyan'
    : glowColor === 'remote'
      ? 'glow-purple'
      : glowColor === 'accent'
        ? 'glow-amber'
        : '';

  return (
    <div className={`glass-card rounded-xl px-5 py-4 ${glowClass} animate-fade-in-up`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="text-2xl font-heading font-bold text-foreground tracking-tight">
        {value}
      </div>

      {(trend || subtitle) && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend === 'up'
                  ? 'text-local'
                  : trend === 'down'
                    ? 'text-destructive'
                    : 'text-muted'
              }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}