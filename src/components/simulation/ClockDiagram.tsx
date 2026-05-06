import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ClockDiagram() {
  const { clockCycle, phase, isRunning, speed, history, setDetailedComponentView } = useSimulatorStore();

  const phases = ['IDLE','FETCH','DECODE','EXECUTE','WRITEBACK'] as const;
  const phaseColors: Record<string,string> = {
    IDLE:'bg-zinc-700', FETCH:'bg-blue-500', DECODE:'bg-violet-500',
    EXECUTE:'bg-rose-500', WRITEBACK:'bg-teal-500', COMPLETE:'bg-zinc-500',
  };
  const phaseText: Record<string,string> = {
    IDLE:'text-zinc-500', FETCH:'text-blue-400', DECODE:'text-violet-400',
    EXECUTE:'text-rose-400', WRITEBACK:'text-teal-400', COMPLETE:'text-zinc-400',
  };

  // Recent 20 history entries for waveform
  const recent = history.slice(-20);
  const cycleDuration = speed; // ms per step
  const freq = cycleDuration > 0 ? (1000 / cycleDuration).toFixed(1) : '—';

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => setDetailedComponentView('none')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Architecture
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-orange-500">System Clock Deep Dive</span>
        <span className="ml-auto text-[10px] text-zinc-500 italic">{isRunning ? 'Running' : 'Paused'} at {cycleDuration}ms / step</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">

          {/* Clock stats row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Clock Cycles', value: clockCycle, color: 'text-orange-400', dim: 'border-orange-500/30 bg-orange-950/30' },
              { label: 'Sim Speed', value: `${cycleDuration}ms`, color: 'text-yellow-400', dim: 'border-yellow-500/30 bg-yellow-950/30' },
              { label: 'Sim Freq', value: `${freq} Hz`, color: 'text-amber-400', dim: 'border-amber-500/30 bg-amber-950/30' },
              { label: 'Current Phase', value: phase, color: phaseText[phase] || 'text-zinc-400', dim: 'border-zinc-700 bg-zinc-900' },
            ].map(({ label, value, color, dim }) => (
              <div key={label} className={cn("rounded-xl border-2 p-4 text-center", dim)}>
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">{label}</div>
                <div className={cn("font-mono font-black text-3xl", color)}>{value}</div>
              </div>
            ))}
          </div>

          {/* Logic Analyzer */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="text-xs font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Logic Analyzer
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">Last 20 micro-steps</div>
            </div>
            
            <div className="relative w-full h-[250px] flex items-stretch z-10">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between h-full text-right pr-4 shrink-0 border-r border-zinc-800 pt-2 pb-6">
                {[
                  { name: 'SYS_CLK', color: 'text-orange-400' },
                  { name: 'MEM_READ', color: 'text-cyan-400' },
                  { name: 'MEM_WRITE', color: 'text-rose-400' },
                  { name: 'ALU_EN', color: 'text-pink-400' },
                  { name: 'PC_INC', color: 'text-violet-400' },
                ].map((trace) => (
                  <span key={trace.name} className={cn("text-xs font-mono font-bold tracking-widest flex-1 flex items-center justify-end", trace.color)}>
                    {trace.name}
                  </span>
                ))}
              </div>
              
              {/* Waveform SVG */}
              <div className="flex-1 relative h-full ml-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 250" preserveAspectRatio="none">
                  {/* Vertical Guide Lines for Steps */}
                  {Array.from({ length: 21 }, (_, i) => (
                    <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="250" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  ))}

                  {/* Traces */}
                  {[
                    { name: 'SYS_CLK', color: '#f97316', getVal: (e: any, i: number) => i % 2 === 0 },
                    { name: 'MEM_READ', color: '#06b6d4', getVal: (e: any) => e.phase === 'FETCH' || (e.phase === 'EXECUTE' && e.description.includes('Read')) },
                    { name: 'MEM_WRITE', color: '#f43f5e', getVal: (e: any) => e.phase === 'EXECUTE' && e.description.includes('STORE') },
                    { name: 'ALU_EN', color: '#ec4899', getVal: (e: any) => e.description.includes('ALU') || e.description.includes('ADD') || e.description.includes('SUB') },
                    { name: 'PC_INC', color: '#8b5cf6', getVal: (e: any) => e.description.includes('PC incremented') },
                  ].map((trace, traceIdx) => {
                    const rowHeight = 50;
                    const baseY = traceIdx * rowHeight;
                    const highY = baseY + 10;
                    const lowY = baseY + 40;

                    return (
                      <g key={trace.name}>
                        {/* Horizontal Baseline */}
                        <line x1="0" y1={lowY} x2="1000" y2={lowY} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4,4" />
                        
                        {Array.from({ length: 20 }, (_, i) => {
                          const entry = recent[i];
                          if (!entry) return null;
                          
                          const isHigh = trace.getVal(entry, i);
                          const y = isHigh ? highY : lowY;
                          
                          const nextEntry = recent[i+1];
                          const nextHigh = nextEntry ? trace.getVal(nextEntry, i+1) : false;
                          const nextY = nextHigh ? highY : lowY;
                          
                          const stepWidth = 1000 / 20;
                          const x1 = i * stepWidth;
                          const x2 = (i + 1) * stepWidth;

                          return (
                            <g key={i}>
                              {/* Fill glow */}
                              {isHigh && (
                                <motion.rect x={x1} y={highY} width={stepWidth} height={30} fill={trace.color} 
                                  initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} transition={{ duration: 0.5 }} />
                              )}
                              
                              {/* Horizontal signal line */}
                              <motion.line x1={x1} y1={y} x2={x2} y2={y} stroke={trace.color} strokeWidth="2.5" strokeLinecap="round"
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
                              
                              {/* Vertical edge transition to next state */}
                              {i < 19 && nextEntry && y !== nextY && (
                                <motion.line x1={x2} y1={y} x2={x2} y2={nextY} stroke={trace.color} strokeWidth="2.5" strokeLinecap="round"
                                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
                  
                  {/* X-Axis Cycle Labels at the very bottom */}
                  {Array.from({ length: 20 }, (_, i) => {
                    const entry = recent[i];
                    if (!entry) return null;
                    if (i % 2 !== 0) return null;
                    const x1 = i * 50;
                    return (
                      <text key={i} x={x1 + 50} y={245} fill="#71717a" fontSize="10" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
                        cyc_{entry.cycle}
                      </text>
                    );
                  })}
                  
                  {/* Scanning Playhead */}
                  {isRunning && (
                    <motion.line 
                      y1="0" y2="250" stroke="#f97316" strokeWidth="2" strokeDasharray="4,4"
                      animate={{ x1: [0, 1000], x2: [0, 1000] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Phase pipeline visualization */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Fetch-Execute Cycle Pipeline</div>
            <div className="flex items-stretch gap-2">
              {phases.map((p, i) => {
                const isCurrent = phase === p;
                const isDone = phases.indexOf(phase as typeof phases[number]) > i;
                return (
                  <div key={p} className="flex-1 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-full rounded-xl border-2 py-4 flex flex-col items-center gap-2 transition-all duration-300",
                      isCurrent ? `border-2 ${phaseColors[p]} ${phaseText[p]} shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-zinc-900` :
                        isDone ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-800 bg-zinc-900/50"
                    )}>
                      <div className={cn("w-3 h-3 rounded-full transition-all", isCurrent ? phaseColors[p] + ' shadow-[0_0_10px_rgba(255,255,255,0.3)]' : isDone ? 'bg-zinc-600' : 'bg-zinc-800')} />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", isCurrent ? phaseText[p] : isDone ? 'text-zinc-500' : 'text-zinc-700')}>{p}</span>
                      {isCurrent && isRunning && (
                        <motion.div className={cn("w-1.5 h-1.5 rounded-full", phaseColors[p])}
                          animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                      )}
                    </div>
                    {/* Arrow between phases */}
                    {i < phases.length - 1 && (
                      <div className={cn("h-0.5 w-full mt-4 hidden", isDone ? "bg-zinc-600" : "bg-zinc-800")} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connector arrows */}
            <div className="flex items-center mt-2 px-4">
              {phases.map((_, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div className={cn("flex-1 h-px", "bg-zinc-700")} />
                  {i < phases.length - 1 && (
                    <svg width="8" height="8" viewBox="0 0 8 8" className="text-zinc-700 shrink-0">
                      <path d="M0 4h6M4 1l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent history log */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Recent Micro-Step Log</div>
            <div className="flex flex-col gap-1 max-h-28 overflow-hidden">
              {recent.slice(-6).reverse().map((entry, i) => (
                <div key={i} className={cn("flex items-center gap-3 text-xs font-mono", i === 0 ? "text-zinc-200" : "text-zinc-500")}>
                  <span className="text-zinc-600 w-8 text-right shrink-0">#{entry.cycle}</span>
                  <span className={cn("px-1.5 rounded font-bold text-[10px] uppercase", phaseColors[entry.phase] + '/30 text-' + entry.phase.toLowerCase() + '-400')}>{entry.phase}</span>
                  <span className="truncate">{entry.description}</span>
                </div>
              ))}
              {recent.length === 0 && <span className="text-zinc-600 text-xs">Run the simulation to see micro-steps here.</span>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
