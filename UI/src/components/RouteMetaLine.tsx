import type { MessageRouteMeta } from '../types/chat';

function formatModelName(model: string): string {
  return model.replace(/^accounts\/fireworks\/models\//, '');
}

export default function RouteMetaLine({ route }: { route: MessageRouteMeta }) {
  const isLocal = route.provider === 'ollama';

  return (
    <div className="mt-2 pt-2 border-t border-border/30 text-[11px] leading-relaxed text-muted">
      <span className={isLocal ? 'text-local font-medium' : 'text-remote font-medium'}>
        {isLocal ? 'Local' : 'Hosted'}
      </span>
      <span className="mx-1.5 text-muted/40">·</span>
      <span className="font-mono text-foreground/80">{formatModelName(route.model)}</span>
      <span className="mx-1.5 text-muted/40">·</span>
      <span>{route.runtime_ms.toLocaleString()} ms</span>
      <span className="mx-1.5 text-muted/40">·</span>
      <span>{route.remote_tokens_used.toLocaleString()} remote tok</span>
      {route.estimated_tokens_saved > 0 && (
        <>
          <span className="mx-1.5 text-muted/40">·</span>
          <span className="text-local">{route.estimated_tokens_saved.toLocaleString()} saved</span>
        </>
      )}
    </div>
  );
}
