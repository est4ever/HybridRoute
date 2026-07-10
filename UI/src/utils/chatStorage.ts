import type { ChatSession, ChatMessage } from '../types/chat';

const STORAGE_KEY = 'hybridroute_chats';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isStorageAvailable(): boolean {
  try {
    const key = '__storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function loadChats(): ChatSession[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
  } catch {
    return [];
  }
}

export function saveChats(chats: ChatSession[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Fail silently if storage is full or unavailable
  }
}

export function createChat(): ChatSession {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addMessageToChat(
  chats: ChatSession[],
  chatId: string,
  message: Omit<ChatMessage, 'id' | 'createdAt'>
): ChatSession[] {
  const now = Date.now();
  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    createdAt: now,
  };

  return chats.map((chat) => {
    if (chat.id !== chatId) return chat;
    return {
      ...chat,
      messages: [...chat.messages, newMessage],
      updatedAt: now,
    };
  });
}

export function updateChatTitle(chats: ChatSession[], chatId: string, title: string): ChatSession[] {
  const now = Date.now();
  return chats.map((chat) =>
    chat.id === chatId ? { ...chat, title: title.trim() || chat.title, updatedAt: now } : chat
  );
}

export function deleteChatFromList(chats: ChatSession[], chatId: string): ChatSession[] {
  return chats.filter((c) => c.id !== chatId);
}

export function deleteChatsFromList(chats: ChatSession[], chatIds: string[]): ChatSession[] {
  const ids = new Set(chatIds);
  return chats.filter((c) => !ids.has(c.id));
}

export function deleteChat(chatId: string): void {
  const chats = loadChats().filter((c) => c.id !== chatId);
  saveChats(chats);
}

export function deleteChats(chatIds: string[]): void {
  const ids = new Set(chatIds);
  const chats = loadChats().filter((c) => !ids.has(c.id));
  saveChats(chats);
}

export function clearAllChats(): void {
  saveChats([]);
}
