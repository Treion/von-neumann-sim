import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ─── Register data ─────────────────────────────────────── */
const REG_INFO: Record<string, {
  name: string; full: string; color: string; icon: string;
  desc: string; role: string; connects: string[];
}> = {
  pc:  { name: 'PC',  full: 'Program Counter',          color: 'emerald', icon: '📍', desc: 'Points to the next instruction in RAM', role: 'Holds address of the NEXT instruction to fetch.', connects: ['mar'] },
  mar: { name: 'MAR', full: 'Memory Address Register',  color: 'cyan',    icon: '📮', desc: 'Tells RAM which address to access', role: 'Loaded from PC (for fetch) or from the operand (for data). Drives the Address Bus.', connects: ['ram'] },
  mbr: { name: 'MBR', full: 'Memory Buffer Register',   color: 'violet',  icon: '📦', desc: 'Holds data travelling to/from RAM', role: 'On READ: receives data from RAM via Data Bus. On WRITE: sends ACC data to RAM.', connects: ['cir', 'alu', 'ram'] },
  cir: { name: 'CIR', full: 'Current Instruction Reg',  color: 'blue',    icon: '📋', desc: 'Holds the instruction being executed', role: 'Instruction arrives from MBR. CU splits it into opcode + operand.', connects: ['cu'] },
  cu:  { name: 'CU',  full: 'Control Unit',              color: 'amber',   icon: '🧭', desc: 'Decodes and orchestrates everything', role: 'Reads the CIR, generates control signals to ALU, buses, and registers.', connects: ['alu'] },
  alu: { name: 'ALU', full: 'Arithmetic Logic Unit',     color: 'rose',    icon: '⚡', desc: 'Performs math and logic operations', role: 'Takes inputs from ACC and MBR, computes result, writes back to ACC.', connects: ['acc'] },
  acc: { name: 'ACC', full: 'Accumulator',               color: 'orange',  icon: '🏦', desc: 'Stores the result of every calculation', role: 'Default destination for ALU output. Used as one operand for operations.', connects: [] },
  ram: { name: 'RAM', full: 'Main Memory',               color: 'zinc',    icon: '💾', desc: 'Stores instructions AND data', role: 'Addressed by MAR. Data flows through MBR via the Data Bus.', connects: [] },
};

/* Positions for the diagram layout (percentages of container) */
const POSITIONS: Record<string, { x: number; y: number }> = {
  pc:  { x: 12, y: 15 },
  mar: { x: 12, y: 50 },
  ram: { x: 12, y: 85 },
  mbr: { x: 42, y: 50 },
  cir: { x: 42, y: 15 },
  cu:  { x: 72, y: 15 },
  alu: { x: 72, y: 50 },
  acc: { x: 72, y: 85 },
};

/* Flow connections with labels showing what moves */
const FLOWS: { from: string; to: string; label: string; step: number; color: string }[] = [
  { from: 'pc',  to: 'mar', label: 'Address copied',    step: 1, color: 'emerald' },
  { from: 'mar', to: 'ram', label: 'Address Bus →',     step: 2, color: 'cyan' },
  { from: 'ram', to: 'mbr', label: '← Data Bus',        step: 3, color: 'violet' },
  { from: 'mbr', to: 'cir', label: 'Instruction loaded', step: 4, color: 'blue' },
  { from: 'cir', to: 'cu',  label: 'Decode opcode',     step: 5, color: 'amber' },
  { from: 'cu',  to: 'alu', label: 'Control signals',   step: 6, color: 'rose' },
  { from: 'alu', to: 'acc', label: 'Result stored',     step: 7, color: 'orange' },
];

const COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
  cyan:    { border: 'border-cyan-500',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]' },
  violet:  { border: 'border-violet-500',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]' },
  blue:    { border: 'border-blue-500',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
  amber:   { border: 'border-amber-500',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]' },
  rose:    { border: 'border-rose-500',    bg: 'bg-rose-500/10',    text: 'text-rose-400',    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' },
  orange:  { border: 'border-orange-500',  bg: 'bg-orange-500/10',  text: 'text-orange-400',  glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)]' },
  zinc:    { border: 'border-zinc-500',    bg: 'bg-zinc-800',       text: 'text-zinc-300',    glow: '' },
};

/* ─── SVG connection lines ───────────────────────────────── */
function ConnectionLines({ activeStep, selected }: { activeStep: number; selected: string | null }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
      {FLOWS.map((flow) => {
        const from = POSITIONS[flow.from];
        const to = POSITIONS[flow.to];
        const isActive = activeStep >= flow.step;
        const isHighlighted = selected === flow.from || selected === flow.to;

        return (
          <g key={`${flow.from}-${flow.to}`}>
            {/* Background line */}
            <line
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={isActive || isHighlighted ? 'currentColor' : '#27272a'}
              strokeWidth="0.4"
              strokeDasharray={isActive ? 'none' : '1 1'}
              className={cn(isActive || isHighlighted ? COLOR_CLASSES[flow.color]?.text : 'text-zinc-800')}
            />
            {/* Animated dot */}
            {isActive && (
              <circle r="0.8" className={cn('fill-current', COLOR_CLASSES[flow.color]?.text)}>
                <animateMotion
                  dur="1.5s"
                  repeatCount="indefinite"
                  path={`M${from.x},${from.y} L${to.x},${to.y}`}
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Individual register node ───────────────────────────── */
function RegisterNode({ id, selected, onSelect }: { id: string; selected: string | null; onSelect: (id: string | null) => void }) {
  const reg = REG_INFO[id];
  const pos = POSITIONS[id];
  const cc = COLOR_CLASSES[reg.color];
  const isSelected = selected === id;

  return (
    <motion.div
      onClick={() => onSelect(isSelected ? null : id)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'absolute z-10 w-[22%] cursor-pointer select-none transition-all duration-200',
        'rounded-xl border p-3 text-center',
        isSelected ? `${cc.border} ${cc.bg} ${cc.glow}` : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
      )}
      style={{
        left: `${pos.x - 11}%`,
        top: `${pos.y - 8}%`,
      }}
    >
      <div className="text-xl leading-none mb-1">{reg.icon}</div>
      <div className={cn('text-sm font-bold', isSelected ? cc.text : 'text-zinc-100')}>{reg.name}</div>
      <div className="text-[9px] text-zinc-500 font-medium leading-tight mt-0.5">{reg.desc}</div>
    </motion.div>
  );
}

/* ─── Info panel that appears on click ────────────────────── */
function InfoPanel({ id }: { id: string }) {
  const reg = REG_INFO[id];
  const cc = COLOR_CLASSES[reg.color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className={cn('rounded-xl border p-5 mt-6', cc.border, cc.bg)}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{reg.icon}</span>
        <div>
          <h4 className={cn('text-lg font-bold', cc.text)}>{reg.name} — {reg.full}</h4>
          <p className="text-xs text-zinc-400">{reg.desc}</p>
        </div>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{reg.role}</p>
      {reg.connects.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-zinc-500 uppercase">Connects to:</span>
          {reg.connects.map((c) => (
            <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              {REG_INFO[c]?.name ?? c}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Step control bar ────────────────────────────────────── */
function StepBar({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2 justify-center mt-6 flex-wrap">
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">Animate Flow:</span>
      {FLOWS.map((f) => {
        const cc = COLOR_CLASSES[f.color];
        return (
          <motion.button
            key={f.step}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setStep(step >= f.step ? f.step - 1 : f.step)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all',
              step >= f.step
                ? `${cc.border} ${cc.bg} ${cc.text}`
                : 'border-zinc-800 bg-zinc-900 text-zinc-600 hover:text-zinc-400'
            )}
          >
            <span className={cn('w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold',
              step >= f.step ? 'bg-current text-zinc-950' : 'bg-zinc-800 text-zinc-600'
            )}>{f.step}</span>
            {f.label}
          </motion.button>
        );
      })}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setStep(step >= 7 ? 0 : 7)}
        className="px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-400 text-[11px] font-bold hover:bg-zinc-800 transition-all"
      >
        {step >= 7 ? 'Reset' : 'Show All'}
      </motion.button>
    </div>
  );
}

/* ─── MAIN EXPORT ─────────────────────────────────────────── */
export function RegisterFlowDiagram() {
  const [selected, setSelected] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const ids = Object.keys(REG_INFO);

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden mb-10">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* CPU label */}
      <div className="absolute top-3 right-4 z-20 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-600 uppercase tracking-wider border border-zinc-800 bg-zinc-900">
        Inside the CPU + Memory
      </div>

      {/* Diagram area */}
      <div className="relative w-full" style={{ paddingBottom: '60%' }}>
        <ConnectionLines activeStep={activeStep} selected={selected} />
        {ids.map((id) => (
          <RegisterNode key={id} id={id} selected={selected} onSelect={setSelected} />
        ))}
      </div>

      {/* Step controls */}
      <div className="relative z-10 px-6 pb-6">
        <StepBar step={activeStep} setStep={setActiveStep} />
      </div>

      {/* Detail info on click */}
      <AnimatePresence mode="wait">
        {selected && (
          <div className="relative z-10 px-6 pb-6">
            <InfoPanel id={selected} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
