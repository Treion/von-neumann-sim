import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ControlPanel() {
  const { isRunning, phase, speed, play, pause, stepForward, resetSimulation, setSpeed } = useSimulatorStore();

  return (
    <div className="flex items-center justify-between">
      {/* Playback Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={isRunning ? pause : play}
          className={cn(
            'flex items-center gap-2 px-5 py-2 rounded font-semibold text-sm transition-all border',
            isRunning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
          )}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Pause' : phase === 'COMPLETE' ? 'Restart' : 'Play'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={stepForward}
          disabled={phase === 'COMPLETE'}
          className="flex items-center gap-2 px-5 py-2 rounded font-semibold text-sm bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <SkipForward className="w-4 h-4" />
          Step
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => resetSimulation()}
          className="flex items-center gap-2 px-5 py-2 rounded font-semibold text-sm bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </motion.button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
        <Gauge className="w-4 h-4 text-zinc-500" />
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-300 w-8 text-right font-bold">
            {1000 / speed >= 1 ? `${Math.round((1000 / speed) * 10) / 10}x` : `${(1000 / speed).toFixed(1)}x`}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(50 * Math.log10(1000 / speed) + 50)}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              const multiplier = Math.pow(10, (val - 50) / 50);
              const newSpeed = 1000 / multiplier;
              setSpeed(Math.round(newSpeed));
            }}
            className="w-28 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center gap-1 p-1 rounded bg-zinc-900 border border-zinc-800">
        {(['IDLE', 'FETCH', 'DECODE', 'EXECUTE', 'WRITEBACK', 'COMPLETE'] as const).map((p) => (
          <div
            key={p}
            className={cn(
              'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border',
              phase === p
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                : 'text-zinc-500 border-transparent'
            )}
          >
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}
