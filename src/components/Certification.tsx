import React from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, Download, ExternalLink, Shield, Star, Trophy } from 'lucide-react';

interface Badge {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  earnedAt?: number;
}

interface Certificate {
  id: string;
  courseName: string;
  issuedAt: number;
  certificateUrl: string;
}

interface CertificationProps {
  badges: Badge[];
  certificates: Certificate[];
}

export const Certification: React.FC<CertificationProps> = ({ badges, certificates }) => {
  return (
    <div className="space-y-12" id="certification-section">
      {/* Badges Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Digital Badges</h2>
            <p className="text-gray-400">Milestones and achievements you've unlocked.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F27D26]/10 rounded-full border border-[#F27D26]/20">
            <Trophy className="w-4 h-4 text-[#F27D26]" />
            <span className="text-sm font-medium text-[#F27D26]">
              {badges.filter(b => b.earnedAt).length} / {badges.length} Earned
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, idx) => {
            const isEarned = !!badge.earnedAt;
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative group p-6 rounded-2xl border transition-all duration-300 ${
                  isEarned 
                    ? 'bg-[#151619] border-[#F27D26]/30 hover:border-[#F27D26]/50' 
                    : 'bg-[#0A0A0A] border-[#2A2B2F] opacity-60 grayscale'
                }`}
                id={`badge-${badge.id}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    isEarned ? 'bg-[#F27D26]/20' : 'bg-gray-800'
                  }`}>
                    <Award className={`w-8 h-8 ${isEarned ? 'text-[#F27D26]' : 'text-gray-600'}`} />
                  </div>
                  {isEarned && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-md border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Earned</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#F27D26] transition-colors">
                  {badge.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {badge.description}
                </p>

                {isEarned && (
                  <div className="text-[11px] text-gray-500 font-mono uppercase tracking-widest">
                    Earned: {new Date(badge.earnedAt!).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Certificates Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Course Certificates</h2>
            <p className="text-gray-400">Official recognition of your course completions.</p>
          </div>
          <Shield className="w-8 h-8 text-gray-700" />
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert, idx) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#151619] border border-[#2A2B2F] p-8 rounded-2xl flex items-center gap-8 group hover:border-[#F27D26]/30 transition-all"
                id={`cert-${cert.id}`}
              >
                <div className="w-24 h-24 bg-[#0A0A0A] border border-[#2A2B2F] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Star className="w-10 h-10 text-[#F27D26]" />
                </div>
                
                <div className="flex-grow">
                  <div className="text-[10px] font-bold text-[#F27D26] uppercase tracking-widest mb-2">Verified Certificate</div>
                  <h3 className="text-xl font-bold text-white mb-2">{cert.courseName}</h3>
                  <p className="text-sm text-gray-500 mb-4">Issued on {new Date(cert.issuedAt).toLocaleDateString()}</p>
                  
                  <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-xs font-semibold text-white hover:text-[#F27D26] transition-colors">
                      <Download className="w-4 h-4" />
                      Download PDF
                    </button>
                    <button className="flex items-center gap-2 text-xs font-semibold text-white hover:text-[#F27D26] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      Verify Link
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0A0A0A] border border-dashed border-[#2A2B2F] rounded-2xl p-12 text-center">
            <Shield className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">No certificates earned yet</h3>
            <p className="text-sm text-gray-600 mt-2">Complete a course to receive your official certificate.</p>
          </div>
        )}
      </section>
    </div>
  );
};
