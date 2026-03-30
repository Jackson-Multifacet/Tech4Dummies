import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc,
  where
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { Job, CareerResource } from '../types';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter,
  Plus,
  DollarSign,
  BookOpen,
  Video,
  Wrench,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export default function JobBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resources, setResources] = useState<CareerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'jobs' | 'resources'>('jobs');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingResource, setIsAddingResource] = useState(false);
  
  const isStaff = user?.role === 'admin' || user?.role === 'mentor';
  
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    description: '',
    requirements: [],
    applyUrl: '',
    category: 'Engineering'
  });

  const [newResource, setNewResource] = useState<Partial<CareerResource>>({
    title: '',
    description: '',
    type: 'Article',
    url: '',
    category: 'Career Advice'
  });

  useEffect(() => {
    const jobsQuery = query(collection(db, 'jobs'), orderBy('postedAt', 'desc'));
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'jobs'));

    const resourcesQuery = query(collection(db, 'careerResources'), orderBy('postedAt', 'desc'));
    const unsubResources = onSnapshot(resourcesQuery, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareerResource)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'careerResources'));

    return () => {
      unsubJobs();
      unsubResources();
    };
  }, []);

  const categories = ['All', 'Engineering', 'Design', 'Product', 'Data', 'Other'];
  const resourceCategories = ['All', 'Career Advice', 'Interview Prep', 'Resume Building', 'Networking'];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         res.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'jobs'), {
        ...newJob,
        postedAt: Date.now(),
        requirements: typeof newJob.requirements === 'string' 
          ? (newJob.requirements as string).split('\n').filter(r => r.trim())
          : newJob.requirements
      });
      setIsAdding(false);
      setNewJob({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: [],
        applyUrl: '',
        category: 'Engineering'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'jobs');
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'careerResources'), {
        ...newResource,
        postedAt: Date.now()
      });
      setIsAddingResource(false);
      setNewResource({
        title: '',
        description: '',
        type: 'Article',
        url: '',
        category: 'Career Advice'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'careerResources');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'Article': return <FileText size={20} />;
      case 'Video': return <Video size={20} />;
      case 'Tool': return <Wrench size={20} />;
      case 'Template': return <BookOpen size={20} />;
      default: return <FileText size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Career & Growth</h1>
          <p className="text-zinc-500 max-w-2xl">
            Explore job opportunities and career-coaching resources curated for your professional success.
          </p>
        </div>
        <div className="flex gap-4">
          {isStaff && (
            <button 
              onClick={() => activeTab === 'jobs' ? setIsAdding(true) : setIsAddingResource(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={20} />
              <span>{activeTab === 'jobs' ? 'Post a Job' : 'Add Resource'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-2 bg-zinc-900/40 backdrop-blur-sm p-1.5 rounded-2xl border border-zinc-800 w-fit">
        <button
          onClick={() => { setActiveTab('jobs'); setSelectedCategory('All'); }}
          className={cn(
            "px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'jobs' ? "bg-zinc-800 text-emerald-400 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Job Board
        </button>
        <button
          onClick={() => { setActiveTab('resources'); setSelectedCategory('All'); }}
          className={cn(
            "px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
            activeTab === 'resources' ? "bg-zinc-800 text-emerald-400 shadow-lg" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Career Services
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/40 backdrop-blur-sm p-4 rounded-3xl border border-zinc-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'jobs' ? "Search jobs, companies, keywords..." : "Search resources, topics..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(activeTab === 'jobs' ? categories : resourceCategories).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                selectedCategory === category
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-zinc-800 space-y-6"
          >
            <h2 className="text-xl font-bold text-white">Post a New Opportunity</h2>
            <form onSubmit={handleAddJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Job Title</label>
                  <input 
                    type="text" 
                    value={newJob.title}
                    onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Company</label>
                  <input 
                    type="text" 
                    value={newJob.company}
                    onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Location</label>
                  <input 
                    type="text" 
                    value={newJob.location}
                    onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Job Type</label>
                  <select 
                    value={newJob.type}
                    onChange={(e) => setNewJob({...newJob, type: e.target.value as any})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Internship</option>
                    <option>Contract</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select 
                    value={newJob.category}
                    onChange={(e) => setNewJob({...newJob, category: e.target.value as any})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Product</option>
                    <option>Data</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apply URL</label>
                  <input 
                    type="url" 
                    value={newJob.applyUrl}
                    onChange={(e) => setNewJob({...newJob, applyUrl: e.target.value})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Requirements (one per line)</label>
                  <textarea 
                    value={newJob.requirements as any}
                    onChange={(e) => setNewJob({...newJob, requirements: e.target.value as any})}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    rows={4}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                <textarea 
                  value={newJob.description}
                  onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                  rows={4}
                  required
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-zinc-400 font-bold">Cancel</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-8 rounded-xl transition-all">Post Job</button>
              </div>
            </form>
          </motion.div>
        )}

        {isAddingResource && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-3xl border border-zinc-800 space-y-6"
          >
            <h2 className="text-xl font-bold text-white">Add Career Resource</h2>
            <form onSubmit={handleAddResource} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Resource Title</label>
                  <input 
                    type="text" 
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                  <select 
                    value={newResource.type}
                    onChange={(e) => setNewResource({...newResource, type: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option>Article</option>
                    <option>Video</option>
                    <option>Tool</option>
                    <option>Template</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">URL</label>
                  <input 
                    type="url" 
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select 
                    value={newResource.category}
                    onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option>Career Advice</option>
                    <option>Interview Prep</option>
                    <option>Resume Building</option>
                    <option>Networking</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500/50"
                    rows={4}
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button type="button" onClick={() => setIsAddingResource(false)} className="px-6 py-2 text-zinc-400 font-bold">Cancel</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-8 rounded-xl transition-all">Add Resource</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'jobs' ? (
          filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
            >
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 shrink-0 overflow-hidden">
                {job.logoUrl ? (
                  <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} className="text-zinc-700" />
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                    {job.type}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
                    {job.category}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={14} />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} />
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-800">
                <a 
                  href={job.applyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <span>Apply Now</span>
                  <ExternalLink size={18} />
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredResources.map((res, index) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 p-6 rounded-3xl hover:border-emerald-500/50 transition-all flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                    {getResourceIcon(res.type)}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800 px-2 py-1 rounded-md">
                    {res.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{res.title}</h3>
                <p className="text-sm text-zinc-500 mb-6 flex-1">{res.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{res.category}</span>
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 text-sm font-bold transition-colors"
                  >
                    <span>Access</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {((activeTab === 'jobs' && filteredJobs.length === 0) || (activeTab === 'resources' && filteredResources.length === 0)) && (
        <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
          <Briefcase size={48} className="mx-auto text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-400">No content found</h3>
          <p className="text-zinc-600">Check back later or try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}

