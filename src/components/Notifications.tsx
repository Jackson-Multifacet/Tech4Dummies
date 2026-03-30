import React, { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface Announcement {
  id: string;
  title: string;
  message: string;
  readBy: string[];
}

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Notifications({ isOpen, onClose }: NotificationsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = collection(db, 'announcements');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(data);
    }, (err) => {
      console.error("Error fetching announcements:", err);
    });
    return unsubscribe;
  }, [auth.currentUser?.uid]);

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    const docRef = doc(db, 'announcements', id);
    await updateDoc(docRef, { readBy: arrayUnion(auth.currentUser.uid) });
  };

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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell size={20} /> Notifications
              </h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {announcements.length === 0 && (
                <p className="text-center text-zinc-500">No new notifications.</p>
              )}
              {announcements.map(n => {
                const isRead = n.readBy?.includes(auth.currentUser?.uid || '');
                return (
                  <div key={n.id} className={`p-4 rounded-xl border ${isRead ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-800/50 border-zinc-700'}`}>
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold ${isRead ? 'text-zinc-500' : 'text-white'}`}>{n.title}</h3>
                      {!isRead && (
                        <button onClick={() => markAsRead(n.id)} className="text-emerald-500 hover:text-emerald-400">
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                    <p className={`text-sm ${isRead ? 'text-zinc-600' : 'text-zinc-400'}`}>{n.message}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
