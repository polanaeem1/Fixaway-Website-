'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { chatApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/components/ui/ToastProvider';

export default function ChatPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params;
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await chatApi.getMessages(accessToken, orderId);
        setMessages(res.data || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load chat history', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Socket Setup
    const socket = getSocket(accessToken);
    socket.emit('join_order_room', orderId);

    const handleReceiveMessage = (newMessage: any) => {
      if (newMessage.orderId === orderId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.find((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.emit('leave_order_room', orderId);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [accessToken, orderId, router, showToast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !accessToken) return;

    const content = inputText.trim();
    setInputText('');

    try {
      const res = await chatApi.sendMessage(accessToken, orderId, content);
      const newMsg = res.data;
      
      // Optimitically add it to UI if socket is slow
      setMessages((prev) => {
        if (prev.find((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-surface">
      {/* Header */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-lg">
            #
          </div>
          <div>
            <h1 className="font-bold text-primary">Order Chat</h1>
            <p className="text-xs text-on-surface-variant">Order #{orderId.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-70">
            <span className="material-symbols-outlined text-5xl mb-2">forum</span>
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMe 
                      ? 'bg-primary text-on-primary rounded-tr-sm' 
                      : 'bg-surface-container text-on-surface rounded-tl-sm'
                  } shadow-sm`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-container/70' : 'text-on-surface-variant/70'} text-right`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-surface border-t border-outline-variant/30 p-4 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
