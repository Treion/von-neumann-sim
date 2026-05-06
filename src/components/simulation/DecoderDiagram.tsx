import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { INSTRUCTION_SET } from '@/lib/simulation/instructions';

export function DecoderDiagram() {
  const { cir, phase, signals, setDetailedComponentView } = useSimulatorStore();
  const isActive = phase === 'DECODE' || phase === 'EXECUTE';
  const opcode = cir?.opcode || 'NOP';
  const info = INSTRUCTION_SET[opcode as keyof typeof INSTRUCTION_SET];
  const binOp = info ? info.opcode.toString(2).padStart(4,'0') : '0000';
  const ctrlSigs = signals.filter(s => s.type === 'control').map(s => s.value as string);

  const microOps = [
    { name: 'MAR ← PC',        active: phase === 'FETCH' },
    { name: 'MBR ← RAM[MAR]',  active: phase === 'FETCH' },
    { name: 'CIR ← MBR',       active: phase === 'FETCH' },
    { name: 'PC ← PC + 1',     active: phase === 'FETCH' },
    { name: 'Decode opcode',    active: phase === 'DECODE' },
    { name: 'MAR ← operand',   active: phase === 'EXECUTE' && !!cir?.opcode },
    { name: 'ALU ← op',        active: phase === 'EXECUTE' && ['ADD','SUB','MUL','DIV','AND','OR','NOT','CMP'].includes(cir?.opcode || '') },
    { name: 'ACC ← result',    active: phase === 'EXECUTE' },
    { name: 'RAM[MAR] ← MBR',  active: ctrlSigs.includes('WRITE') },
  ];

  const colHeaders = ['b3','b2','b1','b0','~b3','~b2','~b1','~b0'];

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => setDetailedComponentView('cu')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to CU
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-violet-500">Instruction Decoder Matrix</span>
        <div className="ml-auto font-mono text-[10px] text-zinc-500">{opcode} → {binOp}b</div>
      </div>

      <div className="flex-1 grid place-items-center p-6 overflow-hidden">
        <div className="w-full max-w-3xl flex flex-col items-center gap-6">

          {/* Opcode input */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">CIR Opcode Field</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {binOp.split('').map((bit, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[8px] text-zinc-600 font-mono">b{3-i}</span>
                    <div className={cn(
                      "w-14 h-14 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-black transition-all",
                      bit === '1' && isActive ? "border-violet-500 bg-violet-950/60 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.5)]" : "border-zinc-800 bg-zinc-900 text-zinc-700"
                    )}>{bit}</div>
                  </div>
                ))}
              </div>
              <div className={cn("px-4 py-2 rounded-xl border-2 font-black text-xl tracking-wider transition-all",
                isActive ? "border-violet-400 bg-violet-950/50 text-violet-300" : "border-zinc-700 bg-zinc-900 text-zinc-600")}>
                = {opcode}
              </div>
            </div>
          </div>

          {/* PLA Matrix */}
          <div className="w-full border border-zinc-800 rounded-xl bg-zinc-900/50 p-5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 text-center">
              Programmable Logic Array — Decoder
            </div>

            {/* Column headers */}
            <div className="flex mb-2 ml-36">
              {colHeaders.map((h, i) => {
                const bitIdx = i < 4 ? i : i - 4;
                const isNot = i >= 4;
                const active = isActive && (isNot ? binOp[bitIdx] === '0' : binOp[bitIdx] === '1');
                return (
                  <div key={h} className="flex-1 flex flex-col items-center">
                    <span className={cn("text-[8px] font-mono font-bold", active ? "text-violet-400" : "text-zinc-600")}>{h}</span>
                    <div className={cn("w-px h-2 mt-0.5", active ? "bg-violet-500" : "bg-zinc-700")} />
                  </div>
                );
              })}
            </div>

            {/* Matrix rows */}
            {microOps.map((op) => (
              <div key={op.name} className="flex items-center mb-1.5">
                <div className={cn("w-36 text-right pr-3 text-[9px] font-mono font-bold shrink-0 transition-colors",
                  op.active ? "text-amber-400" : "text-zinc-600")}>
                  {op.name}
                </div>
                <div className="flex-1 relative flex items-center" style={{ height: 20 }}>
                  {/* Horizontal line */}
                  <div className={cn("absolute inset-y-0 w-full flex items-center")}>
                    <div className={cn("w-full h-px", op.active ? "bg-amber-500/50" : "bg-zinc-800")} />
                  </div>
                  {/* Fuse dots at intersections */}
                  {colHeaders.map((_, col) => {
                    const bitIdx = col < 4 ? col : col - 4;
                    const isNot = col >= 4;
                    const bitMatch = isNot ? binOp[bitIdx] === '0' : binOp[bitIdx] === '1';
                    const on = op.active && bitMatch;
                    return (
                      <div key={col} className="flex-1 flex items-center justify-center relative z-10">
                        <div className={cn("w-2.5 h-2.5 rounded-full border transition-all duration-200",
                          on ? "bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]" : "bg-zinc-900 border-zinc-700")} />
                      </div>
                    );
                  })}
                  {/* Active label */}
                  {op.active && (
                    <span className="absolute right-0 translate-x-full ml-2 pl-2 text-[8px] font-black text-amber-400 uppercase whitespace-nowrap">
                      ← ACTIVE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center max-w-xl text-[11px] text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-lg">
            Each row maps an opcode bit pattern to a micro-operation control line. Lit dots = active intersections that fire for the current instruction.
          </p>
        </div>
      </div>
    </div>
  );
}
