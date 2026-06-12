import { create } from 'zustand';
import { chatApi } from '../services/api';

const useChatStore = create((set, get) => ({
  sessionId: null,
  conversations: [],
  currentMessages: [],
  isLoading: false,
  isStreaming: false,
  sidebarOpen: true,

  initSession: async () => {
    try {
      const { data } = await chatApi.createSession();
      set({ sessionId: data.sessionId, currentMessages: [] });
      return data.sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  },

  loadConversations: async () => {
    try {
      const { data } = await chatApi.getConversations();
      set({ conversations: data });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  },

  loadConversation: async (sessionId) => {
    try {
      const { data } = await chatApi.getConversation(sessionId);
      set({ sessionId, currentMessages: data.messages || [] });
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  },

  sendMessage: async (text, inputType = 'text') => {
    const { sessionId } = get();
    if (!sessionId || !text.trim()) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date(), metadata: { inputType } };
    set((state) => ({
      currentMessages: [...state.currentMessages, userMessage],
      isStreaming: true,
    }));

    const assistantMessage = { role: 'assistant', content: '', timestamp: new Date(), streaming: true };
    set((state) => ({ currentMessages: [...state.currentMessages, assistantMessage] }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: text, sessionId, inputType }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.thinking) {
                // Tool call in progress — show activity label in the message
                set((state) => {
                  const msgs = [...state.currentMessages];
                  msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], thinkingActivity: data.thinking };
                  return { currentMessages: msgs };
                });
              }
              if (data.delta) {
                set((state) => {
                  const msgs = [...state.currentMessages];
                  msgs[msgs.length - 1] = {
                    ...msgs[msgs.length - 1],
                    content: msgs[msgs.length - 1].content + data.delta,
                    thinkingActivity: null, // clear spinner once text arrives
                  };
                  return { currentMessages: msgs };
                });
              }
              if (data.done) {
                set((state) => {
                  const msgs = [...state.currentMessages];
                  msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], streaming: false };
                  return { currentMessages: msgs, isStreaming: false };
                });
                get().loadConversations();
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      set((state) => {
        const msgs = [...state.currentMessages];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: 'Sorry, something went wrong. Please try again.', streaming: false };
        return { currentMessages: msgs, isStreaming: false };
      });
    }
  },

  deleteConversation: async (sessionId) => {
    try {
      await chatApi.deleteConversation(sessionId);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.sessionId !== sessionId),
      }));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  },

  newConversation: () => {
    get().initSession();
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

export default useChatStore;
