import React from 'react';
import { Article } from '../types';
import { ChevronLeft, Calendar, User, Clock, Tag, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

export default function ArticleDetail({ article, onBack }: ArticleDetailProps) {
  const { user, toggleBookmark } = useAuth();
  const isBookmarked = user?.bookmarkedLessonIds?.includes(article.id);

  return (
    <div className="h-full overflow-y-auto bg-black relative">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors group mb-8"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-wider">Back to Knowledge Base</span>
        </button>

        <header className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase rounded-lg tracking-wider">
              {article.category}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-xs flex items-center gap-1.5">
              <Clock size={14} /> 8 min read
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500 text-xs flex items-center gap-1.5">
              <Calendar size={14} /> {new Date(article.publishedAt).toLocaleDateString()}
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-zinc-800/50">
            <div className="flex items-center gap-4">
              <img 
                src={article.authorPhoto} 
                alt={article.authorName} 
                className="w-12 h-12 rounded-2xl border border-zinc-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-white font-bold">{article.authorName}</p>
                <p className="text-xs text-zinc-500">Tech Mentor & Contributor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl border border-zinc-800 transition-all">
                <Share2 size={20} />
              </button>
              <button 
                onClick={() => toggleBookmark(article.id)}
                className="p-3 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 rounded-2xl border border-zinc-800 transition-all"
              >
                {isBookmarked ? <BookmarkCheck size={20} fill="currentColor" /> : <Bookmark size={20} />}
              </button>
            </div>
          </div>
        </header>

        {article.thumbnailUrl && (
          <div className="aspect-video w-full rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
            <img 
              src={article.thumbnailUrl} 
              alt={article.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <article className="prose prose-invert prose-emerald max-w-none">
          <div className="text-zinc-300 text-lg leading-relaxed space-y-6">
            <Markdown>{article.content}</Markdown>
          </div>
        </article>

        <footer className="pt-12 border-t border-zinc-800 mt-12 space-y-8">
          <div className="flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-zinc-900 text-zinc-500 text-xs font-medium rounded-xl border border-zinc-800 flex items-center gap-1.5">
                <Tag size={12} /> {tag}
              </span>
            ))}
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 flex items-center gap-6">
            <img 
              src={article.authorPhoto} 
              alt={article.authorName} 
              className="w-20 h-20 rounded-3xl border border-zinc-700"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">About {article.authorName}</h4>
              <p className="text-zinc-400 text-sm leading-relaxed">
                A dedicated mentor at Tech4Dummies, passionate about sharing knowledge and helping students bridge the gap between theory and practice in modern software development.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
