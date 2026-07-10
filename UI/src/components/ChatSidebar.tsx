import { useState, useMemo } from 'react';
import { PenLine, Search, Trash2, MessageSquare, X, Check, PanelLeft, PanelRight } from 'lucide-react';
import type { ChatSession } from '../types/chat';

interface ChatSidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onDeleteSelected: (ids: string[]) => void;
  onClearAll: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function ChatSidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onDeleteSelected,
  onClearAll,
  collapsed = false,
  onToggle,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const lower = search.toLowerCase();
    return chats.filter((chat) => chat.title.toLowerCase().includes(lower));
  }, [chats, search]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onDeleteSelected(Array.from(selectedIds));
    exitSelectionMode();
  };

  const handleSelectChat = (id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
      return;
    }
    onSelectChat(id);
  };

  return (
    <aside className="w-full h-full flex flex-col border-r border-border/30 bg-surface/40 overflow-y-auto chat-list-scrollbar">
      {/* Top actions */}
      <div className="p-3 border-b border-border/30">
        <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center gap-2'}`}>
          <button
            onClick={onNewChat}
            className={`
              flex items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-3 text-foreground text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.97]
              ${collapsed ? 'w-9 h-9' : 'flex-1 gap-2 px-3 py-2.5'}
            `}
            aria-label="New chat"
            title="New chat"
          >
            <PenLine className="w-4 h-4" />
            {!collapsed && 'New chat'}
          </button>
          {onToggle && (
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-2 hover:bg-surface-3 text-foreground transition-all duration-200 cursor-pointer active:scale-[0.97]"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-surface/50 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-local/40 focus:ring-1 focus:ring-local/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Selection controls */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">Chats</span>
        <div className="flex items-center gap-1">
          {isSelectionMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
                Delete ({selectedIds.size})
              </button>
              <button
                onClick={exitSelectionMode}
                className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
                aria-label="Cancel selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="px-2 py-1 rounded-md text-xs font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Chat list */}
      <div className="px-3 pb-3 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-5 h-5 text-muted/40 mx-auto mb-2" />
            <p className="text-xs text-muted/60">
              {search.trim() ? 'No chats match your search.' : 'No chats yet. Start a new chat.'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isSelected = selectedIds.has(chat.id);
            return (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 rounded-lg px-2.5 py-2.5 transition-all duration-200 cursor-pointer ${
                  isActive ? 'bg-surface-2 border border-border/40' : 'hover:bg-surface-2/50 border border-transparent'
                } ${isSelected ? 'ring-1 ring-local/40' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                {isSelectionMode ? (
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-local border-local text-black'
                        : 'border-muted/40 bg-surface/50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                ) : (
                  <MessageSquare className="w-3.5 h-3.5 text-muted shrink-0" />
                )}
                <span className={`text-sm truncate flex-1 ${isActive ? 'text-foreground' : 'text-muted'}`}>
                  {chat.title}
                </span>
                {!isSelectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-200 cursor-pointer"
                    aria-label={`Delete ${chat.title}`}
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Clear all */}
      <div className="p-3 border-t border-border/30">
        <button
          onClick={onClearAll}
          disabled={chats.length === 0}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear all chats
        </button>
      </div>
        </>
      )}
    </aside>
  );
}
