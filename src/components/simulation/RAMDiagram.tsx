import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getInstructionName } from '@/lib/simulation/instructions';
import { useState } from 'react';

function EditableValue({ value, isRunning, onChange, className }: { value: number, isRunning: boolean, onChange: (val: number) => void, className?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(value.toString());

  if (isEditing) {
    return (
      <input 
        autoFocus
        className={cn("bg-transparent border-b-2 border-violet-500 outline-none w-full text-center tabular-nums", className)}
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

export function RAMDiagram() {
  const { ram, mar, phase, isRunning, overrideMemory, setDetailedComponentView } = useSimulatorStore();

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 shrink-0">
        <button onClick={() => setDetailedComponentView('none')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Architecture
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <span className="text-xs font-bold tracking-widest uppercase text-violet-500">Main Memory (RAM) Deep Dive</span>
        <span className="ml-auto text-[10px] text-zinc-500 italic">64-Cell Addressable Memory Space</span>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
          {/* Legend and Stats */}
          <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Memory Map Legend</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500/20 border border-violet-500/50" />
                    <span className="text-xs text-zinc-400 font-medium">Instructions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" />
                    <span className="text-xs text-zinc-400 font-medium">Data Space</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500/40 border border-blue-400 ring-2 ring-blue-500/20" />
                    <span className="text-xs text-zinc-300 font-bold">Currently Addressed (MAR)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Address Bus Input</span>
              <div className="font-mono text-2xl font-black text-blue-400">MAR: {mar.toString().padStart(2, '0')}</div>
            </div>
          </div>

          {/* Memory Grid */}
          <div className="grid grid-cols-8 gap-3">
            {ram.map((cell) => {
              const opcode = Math.floor(cell.value / 100);
              const operand = cell.value % 100;
              const mnemonic = getInstructionName(opcode);
              const isAddressed = cell.address === mar;
              const isExecuting = isAddressed && phase === 'FETCH';

              return (
                <motion.div
                  key={cell.address}
                  className={cn(
                    "relative rounded-xl border p-4 transition-all duration-300 flex flex-col items-center gap-2 group",
                    isAddressed 
                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)] z-10 scale-105" 
                      : cell.isInstruction 
                        ? "bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40" 
                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  )}
                  whileHover={{ y: -4, scale: isAddressed ? 1.05 : 1.1, zIndex: 20 }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn("text-[9px] font-black font-mono", isAddressed ? "text-blue-400" : "text-zinc-600")}>
                      #{cell.address.toString().padStart(2, '0')}
                    </span>
                    {isAddressed && (
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-blue-500" 
                        animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.5, repeat: Infinity }} />
                    )}
                  </div>

                  <EditableValue 
                    value={cell.value}
                    isRunning={isRunning}
                    onChange={(newVal) => overrideMemory(cell.address, newVal)}
                    className={cn(
                      "font-mono text-2xl font-black tabular-nums transition-colors w-full",
                      isAddressed ? "text-zinc-100" : cell.isInstruction ? "text-violet-300" : "text-zinc-500"
                    )}
                  />

                  {cell.isInstruction && (
                    <div className={cn(
                      "text-[10px] font-black uppercase tracking-tighter transition-opacity",
                      isAddressed ? "text-blue-300" : "text-violet-500 opacity-60 group-hover:opacity-100"
                    )}>
                      {mnemonic} {operand}
                    </div>
                  )}

                  {!cell.isInstruction && (
                    <div className="text-[10px] font-mono text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      Data
                    </div>
                  )}

                  {/* Flow animation for addressed cell */}
                  {isAddressed && isExecuting && (
                    <motion.div className="absolute inset-0 rounded-xl bg-blue-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }} />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-4">
            <h4 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Memory Operation Details</h4>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase">Memory Latency</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">External RAM operates at lower clock speeds than the CPU. This simulation models single-cycle access for educational clarity, but real-world hardware requires wait states.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase">Instruction Encoding</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">Instructions are packed as 3-digit integers (e.g., 120 = LOAD addr 20). The first digit is the opcode, the next two are the operand address.</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase">Stored Program Concept</span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">Von Neumann architecture treats code and data identically in memory. The CPU differentiates them based on the current execution phase.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
