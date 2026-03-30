import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, XCircle, Trophy, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const CHALLENGES = [
  {
    id: 1,
    question: "What is the correct HTML element for the largest heading?",
    options: ["<heading>", "<h6>", "<h1>", "<head>"],
    correct: 2,
    explanation: "<h1> is the standard tag for the most important heading on a page."
  },
  {
    id: 2,
    question: "Which CSS property is used to change the text color of an element?",
    options: ["fgcolor", "color", "text-color", "font-color"],
    correct: 1,
    explanation: "The 'color' property defines the text color of an element."
  },
  {
    id: 3,
    question: "Inside which HTML element do we put the JavaScript?",
    options: ["<js>", "<scripting>", "<script>", "<javascript>"],
    correct: 2,
    explanation: "The <script> tag is used to embed or reference executable scripts."
  }
];

export default function DailyChallenge() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const challenge = CHALLENGES[currentIdx];

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const correct = idx === challenge.correct;
    setIsCorrect(correct);
    
    if (correct) {
      toast.success("Correct! +10 XP", {
        description: "You're on fire today!",
        icon: <Trophy className="text-amber-400" size={16} />
      });
    } else {
      toast.error("Not quite!", {
        description: "Check the explanation to learn why."
      });
    }
  };

  const nextChallenge = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setShowExplanation(false);
    setCurrentIdx((prev) => (prev + 1) % CHALLENGES.length);
  };

  return (
    <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={64} className="text-emerald-500" />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <Trophy size={18} className="text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Daily Knowledge Check</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Earn 10 XP</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-zinc-200 leading-relaxed">
          {challenge.question}
        </p>

        <div className="grid grid-cols-1 gap-2">
          {challenge.options.map((option, i) => (
            <button
              key={i}
              disabled={selectedOption !== null}
              onClick={() => handleOptionSelect(i)}
              className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-all border ${
                selectedOption === i
                  ? isCorrect
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-red-500/10 border-red-500 text-red-400'
                  : selectedOption !== null && i === challenge.correct
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                  : 'bg-zinc-950/40 backdrop-blur-sm border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {selectedOption === i && (
                  isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />
                )}
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedOption !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 space-y-4"
            >
              <div className="p-3 bg-zinc-950/40 backdrop-blur-sm border border-zinc-800 rounded-xl flex gap-3">
                <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                  {challenge.explanation}
                </p>
              </div>
              
              <button
                onClick={nextChallenge}
                className="w-full py-2 bg-emerald-500 text-black rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors"
              >
                Next Challenge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
