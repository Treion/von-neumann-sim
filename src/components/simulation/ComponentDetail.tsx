import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Info, Zap } from 'lucide-react';

export function ComponentDetail({ componentId }: { componentId: string | null }) {
  const state = useSimulatorStore();
  const info = componentId ? state.getComponentInfo(componentId) : null;
  const selectComponent = state.selectComponent;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-bold text-zinc-100">Component Inspector</span>
        </div>
        {componentId && (
          <button
            onClick={() => selectComponent(null)}
            className="p-1.5 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-5">
        <AnimatePresence mode="wait">
          {info ? (
            <motion.div
              key={info.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Header */}
              <div className="rounded border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="text-lg font-bold text-zinc-100">{info.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{info.description}</p>
                {info.extendedDescription && info.extendedDescription.length > 0 && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-zinc-800">
                    {info.extendedDescription.map((paragraph, idx) => (
                      <p key={idx} className="text-[13px] text-zinc-400 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Current State */}
              <div className="rounded border border-blue-500/30 bg-blue-500/5 p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-blue-500 uppercase">Current State</span>
                </div>
                <div className="font-mono text-xl font-bold text-zinc-100 relative z-10">{info.currentValue}</div>
              </div>

              {/* Recent Activity */}
              <div className="rounded border border-amber-500/30 bg-amber-500/5 p-5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-500 uppercase">Recent Activity</span>
                </div>
                <div className="text-sm text-zinc-300 relative z-10 font-medium">{info.justHappened}</div>
              </div>

              {/* Details */}
              <div className="rounded border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase">Details</span>
                </div>
                <div className="space-y-2.5">
                  {info.details.map((detail, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-sm text-zinc-400 flex items-start gap-2.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{detail}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60"
            >
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-500">Select a component to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
