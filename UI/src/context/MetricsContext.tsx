import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import type { RouteResponse } from '../types/api';

interface MetricsState {
  totalPrompts: number;
  ollamaCount: number;
  fireworksCount: number;
  totalRemoteTokensUsed: number;
  totalTokensSaved: number;
  remoteCallsAvoided: number;
}

interface MetricsContextValue {
  metrics: MetricsState;
  addRoutingResult: (result: RouteResponse) => void;
  ollamaPercent: number;
  fireworksPercent: number;
}

const initialState: MetricsState = {
  totalPrompts: 0,
  ollamaCount: 0,
  fireworksCount: 0,
  totalRemoteTokensUsed: 0,
  totalTokensSaved: 0,
  remoteCallsAvoided: 0,
};

const MetricsContext = createContext<MetricsContextValue | null>(null);

export function MetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<MetricsState>(initialState);

  const addRoutingResult = useCallback((result: RouteResponse) => {
    setMetrics((prev) => ({
      totalPrompts: prev.totalPrompts + 1,
      ollamaCount: prev.ollamaCount + (result.provider === 'ollama' ? 1 : 0),
      fireworksCount: prev.fireworksCount + (result.provider === 'fireworks' ? 1 : 0),
      totalRemoteTokensUsed: prev.totalRemoteTokensUsed + result.remote_tokens_used,
      totalTokensSaved: prev.totalTokensSaved + result.estimated_tokens_saved,
      // A "remote call avoided" = the prompt was routed locally when it could have been remote
      remoteCallsAvoided: prev.remoteCallsAvoided + (
        result.provider === 'ollama' && result.remote_tokens_used === 0 ? 1 : 0
      ),
    }));
  }, []);

  const ollamaPercent = metrics.totalPrompts > 0
    ? (metrics.ollamaCount / metrics.totalPrompts) * 100
    : 0;

  const fireworksPercent = metrics.totalPrompts > 0
    ? (metrics.fireworksCount / metrics.totalPrompts) * 100
    : 0;

  return (
    <MetricsContext.Provider
      value={{
        metrics,
        addRoutingResult,
        ollamaPercent,
        fireworksPercent,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextValue {
  const ctx = useContext(MetricsContext);
  if (!ctx) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return ctx;
}