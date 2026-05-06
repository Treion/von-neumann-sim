import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { History } from 'lucide-react';

const phaseColors: Record<string, string> = {
  IDLE: 'text-zinc-500 bg-zinc-900 border-zinc-800',
  FETCH: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  DECODE: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  EXECUTE: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  WRITEBACK: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  COMPLETE: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
};

function getSignalTrace(phase: string, description: string) {
  if (phase === 'FETCH') {
    if (description.includes('PC to MAR')) return 'PC → Address Bus → MAR';
    if (description.includes('RAM to MBR')) return 'RAM → Data Bus → MBR';
    if (description.includes('MBR to CIR')) return 'MBR → CIR';
  }
  if (phase === 'DECODE') return 'CIR → CU (Decoded Opcode)';
  if (description.includes('ALU')) return 'ACC + MBR → ALU → ACC';
  if (description.includes('STORE')) return 'ACC → MBR → Data Bus → RAM';
  return null;
}

export function HistoryPanel() {
  const history = useSimulatorStore((s) => s.history);
  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Execution Trace</span>
        </div>
        <div className="text-[10px] font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-widest">
          {history.length} Steps
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-zinc-950 min-h-0">
        <div className="p-4">
          <AnimatePresence initial={false}>
            {history.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <History className="w-6 h-6 text-zinc-700" />
                </div>
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No Trace Data</p>
                <p className="text-[10px] text-zinc-500 mt-1">Start simulation to capture cycle logs</p>
              </div>
            ) : (
              [...history].reverse().map((entry, index) => {
                const originalIndex = history.length - 1 - index;
                const trace = getSignalTrace(entry.phase, entry.description);
                const isLatest = index === 0;

                return (
                  <motion.div
                    key={originalIndex}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative overflow-hidden mb-3"
                  >
                    <div className={cn(
                      'rounded-xl px-4 py-3 border transition-all relative',
                      isLatest ? 'bg-zinc-900 border-zinc-700 shadow-lg' : 'bg-zinc-900/40 border-zinc-800/60 opacity-80'
                    )}>
                    {isLatest && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-500 font-bold">CYCLE #{entry.cycle}</span>
                        <span className={`font-bold uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full border ${phaseColors[entry.phase] || 'text-zinc-500 bg-zinc-900 border-zinc-800'}`}>
                          {entry.phase}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-[11px] text-zinc-300 font-medium leading-relaxed mb-3">
                      {entry.description}
                    </div>

                    {trace && (
                      <div className="mb-3 px-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-blue-400 tracking-tight uppercase">Trace: {trace}</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-zinc-800 grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500">
                      <div className="flex justify-between border-r border-zinc-800 pr-2">
                        <span>PC</span>
                        <span className="text-zinc-300">{entry.pc.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex justify-between pl-1">
                        <span>ACC</span>
                        <span className="text-emerald-500">{entry.accumulator.toString().padStart(3, '0')}</span>
                      </div>
                      <div className="flex justify-between border-r border-zinc-800 pr-2">
                        <span>MAR</span>
                        <span className="text-cyan-500">{entry.mar.toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex justify-between pl-1">
                        <span>MBR</span>
                        <span className="text-violet-500">{entry.mbr.toString().padStart(3, '0')}</span>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
