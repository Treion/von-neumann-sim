import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { SystemDiagram } from '@/components/simulation/SystemDiagram';
import { ControlPanel } from '@/components/simulation/ControlPanel';
import { ComponentDetail } from '@/components/simulation/ComponentDetail';
import { HistoryPanel } from '@/components/simulation/HistoryPanel';
import { ProgramPanel } from '@/components/simulation/ProgramPanel';
import { PhaseIndicator } from '@/components/simulation/PhaseIndicator';
import { ExpressionInput } from '@/components/simulation/ExpressionInput';
import { useEffect } from 'react';
import { ALUDiagram } from '@/components/simulation/ALUDiagram';
import { AdderDiagram } from '@/components/simulation/AdderDiagram';
import { CUDiagram } from '@/components/simulation/CUDiagram';
import { DecoderDiagram } from '@/components/simulation/DecoderDiagram';
import { CacheDiagram } from '@/components/simulation/CacheDiagram';
import { ClockDiagram } from '@/components/simulation/ClockDiagram';
import { RegistersDiagram } from '@/components/simulation/RegistersDiagram';
import { RAMDiagram } from '@/components/simulation/RAMDiagram';

export function SimulatorPage() {
  const phase = useSimulatorStore((s) => s.phase);
  const isRunning = useSimulatorStore((s) => s.isRunning);
  const selectedComponent = useSimulatorStore((s) => s.selectedComponent);
  const clockCycle = useSimulatorStore((s) => s.clockCycle);
  const isDetailedInspectionMode = useSimulatorStore((s) => s.isDetailedInspectionMode);
  const detailedComponentView = useSimulatorStore((s) => s.detailedComponentView);
  const toggleDetailedInspectionMode = useSimulatorStore((s) => s.toggleDetailedInspectionMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const store = useSimulatorStore.getState();
        if (store.isRunning) store.pause();
        else store.play();
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        useSimulatorStore.getState().stepForward();
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        useSimulatorStore.getState().resetSimulation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col font-sans selection:bg-zinc-800">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-100">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 9h6v6H9z" />
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100">Von Neumann Simulator</h1>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Hardware Architecture</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button 
            onClick={toggleDetailedInspectionMode}
            className={`px-3 py-1 rounded text-xs font-semibold tracking-wide border transition-colors ${
              isDetailedInspectionMode 
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Detailed Inspection: {isDetailedInspectionMode ? 'ON' : 'OFF'}
          </button>
          <PhaseIndicator />
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-zinc-800">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cycle</span>
            <span className="font-mono text-zinc-100 font-bold tabular-nums">{clockCycle}</span>
          </div>
          <div className={`px-3 py-1 rounded text-[11px] font-bold tracking-widest uppercase border ${
            isRunning 
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
              : phase === 'COMPLETE'
                ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}>
            {isRunning ? 'Running' : phase === 'COMPLETE' ? 'Complete' : 'Paused'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Program & History */}
        <aside className="w-80 shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden h-full">
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ProgramPanel />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-t border-zinc-800">
            <HistoryPanel />
          </div>
        </aside>

        {/* Center - System Diagram */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          <div className="border-b border-zinc-800 bg-zinc-950 p-4 shrink-0">
            <ControlPanel />
          </div>
          {/* Center content area: stable overflow-hidden for detailed views, scrollable for main diagram */}
          <div className="flex-1 overflow-hidden relative">
            {detailedComponentView === 'alu-adder' ? (
              <AdderDiagram />
            ) : detailedComponentView === 'alu' ? (
              <ALUDiagram />
            ) : detailedComponentView === 'cu-decoder' ? (
              <DecoderDiagram />
            ) : detailedComponentView === 'cu' ? (
              <CUDiagram />
            ) : detailedComponentView === 'cache' ? (
              <CacheDiagram />
            ) : detailedComponentView === 'clock' ? (
              <ClockDiagram />
            ) : detailedComponentView === 'registers' ? (
              <RegistersDiagram />
            ) : detailedComponentView === 'ram' ? (
              <RAMDiagram />
            ) : (
              <SystemDiagram />
            )}
          </div>
          <div className="border-t border-zinc-800 bg-zinc-950 shrink-0">
            <ExpressionInput />
          </div>
        </div>

        {/* Right Panel - Component Details */}
        <div className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 overflow-hidden">
          <ComponentDetail componentId={selectedComponent} />
        </div>
      </div>
    </div>
  );
}
