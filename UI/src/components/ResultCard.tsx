import { useState } from 'react';
import {
  Cpu,
  Cloud,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle,
  Gauge,
  TrendingDown,
  Sparkles,
  Brain,
} from 'lucide-react';
import type { RouteResponse } from '../types/api';

interface ResultCardProps {
  result: RouteResponse;
  index?: number;
}

// ─── Helpers ───

function routeProviderLabel(provider: string): { label: string; isLocal: boolean } {
  if (provider === 'ollama') return { label: 'Local Model', isLocal: true };
  return { label: 'Hosted Model', isLocal: false };
}

function routeBadgeLabel(route: string) {
  const map: Record<string, string> = {
    local_only: 'Local Only',
    local_hard_lock: 'Local Hard Lock',
    local_with_verifier_passed: 'Local (Verifier Passed)',
    remote_after_compression: 'Hosted (Compressed)',
  };
  return map[route] ?? route;
}

function complexityLabel(c: string) {
  const map: Record<string, string> = {
    local_only: 'Low — local only',
    local_with_verifier: 'Medium — verifier check',
    remote_after_compression: 'High — hosted route',
  };
  return map[c] ?? c;
}

function formatModelName(model: string): string {
  return model.replace(/^accounts\/fireworks\/models\//, '');
}

function modelPathLabel(provider: string): string {
  if (provider === 'ollama') return 'Local Inference';
  return 'Hosted Inference';
}

// ─── Card 1: Routing Decision ───
function RoutingDecisionCard({ result }: { result: RouteResponse }) {
  const { label: providerLabel, isLocal } = routeProviderLabel(result.provider);
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up border-l-4"
      style={{ borderColor: isLocal ? 'oklch(0.72 0.19 175)' : 'oklch(0.50 0.27 290)' }}
    >
      {/* Header */}
      <div className={`px-5 py-3.5 flex items-center justify-between ${isLocal ? 'bg-local/5' : 'bg-remote/5'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLocal ? 'bg-local/15' : 'bg-remote/15'}`}>
            {isLocal ? <Cpu className="w-4.5 h-4.5 text-local" /> : <Cloud className="w-4.5 h-4.5 text-remote" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${isLocal ? 'bg-local/15 text-local' : 'bg-remote/15 text-remote'}`}>
                {isLocal ? 'LOCAL' : 'HOSTED'}
              </span>
              <span className="text-xs text-muted font-medium">
                {routeBadgeLabel(result.selected_route)}
              </span>
            </div>
            <p className="text-xs text-muted/80 mt-0.5">{result.reason}</p>
          </div>
        </div>
        {/* Score ring */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <div className="text-[11px] text-muted">Workload Score</div>
            <div className="text-sm font-mono font-bold text-foreground">{result.preflight_score}/100</div>
          </div>
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="oklch(0.14 0.025 260)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none"
                stroke={isLocal ? 'oklch(0.72 0.19 175)' : 'oklch(0.50 0.27 290)'}
                strokeWidth="3" strokeDasharray={`${result.preflight_score * 0.97} 97`}
                strokeLinecap="round" className="transition-all duration-700 ease-out"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricItem icon={Shield} label="Route" value={routeBadgeLabel(result.selected_route)} color={isLocal ? 'text-local' : 'text-remote'} />
        <MetricItem icon={Brain} label="Model" value={formatModelName(result.model)} color="text-foreground" />
        <MetricItem icon={Gauge} label="Complexity" value={complexityLabel(result.complexity)} color="text-foreground" />
        <MetricItem icon={TrendingDown} label="Provider" value={providerLabel} color="text-foreground" />
      </div>
    </div>
  );
}

// ─── Card 2: Model Path Used ───
function ModelPathCard({ result }: { result: RouteResponse }) {
  const { isLocal } = routeProviderLabel(result.provider);
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up border-l-4 border-l-[oklch(0.72_0.19_175)]">
      <div className="px-5 py-3.5 bg-local/5">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-local" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Model Path Used</span>
        </div>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Model Used</div>
          <div className="flex items-center gap-1.5">
            {isLocal ? (
              <Cpu className="w-3.5 h-3.5 text-local shrink-0" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-remote shrink-0" />
            )}
            <span className="text-sm font-mono font-semibold text-foreground break-all">
              {formatModelName(result.model)}
            </span>
          </div>
          <div className="text-[10px] text-muted/60 mt-1">{modelPathLabel(result.provider)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Path Role</div>
          <span className={`inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${result.local_model_role === 'coding' ? 'bg-accent/15 text-accent' : 'bg-local/15 text-local'}`}>
            {result.local_model_role}
          </span>
        </div>
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Task Type</div>
          <span className="inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-2 border border-border/40 text-foreground">
            {result.task_type}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Card 3: Token Efficiency ───
function TokenEfficiencyCard({ result }: { result: RouteResponse }) {
  const remoteTokens = result.remote_tokens_used;
  const tokensSaved = result.estimated_tokens_saved;
  const originalTokens = result.estimated_original_prompt_tokens;
  const isLocal = remoteTokens === 0;

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up border-l-4 border-l-[oklch(0.72_0.18_75)]">
      <div className="px-5 py-3.5 bg-accent/5">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Token Efficiency</span>
        </div>
      </div>
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Remote Tokens</div>
          <div className={`text-sm font-mono font-bold ${isLocal ? 'text-local' : 'text-remote'}`}>
            {remoteTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted/50 mt-0.5">{isLocal ? 'No remote spend' : 'Hosted inference cost'}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Tokens Saved</div>
          <div className="text-sm font-mono font-bold text-local">{tokensSaved.toLocaleString()}</div>
          <div className="text-[10px] text-muted/50 mt-0.5">by routing locally</div>
        </div>
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Confidence</div>
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-mono font-bold text-foreground">
              {(result.confidence * 100).toFixed(0)}%
            </div>
            {result.confidence >= 0.7 && <CheckCircle className="w-3.5 h-3.5 text-local" />}
          </div>
          <div className="w-full h-1 rounded-full bg-surface-3 mt-1 overflow-hidden">
            <div className="h-full rounded-full bg-local transition-all duration-700 ease-out"
              style={{ width: `${result.confidence * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted font-medium uppercase tracking-wider mb-1">Orig. Prompt</div>
          <div className="text-sm font-mono font-bold text-foreground">
            {originalTokens.toLocaleString()} tok
          </div>
          <div className="text-[10px] text-muted/50 mt-0.5">estimated input</div>
        </div>
      </div>
    </div>
  );
}

// ─── Card 4: Model Response ───
function ModelResponseCard({ result }: { result: RouteResponse }) {
  const [expanded, setExpanded] = useState(false);
  const { isLocal } = routeProviderLabel(result.provider);

  const isLong = result.response.length > 300;

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up border-l-4"
      style={{ borderColor: isLocal ? 'oklch(0.72 0.19 175)' : 'oklch(0.50 0.27 290)' }}
    >
      <div className={`px-5 py-3.5 flex items-center justify-between ${isLocal ? 'bg-local/5' : 'bg-remote/5'}`}>
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-4 h-4 ${isLocal ? 'text-local' : 'text-remote'}`} />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Model Response</span>
          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full ${isLocal ? 'bg-local/10 text-local' : 'bg-remote/10 text-remote'}`}>
            {formatModelName(result.model)}
          </span>
          <Sparkles className={`w-3 h-3 ${isLocal ? 'text-local/40' : 'text-remote/40'}`} />
        </div>
      </div>

      <div className="px-5 py-4">
        <div className={`bg-surface/50 rounded-lg p-3.5 border ${isLocal ? 'border-local/10' : 'border-remote/10'}`}>
          <pre className="text-sm text-foreground/90 font-sans whitespace-pre-wrap leading-relaxed">
            {isLong && !expanded ? result.response.slice(0, 280) + '…' : result.response}
          </pre>
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {expanded ? (
              <><ChevronUp className="w-3 h-3" /> Show less</>
            ) : (
              <><ChevronDown className="w-3 h-3" /> Show full response</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shared metric item ───
function MetricItem({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] text-muted font-medium uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-mono font-semibold truncate ${color}`}>{value}</div>
      </div>
    </div>
  );
}

// ─── Main component ───
export default function ResultCard({ result, index: _index = 0 }: ResultCardProps) {
  return (
    <div className="space-y-3">
      <RoutingDecisionCard result={result} />
      <ModelPathCard result={result} />
      <TokenEfficiencyCard result={result} />
      <ModelResponseCard result={result} />
    </div>
  );
}