import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function AdderDiagram() {
  const { accumulator, mbr, phase, cir, setDetailedComponentView } = useSimulatorStore();
  const isAdding = phase === 'EXECUTE' && cir?.opcode === 'ADD';
  const sum = (accumulator + mbr) & 0xFF;

  const aBits = (accumulator & 0xFF).toString(2).padStart(8,'0').split('').map(Number);
  const bBits = (mbr & 0xFF).toString(2).padStart(8,'0').split('').map(Number);
  const sBits = (sum & 0xFF).toString(2).padStart(8,'0').split('').map(Number);
  const carries = new Array(9).fill(0);
  for (let i = 7; i >= 0; i--) {
    const s = aBits[i] + bBits[i] + carries[i+1];
    carries[i] = s >= 2 ? 1 : 0;
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => setDetailedComponentView('alu')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to ALU
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-cyan-500">8-Bit Ripple Carry Adder</span>
        <div className="ml-auto font-mono text-xs text-zinc-500">
          {isAdding ? <span className="text-cyan-400 font-bold">{`${accumulator} + ${mbr} = ${sum}${carries[0] ? ' (carry out!)' : ''}`}</span> : 'Adder logic evaluates continuously.'}
        </div>
      </div>

      <div className="flex-1 grid place-items-center p-6 overflow-hidden">
        <div className="flex flex-col items-center gap-5 w-full max-w-4xl">

          {/* A bits */}
          <div className="flex gap-2.5 justify-center">
            {aBits.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[8px] text-emerald-700 font-mono font-bold">A{7-i}</span>
                <div className={cn(
                  "w-12 h-11 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-black transition-all",
                  b && isAdding ? "border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "border-zinc-800 bg-zinc-900 text-zinc-600"
                )}>{b}</div>
              </div>
            ))}
          </div>

          {/* B bits */}
          <div className="flex gap-2.5 justify-center">
            {bBits.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[8px] text-violet-700 font-mono font-bold">B{7-i}</span>
                <div className={cn(
                  "w-12 h-11 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-black transition-all",
                  b && isAdding ? "border-violet-500 bg-violet-950/60 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.4)]" : "border-zinc-800 bg-zinc-900 text-zinc-600"
                )}>{b}</div>
              </div>
            ))}
          </div>

          {/* Carry-in row */}
          <div className="flex gap-2.5 justify-center">
            {carries.slice(1).map((c, i) => (
              <div key={i} className="w-12 flex flex-col items-center gap-0.5">
                <span className="text-[7px] text-amber-700 uppercase font-bold">Cin</span>
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-black transition-all",
                  c && isAdding ? "border-amber-400 bg-amber-950/60 text-amber-300" : "border-zinc-800 bg-zinc-900 text-zinc-700"
                )}>{c}</div>
              </div>
            ))}
          </div>

          {/* FA blocks */}
          <div className="flex gap-2.5 justify-center">
            {aBits.map((_, i) => (
              <motion.div key={i}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-[9px] uppercase relative transition-all",
                  isAdding ? "border-cyan-500 bg-cyan-950/60 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]" : "border-zinc-800 bg-zinc-900 text-zinc-600"
                )}
                animate={isAdding ? { boxShadow: ['0 0 8px rgba(6,182,212,0.2)', '0 0 20px rgba(6,182,212,0.5)', '0 0 8px rgba(6,182,212,0.2)'] } : {}}
                transition={{ duration: 1, repeat: Infinity, delay: (7-i) * 0.1 }}>
                FA
              </motion.div>
            ))}
          </div>

          {/* Sum bits */}
          <div className="flex gap-2.5 justify-center">
            {sBits.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-12 h-11 rounded-lg border-2 flex items-center justify-center font-mono text-lg font-black transition-all",
                  b && isAdding ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.5)]" : "border-zinc-800 bg-zinc-900 text-zinc-600"
                )}>{b}</div>
                <span className="text-[8px] text-cyan-700 font-mono font-bold">S{7-i}</span>
              </div>
            ))}
          </div>

          {/* Result row */}
          <div className="flex items-center gap-4 mt-2">
            <div className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-mono font-bold text-sm transition-all",
              carries[0] && isAdding ? "border-rose-400 bg-rose-950/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]" : "border-zinc-800 bg-zinc-900 text-zinc-600"
            )}>
              Carry Out: {carries[0]}
            </div>
            <div className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 font-mono font-bold text-sm transition-all",
              isAdding ? "border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "border-zinc-800 bg-zinc-900 text-zinc-600"
            )}>
              Sum = {sum} (0x{sum.toString(16).toUpperCase().padStart(2,'0')})
            </div>
          </div>

          <p className="text-center max-w-xl text-[11px] text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-lg">
            Each Full Adder (FA) takes two bits + carry-in, outputs a sum bit + carry-out that ripples left.
          </p>
        </div>
      </div>
    </div>
  );
}
