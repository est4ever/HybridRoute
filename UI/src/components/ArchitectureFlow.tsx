import { type ComponentType } from 'react';
import { ArrowRight, Cpu, Cloud, BarChart3, MessageSquare, Route, Gauge, ShieldCheck, FileJson } from 'lucide-react';

interface FlowNodeProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  sublabel?: string;
  color: 'local' | 'remote' | 'accent' | 'foreground';
}

function FlowNode({ icon: Icon, label, sublabel, color }: FlowNodeProps) {
  const colorClasses = {
    local: 'border-local/30 bg-local/5 text-local',
    remote: 'border-remote/30 bg-remote/5 text-remote',
    accent: 'border-accent/30 bg-accent/5 text-accent',
    foreground: 'border-border/50 bg-surface-2 text-foreground',
  };

  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px]">
      <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {sublabel && <div className="text-[11px] text-muted mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

export default function ArchitectureFlow() {
  return (
    <div className="glass-card rounded-xl p-6 sm:p-8">
      {/* Main chain: Application Request → Workload Analyzer */}
      <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12 relative">
        <FlowNode icon={MessageSquare} label="Application Request" sublabel="Raw input" color="foreground" />
        <ArrowRight className="w-5 h-5 text-muted/40 hidden lg:block" />
        <FlowNode icon={Gauge} label="Workload Analyzer" sublabel="Complexity · tokens · intent" color="accent" />
      </div>

      {/* Branching arrow */}
      <div className="flex items-center justify-center gap-3 my-6">
        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
          <Route className="w-3.5 h-3.5" />
          Route by workload
        </div>
        <div className="h-px flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </div>

      {/* Model path branches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Local / Fast path */}
        <div className="glass-card rounded-lg p-5 border-local/20 bg-local/3">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-local/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-local" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted/50" />
              <div className="w-10 h-10 rounded-lg bg-local/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-local" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-local bg-local/10 px-2 py-0.5 rounded-full">
                LIGHT
              </span>
              <span className="text-xs text-muted">simple</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">Local Inference</div>
              <div className="text-xs text-muted mt-0.5">Fast · free · on-device</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted bg-local/5 px-3 py-1.5 rounded-lg border border-local/10">
              <ShieldCheck className="w-3.5 h-3.5 text-local" />
              Verifier: {">"}0.7
            </div>
          </div>
        </div>

        {/* Hosted / High-quality path */}
        <div className="glass-card rounded-lg p-5 border-remote/20 bg-remote/3">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-remote/10 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-remote" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted/50" />
              <div className="w-10 h-10 rounded-lg bg-remote/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-remote" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-remote bg-remote/10 px-2 py-0.5 rounded-full">
                COMPLEX
              </span>
              <span className="text-xs text-muted">reasoning</span>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">Hosted Inference</div>
              <div className="text-xs text-muted mt-0.5">Strong · paid · compressed</div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted bg-remote/5 px-3 py-1.5 rounded-lg border border-remote/10">
              <BarChart3 className="w-3.5 h-3.5 text-remote" />
              Compress before inference
            </div>
          </div>
        </div>
      </div>

      {/* Additional model paths note */}
      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-2 text-xs text-muted bg-surface-2 rounded-lg px-4 py-2 border border-border/30">
          <FileJson className="w-3.5 h-3.5" />
          More paths: code, reasoning, and others via config
        </div>
      </div>

      {/* Output */}
      <div className="flex justify-center mt-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-xl border-2 border-local/30 bg-local/5 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-local" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-foreground">Response</div>
            <div className="text-[11px] text-muted mt-0.5">Decision · tokens · answer</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/30">
        <div className="text-xs font-medium text-muted mb-3 uppercase tracking-wider">
          Route Decision Fields
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <WeightBadge label="selected_route" weight="local / hosted" color="text-local" />
          <WeightBadge label="workload_score" weight="0–100" color="text-accent" />
          <WeightBadge label="confidence" weight="0.0–1.0" color="text-remote" />
        </div>
      </div>
    </div>
  );
}

function WeightBadge({
  label,
  weight,
  color,
}: {
  label: string;
  weight: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between bg-surface/50 rounded-lg px-3 py-2 border border-border/20">
      <span className="text-xs font-mono text-muted">{label}</span>
      <span className={`text-xs font-mono font-bold ${color}`}>{weight}</span>
    </div>
  );
}