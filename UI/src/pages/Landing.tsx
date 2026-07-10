import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Layers,
  Route,
  TrendingDown,
  FileJson,
  Brain,
  Cpu,
  Zap,
  Gauge,
  Eye,
  Shield,
  BarChart3,
} from 'lucide-react';
import HeroVisual from '../components/HeroVisual';

const benefitPoints = [
  {
    icon: TrendingDown,
    title: 'Lower cost',
    description: 'Small tasks avoid expensive large-model calls.',
    color: 'text-local',
    bg: 'bg-local/10',
  },
  {
    icon: Zap,
    title: 'Lower latency',
    description: 'Simple requests use faster model paths.',
    color: 'text-remote',
    bg: 'bg-remote/10',
  },
  {
    icon: Shield,
    title: 'Higher confidence',
    description: 'Complex tasks escalate to stronger models when quality matters.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

const solutionSteps = [
  {
    icon: FileJson,
    title: 'Request',
    description: 'An app sends a prompt, task, or API request.',
  },
  {
    icon: Gauge,
    title: 'Analyze Workload',
    description: 'HybridRoute checks task type, length, complexity, and quality needs.',
  },
  {
    icon: Route,
    title: 'Choose Route',
    description: 'The router selects the best model path based on cost, latency, and capability.',
  },
  {
    icon: Cpu,
    title: 'Run Best Model',
    description: 'The request is sent to a local, open-source, code, reasoning, or hosted model.',
  },
  {
    icon: BarChart3,
    title: 'Response + Metrics',
    description: 'HybridRoute returns the answer with routing reason, latency, and cost signals.',
  },
];

const productCapabilities = [
  {
    icon: Brain,
    title: 'Task Understanding',
    description: 'Detects task type, complexity, intent, and quality needs before inference.',
    color: 'text-local',
    bg: 'bg-local/10',
  },
  {
    icon: Route,
    title: 'Model Routing',
    description: 'Selects the best model path using real-time scoring and routing rules.',
    color: 'text-remote',
    bg: 'bg-remote/10',
  },
  {
    icon: TrendingDown,
    title: 'Cost Control',
    description: 'Keeps simple tasks away from expensive models when smaller ones are enough.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Zap,
    title: 'Latency Optimization',
    description: 'Routes lightweight requests to faster model paths for lower response time.',
    color: 'text-local',
    bg: 'bg-local/10',
  },
  {
    icon: Shield,
    title: 'Quality Guardrails',
    description: 'Escalates complex or high-risk tasks to stronger models when quality matters.',
    color: 'text-remote',
    bg: 'bg-remote/10',
  },
  {
    icon: Eye,
    title: 'Observability',
    description: 'Logs route choice, reason, cost, latency, tokens, and confidence.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[oklch(0.02_0.005_260)]" />
        <div className="absolute inset-0 bg-hero-grid pointer-events-none" />
        <div className="absolute inset-0 bg-hero-radial pointer-events-none" />

        <div className="absolute top-1/4 left-[10%] w-[420px] h-[420px] rounded-full bg-local/3 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-[12%] w-[380px] h-[380px] rounded-full bg-remote/3 blur-[130px] pointer-events-none" />

        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Centered heading & description */}
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[56px] xl:text-[64px] font-heading font-bold text-foreground leading-[1.05] mb-5 animate-fade-in-up">
              Route Every Request to the{' '}
              <span className="bg-gradient-to-r from-local to-remote bg-clip-text text-transparent">
                Right Model
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              HybridRoute routes every AI request to the right model, balancing cost, latency, and answer quality automatically.
            </p>
          </div>

          {/* Hero Visual below */}
          <div className="relative h-[320px] sm:h-[400px] md:h-[480px] lg:h-[540px] max-w-4xl mx-auto flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-local/3 via-transparent to-remote/3 rounded-3xl pointer-events-none" />
            <div className="w-full h-full">
              <HeroVisual />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[oklch(0.02_0.005_260)] to-transparent pointer-events-none" />
      </section>

      {/* ─── PROBLEM SECTION ─── */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
              Most AI Apps Waste Compute
            </h2>
            <p className="text-muted text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mb-8">
              HybridRoute routes each request before inference, choosing the most efficient model that can answer well.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {benefitPoints.map((point, _i) => {
                const Icon = point.icon;
                return (
                  <div
                    key={point.title}
                    className="bg-surface/50 rounded-xl p-5 border border-border/30 text-left stagger-children"
                  >
                    <div className={`w-9 h-9 rounded-lg ${point.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-4.5 h-4.5 ${point.color}`} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{point.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{point.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOLUTION SECTION ─── */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-local/10 border border-local/20 mb-4">
              <Route className="w-3.5 h-3.5 text-local" />
              <span className="text-xs font-medium text-local">Solution</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
              Routing Before Inference
            </h2>
            <p className="text-muted text-base max-w-2xl mx-auto">
              HybridRoute scores each request by complexity, intent, token length, reasoning depth, and
              quality requirements. Then it selects the most efficient model capable of handling the task.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {solutionSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="glass-card rounded-xl p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-local/10 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-local" />
                    </div>
                    <div className="text-xl font-heading font-bold text-local/30">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT CAPABILITIES ─── */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-remote/10 border border-remote/20 mb-4">
              <Layers className="w-3.5 h-3.5 text-remote" />
              <span className="text-xs font-medium text-remote">Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
              One Routing Layer for Every AI App
            </h2>
            <p className="text-muted text-base">
              Connect any AI app to smarter model selection, cost control, and quality-aware routing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {productCapabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="glass-card rounded-xl p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${cap.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${cap.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{cap.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{cap.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── LIVE DEMO TEASER ─── */}
      <section className="relative px-4 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
                  See Routing in Action
                </h2>
                <p className="text-muted text-sm sm:text-base leading-relaxed mb-6">
                  Enter any prompt and watch HybridRoute decide which model path should handle it.
                  Every result shows the routing decision, complexity analysis, and estimated cost
                  vs. latency tradeoff.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/demo"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-local text-black font-semibold text-sm hover:bg-local/90 transition-all duration-200 cursor-pointer active:scale-[0.97]"
                  >
                    Routing Console
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                  <Link
                    to="/architecture"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/60 text-foreground font-medium text-sm transition-all duration-200 cursor-pointer active:scale-[0.97]"
                  >
                    View Architecture
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 border border-border/40 bg-surface/30">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-surface/50 rounded-lg p-3 border border-border/20">
                    <div className="text-muted">Selected Model Path</div>
                    <div className="text-local font-mono font-semibold mt-0.5">Local Inference</div>
                  </div>
                  <div className="bg-surface/50 rounded-lg p-3 border border-border/20">
                    <div className="text-muted">Why it was chosen</div>
                    <div className="text-foreground font-mono font-semibold mt-0.5 text-[10px]">Complexity: Low</div>
                  </div>
                  <div className="bg-surface/50 rounded-lg p-3 border border-border/20">
                    <div className="text-muted">Estimated Latency</div>
                    <div className="text-accent font-mono font-semibold mt-0.5">0.4s</div>
                  </div>
                  <div className="bg-surface/50 rounded-lg p-3 border border-border/20">
                    <div className="text-muted">Estimated Cost</div>
                    <div className="text-local font-mono font-semibold mt-0.5">$0.00002</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/30 px-4 py-8">
        <div className="max-w-6xl mx-auto" />
      </footer>
    </div>
  );
}