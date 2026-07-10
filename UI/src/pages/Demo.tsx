import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2, Menu, Paperclip, Mic, MicOff } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar';
import RouteMetaLine from '../components/RouteMetaLine';
import { useChatSessions } from '../hooks/useChatSessions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useMetrics } from '../context/MetricsContext';
import { routePrompt } from '../utils/api';

const SUGGESTIONS = [
  'Summarize the benefits of vector databases',
  'Write a Python function to fetch data from an API',
  'Explain the difference between REST and GraphQL',
  'What is token-efficient routing?',
];

export default function Demo() {
  const {
    chats,
    activeChat,
    activeChatId,
    isHydrated,
    createNewChat,
    addMessage,
    selectChat,
    deleteChat,
    deleteSelected,
    clearAll,
  } = useChatSessions();
  const { addRoutingResult } = useMetrics();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useLocalStorage('hybridroute-sidebar-open', true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isLoading]);

  useEffect(() => {
    setError(null);
  }, [activeChatId]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleSend = async (text?: string) => {
    const content = text?.trim() || prompt.trim();
    if (!content || isLoading) return;

    setError(null);
    if (!text) setPrompt('');
    setIsLoading(true);
    const startedAt = performance.now();

    const chatId = await addMessage({ role: 'user', content });

    try {
      const result = await routePrompt(content);
      const runtimeMs = Math.round(performance.now() - startedAt);
      addRoutingResult(result);
      await addMessage(
        {
          role: 'assistant',
          content: result.response,
          route: {
            provider: result.provider,
            model: result.model,
            remote_tokens_used: result.remote_tokens_used,
            estimated_tokens_saved: result.estimated_tokens_saved,
            runtime_ms: runtimeMs,
            preflight_score: result.preflight_score,
          },
        },
        chatId,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to get a response. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setPrompt(text);
    inputRef.current?.focus();
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setPrompt((prev) => {
        const separator = prev.trim() ? '\n\n' : '';
        return `${prev}${separator}[Attached: ${file.name}]\n\n${text}`;
      });
      inputRef.current?.focus();
    } catch {
      setError('Could not read the attached file.');
    } finally {
      e.target.value = '';
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setError('Speech recognition failed. Please try again.');
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any)
        .map((result: any) => result[0].transcript)
        .join('');
      setPrompt(transcript);
      inputRef.current?.focus();
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading chats…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Background glow */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-20 left-1/4 w-96 h-96 rounded-full bg-local/3 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-20 right-1/4 w-80 h-80 rounded-full bg-remote/3 blur-[120px] pointer-events-none" />

      {/* Desktop sidebar */}
      <div
        className={`hidden sm:block h-[calc(100vh-4rem)] shrink-0 transition-all duration-200 overflow-hidden ${
          desktopSidebarOpen ? 'w-[260px]' : 'w-16'
        }`}
      >
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={createNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onDeleteSelected={deleteSelected}
          onClearAll={clearAll}
          collapsed={!desktopSidebarOpen}
          onToggle={() => setDesktopSidebarOpen((s) => !s)}
        />
      </div>

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-0 z-40 sm:hidden flex ${
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div
          className={`w-[260px] h-full transform transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ChatSidebar
            chats={chats}
            activeChatId={activeChatId}
            onNewChat={() => {
              setSidebarOpen(false);
              createNewChat();
            }}
            onSelectChat={(id) => {
              setSidebarOpen(false);
              selectChat(id);
            }}
            onDeleteChat={deleteChat}
            onDeleteSelected={deleteSelected}
            onClearAll={clearAll}
          />
        </div>
        <div
          className={`flex-1 bg-black/50 transition-opacity duration-200 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      </div>

      <main className="relative flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-surface/40 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-foreground hover:bg-surface-2 transition-colors duration-200 cursor-pointer"
            aria-label="Open chat menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-heading font-bold text-foreground">HybridRoute</span>
          <div className="w-5" />
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-border/30 flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-local" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                How can I help?
              </h2>
              <p className="text-sm text-muted max-w-md mb-8">
                Each message is analyzed and routed to the optimal model path — local for simple tasks, hosted for complex ones.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleSuggestionClick(text)}
                    className="text-left px-4 py-3 rounded-xl bg-surface/50 border border-border/30 text-sm text-foreground hover:bg-surface-2 hover:border-border/50 transition-all duration-200 cursor-pointer"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {activeChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === 'user' ? 'bg-local/15' : 'bg-remote/15'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-local" />
                    ) : (
                      <Bot className="w-4 h-4 text-remote" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-local text-black rounded-br-none'
                        : 'bg-surface-2 border border-border/40 text-foreground rounded-bl-none max-h-80 overflow-y-auto'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    {message.role === 'assistant' && message.route && (
                      <RouteMetaLine route={message.route} />
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-remote/15 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-remote" />
                  </div>
                  <div className="bg-surface-2 border border-border/40 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Routing your request…
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative border-t border-border/30 bg-surface/60 backdrop-blur-md p-4 sm:p-5">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-3 text-xs text-destructive flex items-center gap-1.5" role="alert">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 flex items-end gap-2 bg-surface/50 border border-border/50 rounded-xl px-2 py-2 focus-within:border-local/40 focus-within:ring-1 focus-within:ring-local/20 transition-all duration-200">
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a request…"
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-[200px] bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted/40 resize-none focus:outline-none"
                  disabled={isLoading || isListening}
                  aria-label="Enter your request"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Attach file"
                  />
                  <button
                    onClick={handleAttachClick}
                    disabled={isLoading}
                    className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`p-2 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isListening ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-muted hover:text-foreground hover:bg-surface-2'}`}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-local text-black hover:bg-local/90 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
                aria-label="Send request"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
