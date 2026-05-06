import React, { useMemo } from 'react';
import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════
   COLOR TOKENS
   ═══════════════════════════════════════════════════════════════════════ */
const PAL = {
  cu:    { border: '#f59e0b', bg: 'rgba(245,158,11,0.08)', text: '#fbbf24', glow: '0 0 24px rgba(245,158,11,0.18)' },
  alu:   { border: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  text: '#fb7185', glow: '0 0 24px rgba(244,63,94,0.18)' },
  reg:   { border: '#10b981', bg: 'rgba(16,185,129,0.06)', text: '#34d399', glow: '0 0 24px rgba(16,185,129,0.15)' },
  cache: { border: '#14b8a6', bg: 'rgba(20,184,166,0.06)', text: '#2dd4bf', glow: '0 0 24px rgba(20,184,166,0.15)' },
  clk:   { border: '#f97316', bg: 'rgba(249,115,22,0.06)', text: '#fb923c', glow: '0 0 24px rgba(249,115,22,0.15)' },
  ram:   { border: '#8b5cf6', bg: 'rgba(139,92,246,0.06)', text: '#a78bfa', glow: '0 0 24px rgba(139,92,246,0.15)' },
  idle:  { border: 'rgba(255,255,255,0.07)', bg: 'rgba(255,255,255,0.02)', text: '#52525b', glow: 'none' },
} as const;

type PalKey = keyof typeof PAL;

/* ═══════════════════════════════════════════════════════════════════════
   CHIP — universal component card that fills its flex parent
   ═══════════════════════════════════════════════════════════════════════ */
function Chip({
  label, value, sub, palette, active, className, onClick, viewId,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  palette: PalKey;
  active: boolean;
  className?: string;
  onClick: () => void;
  viewId?: string;
}) {
  const isDetailed = useSimulatorStore(s => s.isDetailedInspectionMode);
  const setDetailed = useSimulatorStore(s => s.setDetailedComponentView);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const c = active ? PAL[palette] : PAL.idle;

  return (
    <motion.button
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => { onClick(); if (isDetailed && viewId) setDetailed(viewId as any); }}
      className={cn(
        'group relative flex flex-col items-start justify-center rounded-xl px-4 py-3',
        'border transition-all duration-300 cursor-pointer text-left overflow-hidden min-h-0',
        'hover:brightness-125 active:scale-[0.98]',
        className,
      )}
      style={{
        borderColor: c.border,
        backgroundColor: c.bg,
        boxShadow: active ? `${c.glow}, inset 0 1px 0 rgba(255,255,255,0.04)` : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Label */}
      <div className="flex w-full items-center justify-between gap-2 mb-1.5 relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] leading-none"
          style={{ color: active ? c.text : '#52525b' }}>
          {label}
        </span>
        {active && (
          <motion.div className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: c.text, boxShadow: `0 0 8px ${c.text}` }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
        )}
      </div>

      {/* Value */}
      <div className="font-mono text-xl font-extrabold tabular-nums tracking-tight leading-none relative z-10"
        style={{ color: active ? '#f4f4f5' : '#a1a1aa' }}>
        {value}
      </div>

      {/* Sub */}
      {sub && (
        <div className="text-[10px] font-semibold uppercase tracking-wide mt-2 leading-none truncate w-full relative z-10"
          style={{ color: active ? `${c.text}bb` : '#3f3f46' }}>
          {sub}
        </div>
      )}

      {/* Shimmer */}
      {active && (
        <motion.div className="absolute inset-0 pointer-events-none z-0"
          style={{ background: `linear-gradient(105deg, transparent 40%, ${c.text}06 50%, transparent 60%)` }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
      )}

      {/* Hover Glass/Shiny Effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: `radial-gradient(circle 100px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.25), transparent 100%)`,
          }}
        />
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   BUS STRIP — clean minimal vertical bus indicator
   ═══════════════════════════════════════════════════════════════════════ */
function BusStrip({ buses }: { buses: { address: boolean; control: boolean; data: boolean } }) {
  const lines = [
    { label: 'ADDRESS', color: '#06b6d4', active: buses.address },
    { label: 'CONTROL', color: '#f59e0b', active: buses.control },
    { label: 'DATA', color: '#8b5cf6', active: buses.data },
  ];

  return (
    <div className="flex flex-col items-center h-full py-4 gap-0 shrink-0 w-24">
      {/* Top label */}
      <div className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-3 rotate-0">
        SYSTEM BUSES
      </div>

      {/* Bus lines */}
      <div className="flex-1 flex gap-2 min-h-0">
        {lines.map(({ label, color, active }) => (
          <div key={label} className="flex flex-col items-center gap-1 h-full">
            {/* Line */}
            <div className="flex-1 w-5 rounded-full relative overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: active ? `${color}20` : 'rgba(255,255,255,0.03)' }}>
              {/* Static glow */}
              {active && (
                <div className="absolute inset-0" style={{ backgroundColor: `${color}40`, boxShadow: `0 0 10px ${color}50` }} />
              )}
              {/* Traveling pulse */}
              {active && (
                <motion.div className="absolute left-0 right-0 h-12 rounded-full"
                  style={{ background: `linear-gradient(to bottom, transparent, ${color}, transparent)`, filter: `drop-shadow(0 0 6px ${color})` }}
                  animate={{ top: ['-48px', 'calc(100% + 48px)'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
              )}
              {/* Vertical Text */}
              <span className="relative z-10 text-[8px] font-black tracking-[0.3em] uppercase opacity-90 whitespace-nowrap select-none"
                style={{ 
                  color: active ? '#fff' : '#666',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)'
                }}>
                {label} BUS
              </span>
            </div>
            {/* Bottom dot */}
            <div className="w-[5px] h-[5px] rounded-full mt-1 transition-all duration-300"
              style={{ backgroundColor: active ? color : '#27272a', boxShadow: active ? `0 0 6px ${color}` : 'none' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PHASE BADGE
   ═══════════════════════════════════════════════════════════════════════ */
function PhaseBadge({ phase }: { phase: string }) {
  const p: Record<string, { bg: string; text: string; border: string }> = {
    IDLE:     { bg: 'rgba(113,113,122,0.1)', text: '#a1a1aa', border: 'rgba(113,113,122,0.2)' },
    FETCH:    { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    DECODE:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    EXECUTE:  { bg: 'rgba(244,63,94,0.12)',  text: '#fb7185', border: 'rgba(244,63,94,0.3)' },
    WRITEBACK:{ bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    COMPLETE: { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  };
  const s = p[phase] || p.IDLE;
  return (
    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {phase}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════ */
export function SystemDiagram() {
  const state = useSimulatorStore();
  const selectComponent = useSimulatorStore(s => s.selectComponent);
  const {
    pc, mar, mbr, cir, accumulator, statusRegister, generalRegisters,
    ram, rom, l1Cache, l2Cache, l3Cache, phase, microStep, clockCycle,
    activeBuses, signals, isRunning, history,
  } = state;

  const isActive = (id: string) => {
    if (signals.some(s => s.from === id || s.to === id)) return true;
    if (phase === 'FETCH' && ['pc', 'mar', 'mbr', 'cir', 'ram'].includes(id)) return true;
    if (phase === 'DECODE' && ['cir', 'cu', 'alu'].includes(id)) return true;
    if (phase === 'EXECUTE' && ['cu', 'alu', 'accumulator', 'mar', 'mbr', 'ram', 'registers'].includes(id)) return true;
    if (id === 'clock' && isRunning) return true;
    return false;
  };

  const executed = history.filter(h => h.phase === 'FETCH').length;
  const ipc = executed > 0 ? (executed / clockCycle).toFixed(2) : '0.00';

  const ramCells = useMemo(() => ram.map(cell => ({
    address: cell.address,
    value: cell.value,
    isInstruction: cell.isInstruction,
    isAccessed: cell.address === mar,
  })), [ram, mar]);

  return (
    <div className="absolute inset-0 flex flex-col bg-[#08080c] text-white overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-white/[0.06] bg-[#0c0c12] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full transition-colors',
              isRunning ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-zinc-600')} />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Datapath</span>
          </div>
          <div className="h-3.5 w-px bg-white/10" />
          <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Instr <span className="text-blue-400 font-mono ml-0.5">{executed}</span></span>
            <span>IPC <span className="text-emerald-400 font-mono ml-0.5">{ipc}</span></span>
            <span>Cycle <span className="text-amber-400 font-mono ml-0.5">{clockCycle}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {microStep && (
            <span className="text-[10px] font-medium text-zinc-500 max-w-[260px] truncate">
              {microStep.replace(/_/g, ' ').toLowerCase()}
            </span>
          )}
          <PhaseBadge phase={phase} />
        </div>
      </div>

      {/* ── MAIN CONTENT — fills ALL remaining vertical space ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* ════════ CPU COLUMN ════════ */}
        <div className="flex-[4] flex flex-col min-h-0 min-w-0 border-r border-white/[0.04]">
          {/* CPU header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
              <rect x="5" y="5" width="14" height="14" rx="2" />
              <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">CPU</span>
          </div>

          {/* CPU body — each row stretches to fill */}
          <div className="flex-1 flex flex-col gap-2 p-2.5 min-h-0">
            {/* Row 1: Control Unit */}
            <Chip label="Control Unit"
              value={phase === 'WRITEBACK' ? 'WB' : phase === 'COMPLETE' ? 'DONE' : phase}
              sub={microStep || 'Standby'}
              palette="cu" active={isActive('cu')}
              onClick={() => selectComponent('cu')} viewId="cu"
              className="flex-[2]" />

            {/* Row 2: ALU + Registers (side by side) */}
            <div className="flex gap-2 flex-[5] min-h-0">
              {/* Left sub-col: ALU + Accumulator stacked */}
              <div className="flex flex-col gap-2 flex-[3] min-h-0 min-w-0">
                <Chip label="ALU"
                  value={isActive('alu') ? 'ACTIVE' : 'IDLE'}
                  sub={cir?.opcode || '—'}
                  palette="alu" active={isActive('alu')}
                  onClick={() => selectComponent('alu')} viewId="alu"
                  className="flex-1" />
                <Chip label="Accumulator"
                  value={accumulator}
                  sub={`Z:${statusRegister.zero ? 1 : 0}  N:${statusRegister.negative ? 1 : 0}`}
                  palette="reg" active={isActive('accumulator')}
                  onClick={() => selectComponent('accumulator')} viewId="registers"
                  className="flex-1" />
              </div>

              {/* Right sub-col: PC, MAR, MBR, CIR */}
              <div className="flex flex-col gap-2 flex-[4] min-h-0 min-w-0">
                <div className="flex gap-2 flex-1 min-h-0">
                  <Chip label="PC" value={pc} palette="reg" active={isActive('pc')}
                    onClick={() => selectComponent('pc')} viewId="registers" className="flex-1" />
                  <Chip label="MAR" value={mar} palette="reg" active={isActive('mar')}
                    onClick={() => selectComponent('mar')} viewId="registers" className="flex-1" />
                </div>
                <div className="flex gap-2 flex-1 min-h-0">
                  <Chip label="MBR" value={mbr} palette="reg" active={isActive('mbr')}
                    onClick={() => selectComponent('mbr')} viewId="registers" className="flex-1" />
                  <Chip label="CIR" value={cir ? cir.opcode : '---'}
                    sub={cir ? `op:${cir.operand ?? '—'}` : ''}
                    palette="reg" active={isActive('cir')}
                    onClick={() => selectComponent('cir')} viewId="registers" className="flex-1" />
                </div>
              </div>
            </div>

            {/* Row 3: General Registers */}
            <div className="flex gap-2 flex-[2] min-h-0">
              {generalRegisters.slice(0, 4).map((v, i) => (
                <Chip key={i} label={`R${i}`} value={v} palette="reg"
                  active={isActive('registers')}
                  onClick={() => selectComponent('registers')} viewId="registers"
                  className="flex-1" />
              ))}
            </div>

            {/* Row 4: Clock */}
            <Chip label="System Clock"
              value={`${clockCycle} Hz`}
              sub={isRunning ? 'RUNNING' : 'PAUSED'}
              palette="clk" active={isActive('clock')}
              onClick={() => selectComponent('clock')} viewId="clock"
              className="flex-[1.5]" />
          </div>
        </div>

        {/* ════════ BUS STRIP (thin separator) ════════ */}
        <BusStrip buses={activeBuses} />

        {/* ════════ MEMORY COLUMN ════════ */}
        <div className="flex-[4] flex flex-col min-h-0 min-w-0 border-l border-white/[0.04]">
          {/* Memory header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-500">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Memory</span>
          </div>

          {/* Memory body */}
          <div className="flex-1 flex flex-col gap-2 p-2.5 min-h-0">
            {/* Cache row */}
            <div className="flex gap-2 flex-[2] min-h-0">
              {[
                { id: 'l1cache', lbl: 'L1 Cache', c: l1Cache },
                { id: 'l2cache', lbl: 'L2 Cache', c: l2Cache },
                { id: 'l3cache', lbl: 'L3 Cache', c: l3Cache },
              ].map(({ id, lbl, c }) => (
                <Chip key={id} label={lbl}
                  value={c.lines.filter((l: any) => l.valid).length}
                  sub={`/ ${c.size} lines`}
                  palette="cache" active={isActive(id)}
                  onClick={() => selectComponent(id)} viewId="cache"
                  className="flex-1" />
              ))}
            </div>

            {/* RAM — takes most space, scrolls internally */}
            <div className="flex-[8] flex flex-col min-h-0 rounded-xl border border-white/[0.05] bg-white/[0.01] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.04] shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">RAM</span>
                <span className="text-[9px] font-mono text-zinc-600">
                  {ram.filter(c => c.value !== 0).length}/{ram.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 min-h-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>
                <div className="grid grid-cols-4 gap-1.5 auto-rows-fr">
                  {ramCells.map(cell => (
                    <motion.button key={cell.address}
                      onClick={() => selectComponent('ram')}
                      className={cn(
                        'relative rounded-lg border p-1.5 flex flex-col justify-center items-center cursor-pointer',
                        'transition-all duration-200 min-h-[40px]',
                        cell.isInstruction
                          ? 'bg-violet-500/[0.06] border-violet-500/15'
                          : 'bg-white/[0.015] border-white/[0.04]',
                        cell.isAccessed && 'border-blue-400/60 bg-blue-500/12 ring-1 ring-blue-400/25 z-10'
                      )}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                      <div className="text-[8px] font-bold text-zinc-600 tabular-nums">{cell.address.toString().padStart(2, '0')}</div>
                      <div className={cn(
                        'font-mono text-[13px] font-bold tabular-nums leading-tight',
                        cell.isInstruction ? 'text-violet-300' : 'text-zinc-400',
                        cell.isAccessed && 'text-blue-300',
                      )}>
                        {cell.value.toString().padStart(3, '0')}
                      </div>
                      {cell.isAccessed && (
                        <motion.div className="absolute inset-0 rounded-lg pointer-events-none"
                          style={{ boxShadow: '0 0 12px rgba(59,130,246,0.25)' }}
                          animate={{ opacity: [0.5, 0.15, 0.5] }}
                          transition={{ duration: 1.2, repeat: Infinity }} />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* ROM row */}
            <div className="flex gap-1.5 flex-[1.5] min-h-0">
              {rom.slice(0, 8).map(cell => (
                <div key={cell.address}
                  className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.015] flex flex-col items-center justify-center opacity-40 min-h-0">
                  <div className="text-[7px] font-bold text-zinc-600 tabular-nums">{cell.address}</div>
                  <div className="font-mono text-[10px] text-zinc-500 tabular-nums">
                    {cell.value.toString(16).toUpperCase()}h
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
