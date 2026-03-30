import React from 'react';
import { Users, Calendar, GraduationCap, Mail, Github, Linkedin, Globe } from 'lucide-react';
import { Cohort, PublicProfile } from '../types';

interface CohortViewProps {
  cohort: Cohort;
  mentors: PublicProfile[];
  students: PublicProfile[];
}

export default function CohortView({ cohort, mentors, students }: CohortViewProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{cohort.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-zinc-500 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <span>{new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <span>{cohort.studentCount} Students</span>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-2xl border border-emerald-500/20 font-bold text-sm">
          Active Cohort
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mentors Section */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap size={18} /> Mentors
          </h2>
          <div className="space-y-3">
            {mentors.map(mentor => (
              <div key={mentor.uid} className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <img src={mentor.photoURL} alt="" className="w-12 h-12 rounded-2xl" />
                  <div>
                    <h3 className="font-bold text-white">{mentor.displayName}</h3>
                    <p className="text-xs text-zinc-500">Cohort Mentor</p>
                  </div>
                </div>
                {(mentor.githubUrl || mentor.linkedinUrl || mentor.websiteUrl) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                    {mentor.githubUrl && (
                      <a href={mentor.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                        <Github size={16} />
                      </a>
                    )}
                    {mentor.linkedinUrl && (
                      <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[#0A66C2] transition-colors">
                        <Linkedin size={16} />
                      </a>
                    )}
                    {mentor.websiteUrl && (
                      <a href={mentor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                        <Globe size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Students Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Users size={18} /> Your Peers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {students.map(student => (
              <div key={student.uid} className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between group hover:border-zinc-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <img src={student.photoURL} alt="" className="w-10 h-10 rounded-xl" />
                    <div>
                      <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{student.displayName}</h3>
                      <p className="text-xs text-zinc-500">Student</p>
                    </div>
                  </div>
                  <button className="p-2 text-zinc-600 hover:text-emerald-400 transition-colors">
                    <Mail size={18} />
                  </button>
                </div>
                {(student.githubUrl || student.linkedinUrl || student.websiteUrl) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/50">
                    {student.githubUrl && (
                      <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                        <Github size={14} />
                      </a>
                    )}
                    {student.linkedinUrl && (
                      <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[#0A66C2] transition-colors">
                        <Linkedin size={14} />
                      </a>
                    )}
                    {student.websiteUrl && (
                      <a href={student.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-emerald-400 transition-colors">
                        <Globe size={14} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
