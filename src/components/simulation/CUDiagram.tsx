import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRef, useLayoutEffect, useState } from 'react';

const CONTROL_LINES = [
  { id: 'MEM_READ',  label: 'MEM\nREAD',  match: (sigs: string[]) => sigs.includes('READ') },
  { id: 'MEM_WRITE', label: 'MEM\nWRITE', match: (sigs: string[]) => sigs.includes('WRITE') },
  { id: 'ALU_ADD',   label: 'ALU\nADD',   match: (_: string[], op?: string) => op === 'ADD' },
  { id: 'ALU_SUB',   label: 'ALU\nSUB',   match: (_: string[], op?: string) => op === 'SUB' },
  { id: 'PC_INC',    label: 'PC\nINC',    match: (sigs: string[]) => sigs.includes('INCREMENT') },
  { id: 'PC_JUMP',   label: 'PC\nJUMP',   match: (sigs: string[]) => sigs.includes('JUMP') },
  { id: 'LD_MAR',    label: 'LOAD\nMAR',  match: (sigs: string[]) => sigs.includes('LOAD') },
  { id: 'HALT',      label: 'HALT',       match: (_: string[], op?: string) => op === 'HALT' },
];

function getAnchor(el: HTMLElement | null, container: HTMLElement | null, edge: 'bottom' | 'top') {
  if (!el || !container) return { x: 0, y: 0 };
  const eR = el.getBoundingClientRect();
  const cR = container.getBoundingClientRect();
  switch (edge) {
    case 'bottom': return { x: eR.left - cR.left + eR.width / 2, y: eR.bottom - cR.top };
    case 'top':    return { x: eR.left - cR.left + eR.width / 2, y: eR.top - cR.top };
  }
}

function getLeft(el: HTMLElement | null, container: HTMLElement | null) {
  if (!el || !container) return 0;
  return el.getBoundingClientRect().left - container.getBoundingClientRect().left + el.getBoundingClientRect().width / 2;
}

export function CUDiagram() {
  const { clockCycle, cir, phase, signals, setDetailedComponentView } = useSimulatorStore();

  const isDecoding = phase === 'DECODE';
  const isExecuting = phase === 'EXECUTE';
  const isActive = phase !== 'IDLE' && phase !== 'COMPLETE';
  const ctrlSigs = signals.filter(s => s.type === 'control').map(s => s.value as string);
  const op = cir?.opcode;

  const phaseColor: Record<string, string> = {
    IDLE:'text-zinc-500', FETCH:'text-blue-400', DECODE:'text-violet-400',
    EXECUTE:'text-rose-400', WRITEBACK:'text-teal-400', COMPLETE:'text-zinc-400',
  };

  // Measured wire paths
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const cirRef   = useRef<HTMLDivElement>(null);
  const cuRef    = useRef<HTMLDivElement>(null);
  const sigRowRef = useRef<HTMLDivElement>(null);
  const sigRefs  = useRef<(HTMLDivElement | null)[]>([]);

  type WireState = { clockLine: string; cirLine: string; fanOut: string; drops: string[] };
  const [wires, setWires] = useState<WireState>({ clockLine: '', cirLine: '', fanOut: '', drops: [] });

  useLayoutEffect(() => {
    const measure = () => {
      const c = containerRef.current;
      if (!c || !clockRef.current || !cirRef.current || !cuRef.current) return;

      const clockBottom = getAnchor(clockRef.current, c, 'bottom');
      const cirBottom   = getAnchor(cirRef.current, c, 'bottom');
      const cuTop       = getAnchor(cuRef.current, c, 'top');
      const cuBottom    = getAnchor(cuRef.current, c, 'bottom');

      const clockLine = `M ${clockBottom.x} ${clockBottom.y} L ${clockBottom.x} ${cuTop.y}`;
      const cirLine   = `M ${cirBottom.x} ${cirBottom.y} L ${cirBottom.x} ${cuTop.y}`;

      // Fan-out
      const busY = cuBottom.y + 30;
      const sigCenters = sigRefs.current.map(el => getLeft(el, c));
      const validCenters = sigCenters.filter(Boolean);
      const minX = Math.min(...validCenters);
      const maxX = Math.max(...validCenters);

      const fanOut = validCenters.length > 1
        ? `M ${cuBottom.x} ${cuBottom.y} L ${cuBottom.x} ${busY} M ${minX} ${busY} L ${maxX} ${busY}`
        : '';

      const drops = sigRefs.current.map((el, i) => {
        const cx = sigCenters[i];
        if (!cx || !sigRowRef.current) return '';
        const sigTop = getAnchor(sigRowRef.current, c, 'top');
        return `M ${cx} ${busY} L ${cx} ${sigTop.y}`;
      });

      setWires({ clockLine, cirLine, fanOut, drops });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => setDetailedComponentView('none')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Architecture
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-amber-500">Control Unit Deep Dive</span>
        <span className="ml-auto text-[10px] text-zinc-500 italic">Click CU Core → Decoder Matrix</span>
      </div>

      {/* Diagram */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex flex-col items-center justify-between py-10 px-16 gap-0">
        {/* SVG wire layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Clock → CU */}
          <path d={wires.clockLine} stroke="rgba(249,115,22,0.15)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {isActive && <path d={wires.clockLine} stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
          {isActive && <motion.circle r="4" fill="#f97316"
            style={{ offsetPath: `path("${wires.clockLine}")`, filter: 'drop-shadow(0 0 5px #f97316)' }}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />}

          {/* CIR → CU */}
          <path d={wires.cirLine} stroke="rgba(139,92,246,0.15)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {isDecoding && <path d={wires.cirLine} stroke="#8b5cf6" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
          {isDecoding && <motion.circle r="4" fill="#8b5cf6"
            style={{ offsetPath: `path("${wires.cirLine}")`, filter: 'drop-shadow(0 0 5px #8b5cf6)' }}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />}

          {/* Fan-out bus */}
          {wires.fanOut.split(/(?=M )/).filter(Boolean).map((seg, i) => (
            <path key={i} d={seg.trim()} stroke={isActive ? "rgba(245,158,11,0.6)" : "rgba(255,255,255,0.06)"} strokeWidth="2" fill="none" strokeLinecap="round" />
          ))}

          {/* Per-signal drops */}
          {wires.drops.map((d, i) => {
            const on = CONTROL_LINES[i] && CONTROL_LINES[i].match(ctrlSigs, op);
            return (
              <g key={i}>
                <path d={d} stroke={on ? "#f59e0b" : "rgba(255,255,255,0.05)"} strokeWidth="2" fill="none" strokeLinecap="round" />
                {on && isActive && (
                  <motion.circle r="3" fill="#f59e0b"
                    style={{ offsetPath: `path("${d}")`, filter: 'drop-shadow(0 0 4px #f59e0b)' }}
                    animate={{ offsetDistance: ['0%', '100%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* ROW 1 — Inputs */}
        <div className="w-full grid grid-cols-2 gap-6 z-10">
          {/* Clock */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-orange-500 uppercase">System Clock</span>
            <div ref={clockRef} className="w-full rounded-xl border-2 border-orange-500/40 bg-orange-950/30 p-4 text-center relative overflow-hidden">
              <div className="font-mono text-4xl font-black text-orange-400">{clockCycle}</div>
              <div className="text-[9px] text-orange-700 uppercase font-bold mt-0.5">cycles</div>
              <motion.div className="absolute inset-0 bg-orange-500/10"
                animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 1, repeat: Infinity }} />
            </div>
          </div>

          {/* CIR */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-violet-500 uppercase">Current Instruction Register</span>
            <div ref={cirRef} className={cn(
              "w-full rounded-xl border-2 p-4 flex items-center justify-center gap-4 font-mono font-black text-2xl transition-all duration-300",
              isDecoding || isExecuting
                ? "border-violet-500 bg-violet-950/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                : "border-violet-900/40 bg-violet-950/20"
            )}>
              <span className={isDecoding || isExecuting ? "text-violet-300" : "text-violet-800"}>{cir?.opcode || 'NOP'}</span>
              <span className="text-zinc-700">|</span>
              <span className={isDecoding || isExecuting ? "text-cyan-300" : "text-cyan-900"}>{cir?.operand ?? '---'}</span>
            </div>
          </div>
        </div>

        {/* ROW 2 — CU Core */}
        <motion.div ref={cuRef} onClick={() => setDetailedComponentView('cu-decoder')}
          className="w-full cursor-pointer group z-10"
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <div className={cn(
            "w-full rounded-2xl border-2 flex overflow-hidden transition-all duration-500 relative",
            isActive ? "border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)] bg-zinc-950" : "border-zinc-800 bg-zinc-950"
          )}>
            {isActive && (
              <motion.div className="absolute inset-0 bg-amber-500/5 rounded-2xl pointer-events-none"
                animate={{ opacity: [0.5,1,0.5] }} transition={{ duration: 2, repeat: Infinity }} />
            )}

            {/* Left: Timing Sequencer */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-r border-zinc-800/80 gap-4 relative z-10">
              <span className={cn("text-[10px] font-black tracking-widest uppercase", isActive ? "text-orange-500" : "text-zinc-600")}>
                Timing Sequencer
              </span>
              <div className="relative w-24 h-24">
                <div className={cn("w-24 h-24 rounded-full border-2 flex items-center justify-center", isActive ? "border-orange-500/30" : "border-zinc-800")}>
                  <span className={cn("text-sm font-black text-center leading-tight", phaseColor[phase] || "text-zinc-600")}>
                    {phase}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-t-orange-500 border-r-orange-300 border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
                  />
                )}
              </div>
              <div className="flex gap-2">
                {['IDLE','FETCH','DECODE','EXECUTE','WRITEBACK'].map(p => (
                  <div key={p} className={cn("w-2 h-2 rounded-full transition-all", phase === p ? "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]" : "bg-zinc-800")} />
                ))}
              </div>
            </div>

            {/* Right: Instruction Decoder */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 relative z-10">
              <span className={cn("text-[10px] font-black tracking-widest uppercase", isDecoding ? "text-violet-400" : "text-zinc-600")}>
                Instruction Decoder
              </span>
              <div className="w-full flex flex-col gap-3">
                {['opcode[3:0]', 'operand[7:0]', 'ctrl_lines', 'micro-ops'].map((row, i) => (
                  <div key={row} className="flex items-center gap-3">
                    <span className="text-[9px] text-zinc-600 font-mono w-20 shrink-0">{row}</span>
                    <div className="flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      {isDecoding && (
                        <motion.div className="h-full rounded-full"
                          style={{ background: ['#8b5cf6','#06b6d4','#f59e0b','#10b981'][i] }}
                          initial={{ width: 0 }}
                          animate={{ width: ['0%', `${[90,65,100,75][i]}%`, '0%'] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Click → Decoder Matrix
              </span>
            </div>
          </div>
        </motion.div>

        {/* ROW 3 — Control signal outputs */}
        <div ref={sigRowRef} className="w-full grid grid-cols-8 gap-2 z-10">
          {CONTROL_LINES.map((sig, i) => {
            const on = sig.match(ctrlSigs, op);
            return (
              <div key={sig.id} ref={el => { sigRefs.current[i] = el; }} className="flex flex-col items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded-full border transition-all duration-200",
                  on ? "bg-amber-400 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)]" : "bg-zinc-900 border-zinc-700")} />
                <div className={cn(
                  "text-center text-[8px] font-black tracking-wide uppercase px-1 py-1 rounded border whitespace-pre-line leading-tight transition-all",
                  on ? "bg-amber-500/20 text-amber-400 border-amber-500/50" : "bg-zinc-900 border-zinc-800 text-zinc-600"
                )}>{sig.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
