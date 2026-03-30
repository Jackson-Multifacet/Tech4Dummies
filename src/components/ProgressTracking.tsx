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
import { CheckCircle2, Clock, BookOpen, GraduationCap, Award, Shield, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { Certification } from './Certification';
import { Comments } from './Comments';

interface ProgressUpdate {
  id: string;
  studentId: string;
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  updatedAt: number;
  lessonTitle?: string;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  completedAt: number;
  quizTitle?: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'pending' | 'reviewed' | 'featured';
  submittedAt: number;
  assignmentTitle?: string;
  grade?: number;
}

export default function ProgressTracking() {
  const [progress, setProgress] = useState<ProgressUpdate[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch progress
    const q = query(
      collection(db, 'progressUpdates'),
      where('studentId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeProgress = onSnapshot(q, (snapshot) => {
      setProgress(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressUpdate)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'progressUpdates'));

    // Fetch Quiz Attempts
    const qQuizzes = query(
      collection(db, 'quizAttempts'),
      where('studentId', '==', auth.currentUser.uid),
      orderBy('completedAt', 'desc')
    );
    const unsubscribeQuizzes = onSnapshot(qQuizzes, (snapshot) => {
      setQuizAttempts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt)));
    });

    // Fetch Submissions
    const qSubmissions = query(
      collection(db, 'submissions'),
      where('studentId', '==', auth.currentUser.uid),
      orderBy('submittedAt', 'desc')
    );
    const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
      setLoading(false);
    });

    // Fetch all available badges and earned badges
    const unsubscribeBadges = onSnapshot(collection(db, 'badges'), (badgeSnap) => {
      const allBadgesList = badgeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const qUserBadges = query(
        collection(db, 'userBadges'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      onSnapshot(qUserBadges, (snapshot) => {
        const userBadgesMap = new Map(snapshot.docs.map(doc => [doc.data().badgeId, doc.data().earnedAt]));
        
        const mergedBadges = allBadgesList.map(badge => ({
          ...badge,
          earnedAt: userBadgesMap.get(badge.id) || null
        }));
        
        // If no badges in DB yet, use mocks for demo
        if (allBadgesList.length === 0) {
          const mockBadges = [
            { id: 'b1', title: 'First Steps', description: 'Complete your first lesson.', imageUrl: '', earnedAt: userBadgesMap.get('b1') },
            { id: 'b2', title: 'Code Warrior', description: 'Submit 5 assignments.', imageUrl: '', earnedAt: userBadgesMap.get('b2') },
            { id: 'b3', title: 'Peer Mentor', description: 'Provide 10 peer reviews.', imageUrl: '', earnedAt: userBadgesMap.get('b3') },
          ];
          setBadges(mockBadges);
        } else {
          setBadges(mergedBadges);
        }
      });
    });

    // Fetch certificates
    const qCerts = query(
      collection(db, 'certificates'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeCerts = onSnapshot(qCerts, (snapshot) => {
      setCertificates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), courseName: 'Web Development 101' })));
    });

    return () => {
      unsubscribeProgress();
      unsubscribeQuizzes();
      unsubscribeSubmissions();
      unsubscribeBadges();
      unsubscribeCerts();
    };
  }, []);

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const inProgressCount = progress.filter(p => p.status === 'in-progress').length;
  const totalLessons = 24; // Mock total lessons
  const progressPercentage = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Your Learning Progress</h1>
        <p className="text-zinc-500 mt-1">Track your journey through the course.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{completedCount}</span>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Lessons</p>
          </div>
        </div>
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{quizAttempts.length}</span>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Quizzes</p>
          </div>
        </div>
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <FileText size={24} />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{submissions.length}</span>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Assignments</p>
          </div>
        </div>
        <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <GraduationCap size={24} />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{progressPercentage}%</span>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Completion</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Overall Progress</h2>
          <span className="text-sm font-bold text-emerald-500">{progressPercentage}% Complete</span>
        </div>
        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500">You've completed {completedCount} out of {totalLessons} lessons. Keep it up!</p>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <div className="space-y-4">
              {progress.length > 0 ? (
                progress.slice(0, 5).map(update => (
                  <div key={update.id} className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          update.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {update.status === 'completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{update.lessonTitle || 'Untitled Lesson'}</h3>
                          <p className="text-xs text-zinc-500">Updated on {new Date(update.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                        update.status === 'completed' ? "text-emerald-500 bg-emerald-500/10" : "text-blue-500 bg-blue-500/10"
                      )}>
                        {update.status}
                      </span>
                    </div>
                    <Comments targetId={update.id} targetType="progressUpdate" />
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                  <BookOpen size={32} className="mx-auto text-zinc-700 mb-2" />
                  <p className="text-sm text-zinc-600">No activity recorded yet.</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white">Assessments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quizzes */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quiz Scores</h3>
                {quizAttempts.length > 0 ? (
                  quizAttempts.map(attempt => (
                    <div key={attempt.id} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{attempt.quizTitle || 'Quiz Attempt'}</p>
                          <p className="text-[10px] text-zinc-500">{new Date(attempt.completedAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-bold text-yellow-500">{attempt.score} pts</span>
                      </div>
                      <Comments targetId={attempt.id} targetType="quizAttempt" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 italic">No quizzes taken yet.</p>
                )}
              </div>

              {/* Assignments */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Assignments</h3>
                {submissions.length > 0 ? (
                  submissions.map(sub => (
                    <div key={sub.id} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{sub.assignmentTitle || 'Assignment'}</p>
                          <p className="text-[10px] text-zinc-500">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                            sub.status === 'reviewed' ? "text-emerald-500 bg-emerald-500/10" : "text-yellow-500 bg-yellow-500/10"
                          )}>
                            {sub.status}
                          </span>
                          {sub.grade && <p className="text-xs font-bold text-white mt-1">{sub.grade}%</p>}
                        </div>
                      </div>
                      <Comments targetId={sub.id} targetType="submission" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-600 italic">No assignments submitted yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Achievements</h2>
          <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Badges Earned</span>
              <span className="text-sm font-bold text-white">{badges.filter(b => b.earnedAt).length}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {badges.map(badge => (
                <div 
                  key={badge.id} 
                  title={badge.title}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                    badge.earnedAt ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-zinc-800 border-zinc-700 text-zinc-600 grayscale"
                  )}
                >
                  <Award size={20} />
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-400">Certificates</span>
                <span className="text-sm font-bold text-white">{certificates.length}</span>
              </div>
              {certificates.map(cert => (
                <div key={cert.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <Shield size={16} className="text-emerald-500" />
                  <span className="text-xs font-medium text-white truncate">{cert.courseName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Certification View */}
      <Certification badges={badges} certificates={certificates} />
    </div>
  );
}
