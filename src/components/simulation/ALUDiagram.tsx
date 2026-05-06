import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRef, useLayoutEffect, useState } from 'react';

// Gets the center-bottom or center-top of an element relative to a container
function getAnchor(el: HTMLElement | null, container: HTMLElement | null, edge: 'bottom' | 'top' | 'left' | 'right') {
  if (!el || !container) return { x: 0, y: 0 };
  const eR = el.getBoundingClientRect();
  const cR = container.getBoundingClientRect();
  switch (edge) {
    case 'bottom': return { x: eR.left - cR.left + eR.width / 2, y: eR.bottom - cR.top };
    case 'top':    return { x: eR.left - cR.left + eR.width / 2, y: eR.top - cR.top };
    case 'left':   return { x: eR.left - cR.left, y: eR.top - cR.top + eR.height / 2 };
    case 'right':  return { x: eR.right - cR.left, y: eR.top - cR.top + eR.height / 2 };
  }
}

function AnimatedPath({ d, color, isActive, delay = 0 }: { d: string; color: string; isActive: boolean; delay?: number }) {
  return (
    <g>
      <path d={d} stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {isActive && (
        <>
          <path d={d} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
          <motion.circle r="5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})`, offsetPath: `path("${d}")` }}
            animate={{ offsetDistance: ['0%', '100%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay }}
          />
        </>
      )}
    </g>
  );
}

export function ALUDiagram() {
  const { accumulator, mbr, statusRegister, cir, phase, setDetailedComponentView } = useSimulatorStore();

  const aluOps = ['ADD','SUB','MUL','DIV','AND','OR','NOT','CMP'];
  const op = cir?.opcode && aluOps.includes(cir.opcode) ? cir.opcode : null;
  const isActive = phase === 'EXECUTE' && !!op;

  const flags = [
    { k: 'Z', label: 'Zero',  active: statusRegister.zero },
    { k: 'N', label: 'Neg',   active: statusRegister.negative },
    { k: 'C', label: 'Carry', active: statusRegister.carry },
    { k: 'V', label: 'Ovfl',  active: statusRegister.overflow },
  ];

  // Refs for measuring
  const containerRef = useRef<HTMLDivElement>(null);
  const accRef  = useRef<HTMLDivElement>(null);
  const mbrRef  = useRef<HTMLDivElement>(null);
  const opRef   = useRef<HTMLDivElement>(null);
  const aluRef  = useRef<HTMLDivElement>(null);
  const resRef  = useRef<HTMLDivElement>(null);
  const flagRef = useRef<HTMLDivElement>(null);

  const [paths, setPaths] = useState({ accToAlu: '', mbrToAlu: '', opToAlu: '', aluToRes: '', aluToFlag: '' });

  useLayoutEffect(() => {
    const measure = () => {
      const c = containerRef.current;
      const accBottom = getAnchor(accRef.current, c, 'bottom');
      const mbrBottom = getAnchor(mbrRef.current, c, 'bottom');
      const opBottom  = getAnchor(opRef.current,  c, 'bottom');
      const aluTop    = getAnchor(aluRef.current,  c, 'top');
      const aluBottom = getAnchor(aluRef.current,  c, 'bottom');
      const resTop    = getAnchor(resRef.current,  c, 'top');
      const flagTop   = getAnchor(flagRef.current, c, 'top');

      const midY = (accBottom.y + aluTop.y) / 2;

      setPaths({
        accToAlu:  `M ${accBottom.x} ${accBottom.y} L ${accBottom.x} ${midY} L ${aluTop.x - 60} ${midY} L ${aluTop.x - 60} ${aluTop.y}`,
        mbrToAlu:  `M ${mbrBottom.x} ${mbrBottom.y} L ${mbrBottom.x} ${midY} L ${aluTop.x + 60} ${midY} L ${aluTop.x + 60} ${aluTop.y}`,
        opToAlu:   `M ${opBottom.x} ${opBottom.y} L ${opBottom.x} ${aluTop.y}`,
        aluToRes:  `M ${aluBottom.x - 60} ${aluBottom.y} L ${aluBottom.x - 60} ${(aluBottom.y + resTop.y) / 2} L ${resTop.x} ${(aluBottom.y + resTop.y) / 2} L ${resTop.x} ${resTop.y}`,
        aluToFlag: `M ${aluBottom.x + 60} ${aluBottom.y} L ${aluBottom.x + 60} ${(aluBottom.y + flagTop.y) / 2} L ${flagTop.x} ${(aluBottom.y + flagTop.y) / 2} L ${flagTop.x} ${flagTop.y}`,
      });
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Architecture
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-rose-500">ALU Deep Dive</span>
        <span className="ml-auto text-[10px] text-zinc-500 italic">Click ALU Core → logic gate view</span>
      </div>

      {/* Diagram */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex flex-col items-center justify-between py-10 px-16">
        {/* SVG wire layer — sits beneath everything */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <AnimatedPath d={paths.accToAlu}  color="#10b981" isActive={isActive} />
          <AnimatedPath d={paths.mbrToAlu}  color="#8b5cf6" isActive={isActive} delay={0.3} />
          <AnimatedPath d={paths.opToAlu}   color="#f43f5e" isActive={isActive} delay={0.15} />
          <AnimatedPath d={paths.aluToRes}  color="#10b981" isActive={isActive} delay={0.6} />
          <AnimatedPath d={paths.aluToFlag} color="#f59e0b" isActive={isActive} delay={0.6} />
        </svg>

        {/* ROW 1 — Inputs */}
        <div className="w-full grid grid-cols-3 gap-8 z-10">
          {/* ACC */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">Accumulator (A)</span>
            <div ref={accRef} className={cn(
              "w-full max-w-[200px] rounded-xl border-2 p-4 text-center transition-all duration-300",
              isActive ? "border-emerald-500 bg-emerald-950/60 shadow-[0_0_25px_rgba(16,185,129,0.3)]" : "border-zinc-800 bg-zinc-900"
            )}>
              <div className="font-mono text-4xl font-black text-emerald-400">{accumulator}</div>
              <div className="font-mono text-[10px] text-emerald-800 mt-1">{accumulator.toString(2).padStart(8,'0')}b</div>
            </div>
          </div>

          {/* OP */}
          <div className="flex flex-col items-center justify-end gap-2 pb-2">
            <div ref={opRef} className={cn(
              "px-8 py-3 rounded-full border-2 font-black text-xl tracking-widest uppercase transition-all duration-300",
              isActive
                ? "border-rose-500 bg-rose-950/60 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.4)]"
                : "border-zinc-700 bg-zinc-900 text-zinc-600"
            )}>
              {op ?? 'IDLE'}
            </div>
          </div>

          {/* MBR */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-violet-500 uppercase">MBR (B)</span>
            <div ref={mbrRef} className={cn(
              "w-full max-w-[200px] rounded-xl border-2 p-4 text-center transition-all duration-300",
              isActive ? "border-violet-500 bg-violet-950/60 shadow-[0_0_25px_rgba(139,92,246,0.3)]" : "border-zinc-800 bg-zinc-900"
            )}>
              <div className="font-mono text-4xl font-black text-violet-400">{mbr}</div>
              <div className="font-mono text-[10px] text-violet-800 mt-1">{mbr.toString(2).padStart(8,'0')}b</div>
            </div>
          </div>
        </div>

        {/* ROW 2 — ALU Core */}
        <div className="z-10">
          <motion.div ref={aluRef} onClick={() => setDetailedComponentView('alu-adder')}
            className="cursor-pointer group"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <div className={cn(
              "w-[420px] rounded-2xl border-2 py-10 flex flex-col items-center gap-3 transition-all duration-500 relative overflow-hidden",
              isActive
                ? "border-rose-500 bg-rose-950/40 shadow-[0_0_60px_rgba(244,63,94,0.25)]"
                : "border-zinc-700 bg-zinc-900/80"
            )}>
              {isActive && (
                <motion.div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent"
                  animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              )}
              <div className={cn("text-xs font-black tracking-widest uppercase z-10", isActive ? "text-rose-400" : "text-zinc-600")}>
                Arithmetic Logic Unit
              </div>
              <div className={cn("font-mono font-black text-7xl z-10 transition-colors", isActive ? "text-rose-300" : "text-zinc-700")}>
                ALU
              </div>
              {isActive && (
                <div className="text-sm font-black text-rose-400 tracking-widest z-10 animate-pulse">
                  EXECUTING: {op}
                </div>
              )}
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                Click for Logic Gate View →
              </span>
            </div>
          </motion.div>
        </div>

        {/* ROW 3 — Outputs */}
        <div className="w-full grid grid-cols-2 gap-12 px-12 z-10">
          {/* Result */}
          <div className="flex flex-col items-center gap-3">
            <div ref={resRef} className={cn(
              "w-full rounded-xl border-2 p-5 text-center transition-all duration-300 relative overflow-hidden",
              isActive ? "border-emerald-500 bg-emerald-950/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "border-zinc-800 bg-zinc-900"
            )}>
              <div className="font-mono text-5xl font-black text-emerald-400 tabular-nums">{accumulator}</div>
              {isActive && <motion.div className="absolute inset-0 bg-emerald-500/10"
                animate={{ opacity: [0,1,0] }} transition={{ duration: 1, repeat: Infinity }} />}
            </div>
            <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Result → Accumulator</span>
          </div>

          {/* Flags */}
          <div className="flex flex-col items-center gap-3">
            <div ref={flagRef} className="flex gap-3">
              {flags.map(({ k, label, active }) => (
                <div key={k} className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-14 h-14 rounded-lg border-2 flex items-center justify-center font-mono text-xl font-black transition-all duration-300",
                    active && isActive
                      ? "border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                      : "border-zinc-800 bg-zinc-900 text-zinc-700"
                  )}>{k}</div>
                  <span className="text-[9px] text-zinc-600 font-bold uppercase">{label}</span>
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">Hardware Status Flags</span>
          </div>
        </div>
      </div>
    </div>
  );
}
