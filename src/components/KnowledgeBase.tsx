import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import { collection, query, onSnapshot, orderBy, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Article } from '../types';
import { Search, Filter, Calendar, User, ChevronRight, BookOpen, Clock, Tag, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';

interface KnowledgeBaseProps {
  onSelectArticle: (article: Article) => void;
}

export default function KnowledgeBase({ onSelectArticle }: KnowledgeBaseProps) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminOrMentor = user?.role === 'admin' || user?.role === 'mentor';

  useEffect(() => {
    const q = query(
      collection(db, 'articles'),
      where('isPublished', '==', true),
      orderBy('publishedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const articlesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];
      setArticles(articlesData);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'articles'));

    return unsubscribe;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const articleData = {
        ...formData,
        authorId: auth.currentUser.uid,
        authorName: user?.displayName || 'Anonymous',
        authorPhoto: user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'A'}`,
        publishedAt: isEditing ? (formData as Article).publishedAt : Date.now(),
        isPublished: true,
        tags: typeof formData.tags === 'string' ? (formData.tags as string).split(',').map(t => t.trim()) : formData.tags || []
      };

      if (isEditing && formData.id) {
        await updateDoc(doc(db, 'articles', formData.id), articleData);
      } else {
        await addDoc(collection(db, 'articles'), articleData);
      }

      setIsAdding(false);
      setIsEditing(false);
      setFormData({});
    } catch (err) {
      handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, 'articles');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'articles');
    }
  };

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-4xl font-bold text-white tracking-tight">Knowledge Base</h1>
          <p className="text-zinc-400 max-w-2xl">
            Deep-dives into technologies, career advice, and how-to guides curated by our mentors and community.
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
            <span>Add Article</span>
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/40 backdrop-blur-sm p-4 rounded-3xl border border-zinc-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search articles, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectArticle(article)}
            className="group bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col"
          >
            {article.thumbnailUrl ? (
              <div className="aspect-video w-full overflow-hidden relative">
                <img 
                  src={article.thumbnailUrl} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {isAdminOrMentor && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setFormData(article);
                        setIsEditing(true);
                        setIsAdding(true);
                      }}
                      className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-emerald-500 hover:text-black transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(article.id)}
                      className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video w-full bg-emerald-500/5 flex items-center justify-center text-emerald-500/20 relative">
                <BookOpen size={64} />
                {isAdminOrMentor && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setFormData(article);
                        setIsEditing(true);
                        setIsAdding(true);
                      }}
                      className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-emerald-500 hover:text-black transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(article.id)}
                      className="p-2 bg-black/50 backdrop-blur-md rounded-lg text-white hover:bg-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded-md tracking-wider">
                  {article.category}
                </span>
                <span className="text-zinc-600 text-[10px]">•</span>
                <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                  <Clock size={10} /> 8 min read
                </span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
                {article.title}
              </h3>
              <p className="text-zinc-400 text-sm line-clamp-3 mb-4 flex-1">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <img 
                    src={article.authorPhoto} 
                    alt={article.authorName} 
                    className="w-6 h-6 rounded-full border border-zinc-700"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs text-zinc-500">{article.authorName}</span>
                </div>
                <div className="flex gap-1">
                  {article.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] text-zinc-600 flex items-center gap-0.5">
                      <Tag size={8} /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
          <Search size={48} className="mx-auto text-zinc-700 mb-4" />
          <h3 className="text-xl font-bold text-zinc-400">No articles found</h3>
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
                  {isEditing ? 'Edit Article' : 'Add New Article'}
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
                        placeholder="Article title..."
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
                        placeholder="e.g. Career, React, Tutorial"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Excerpt</label>
                    <textarea 
                      required
                      rows={2}
                      value={formData.excerpt || ''}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                      placeholder="Brief summary of the article..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Thumbnail URL</label>
                    <input 
                      type="url"
                      value={formData.thumbnailUrl || ''}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Content (Markdown Supported)</label>
                    <textarea 
                      required
                      rows={10}
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono text-sm"
                      placeholder="# Welcome to the guide..."
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
                    {isSubmitting ? 'Saving...' : 'Save Article'}
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
