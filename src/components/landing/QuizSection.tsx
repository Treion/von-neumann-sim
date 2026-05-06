import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionTitle } from './Sections';
import { CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';

const QUESTIONS = [
  {
    question: 'What does the Program Counter (PC) hold?',
    options: ['The result of a calculation', 'The address of the next instruction', 'The current data value', 'The clock speed'],
    correct: 1,
    explanation: 'The PC always points to the address of the NEXT instruction to be fetched from memory.',
  },
  {
    question: 'Which bus carries data in BOTH directions?',
    options: ['Address Bus', 'Control Bus', 'Data Bus', 'System Bus'],
    correct: 2,
    explanation: 'The Data Bus is bi-directional — data flows from RAM to CPU on a READ, and CPU to RAM on a WRITE.',
  },
  {
    question: 'What is the ALU responsible for?',
    options: ['Decoding instructions', 'Storing programs', 'Performing arithmetic and logic', 'Generating clock signals'],
    correct: 2,
    explanation: 'The ALU (Arithmetic Logic Unit) performs all mathematical operations and logical comparisons.',
  },
  {
    question: 'In Von Neumann architecture, where are instructions stored?',
    options: ['In a separate instruction memory', 'In the CPU registers only', 'In the same memory as data', 'On the Control Bus'],
    correct: 2,
    explanation: 'The Stored Program Concept — Von Neumann\'s key insight — stores both instructions AND data in the same unified memory (RAM).',
  },
  {
    question: 'What happens during the FETCH phase?',
    options: ['ALU calculates the result', 'The instruction is retrieved from RAM', 'Control signals are generated', 'Data is written back to memory'],
    correct: 1,
    explanation: 'During FETCH, the CPU copies PC → MAR, reads memory at that address, and loads the instruction into the CIR.',
  },
  {
    question: 'Which is the fastest type of memory?',
    options: ['RAM', 'L3 Cache', 'SSD', 'CPU Registers'],
    correct: 3,
    explanation: 'Registers are built directly into the CPU core and operate at clock speed — zero wait cycles. The further from the CPU, the slower the memory.',
  },
];

export function QuizSection() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const q = QUESTIONS[currentQ];
  const wasCorrect = selected !== null && selected === q.correct;

  function handleSelect(idx: number) {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === q.correct) {
      setScore((s) => s + 1);
      setAnswered((a) => [...a, true]);
    } else {
      setAnswered((a) => [...a, false]);
    }
  }

  function handleNext() {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setIsFinished(true);
    }
  }

  function handleReset() {
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setAnswered([]);
    setShowResult(false);
    setIsFinished(false);
  }

  const percentage = Math.round((score / QUESTIONS.length) * 100);

  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-800">
      <SectionTitle
        tag="Test Yourself"
        title="Quick Knowledge Check"
        sub="Before you jump into the simulator, let's see how much you picked up. No pressure — it's just for fun!"
      />

      {!isFinished ? (
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                animate={{ width: `${((currentQ + (showResult ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-500 shrink-0">
              {currentQ + 1}/{QUESTIONS.length}
            </span>
            {/* Score dots */}
            <div className="flex gap-1 shrink-0">
              {answered.map((correct, i) => (
                <div
                  key={i}
                  className={cn('w-2 h-2 rounded-full', correct ? 'bg-emerald-500' : 'bg-rose-500')}
                />
              ))}
              {Array.from({ length: QUESTIONS.length - answered.length }).map((_, i) => (
                <div key={`empty-${i}`} className="w-2 h-2 rounded-full bg-zinc-800" />
              ))}
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-xl font-bold text-zinc-100 mb-6">{q.question}</h3>

              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  let style = 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300';
                  if (showResult) {
                    if (i === q.correct) style = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                    else if (i === selected && i !== q.correct) style = 'border-rose-500 bg-rose-500/10 text-rose-400';
                    else style = 'border-zinc-800 bg-zinc-900 text-zinc-600';
                  } else if (selected === i) {
                    style = 'border-blue-500 bg-blue-500/10 text-blue-400';
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={!showResult ? { scale: 1.01 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                      onClick={() => handleSelect(i)}
                      disabled={showResult}
                      className={cn(
                        'w-full text-left px-5 py-3.5 rounded-xl border font-medium text-sm transition-all flex items-center gap-3',
                        style
                      )}
                    >
                      <span className={cn(
                        'w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0',
                        showResult && i === q.correct ? 'border-emerald-500 bg-emerald-500/20' :
                        showResult && i === selected ? 'border-rose-500 bg-rose-500/20' :
                        'border-zinc-700 bg-zinc-800'
                      )}>
                        {showResult && i === q.correct ? <CheckCircle2 className="w-4 h-4" /> :
                         showResult && i === selected && i !== q.correct ? <XCircle className="w-4 h-4" /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation + Next */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex flex-col gap-4"
                  >
                    <div className={cn(
                      'rounded-xl border px-5 py-4 text-sm',
                      wasCorrect
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-zinc-300'
                        : 'border-rose-500/30 bg-rose-500/5 text-zinc-300'
                    )}>
                      <span className={cn('font-bold mr-2', wasCorrect ? 'text-emerald-400' : 'text-rose-400')}>
                        {wasCorrect ? '✓ Correct!' : '✗ Not quite.'}
                      </span>
                      {q.explanation}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      className="self-end px-6 py-2.5 rounded-full bg-zinc-100 text-zinc-950 font-bold text-sm hover:bg-white transition-all"
                    >
                      {currentQ < QUESTIONS.length - 1 ? 'Next Question →' : 'See Results'}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* ─── Results screen ─────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2',
            percentage >= 80 ? 'border-emerald-500 bg-emerald-500/10' :
            percentage >= 50 ? 'border-amber-500 bg-amber-500/10' :
            'border-rose-500 bg-rose-500/10'
          )}>
            <Trophy className={cn(
              'w-8 h-8',
              percentage >= 80 ? 'text-emerald-400' : percentage >= 50 ? 'text-amber-400' : 'text-rose-400'
            )} />
          </div>

          <h3 className="text-3xl font-extrabold text-zinc-100 mb-2">{score}/{QUESTIONS.length}</h3>
          <p className="text-zinc-400 mb-2">
            {percentage >= 80 ? 'Excellent! You really understand the architecture.' :
             percentage >= 50 ? 'Good effort! You\'re getting the hang of it.' :
             'Keep learning — scroll back up to review the concepts!'}
          </p>

          {/* Score dots */}
          <div className="flex gap-2 justify-center mb-8">
            {answered.map((correct, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn('w-4 h-4 rounded-full', correct ? 'bg-emerald-500' : 'bg-rose-500')}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-700 text-zinc-300 text-sm font-semibold hover:bg-zinc-800 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </motion.button>
        </motion.div>
      )}
    </section>
  );
}
