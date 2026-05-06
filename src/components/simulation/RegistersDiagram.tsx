import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function EditableValue({ value, isRunning, onChange, className }: { value: number, isRunning: boolean, onChange: (val: number) => void, className?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value.toString());

  if (isEditing) {
    return (
      <input 
        autoFocus
        className={cn("bg-transparent border-b-2 border-emerald-500 outline-none w-full text-center tabular-nums", className)}
        value={tempVal}
        onChange={e => setTempVal(e.target.value)}
        onBlur={() => { 
          setIsEditing(false); 
          const parsed = parseInt(tempVal);
          if (!isNaN(parsed)) onChange(parsed); 
          else setTempVal(value.toString());
        }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      />
    );
  }

  return (
    <div 
      onClick={() => !isRunning && setIsEditing(true)} 
      className={cn(className, !isRunning ? "cursor-text hover:opacity-80 transition-opacity" : "cursor-default")}
      title={!isRunning ? "Click to edit value" : "Simulation running"}
    >
      {value.toString().padStart(3, '0')}
    </div>
  );
}

export function RegistersDiagram() {
  const { generalRegisters, pc, mar, mbr, accumulator, setDetailedComponentView, phase, isRunning, overrideRegister } = useSimulatorStore();

  const allRegisters = [
    { name: 'PC',  label: 'Program Counter',      val: pc,          color: 'emerald', sub: 'Next Instruction Address' },
    { name: 'ACC', label: 'Accumulator',          val: accumulator, color: 'rose',    sub: 'ALU Working Storage' },
    { name: 'MAR', label: 'Memory Address Reg',   val: mar,          color: 'cyan',    sub: 'RAM Pointer' },
    { name: 'MBR', label: 'Memory Buffer Reg',    val: mbr,          color: 'violet',  sub: 'Data Interface' },
  ];

  const isActive = (name: string) => {
    if (phase === 'FETCH' && ['PC', 'MAR', 'MBR'].includes(name)) return true;
    if (phase === 'EXECUTE' && ['ACC', 'MAR', 'MBR'].includes(name)) return true;
    return false;
  };

  const colors: Record<string, string> = {
    emerald: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
    rose:    'border-rose-500/40 bg-rose-950/20 text-rose-400',
    cyan:    'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
    violet:  'border-violet-500/40 bg-violet-950/20 text-violet-400',
  };

  const activeColors: Record<string, string> = {
    emerald: 'border-emerald-500 bg-emerald-950/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    rose:    'border-rose-500 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    cyan:    'border-cyan-500 bg-cyan-950/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    violet:  'border-violet-500 bg-violet-950/60 shadow-[0_0_20px_rgba(139,92,246,0.3)]',
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
        <span className="text-xs font-bold tracking-widest uppercase text-emerald-500">Register File Deep Dive</span>
        <span className="ml-auto text-[10px] text-zinc-500 italic">High-speed internal storage</span>
      </div>

      <div className="flex-1 grid place-items-center p-6 overflow-hidden">
        <div className="w-full max-w-5xl flex flex-col gap-10">
          
          {/* Main Architectural Registers */}
          <div className="grid grid-cols-2 gap-6">
            {allRegisters.map((reg) => (
              <div key={reg.name} className={cn(
                "rounded-2xl border-2 p-6 transition-all duration-300 flex items-center justify-between",
                isActive(reg.name) ? activeColors[reg.color] : colors[reg.color].split(' text-')[0] + " bg-zinc-900/50"
              )}>
                <div className="flex flex-col">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest mb-1", isActive(reg.name) ? "text-zinc-100" : colors[reg.color].split(' ')[2])}>
                    {reg.label}
                  </span>
                  <span className={cn("font-mono text-4xl font-black", isActive(reg.name) ? "text-zinc-100" : "text-zinc-400")}>
                    {reg.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-2 font-medium">{reg.sub}</span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <EditableValue 
                    value={reg.val} 
                    isRunning={isRunning} 
                    onChange={(newVal) => overrideRegister(reg.name.toLowerCase(), newVal)}
                    className="font-mono text-5xl font-black tabular-nums tracking-tighter"
                  />
                  <div className="font-mono text-xs text-zinc-600 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    0x{reg.val.toString(16).toUpperCase().padStart(2, '0')} | {reg.val.toString(2).padStart(8, '0')}b
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* General Purpose Register Bank */}
          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest">General Purpose Register Bank (GPR)</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Accessible by R0-R3 identifiers</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {generalRegisters.map((val, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-emerald-500 z-10">
                    R{i}
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center group-hover:border-emerald-500/50 transition-colors shadow-xl">
                    <EditableValue 
                      value={val} 
                      isRunning={isRunning} 
                      onChange={(newVal) => overrideRegister(`r${i}`, newVal)}
                      className="font-mono text-4xl font-black text-zinc-100 tabular-nums inline-block"
                    />
                    <div className="mt-4 flex flex-col gap-1">
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(val / 255) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                        <span>0x00</span>
                        <span>0xFF</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-6 py-3 rounded-xl max-w-2xl mx-auto leading-relaxed">
            Registers are the fastest storage in the CPU hierarchy. The **PC** tracks instruction flow, while **MAR/MBR** bridge the gap to external RAM. **ACC** is the primary operand for ALU operations.
          </p>
        </div>
      </div>
    </div>
  );
}
