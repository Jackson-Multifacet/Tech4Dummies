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
  limit,
  Timestamp
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { Calendar, Clock, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface MentorshipSession {
  id: string;
  mentorId: string;
  studentId: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  topic: string;
  mentorName?: string;
  studentName?: string;
}

interface MentorProfile {
  uid: string;
  displayName: string;
  email: string;
  expertise?: string[];
}

export default function MentorshipBooking() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [topic, setTopic] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    // Fetch mentors
    const fetchMentors = async () => {
      try {
        const q = query(collection(db, 'users_public'), where('role', '==', 'mentor'), limit(10));
        const snapshot = await getDocs(q);
        setMentors(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as MentorProfile)));
      } catch (err) {
        console.error('Error fetching mentors:', err);
      }
    };
    fetchMentors();

    // Fetch user's sessions
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'mentorshipSessions'),
      where('studentId', '==', auth.currentUser.uid),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MentorshipSession)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'mentorshipSessions'));

    return unsubscribe;
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedMentor || !selectedDate || !selectedTime || !topic) return;

    setIsBooking(true);
    try {
      const start = new Date(`${selectedDate}T${selectedTime}`).getTime();
      const end = start + 3600000; // 1 hour duration

      await addDoc(collection(db, 'mentorshipSessions'), {
        mentorId: selectedMentor.uid,
        studentId: auth.currentUser.uid,
        mentorName: selectedMentor.displayName,
        studentName: auth.currentUser.displayName || 'Student',
        startTime: start,
        endTime: end,
        status: 'pending',
        topic: topic,
        createdAt: Date.now()
      });

      setSelectedMentor(null);
      setTopic('');
      setSelectedDate('');
      setSelectedTime('');
      alert('Session booked successfully! Waiting for mentor confirmation.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'mentorshipSessions');
    } finally {
      setIsBooking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-500 bg-emerald-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      case 'completed': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-zinc-500 bg-zinc-500/10';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Mentorship & Office Hours</h1>
        <p className="text-zinc-500 mt-1">Book 1-on-1 sessions with our expert mentors.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Mentor Selection & Booking */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Available Mentors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mentors.map(mentor => (
                <button 
                  key={mentor.uid}
                  onClick={() => setSelectedMentor(mentor)}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all",
                    selectedMentor?.uid === mentor.uid 
                      ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                      : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{mentor.displayName}</h3>
                      <p className="text-xs text-zinc-500">{mentor.expertise?.join(', ') || 'General Tech'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selectedMentor && (
            <section className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-white mb-4">Book Session with {selectedMentor.displayName}</h2>
              <form onSubmit={handleBook} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Time</label>
                    <input 
                      type="time" 
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Topic / Questions</label>
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What would you like to discuss?"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    rows={3}
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isBooking}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {isBooking ? 'Booking...' : 'Confirm Booking'}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Right: Upcoming Sessions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Your Sessions</h2>
          <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map(session => (
                <div key={session.id} className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Calendar size={16} className="text-emerald-500" />
                      <span>{new Date(session.startTime).toLocaleDateString()}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full", getStatusColor(session.status))}>
                      {session.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Clock size={16} />
                    <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 1 Hour</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <UserIcon size={16} />
                    <span>Mentor: {session.mentorName}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 italic">"{session.topic}"</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
                <Calendar size={32} className="mx-auto text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-600">No sessions scheduled yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
