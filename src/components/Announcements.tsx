import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { UserRole } from '../types';
import Markdown from 'react-markdown';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  authorId: string;
  authorName: string;
  readBy?: string[];
}

interface AnnouncementsProps {
  userRole: UserRole;
}

export default function Announcements({ userRole }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'announcements');
    });
    return unsubscribe;
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        createdAt: Date.now(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Admin',
        readBy: []
      });
      setTitle('');
      setContent('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        readBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'announcements/' + announcementId);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Announcements</h1>
        <p className="text-zinc-500 mt-1">Stay updated with the latest news.</p>
      </header>

      {userRole === 'admin' && (
        <form onSubmit={handleCreate} className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
          <h2 className="text-lg font-bold text-white">Create Announcement</h2>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-3 rounded-xl bg-zinc-800 text-white" required />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content (Markdown supported)" className="w-full p-3 rounded-xl bg-zinc-800 text-white" rows={4} required />
          <button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-6 rounded-xl transition-all">
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      )}

      <div className="space-y-6">
        {announcements.map(ann => {
          const isRead = auth.currentUser && ann.readBy?.includes(auth.currentUser.uid);
          return (
            <div 
              key={ann.id} 
              className={`bg-zinc-900/40 p-6 rounded-2xl border ${isRead ? 'border-zinc-800' : 'border-emerald-500/50'} transition-all`}
              onMouseEnter={() => !isRead && markAsRead(ann.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white">{ann.title}</h3>
                {!isRead && <span className="bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded-full">New</span>}
              </div>
              <div className="text-zinc-400 mt-2 markdown-body">
                <Markdown>{ann.content}</Markdown>
              </div>
              <div className="text-xs text-zinc-600 mt-4">
                Posted by {ann.authorName} on {new Date(ann.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
