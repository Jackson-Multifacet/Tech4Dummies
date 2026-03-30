import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Resource } from '../types';
import { Search, Filter, ExternalLink, Tag, Book, FileText, Wrench, Bookmark, BookmarkCheck, LayoutGrid, List, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export default function ResourceLibrary() {
  const { user, toggleBookmark } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminOrMentor = user?.role === 'admin' || user?.role === 'mentor';

  useEffect(() => {
    const q = query(
      collection(db, 'resources'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      setResources(resourcesData);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'resources'));

    return unsubscribe;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const resourceData = {
        ...formData,
        addedBy: auth.currentUser.uid,
        addedAt: isEditing ? (formData as Resource).addedAt : Date.now(),
        tags: typeof formData.tags === 'string' ? (formData.tags as string).split(',').map(t => t.trim()) : formData.tags || []
      };

      if (isEditing && formData.id) {
        await updateDoc(doc(db, 'resources', formData.id), resourceData);
      } else {
        await addDoc(collection(db, 'resources'), resourceData);
      }

      setIsAdding(false);
      setIsEditing(false);
      setFormData({});
    } catch (err) {
      handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'resources');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'resources');
    }
  };

  const categories = ['All', ...Array.from(new Set(resources.map(r => r.category)))];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'documentation': return <Book size={20} />;
      case 'cheat sheet': return <FileText size={20} />;
      case 'tool': return <Wrench size={20} />;
      default: return <ExternalLink size={20} />;
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Resource Library</h1>
          <p className="text-zinc-400 max-w-2xl">
            A curated collection of external documentation, cheat sheets, and recommended tools to help you succeed.
          </p>
        </div>
        {isAdminOrMentor && (
          <button 
            onClick={() => {
              setFormData({});
              setIsAdding(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            <span>Add Resource</span>
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/40 backdrop-blur-sm p-4 rounded-3xl border border-zinc-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search resources, tools, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex gap-2">
            {categories.map(category => (
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
          <div className="flex gap-1 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-zinc-800 text-emerald-400" : "text-zinc-600 hover:text-zinc-400")}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-zinc-800 text-emerald-400" : "text-zinc-600 hover:text-zinc-400")}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => {
            const isBookmarked = user?.bookmarkedLessonIds?.includes(resource.id);
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 hover:border-emerald-500/50 transition-all flex flex-col relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                    {getIcon(resource.category)}
                  </div>
                  <div className="flex gap-1">
                    {isAdminOrMentor && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setFormData(resource);
                            setIsEditing(true);
                            setIsAdding(true);
                          }}
                          className="p-2 text-zinc-700 hover:text-emerald-400 transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-zinc-700 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => toggleBookmark(resource.id)}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        isBookmarked ? "text-emerald-500" : "text-zinc-700 hover:text-zinc-500"
                      )}
                    >
                      {isBookmarked ? <BookmarkCheck size={18} fill="currentColor" /> : <Bookmark size={18} />}
                    </button>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-700 hover:text-emerald-400 transition-all"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                  {resource.title}
                </h3>
                <p className="text-zinc-400 text-sm line-clamp-3 mb-4 flex-1">
                  {resource.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800/50">
                  {resource.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-zinc-600 bg-zinc-950/50 px-2 py-1 rounded-md flex items-center gap-1">
                      <Tag size={8} /> {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResources.map((resource, index) => {
            const isBookmarked = user?.bookmarkedLessonIds?.includes(resource.id);
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    {getIcon(resource.category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-1">{resource.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-1">
                    {resource.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[10px] text-zinc-600 bg-zinc-950/50 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {isAdminOrMentor && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setFormData(resource);
                            setIsEditing(true);
                            setIsAdding(true);
                          }}
                          className="p-2 text-zinc-700 hover:text-emerald-400 transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(resource.id)}
                          className="p-2 text-zinc-700 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => toggleBookmark(resource.id)}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        isBookmarked ? "text-emerald-500" : "text-zinc-700 hover:text-zinc-500"
                      )}
                    >
                      {isBookmarked ? <BookmarkCheck size={18} fill="currentColor" /> : <Bookmark size={18} />}
                    </button>
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-700 hover:text-emerald-400 transition-all"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filteredResources.length === 0 && (
        <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
          <Search size={48} className="mx-auto text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-400">No resources found</h3>
          <p className="text-zinc-600">Try adjusting your search or category filters.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? 'Edit Resource' : 'Add New Resource'}
                </h2>
                <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Title</label>
                      <input 
                        required
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="Resource title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Category</label>
                      <input 
                        required
                        type="text"
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="e.g. Documentation, Tool, Cheat Sheet"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Resource URL</label>
                    <input 
                      required
                      type="url"
                      value={formData.url || ''}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Description</label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                      placeholder="What is this resource about?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Tags (Comma separated)</label>
                    <input 
                      type="text"
                      value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags || ''}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="react, frontend, tutorial"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Resource'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
