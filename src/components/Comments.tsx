import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Comment } from '../types';
import { Send } from 'lucide-react';

interface CommentsProps {
  targetId: string;
  targetType: 'progressUpdate' | 'submission' | 'quizAttempt';
}

export const Comments: React.FC<CommentsProps> = ({ targetId, targetType }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
  }, [targetId, targetType]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !auth.currentUser) return;
    await addDoc(collection(db, 'comments'), {
      targetId,
      targetType,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName || 'Student',
      authorPhoto: auth.currentUser.photoURL || '',
      content: newComment,
      createdAt: Date.now()
    });
    setNewComment('');
  };

  return (
    <div className="space-y-4 mt-4">
      <h4 className="text-sm font-bold text-zinc-400 uppercase">Comments</h4>
      <div className="space-y-2">
        {comments.map(comment => (
          <div key={comment.id} className="bg-zinc-800 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <img src={comment.authorPhoto} alt={comment.authorName} className="w-6 h-6 rounded-full" />
              <span className="text-xs font-bold text-white">{comment.authorName}</span>
            </div>
            <p className="text-sm text-zinc-300">{comment.content}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          placeholder="Add a comment..."
        />
        <button onClick={handleAddComment} className="bg-emerald-500 text-black p-2 rounded-xl hover:bg-emerald-400">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
