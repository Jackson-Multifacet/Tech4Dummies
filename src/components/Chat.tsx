import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, MessageSquare, X, Minus, Maximize2, Github, Linkedin, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Message, PublicProfile } from '../types';

interface ChatProps {
  recipient: PublicProfile;
  onClose: () => void;
}

export default function Chat({ recipient, onClose }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'auth', userId: user?.uid }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setMessages(data.messages);
      } else if (data.type === 'chat') {
        setMessages(prev => [...prev, data.message]);
      }
    };

    return () => {
      socket.close();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      type: 'chat',
      receiverId: recipient.uid,
      content: input.trim()
    }));
    setInput('');
  };

  if (isMinimized) {
    return (
      <motion.div 
        layoutId="chat-window"
        className="fixed bottom-4 right-4 w-64 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="p-3 bg-emerald-500 text-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} />
            <span className="text-xs font-bold truncate">{recipient.displayName}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-black/10 p-1 rounded">
            <X size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layoutId="chat-window"
      className="fixed bottom-4 right-4 w-80 h-96 bg-zinc-950/40 backdrop-blur-sm border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
    >
      <div className="p-4 bg-zinc-900/40 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={recipient.photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-900 rounded-full"></div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">{recipient.displayName}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{recipient.role}</p>
              {(recipient.githubUrl || recipient.linkedinUrl || recipient.websiteUrl) && (
                <div className="flex items-center gap-1.5 border-l border-zinc-700 pl-2">
                  {recipient.githubUrl && (
                    <a href={recipient.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                      <Github size={10} />
                    </a>
                  )}
                  {recipient.linkedinUrl && (
                    <a href={recipient.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[#0A66C2] transition-colors">
                      <Linkedin size={10} />
                    </a>
                  )}
                  {recipient.websiteUrl && (
                    <a href={recipient.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                      <Globe size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <Minus size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.filter(m => (m.senderId === user?.uid && m.receiverId === recipient.uid) || (m.senderId === recipient.uid && m.receiverId === user?.uid)).map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.senderId === user?.uid 
                ? 'bg-emerald-500 text-black rounded-tr-none' 
                : 'bg-zinc-900/40 backdrop-blur-sm text-white rounded-tl-none border border-zinc-800'
            }`}>
              {msg.content}
              <p className={`text-[9px] mt-1 opacity-50 ${msg.senderId === user?.uid ? 'text-black' : 'text-zinc-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-zinc-900/40 backdrop-blur-sm border-t border-zinc-800 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-950/40 backdrop-blur-sm border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
        <button type="submit" className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-colors">
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}
