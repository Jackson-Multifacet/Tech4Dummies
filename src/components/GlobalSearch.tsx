import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  onNavigate: (item: any) => void;
}

export default function GlobalSearch({ isOpen, onClose, data, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }
    const filtered = data.filter(item => 
      item.title?.toLowerCase().includes(query.toLowerCase()) || 
      item.content?.toLowerCase().includes(query.toLowerCase()) ||
      item.displayName?.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
  }, [query, data]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
              <Search className="text-zinc-500" size={20} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lessons, resources, forum..."
                className="flex-1 bg-transparent text-white focus:outline-none"
                autoFocus
              />
              <button onClick={onClose} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {results.length === 0 && query.trim() !== '' && (
                <p className="p-4 text-center text-zinc-500">No results found.</p>
              )}
              {results.map((item, index) => (
                <button 
                  key={index}
                  className="w-full text-left p-3 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  onClick={() => {
                    onNavigate(item);
                    onClose();
                  }}
                >
                  <div className="font-bold">{item.title || item.displayName}</div>
                  <div className="text-xs text-zinc-500">{item.type}</div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
