import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit,
  getDocs
} from 'firebase/firestore';
import { Trophy, Medal, Star, Zap, Target, Award, TrendingUp, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  rank?: number;
}

interface XPHistory {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

export default function Achievements() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [xpHistory, setXpHistory] = useState<XPHistory[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'badges'>('leaderboard');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch Leaderboard
    const qLeaderboard = query(
      collection(db, 'users_public'),
      orderBy('xp', 'desc'),
      limit(10)
    );

    const unsubscribeLeaderboard = onSnapshot(qLeaderboard, (snapshot) => {
      const entries = snapshot.docs.map((doc, index) => ({
        uid: doc.id,
        ...doc.data(),
        rank: index + 1
      } as LeaderboardEntry));
      setLeaderboard(entries);
    });

    // Fetch User Stats
    const unsubscribeUser = onSnapshot(collection(db, 'users_public'), (snapshot) => {
      const userDoc = snapshot.docs.find(doc => doc.id === auth.currentUser?.uid);
      if (userDoc) {
        setUserStats(userDoc.data());
      }
    });

    // Fetch XP History
    const qHistory = query(
      collection(db, 'xpHistory'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribeHistory = onSnapshot(qHistory, (snapshot) => {
      setXpHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as XPHistory)));
      setLoading(false);
    });

    return () => {
      unsubscribeLeaderboard();
      unsubscribeUser();
      unsubscribeHistory();
    };
  }, []);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case 2: return "text-zinc-300 bg-zinc-300/10 border-zinc-300/20";
      case 3: return "text-amber-600 bg-amber-600/10 border-amber-600/20";
      default: return "text-zinc-500 bg-zinc-800/50 border-zinc-700/50";
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Hall of Fame</h1>
          <p className="text-zinc-500 mt-2 font-medium">Your journey to mastery, visualized.</p>
        </div>
        
        {userStats && (
          <div className="flex items-center gap-6 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Level</p>
              <div className="flex items-center gap-2 justify-center">
                <Zap size={16} className="text-emerald-500" />
                <span className="text-2xl font-black text-white italic">{userStats.level || 1}</span>
              </div>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total XP</p>
              <div className="flex items-center gap-2 justify-center">
                <Star size={16} className="text-yellow-500" />
                <span className="text-2xl font-black text-white italic">{userStats.xp || 0}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-900/60 rounded-2xl border border-zinc-800/50 w-fit">
        {[
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'history', label: 'XP History', icon: TrendingUp },
          { id: 'badges', label: 'Milestones', icon: Target }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === tab.id 
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Top 3 Podium */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                <Medal className="text-emerald-500" />
                The Podium
              </h2>
              <div className="space-y-4">
                {leaderboard.slice(0, 3).map((entry) => (
                  <div 
                    key={entry.uid}
                    className={cn(
                      "relative overflow-hidden p-6 rounded-3xl border transition-all duration-500 group hover:scale-[1.02]",
                      getRankColor(entry.rank!)
                    )}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Trophy size={80} />
                    </div>
                    <div className="relative flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.uid}`}
                          alt={entry.displayName}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-current"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-zinc-900 border-2 border-current flex items-center justify-center font-black italic text-xs">
                          #{entry.rank}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight">{entry.displayName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold uppercase tracking-widest opacity-70">Level {entry.level}</span>
                          <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                          <span className="text-xs font-bold uppercase tracking-widest">{entry.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Full Leaderboard List */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                <Users className="text-emerald-500" />
                Rising Stars
              </h2>
              <div className="bg-zinc-900/40 rounded-3xl border border-zinc-800/50 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-7">Student</div>
                  <div className="col-span-2 text-center">Level</div>
                  <div className="col-span-2 text-right">XP</div>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.uid}
                      className={cn(
                        "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-zinc-800/30",
                        entry.uid === auth.currentUser?.uid ? "bg-emerald-500/5" : ""
                      )}
                    >
                      <div className="col-span-1 font-black italic text-zinc-500">#{entry.rank}</div>
                      <div className="col-span-7 flex items-center gap-3">
                        <img 
                          src={entry.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.uid}`}
                          alt={entry.displayName}
                          className="w-8 h-8 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className={cn(
                          "font-bold text-sm",
                          entry.uid === auth.currentUser?.uid ? "text-emerald-400" : "text-zinc-300"
                        )}>
                          {entry.displayName}
                          {entry.uid === auth.currentUser?.uid && " (You)"}
                        </span>
                      </div>
                      <div className="col-span-2 text-center font-black italic text-zinc-400">Lvl {entry.level}</div>
                      <div className="col-span-2 text-right font-black text-white">{entry.xp.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
              <TrendingUp className="text-emerald-500" />
              XP Log
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {xpHistory.map((log) => (
                <div key={log.id} className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{log.reason}</h3>
                      <p className="text-xs text-zinc-500">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-500 italic">+{log.amount}</span>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">XP Gained</p>
                  </div>
                </div>
              ))}
              {xpHistory.length === 0 && (
                <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                  <Zap size={40} className="mx-auto text-zinc-800 mb-4" />
                  <p className="text-zinc-500 font-medium">No XP history found. Start learning to earn XP!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <section className="space-y-6">
              <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-3">
                <Award className="text-emerald-500" />
                Milestones & Badges
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { 
                    title: 'The Architect', 
                    goal: 'Complete 10 Lessons', 
                    progress: userStats?.completedCount || 0, 
                    total: 10, 
                    icon: BookOpen 
                  },
                  { 
                    title: 'Feedback Seeker', 
                    goal: 'Use AI Feedback 5 times', 
                    progress: xpHistory.filter(l => l.reason.includes('AI Feedback')).length, 
                    total: 5, 
                    icon: Zap 
                  },
                  { 
                    title: 'Perfect Score', 
                    goal: 'Get 3 Perfect Quizzes', 
                    progress: xpHistory.filter(l => l.reason.includes('Perfect Quiz')).length, 
                    total: 3, 
                    icon: Star 
                  },
                ].map((milestone, i) => (
                  <div key={i} className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800/50 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <milestone.icon size={100} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <milestone.icon size={24} />
                      </div>
                      <span className="text-xs font-black text-emerald-500 italic">
                        {Math.min(100, Math.round((milestone.progress / milestone.total) * 100))}%
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{milestone.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{milestone.goal}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000"
                          style={{ width: `${Math.min(100, (milestone.progress / milestone.total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {milestone.progress} / {milestone.total} completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const BookOpen = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
