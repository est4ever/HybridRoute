import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatSession, ChatMessage } from '../types/chat';
import { generateChatTitle } from '../utils/chatTitle';
import {
  loadChats,
  saveChats,
  createChat,
  addMessageToChat,
  updateChatTitle,
  deleteChatFromList,
  deleteChatsFromList,
  clearAllChats,
} from '../utils/chatStorage';

export function useChatSessions() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Load chats from localStorage on mount
  useEffect(() => {
    const loaded = loadChats();
    setChats(loaded);
    if (loaded.length > 0) {
      setActiveChatId(loaded[0].id);
    }
    setIsHydrated(true);
  }, []);

  // Persist chats whenever they change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveChats(chats);
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const createNewChat = useCallback(() => {
    const newChat = createChat();
    activeChatIdRef.current = newChat.id;
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    return newChat.id;
  }, []);

  const ensureActiveChat = useCallback(() => {
    if (activeChatIdRef.current) return activeChatIdRef.current;
    return createNewChat();
  }, [createNewChat]);

  const addMessage = useCallback(
    async (
      message: Omit<ChatMessage, 'id' | 'createdAt'>,
      explicitChatId?: string,
    ) => {
      const chatId = explicitChatId ?? ensureActiveChat();
      const isFirstUserMessage =
        message.role === 'user'
        && !chats.find((c) => c.id === chatId)?.messages.some((m) => m.role === 'user');

      setChats((prev) => addMessageToChat(prev, chatId, message));

      if (isFirstUserMessage) {
        const title = await generateChatTitle(message.content);
        setChats((prev) => updateChatTitle(prev, chatId, title));
      }

      return chatId;
    },
    [chats, ensureActiveChat],
  );

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const next = deleteChatFromList(prev, id);
      if (activeChatId === id) {
        setActiveChatId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [activeChatId]);

  const deleteSelected = useCallback((ids: string[]) => {
    setChats((prev) => {
      const next = deleteChatsFromList(prev, ids);
      if (activeChatId && ids.includes(activeChatId)) {
        setActiveChatId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [activeChatId]);

  const clearAll = useCallback(() => {
    clearAllChats();
    setChats([]);
    setActiveChatId(null);
  }, []);

  return {
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
  };
}
