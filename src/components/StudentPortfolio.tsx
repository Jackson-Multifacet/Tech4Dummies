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
  updateDoc,
  doc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { ExternalLink, Github, Plus, Image as ImageIcon, Award, Star, MessageSquare, BookOpen, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Submission, UserBadge, Badge, AppUser, PublicProfile } from '../types';
import { ChevronLeft } from 'lucide-react';

interface PortfolioProject {
  id: string;
  studentId: string;
  title: string;
  description: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  createdAt: number;
}

interface StudentPortfolioProps {
  userId?: string;
  onBack?: () => void;
}

export default function StudentPortfolio({ userId, onBack }: StudentPortfolioProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userBadges, setUserBadges] = useState<(UserBadge & { badge?: Badge })[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [profileUser, setProfileUser] = useState<PublicProfile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', imageUrl: '', projectUrl: '', githubUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'projects' | 'submissions' | 'achievements' | 'reviews'>('all');

  const targetUserId = userId || auth.currentUser?.uid;
  const isPublicView = !!userId && userId !== auth.currentUser?.uid;

  useEffect(() => {
    if (!targetUserId) return;

    // Fetch user profile info from public collection
    const fetchProfile = async () => {
      const userSnap = await getDocs(query(collection(db, 'users_public'), where('uid', '==', targetUserId)));
      if (!userSnap.empty) {
        setProfileUser(userSnap.docs[0].data() as PublicProfile);
      }
    };
    fetchProfile();

    // Fetch manual projects
    const projectsQuery = query(
      collection(db, 'portfolioProjects'),
      where('studentId', '==', targetUserId),
      orderBy('createdAt', 'desc')
    );

    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioProject)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'portfolioProjects'));

    // Fetch top submissions (graded and high score)
    const submissionsQuery = query(
      collection(db, 'submissions'),
      where('studentId', '==', targetUserId),
      where('status', '==', 'reviewed'),
      orderBy('grade', 'desc'),
      limit(5)
    );

    const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
      // If public view, only show featured ones
      if (isPublicView) {
        data = data.filter(s => s.isFeatured);
      }
      setSubmissions(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'submissions'));

    // Fetch badges
    const userBadgesQuery = query(
      collection(db, 'userBadges'),
      where('userId', '==', targetUserId)
    );

    const unsubUserBadges = onSnapshot(userBadgesQuery, async (snapshot) => {
      const userBadgesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserBadge));
      
      // Fetch badge details for each user badge
      const badgesWithDetails = await Promise.all(userBadgesData.map(async (ub) => {
        const badgeSnap = await getDocs(query(collection(db, 'badges'), where('id', '==', ub.badgeId)));
        const badgeData = badgeSnap.docs[0]?.data() as Badge;
        return { ...ub, badge: badgeData };
      }));

      setUserBadges(badgesWithDetails);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'userBadges'));

    // Fetch peer reviews
    const reviewsQuery = query(
      collection(db, 'peerReviews'),
      where('revieweeId', '==', targetUserId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'peerReviews'));

    return () => {
      unsubProjects();
      unsubSubmissions();
      unsubUserBadges();
      unsubReviews();
    };
  }, [targetUserId, isPublicView]);

  const toggleFeatureSubmission = async (submissionId: string, currentStatus: boolean) => {
    if (isPublicView) return;
    try {
      await updateDoc(doc(db, 'submissions', submissionId), {
        isFeatured: !currentStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'submissions');
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newProject.title || !newProject.description) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'portfolioProjects'), {
        ...newProject,
        studentId: auth.currentUser.uid,
        createdAt: Date.now()
      });

      setNewProject({ title: '', description: '', imageUrl: '', projectUrl: '', githubUrl: '' });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'portfolioProjects');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sharePortfolio = () => {
    const url = `${window.location.origin}/portfolio/${targetUserId}`;
    navigator.clipboard.writeText(url);
    alert('Portfolio link copied to clipboard!');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {isPublicView ? `${profileUser?.displayName || 'Student'}'s Portfolio` : 'Professional Portfolio'}
            </h1>
          </div>
          <p className="text-zinc-500 max-w-2xl">
            {isPublicView 
              ? `A curated showcase of ${profileUser?.displayName || 'this student'}'s technical journey, projects, and academic achievements.`
              : 'A curated showcase of your technical journey, projects, and academic achievements.'}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={sharePortfolio}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all border border-zinc-700"
          >
            <Share2 size={18} />
            <span>{isPublicView ? 'Copy Profile Link' : 'Share Profile'}</span>
          </button>
          {!isPublicView && (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={20} />
              <span>Add Project</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-zinc-900/40 backdrop-blur-sm p-1.5 rounded-2xl border border-zinc-800 w-fit">
        {(['all', 'projects', 'submissions', 'achievements', 'reviews'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              activeView === view 
                ? "bg-zinc-800 text-emerald-400 shadow-lg" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {view}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-12"
        >
          {/* Projects Section */}
          {(activeView === 'all' || activeView === 'projects') && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Github size={24} className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-white">Technical Projects</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map(project => (
                  <div key={project.id} className="group bg-zinc-900/40 rounded-3xl border border-zinc-800 overflow-hidden hover:border-emerald-500/50 transition-all flex flex-col">
                    <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <ImageIcon size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        {project.projectUrl && (
                          <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                            <ExternalLink size={20} />
                          </a>
                        )}
                        {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                            <Github size={20} />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                      <p className="text-sm text-zinc-500 line-clamp-3 mb-4 flex-1">{project.description}</p>
                      <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                        <span>Project</span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && activeView === 'projects' && (
                  <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No projects added yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Top Submissions Section */}
          {(activeView === 'all' || activeView === 'submissions') && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Star size={24} className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-white">Academic Highlights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submissions.map(submission => (
                  <div key={submission.id} className="bg-zinc-900/40 rounded-3xl border border-zinc-800 p-6 hover:border-emerald-500/50 transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-white">Assignment Submission</h3>
                        <p className="text-sm text-zinc-500">Grade: <span className="text-emerald-500 font-bold">{submission.grade}%</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isPublicView && (
                          <button 
                            onClick={() => toggleFeatureSubmission(submission.id, !!submission.isFeatured)}
                            className={cn(
                              "p-2 rounded-xl transition-all border",
                              submission.isFeatured 
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"
                            )}
                            title={submission.isFeatured ? "Featured in Portfolio" : "Feature in Portfolio"}
                          >
                            {submission.isFeatured ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                          </button>
                        )}
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                          <BookOpen size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                      <p className="text-sm text-zinc-400 line-clamp-3 italic">"{submission.feedback}"</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                        <MessageSquare size={12} />
                        <span>Mentor Feedback</span>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                        Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <button className="text-emerald-500 text-xs font-bold hover:underline">View Full Work</button>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && activeView === 'submissions' && (
                  <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No graded submissions found.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Achievements Section */}
          {(activeView === 'all' || activeView === 'achievements') && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Award size={24} className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-white">Certifications & Badges</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {userBadges.map(ub => (
                  <div key={ub.id} className="group flex flex-col items-center text-center space-y-3">
                    <div className="w-24 h-24 bg-zinc-900/60 rounded-full border border-zinc-800 p-4 flex items-center justify-center group-hover:border-emerald-500/50 transition-all relative">
                      {ub.badge?.imageUrl ? (
                        <img src={ub.badge.imageUrl} alt={ub.badge.title} className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
                      ) : (
                        <Award size={40} className="text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                      )}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-black rounded-full flex items-center justify-center border-4 border-black">
                        <Star size={14} fill="currentColor" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{ub.badge?.title || 'Badge'}</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Earned {new Date(ub.earnedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {userBadges.length === 0 && activeView === 'achievements' && (
                  <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No badges earned yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Peer Reviews Section */}
          {(activeView === 'all' || activeView === 'reviews') && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <MessageSquare size={24} className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-white">Peer Endorsements</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-zinc-900/40 rounded-3xl border border-zinc-800 p-6 hover:border-emerald-500/50 transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                          <Star size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{review.reviewerName}</h4>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Peer Reviewer</p>
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
                    <div className="pt-2 border-t border-zinc-800/50">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                        On assignment: {review.assignmentTitle}
                      </p>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && activeView === 'reviews' && (
                  <div className="col-span-full py-20 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                    <p className="text-zinc-500">No peer reviews received yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.section 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-8"
            >
              <h2 className="text-2xl font-bold text-white">Add New Portfolio Project</h2>
              <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Project Title</label>
                    <input 
                      type="text" 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      placeholder="e.g., Personal Dashboard"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                    <textarea 
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="What did you build? What technologies did you use?"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Image URL (Optional)</label>
                    <input 
                      type="url" 
                      value={newProject.imageUrl}
                      onChange={(e) => setNewProject({...newProject, imageUrl: e.target.value})}
                      placeholder="https://picsum.photos/seed/project/800/600"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live URL (Optional)</label>
                    <input 
                      type="url" 
                      value={newProject.projectUrl}
                      onChange={(e) => setNewProject({...newProject, projectUrl: e.target.value})}
                      placeholder="https://your-project.com"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">GitHub URL (Optional)</label>
                    <input 
                      type="url" 
                      value={newProject.githubUrl}
                      onChange={(e) => setNewProject({...newProject, githubUrl: e.target.value})}
                      placeholder="https://github.com/your-username/project"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-zinc-400 font-bold">Cancel</button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-10 rounded-xl transition-all"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Project'}
                  </button>
                </div>
              </form>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
