import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, HelpCircle, Trophy } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  quizId: string;
  title: string;
  questions: Question[];
  onComplete: (score: number) => void;
}

export const Quiz: React.FC<QuizProps> = ({ quizId, title, questions, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      const score = newAnswers.reduce((acc, curr, idx) => {
        return curr === questions[idx].correctAnswer ? acc + 1 : acc;
      }, 0);
      onComplete(score);
    }
  };

  const score = answers.reduce((acc, curr, idx) => {
    return curr === questions[idx].correctAnswer ? acc + 1 : acc;
  }, 0);

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-8 text-center max-w-md mx-auto"
        id="quiz-results"
      >
        <div className="w-20 h-20 bg-[#F27D26]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-[#F27D26]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Completed!</h2>
        <p className="text-gray-400 mb-6">You've finished the {title} quiz.</p>
        
        <div className="bg-[#0A0A0A] rounded-lg p-6 mb-8">
          <div className="text-4xl font-bold text-white mb-1">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <div className="text-sm text-gray-500 uppercase tracking-wider">Your Score</div>
          <div className="mt-4 text-gray-300">
            {score} out of {questions.length} correct
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-[#F27D26] text-white rounded-lg font-semibold hover:bg-[#D96A1F] transition-colors"
          id="quiz-done-btn"
        >
          Continue Learning
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" id={`quiz-${quizId}`}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
          <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-1">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 w-8 rounded-full ${
                idx < currentQuestionIndex
                  ? 'bg-[#F27D26]'
                  : idx === currentQuestionIndex
                  ? 'bg-gray-600'
                  : 'bg-gray-800'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-8"
        >
          <div className="flex items-start gap-4 mb-8">
            <div className="w-10 h-10 bg-[#F27D26]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-[#F27D26]" />
            </div>
            <h3 className="text-lg text-white font-medium leading-relaxed">
              {currentQuestion.text}
            </h3>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              const showResult = selectedOption !== null;

              let borderColor = 'border-[#2A2B2F]';
              let bgColor = 'bg-[#0A0A0A]';
              let textColor = 'text-gray-300';

              if (showResult) {
                if (isCorrect) {
                  borderColor = 'border-green-500/50';
                  bgColor = 'bg-green-500/10';
                  textColor = 'text-green-400';
                } else if (isSelected) {
                  borderColor = 'border-red-500/50';
                  bgColor = 'bg-red-500/10';
                  textColor = 'text-red-400';
                }
              } else if (isSelected) {
                borderColor = 'border-[#F27D26]';
                bgColor = 'bg-[#F27D26]/5';
                textColor = 'text-white';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-lg border ${borderColor} ${bgColor} ${textColor} transition-all flex items-center justify-between group`}
                >
                  <span>{option}</span>
                  {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
                selectedOption !== null
                  ? 'bg-[#F27D26] text-white hover:bg-[#D96A1F]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              id="quiz-next-btn"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
