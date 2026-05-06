import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function CacheDiagram() {
  const { l1Cache, l2Cache, l3Cache, mar, phase, setDetailedComponentView } = useSimulatorStore();
  const isAccessing = phase === 'FETCH' || phase === 'EXECUTE';

  const levels = [
    { cache: l1Cache, color: 'teal',   speed: '1-4 cycles',   loc: 'On-core',    bg: 'teal' },
    { cache: l2Cache, color: 'cyan',   speed: '10-20 cycles',  loc: 'Per-core',   bg: 'cyan' },
    { cache: l3Cache, color: 'blue',   speed: '30-50 cycles',  loc: 'Shared',     bg: 'blue' },
  ];

  const colorMap: Record<string,string> = {
    teal: 'border-teal-500 bg-teal-950/60 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    cyan: 'border-cyan-500 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    blue: 'border-blue-500 bg-blue-950/60 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  };
  const dimMap: Record<string,string> = {
    teal: 'border-teal-900/30 bg-zinc-900',
    cyan: 'border-cyan-900/30 bg-zinc-900',
    blue: 'border-blue-900/30 bg-zinc-900',
  };
  const lineActive: Record<string,string> = {
    teal: 'bg-teal-500/40 border-teal-500/60',
    cyan: 'bg-cyan-500/20 border-cyan-500/40',
    blue: 'bg-blue-500/20 border-blue-500/40',
  };
  const lineInactive = 'bg-zinc-900 border-zinc-800';
  const dotActive: Record<string,string> = {
    teal: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]',
    cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
    blue: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]',
  };
  const barActive: Record<string,string> = {
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => setDetailedComponentView('none')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Architecture
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-teal-500">Cache Hierarchy Deep Dive</span>
        {isAccessing && <div className="ml-2 text-[10px] text-teal-400 font-mono">Accessing MAR[{mar}]</div>}
        <span className="ml-auto text-[10px] text-zinc-500 italic">L1 fastest → L3 largest</span>
      </div>

      <div className="flex-1 grid place-items-center p-6 overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">

          {/* CPU label at top */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">CPU Core</span>
          </div>

          {/* Cache levels */}
          {levels.map(({ cache, color, speed, loc, bg }) => {
            const used = cache.lines.filter(l => l.valid).length;
            const pct = cache.size > 0 ? (used / cache.size) * 100 : 0;
            const total = cache.hits + cache.misses;
            const hitRate = total > 0 ? Math.round((cache.hits / total) * 100) : 0;
            const isFull = used === cache.size;

            return (
              <div key={cache.name} className="w-full">
                {/* Connector from previous level */}
                <div className="flex justify-center mb-1">
                  <div className={cn("w-0.5 h-4", isAccessing ? barActive[bg] : "bg-zinc-800")} />
                </div>

                <div className={cn(
                  "w-full rounded-2xl border-2 p-5 transition-all duration-300",
                  isAccessing ? colorMap[color] : dimMap[color]
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", isAccessing ? dotActive[bg] : "bg-zinc-700")} />
                      <span className={cn("font-black text-lg tracking-widest uppercase", isAccessing ? "" : "text-zinc-500")}>
                        {cache.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">{loc}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{speed}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Used:</span>
                        <span className={cn("font-black", isAccessing ? "" : "text-zinc-500")}>{used}/{cache.size}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Hit Rate:</span>
                        <span className={cn("font-black", hitRate > 70 ? "text-emerald-400" : hitRate > 40 ? "text-amber-400" : "text-zinc-500")}>{hitRate}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Hits:</span><span className="text-emerald-500">{cache.hits}</span>
                        <span className="text-zinc-500">Miss:</span><span className="text-rose-500">{cache.misses}</span>
                      </div>
                    </div>
                  </div>

                  {/* Usage bar */}
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 mb-4">
                    <motion.div className={cn("h-full rounded-full", barActive[bg])}
                      style={{ width: `${pct}%` }} layout transition={{ type: 'spring', stiffness: 100 }} />
                  </div>

                  {/* Cache lines grid */}
                  <div className="flex flex-wrap gap-1.5">
                    {cache.lines.map((line, i) => {
                      const isCurrentAddr = line.valid && line.tag === mar;
                      return (
                        <motion.div key={i}
                          className={cn(
                            "rounded-md border p-1.5 text-center transition-all duration-200 min-w-[48px]",
                            isCurrentAddr && isAccessing ? cn(lineActive[bg], 'border-[2px]')
                              : line.valid ? cn(lineActive[bg], 'border')
                              : lineInactive
                          )}
                          animate={isCurrentAddr && isAccessing ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}>
                          <div className="text-[7px] text-zinc-600 font-mono mb-0.5">
                            {line.valid ? `tag:${line.tag}` : 'empty'}
                          </div>
                          <div className={cn("font-mono text-[10px] font-bold",
                            isCurrentAddr && isAccessing ? "text-white" : line.valid ? "text-zinc-300" : "text-zinc-700")}>
                            {line.valid ? line.data.toString().padStart(3,'0') : '---'}
                          </div>
                        </motion.div>
                      );
                    })}
                    {isFull && (
                      <div className="flex items-center pl-2">
                        <span className="text-[9px] text-amber-500 font-bold uppercase">Full — LRU eviction active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bottom: RAM */}
          <div className="flex justify-center">
            <div className="w-0.5 h-4 bg-zinc-700" />
          </div>
          <div className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-5 py-3 flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Main RAM</span>
            <span className="text-[10px] text-zinc-600 font-mono">100–200 cycles latency</span>
            <div className="ml-auto text-[10px] text-zinc-500 font-mono">Addressed via MAR → {mar}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
