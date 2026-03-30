import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Users, Calendar, Edit2, Save, X, Github, Linkedin, Globe, Briefcase } from 'lucide-react';
import { AppUser, Cohort } from '../types';

interface ProfilePageProps {
  user: AppUser;
  cohort?: Cohort;
  onUpdateProfile: (updates: Partial<AppUser>) => void;
  onViewPortfolio: () => void;
}

export default function ProfilePage({ user, cohort, onUpdateProfile, onViewPortfolio }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [location, setLocation] = useState(user.location || '');
  const [visibility, setVisibility] = useState(user.visibility || 'public');

  const handleSave = () => {
    onUpdateProfile({ 
      bio, 
      githubUrl, 
      linkedinUrl, 
      websiteUrl, 
      skills: skills.split(',').map(s => s.trim()).filter(s => s !== ''),
      location,
      visibility
    });
    setIsEditing(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">User Profile</h1>
          <p className="text-zinc-500 mt-1">Manage your personal information and bio.</p>
        </div>
        {user.role === 'student' && (
          <button 
            onClick={onViewPortfolio}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Briefcase size={18} />
            <span>View Portfolio</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 text-center space-y-4">
            <div className="relative inline-block">
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                className="w-32 h-32 rounded-3xl mx-auto border-4 border-zinc-800 shadow-2xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black p-2 rounded-xl shadow-lg">
                <Shield size={16} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider mt-1">{user.role}</p>
            </div>

            {(user.githubUrl || user.linkedinUrl || user.websiteUrl) && (
              <div className="pt-4 border-t border-zinc-800 flex justify-center gap-4">
                {user.githubUrl && (
                  <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800/50 rounded-full text-zinc-400 hover:text-white hover:bg-emerald-500/20 transition-all" title="GitHub">
                    <Github size={20} />
                  </a>
                )}
                {user.linkedinUrl && (
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800/50 rounded-full text-zinc-400 hover:text-white hover:bg-emerald-500/20 transition-all" title="LinkedIn">
                    <Linkedin size={20} />
                  </a>
                )}
                {user.websiteUrl && (
                  <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-800/50 rounded-full text-zinc-400 hover:text-white hover:bg-emerald-500/20 transition-all" title="Website">
                    <Globe size={20} />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail size={18} className="text-zinc-500" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <User size={18} className="text-zinc-500" />
                <span className="text-sm">UID: {user.uid.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Cohort Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio Section */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                About Me
              </h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Edit2 size={14} /> EDIT BIO
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => { 
                      setBio(user.bio || ''); 
                      setGithubUrl(user.githubUrl || '');
                      setLinkedinUrl(user.linkedinUrl || '');
                      setWebsiteUrl(user.websiteUrl || '');
                      setIsEditing(false); 
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={14} /> CANCEL
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Save size={14} /> SAVE
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-zinc-950/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-4 text-zinc-300 focus:outline-none focus:border-emerald-500/50 min-h-[150px] transition-all"
                  placeholder="Tell us about yourself..."
                />
                
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Profile Details</h4>
                  
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Location (e.g., San Francisco, CA)"
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="Skills (comma separated, e.g., React, TypeScript, Firebase)"
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="cohort_only">Cohort Only</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Social Links</h4>
                  
                  <div className="flex items-center gap-3">
                    <Github size={18} className="text-zinc-500" />
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="flex-1 bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Linkedin size={18} className="text-zinc-500" />
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="flex-1 bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-zinc-500" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="flex-1 bg-zinc-950/40 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-zinc-400 leading-relaxed italic">
                  {user.bio || "No bio yet. Click edit to add one!"}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                  {user.location && (
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Location</h4>
                      <p className="text-sm text-zinc-300">{user.location}</p>
                    </div>
                  )}
                  {user.visibility && (
                    <div>
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Visibility</h4>
                      <p className="text-sm text-zinc-300 capitalize">{user.visibility.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
                
                {user.skills && user.skills.length > 0 && (
                  <div className="pt-4 border-t border-zinc-800">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cohort Info */}
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Academic Status
            </h3>
            {cohort ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Current Cohort</label>
                  <div className="flex items-center gap-3 text-white font-bold">
                    <Users size={18} className="text-emerald-500" />
                    {cohort.name}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Enrollment Date</label>
                  <div className="flex items-center gap-3 text-white font-bold">
                    <Calendar size={18} className="text-emerald-500" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-950/50 border border-zinc-800 border-dashed rounded-2xl text-center">
                <p className="text-zinc-500 text-sm">Not currently assigned to a cohort.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
