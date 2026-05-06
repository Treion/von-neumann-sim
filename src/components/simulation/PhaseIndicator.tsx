import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function PhaseIndicator() {
  const phase = useSimulatorStore((s) => s.phase);
  const microStep = useSimulatorStore((s) => s.microStep);
  const getPhaseDescription = useSimulatorStore((s) => s.getPhaseDescription);
  const getMicroStepDescription = useSimulatorStore((s) => s.getMicroStepDescription);

  const phaseConfig: Record<string, { color: string; bg: string; border: string }> = {
    IDLE: { color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' },
    FETCH: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    DECODE: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    EXECUTE: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    WRITEBACK: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    COMPLETE: { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  };

  const config = phaseConfig[phase] || phaseConfig.IDLE;

  return (
    <div className="flex items-center gap-3">
      <div className={cn('px-3 py-1.5 rounded-lg border text-sm font-bold uppercase tracking-wider', config.bg, config.border, config.color)}>
        {phase}
      </div>
      
      <motion.div
        key={`${phase}-${microStep}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs"
      >
        <div className="text-xs text-slate-300">{getPhaseDescription()}</div>
        {microStep && (
          <div className="text-[10px] text-slate-500 mt-0.5">{getMicroStepDescription()}</div>
        )}
      </motion.div>
    </div>
  );
}
