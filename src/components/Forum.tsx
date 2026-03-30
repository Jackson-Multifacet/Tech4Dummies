import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import Markdown from 'react-markdown';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  authorId: string;
  authorName: string;
  repliesCount: number;
}

interface ForumReply {
  id: string;
  threadId: string;
  content: string;
  createdAt: number;
  authorId: string;
  authorName: string;
}

export default function Forum() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');

  useEffect(() => {
    const q = query(collection(db, 'forumThreads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setThreads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumThread)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'forumThreads'));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    const q = query(collection(db, `forumThreads/${activeThread.id}/replies`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumReply)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `forumThreads/${activeThread.id}/replies`));
    return unsubscribe;
  }, [activeThread]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'forumThreads'), {
        ...newThread,
        createdAt: Date.now(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Student',
        repliesCount: 0
      });
      setNewThread({ title: '', content: '' });
      setView('list');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'forumThreads');
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !activeThread) return;
    try {
      await addDoc(collection(db, `forumThreads/${activeThread.id}/replies`), {
        threadId: activeThread.id,
        content: newReply,
        createdAt: Date.now(),
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Student'
      });
      setNewReply('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `forumThreads/${activeThread.id}/replies`);
    }
  };

  if (view === 'create') return (
    <form onSubmit={handleCreateThread} className="p-8 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white">New Discussion</h2>
      <input type="text" value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} placeholder="Thread Title" className="w-full p-3 rounded-xl bg-zinc-800 text-white" required />
      <textarea value={newThread.content} onChange={e => setNewThread({...newThread, content: e.target.value})} placeholder="Content (Markdown supported)" className="w-full p-3 rounded-xl bg-zinc-800 text-white" rows={6} required />
      <div className="flex gap-4">
        <button type="button" onClick={() => setView('list')} className="text-zinc-400">Cancel</button>
        <button type="submit" className="bg-emerald-500 text-black font-bold py-2 px-6 rounded-xl">Post Thread</button>
      </div>
    </form>
  );

  if (view === 'detail' && activeThread) return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <button onClick={() => setView('list')} className="text-emerald-400">&larr; Back to Forum</button>
      <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
        <h1 className="text-3xl font-bold text-white">{activeThread.title}</h1>
        <div className="text-zinc-400 mt-4 markdown-body"><Markdown>{activeThread.content}</Markdown></div>
        <div className="text-xs text-zinc-600 mt-4">Posted by {activeThread.authorName} on {new Date(activeThread.createdAt).toLocaleDateString()}</div>
      </div>
      <div className="space-y-4">
        {replies.map(reply => (
          <div key={reply.id} className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 ml-8">
            <div className="text-zinc-400 markdown-body"><Markdown>{reply.content}</Markdown></div>
            <div className="text-xs text-zinc-600 mt-2">{reply.authorName} - {new Date(reply.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddReply} className="mt-6">
        <textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Write a reply..." className="w-full p-3 rounded-xl bg-zinc-800 text-white" rows={3} required />
        <button type="submit" className="mt-2 bg-emerald-500 text-black font-bold py-2 px-6 rounded-xl">Reply</button>
      </form>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Community Forum</h1>
        <button onClick={() => setView('create')} className="bg-emerald-500 text-black font-bold py-2 px-6 rounded-xl">New Thread</button>
      </div>
      <div className="space-y-4">
        {threads.map(thread => (
          <button key={thread.id} onClick={() => { setActiveThread(thread); setView('detail'); }} className="w-full text-left bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/50 transition-all">
            <h3 className="text-xl font-bold text-white">{thread.title}</h3>
            <div className="text-xs text-zinc-600 mt-2">Posted by {thread.authorName} • {new Date(thread.createdAt).toLocaleDateString()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
