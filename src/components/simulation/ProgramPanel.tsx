import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SAMPLE_PROGRAMS } from '@/lib/simulation/instructions';

export function ProgramPanel() {
  const program = useSimulatorStore((s) => s.program);
  const pc = useSimulatorStore((s) => s.pc);
  const cir = useSimulatorStore((s) => s.cir);
  const programName = useSimulatorStore((s) => s.programName);
  const loadProgram = useSimulatorStore((s) => s.loadProgram);
  const phase = useSimulatorStore((s) => s.phase);

  return (
    <div className="shrink-0 h-full flex flex-col bg-zinc-950">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-violet-500" />
          <span className="text-sm font-bold text-zinc-100">Program</span>
        </div>
      </div>

      {/* Program Selector */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950">
        <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2 px-1 tracking-wider">Select Program</div>
        <div className="space-y-1">
          {SAMPLE_PROGRAMS.map((prog, index) => (
            <button
              key={prog.name}
              onClick={() => loadProgram(index)}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-xs transition-all font-medium border',
                programName === prog.name
                  ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border-transparent'
              )}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', programName === prog.name ? 'text-violet-500 translate-x-0.5' : 'text-zinc-600')} />
                {prog.name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Program Instructions */}
      <ScrollArea className="flex-1 bg-zinc-950/80 font-mono text-sm relative">
        <div className="py-4">
          {program.map((inst, index) => {
            const isCurrent = cir?.address === index;
            const isNext = pc === index && phase !== 'EXECUTE' && phase !== 'WRITEBACK';
            
            return (
              <motion.div
                key={index}
                className={cn(
                  'relative flex items-center group transition-colors duration-200 cursor-default hover:bg-zinc-900/50',
                  isCurrent ? 'bg-blue-900/20 shadow-[inset_2px_0_0_0_#3b82f6]' : '',
                  isNext && !isCurrent ? 'bg-zinc-900/40 shadow-[inset_2px_0_0_0_#71717a]' : ''
                )}
              >
                {/* Gutter with line numbers */}
                <div className={cn(
                  'w-12 shrink-0 py-1.5 text-right pr-4 select-none border-r border-zinc-800/50',
                  isCurrent ? 'text-blue-500 font-bold' : isNext ? 'text-zinc-300 font-bold' : 'text-zinc-600'
                )}>
                  {index}
                </div>

                {/* Instruction Editor Area */}
                <div className="flex-1 py-1.5 pl-4 pr-6 flex items-center gap-4">
                  <span className={cn(
                    'font-bold w-12',
                    isCurrent ? 'text-blue-400' : 'text-violet-400'
                  )}>
                    {inst.opcode}
                  </span>
                  
                  <span className={cn(
                    'w-8',
                    inst.operand !== null ? (isCurrent ? 'text-blue-300' : 'text-zinc-300') : ''
                  )}>
                    {inst.operand !== null ? inst.operand : ''}
                  </span>

                  <span className={cn(
                    'text-[10px] italic flex-1 min-w-0 pr-2',
                    isCurrent ? 'text-blue-500/70' : 'text-zinc-600 group-hover:text-zinc-500'
                  )}>
                    // {inst.description}
                  </span>

                  {/* Debugger Markers */}
                  {isCurrent && (
                    <motion.div
                      layoutId="execution-marker"
                      className="absolute left-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {isNext && !isCurrent && (
                     <div className="absolute left-1.5 w-1 h-1 rounded-full bg-zinc-500" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
