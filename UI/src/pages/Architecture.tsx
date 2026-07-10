import { Route, Database } from 'lucide-react';
import ArchitectureFlow from '../components/ArchitectureFlow';

const scoringDetails = [
  {
    name: 'Workload Analysis Score',
    weight: '0–100',
    description: 'Measures complexity, tokens, task type, and reasoning depth. Lower scores go to faster paths.',
    color: 'text-local',
    bg: 'bg-local/5',
    border: 'border-local/20',
  },
  {
    name: 'Routing Confidence',
    weight: '0.0–1.0',
    description: 'Verifier checks light-path outputs. Low confidence automatically escalates to a stronger model.',
    color: 'text-accent',
    bg: 'bg-accent/5',
    border: 'border-accent/20',
  },
  {
    name: 'Cost-Latency Tradeoff',
    weight: 'tokens & latency',
    description: 'Tracks hosted cost and latency. Shows tokens spent vs. tokens saved.',
    color: 'text-remote',
    bg: 'bg-remote/5',
    border: 'border-remote/20',
  },
];

const modelPaths = [
  {
    label: 'Local Inference Path',
    value: 'Fast, small models',
    detail: 'Sub-second · zero cost · simple tasks',
    color: 'text-local',
  },
  {
    label: 'Open-Source Hosted Path',
    value: 'Hosted open-weight models',
    detail: 'Low latency · low cost · general tasks',
    color: 'text-teal-400',
  },
  {
    label: 'Code-Specialist Path',
    value: 'Code models',
    detail: 'Debug, generate, review',
    color: 'text-local',
  },
  {
    label: 'Reasoning Path',
    value: 'Reasoning models',
    detail: 'Math, logic, multi-step',
    color: 'text-remote',
  },
  {
    label: 'High-Quality Hosted Path',
    value: 'High-quality hosted models',
    detail: 'Best quality · higher cost · complex tasks',
    color: 'text-remote',
  },
];

export default function Architecture() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      {/* Background */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-2">
            Model-Agnostic Routing Architecture
          </h1>
          <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
            A decision layer that scores every request and routes it to the best model path —
            without locking you into one provider.
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="mb-8 animate-fade-in-up">
          <ArchitectureFlow />
        </div>

        {/* Scoring Details */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <Route className="w-4.5 h-4.5 text-accent" />
            <h2 className="text-lg font-heading font-bold text-foreground">
              Routing Decision System
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
            {scoringDetails.map((detail) => (
              <div
                key={detail.name}
                className={`glass-card rounded-xl p-5 ${detail.bg} ${detail.border}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">{detail.name}</h3>
                  <span className={`text-xs font-mono font-bold ${detail.color}`}>
                    {detail.weight}
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{detail.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Model Paths */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-5">
            <Database className="w-4.5 h-4.5 text-local" />
            <h2 className="text-lg font-heading font-bold text-foreground">
              Available Model Paths
            </h2>
          </div>
          <div className="glass-card rounded-xl divide-y divide-border/30 overflow-hidden">
            {modelPaths.map((spec) => (
              <div
                key={spec.label}
                className="px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-muted font-medium">{spec.label}</div>
                  <div className={`text-sm font-semibold ${spec.color}`}>{spec.value}</div>
                </div>
                <div className="text-xs text-muted/60 text-right max-w-[220px]">
                  {spec.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}