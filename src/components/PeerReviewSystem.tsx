import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  getDocs,
  limit
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { Star, MessageSquare, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface RubricItem {
  id: string;
  label: string;
  maxScore: number;
  score: number;
}

interface PeerReview {
  id: string;
  assignmentId: string;
  reviewerId: string;
  revieweeId: string;
  content: string;
  rating: number;
  rubric?: RubricItem[];
  createdAt: number;
  reviewerName?: string;
  revieweeName?: string;
  assignmentTitle?: string;
}

interface Assignment {
  id: string;
  title?: string;
  studentId: string;
  studentName?: string;
}

export default function PeerReviewSystem() {
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [rubric, setRubric] = useState<RubricItem[]>([
    { id: '1', label: 'Code Quality', maxScore: 5, score: 0 },
    { id: '2', label: 'Functionality', maxScore: 5, score: 0 },
    { id: '3', label: 'Documentation', maxScore: 5, score: 0 },
    { id: '4', label: 'Innovation', maxScore: 5, score: 0 },
  ]);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRubricScore = (id: string, score: number) => {
    setRubric(prev => prev.map(item => item.id === id ? { ...item, score } : item));
  };

  const totalScore = rubric.reduce((acc, curr) => acc + curr.score, 0);
  const maxTotalScore = rubric.reduce((acc, curr) => acc + curr.maxScore, 0);
  const calculatedRating = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 5) : 0;

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch reviews received by the user
    const q = query(
      collection(db, 'peerReviews'),
      where('revieweeId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerReview)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'peerReviews'));

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Fetch some assignments from other students that need review
    const fetchPending = async () => {
      try {
        const q = query(collection(db, 'assignments'), limit(5));
        const snapshot = await getDocs(q);
        setPendingAssignments(snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Assignment))
          .filter(a => a.studentId !== auth.currentUser?.uid)
        );
      } catch (err) {
        console.error('Error fetching pending assignments:', err);
      }
    };
    fetchPending();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedAssignment || calculatedRating === 0 || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'peerReviews'), {
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title || 'Untitled Assignment',
        reviewerId: auth.currentUser.uid,
        reviewerName: auth.currentUser.displayName || 'Peer Reviewer',
        revieweeId: selectedAssignment.studentId,
        revieweeName: selectedAssignment.studentName || 'Student',
        content,
        rating: calculatedRating,
        rubric,
        createdAt: Date.now()
      });

      setSelectedAssignment(null);
      setRubric(prev => prev.map(item => ({ ...item, score: 0 })));
      setContent('');
      alert('Review submitted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'peerReviews');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Peer Review System</h1>
        <p className="text-zinc-500 mt-1">Give and receive feedback from your peers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Give Feedback */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Assignments to Review</h2>
            <div className="space-y-4">
              {pendingAssignments.map(assignment => (
                <button 
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment)}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left transition-all",
                    selectedAssignment?.id === assignment.id 
                      ? "bg-emerald-500/10 border-emerald-500" 
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <h3 className="font-bold text-white">{assignment.title || 'Untitled Assignment'}</h3>
                  <p className="text-xs text-zinc-500 mt-1">By {assignment.studentName || 'Student'}</p>
                </button>
              ))}
            </div>
          </section>

          {selectedAssignment && (
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-white mb-4">Review for {selectedAssignment.studentName}</h2>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Rubric</h3>
                  {rubric.map(item => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-300">{item.label}</span>
                        <span className="text-xs font-mono text-emerald-500">{item.score}/{item.maxScore}</span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleRubricScore(item.id, s)}
                            className={cn(
                              "flex-1 h-2 rounded-full transition-all",
                              s <= item.score ? "bg-emerald-500" : "bg-zinc-800 hover:bg-zinc-700"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-white">Overall Rating</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= calculatedRating ? "text-yellow-500" : "text-zinc-800"} 
                          fill={star <= calculatedRating ? "currentColor" : "none"} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did they do well? What could be improved?"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                  rows={4}
                  required
                />
                <div className="flex gap-4">
                  <button type="button" onClick={() => setSelectedAssignment(null)} className="text-zinc-400">Cancel</button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Right: Received Feedback */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Your Feedback</h2>
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">{review.reviewerName}</span>
                        <p className="text-[10px] text-zinc-600">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={12} 
                          className={star <= review.rating ? "text-yellow-500" : "text-zinc-800"} 
                          fill={star <= review.rating ? "currentColor" : "none"} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 italic">"{review.content}"</p>
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-[10px] text-zinc-500">On assignment: {review.assignmentTitle}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                <MessageSquare size={32} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-600">No reviews received yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
