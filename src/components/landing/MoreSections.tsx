import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SectionTitle } from './Sections';

/* ─── FDE Cycle interactive stepper ─────────────────────── */
const FDE_STEPS = [
  {
    phase: 'FETCH',
    color: 'cyan',
    icon: '📡',
    title: 'Fetch',
    steps: [
      'PC → MAR: copy the address of the next instruction',
      'MAR → RAM (via Address Bus): ask memory for that address',
      'RAM → MBR (via Data Bus): instruction data arrives',
      'MBR → CIR: the instruction is latched for decoding',
      'PC increments to point at the next instruction',
    ],
  },
  {
    phase: 'DECODE',
    color: 'amber',
    icon: '🔍',
    title: 'Decode',
    steps: [
      'CIR → Control Unit: the CU reads the instruction',
      'Opcode field is extracted (e.g. "ADD")',
      'Operand field is extracted (e.g. address 21)',
      'CU generates the correct sequence of control signals',
      'ALU and relevant registers are prepared',
    ],
  },
  {
    phase: 'EXECUTE',
    color: 'rose',
    icon: '⚡',
    title: 'Execute',
    steps: [
      'Operand address → MAR (if memory access is needed)',
      'RAM → MBR: data is fetched (via buses)',
      'MBR + ACC → ALU: operands are fed to the calculator',
      'ALU computes the result',
      'Result → ACC; status flags (Zero, Negative) are updated',
    ],
  },
];

export function FdeCycleSection() {
  const [active, setActive] = useState(0);
  const step = FDE_STEPS[active];
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500 bg-cyan-500/5 text-cyan-400',
    amber: 'border-amber-500 bg-amber-500/5 text-amber-400',
    rose: 'border-rose-500 bg-rose-500/5 text-rose-400',
  };
  const dotColor: Record<string, string> = { cyan: 'bg-cyan-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };

  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-800">
      <SectionTitle
        tag="How it works"
        title="Fetch → Decode → Execute"
        sub="Every single instruction your computer runs goes through these three phases, billions of times per second."
      />

      {/* Phase selector */}
      <div className="flex gap-3 justify-center mb-8">
        {FDE_STEPS.map((s, i) => (
          <motion.button
            key={s.phase}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActive(i)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-bold transition-all',
              active === i ? colorMap[s.color] : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            )}
          >
            <span>{s.icon}</span>{s.title}
          </motion.button>
        ))}
      </div>

      {/* Detail card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.phase}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={cn('rounded-2xl border p-8', colorMap[step.color])}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{step.icon}</span>
            <h3 className="text-2xl font-bold">{step.title} Phase</h3>
          </div>
          <ol className="space-y-3">
            {step.steps.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 text-sm text-zinc-200"
              >
                <span className={cn('w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-950 mt-0.5', dotColor[step.color])}>
                  {i + 1}
                </span>
                {s}
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ─── Memory hierarchy section ────────────────────────────── */
const MEMORY_LEVELS = [
  { name: 'Registers', speed: '1 cycle', size: 'Bytes', color: 'bg-rose-500', width: 'w-full', icon: '⚡', desc: 'Inside the CPU. Instantaneous. Tiny.' },
  { name: 'L1 Cache', speed: '4 cycles', size: 'KBs', color: 'bg-orange-500', width: 'w-11/12', icon: '🔥', desc: 'On the CPU die. Extremely fast. Very small.' },
  { name: 'L2 Cache', speed: '12 cycles', size: 'MBs', color: 'bg-amber-500', width: 'w-10/12', icon: '🟡', desc: 'Still on-chip. Fast but larger.' },
  { name: 'L3 Cache', speed: '40 cycles', size: 'MBs–GBs', color: 'bg-yellow-600', width: 'w-9/12', icon: '🟠', desc: 'Shared across all CPU cores.' },
  { name: 'RAM', speed: '100+ cycles', size: 'GBs', color: 'bg-violet-500', width: 'w-7/12', icon: '💾', desc: 'Main working memory. Volatile.' },
  { name: 'SSD / HDD', speed: 'Milliseconds', size: 'TBs', color: 'bg-zinc-500', width: 'w-5/12', icon: '📀', desc: 'Persistent storage. Slow to access.' },
];

export function MemorySection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-800">
      <SectionTitle
        tag="Memory"
        title="The Memory Pyramid"
        sub="Not all memory is equal. Speed and size trade off — faster memory is always smaller and more expensive. Hover each level."
      />
      <div className="flex flex-col items-center gap-2">
        {MEMORY_LEVELS.map((m, i) => (
          <motion.div
            key={m.name}
            onHoverStart={() => setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ scale: 1.02 }}
            className={cn('relative rounded-xl border border-zinc-800 overflow-hidden cursor-default transition-all duration-200', m.width,
              hovered === i ? 'border-zinc-600' : ''
            )}
            style={{ maxWidth: 560 }}
          >
            <div className={cn('h-12 flex items-center px-5 gap-3', m.color + '/15')}>
              <span className="text-base">{m.icon}</span>
              <span className="font-bold text-zinc-100 text-sm">{m.name}</span>
              <span className="ml-auto text-xs font-mono text-zinc-400">{m.speed}</span>
              <span className="text-xs font-mono text-zinc-500">{m.size}</span>
            </div>
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 py-3 text-xs text-zinc-400 border-t border-zinc-800">{m.desc}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-600 mt-6 italic">← Faster & smaller at the top &nbsp;|&nbsp; Larger & slower at the bottom →</p>
    </section>
  );
}

/* ─── Stored program concept quiz ──────────────────────────── */
export function StoredProgramSection() {
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-800">
      <SectionTitle
        tag="The Big Idea"
        title="The Stored Program Concept"
        sub="What makes Von Neumann architecture revolutionary? One single insight changed everything."
      />
      <div className="grid md:grid-cols-2 gap-6">
        {/* Before */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-lg mb-4">✗</div>
          <h3 className="font-bold text-zinc-100 text-lg mb-2">Before (1940s)</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            To change what a computer did, engineers had to physically <span className="text-zinc-200 font-medium">rewire the circuits</span>. 
            A new task meant days of labour reconnecting plugboards and switches.
          </p>
        </div>
        {/* After */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg mb-4">✓</div>
          <h3 className="font-bold text-zinc-100 text-lg mb-2">Von Neumann's Insight</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Store the program <span className="text-emerald-400 font-medium">in the same memory as the data</span>. 
            To change what the computer does, just write a new program — no rewiring needed.
          </p>
        </div>
      </div>

      {/* Reveal quiz */}
      <div className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-8 text-center">
        <p className="text-zinc-300 font-medium mb-4">Why does treating instructions like data matter?</p>
        {!revealed ? (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setRevealed(true)}
            className="px-6 py-2.5 rounded-full border border-zinc-700 text-zinc-300 text-sm font-semibold hover:bg-zinc-800 transition-all"
          >
            Tap to reveal →
          </motion.button>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-zinc-300 text-sm leading-relaxed max-w-lg mx-auto"
          >
            It means a program can <span className="text-blue-400 font-medium">modify itself or another program</span> at runtime, 
            enabling loops, conditions, and — ultimately — every piece of software ever written.
          </motion.p>
        )}
      </div>
    </section>
  );
}
