// ChatInterface.tsx
import React, { useState, useRef, useEffect } from "react";
import { useApp } from "./Chatbot";
import { Send, Bot, User, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  botId: string;
  companyName: string;
  userId?: string; // optional – if user is logged in
  onBack?: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.zooda.in";

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  botId,
  companyName,
  userId,
  onBack,
}) => {
  const { askBot } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate a session ID for anonymous users (stored in localStorage)
  const [sessionId] = useState(() => {
    if (userId) return null; // logged in users don't need sessionId
    let sid = localStorage.getItem(`chat_session_${botId}`);
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(`chat_session_${botId}`, sid);
    }
    return sid;
  });

  // Load previous messages from backend
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setInitialLoading(true);
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        else if (sessionId) params.append("sessionId", sessionId);
        const res = await axios.get(`${API_BASE_URL}/api/chat/history/${botId}?${params}`);
        if (res.data.success) {
          const history = res.data.messages.map((msg: any) => ({
            id: msg._id,
            role: msg.role,
            text: msg.message,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages(history);
        } else {
          // fallback to welcome message
          setMessages([{
            id: "welcome",
            role: "bot",
            text: `Hi! Ask anything about ${companyName}, products, or posts.`,
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
        setMessages([{
          id: "welcome",
          role: "bot",
          text: `Hi! Ask anything about ${companyName}, products, or posts.`,
          timestamp: new Date(),
        }]);
      } finally {
        setInitialLoading(false);
      }
    };
    loadHistory();
  }, [botId, userId, sessionId, companyName]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save a message to backend
  const saveMessage = async (role: "user" | "bot", message: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/chat/message`, {
        botId,
        userId: userId || null,
        sessionId: userId ? null : sessionId,
        role,
        message,
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessageText = input;
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      text: userMessageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Save user message to backend (don't wait)
    saveMessage("user", userMessageText);

    try {
      const { answer } = await askBot({ botId, question: userMessageText });
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      saveMessage("bot", answer);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "Sorry, something went wrong. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
          <Bot className="text-green-500" size={20} />
        </div>
        <div>
          <h2 className="font-semibold">{companyName} AI</h2>
          <p className="text-xs text-zinc-400">Online</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-green-600 text-white rounded-br-none"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-none px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 py-3 text-sm text-white outline-none focus:border-green-500 transition"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};