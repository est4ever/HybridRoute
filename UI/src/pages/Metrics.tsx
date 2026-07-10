import { Cpu, Cloud, BarChart3, Activity, DollarSign, TrendingDown, ShieldCheck } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { useMetrics } from '../context/MetricsContext';

export default function Metrics() {
  const { metrics, ollamaPercent, fireworksPercent } = useMetrics();
  const hasData = metrics.totalPrompts > 0;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-1/4 w-96 h-96 rounded-full bg-remote/3 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-80 h-80 rounded-full bg-local/3 blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-2">
            Routing Metrics
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
            Real-time analytics for all routing decisions made during this session.
            Data resets on page refresh.
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            label="Total Requests Routed"
            value={metrics.totalPrompts.toString()}
            icon={<Activity className="w-4.5 h-4.5 text-foreground" />}
            subtitle={hasData ? 'session total' : undefined}
          />
          <MetricCard
            label="Local Route"
            value={hasData ? `${ollamaPercent.toFixed(1)}%` : '0%'}
            icon={<Cpu className="w-4.5 h-4.5 text-local" />}
            glowColor="local"
            subtitle={hasData ? `${metrics.ollamaCount} requests` : undefined}
          />
          <MetricCard
            label="Hosted Route"
            value={hasData ? `${fireworksPercent.toFixed(1)}%` : '0%'}
            icon={<Cloud className="w-4.5 h-4.5 text-remote" />}
            glowColor="remote"
            subtitle={hasData ? `${metrics.fireworksCount} requests` : undefined}
          />
          <MetricCard
            label="Total Remote Tokens Used"
            value={hasData ? metrics.totalRemoteTokensUsed.toLocaleString() : '0'}
            icon={<DollarSign className="w-4.5 h-4.5 text-accent" />}
            glowColor="accent"
            subtitle={hasData ? 'hosted inference cost' : undefined}
          />
          <MetricCard
            label="Total Tokens Saved"
            value={hasData ? metrics.totalTokensSaved.toLocaleString() : '0'}
            icon={<TrendingDown className="w-4.5 h-4.5 text-local" />}
            glowColor="local"
            subtitle={hasData ? 'by local routing' : undefined}
          />
          <MetricCard
            label="Remote Calls Avoided"
            value={hasData ? metrics.remoteCallsAvoided.toString() : '0'}
            icon={<ShieldCheck className="w-4.5 h-4.5 text-local" />}
            glowColor="local"
            subtitle={hasData ? 'saved by workload analyzer' : undefined}
          />
        </div>

        {/* Distribution bar */}
        <div className="glass-card rounded-xl p-5 sm:p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted" />
            Routing Distribution
          </h3>

          {hasData ? (
            <div className="space-y-4">
              <div className="relative h-8 rounded-lg overflow-hidden bg-surface-3 flex">
                <div
                  className="h-full bg-local flex items-center justify-center text-xs font-mono font-bold text-black transition-all duration-700 ease-out"
                  style={{ width: `${ollamaPercent}%` }}
                >
                  {ollamaPercent > 8 && `${ollamaPercent.toFixed(0)}%`}
                </div>
                <div
                  className="h-full bg-remote flex items-center justify-center text-xs font-mono font-bold text-white transition-all duration-700 ease-out"
                  style={{ width: `${fireworksPercent}%` }}
                >
                  {fireworksPercent > 8 && `${fireworksPercent.toFixed(0)}%`}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-local" />
                  <span className="text-muted">
                    Local <strong className="text-foreground">({metrics.ollamaCount})</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-remote" />
                  <span className="text-muted">
                    Hosted <strong className="text-foreground">({metrics.fireworksCount})</strong>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={<Activity className="w-5 h-5 text-muted/40" />}
              text="No routing data yet. Visit the Demo page to start routing requests." />
          )}
        </div>

        {/* Efficiency summary */}
        <div className="glass-card rounded-xl p-5 sm:p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-local" />
            Efficiency Summary
          </h3>

          {hasData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface/50 rounded-lg p-4 border border-border/20">
                  <div className="text-xs text-muted mb-1">Remote Tokens Used</div>
                  <div className="text-lg font-mono font-bold text-remote">
                    {metrics.totalRemoteTokensUsed.toLocaleString()}
                  </div>
                </div>
                <div className="bg-surface/50 rounded-lg p-4 border border-border/20">
                  <div className="text-xs text-muted mb-1">Tokens Saved</div>
                  <div className="text-lg font-mono font-bold text-local">
                    {metrics.totalTokensSaved.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-local/5 border border-local/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-heading font-bold text-local">
                  {metrics.remoteCallsAvoided}
                </div>
                <div className="text-xs text-muted mt-1">
                  Remote calls avoided by routing locally
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={<DollarSign className="w-5 h-5 text-muted/40" />}
              text="Route some requests from the demo page to see efficiency data." />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-2 border border-border/30 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-sm text-muted/50">{text}</p>
    </div>
  );
}