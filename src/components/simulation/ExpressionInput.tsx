import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '@/hooks/useSimulatorStore';
import { createProgram } from '@/lib/simulation/instructions';
import { Calculator, Play, AlertCircle, CheckCircle2, Code, Library, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Op = '+' | '-' | '×' | '÷';
const OPS: Op[] = ['+', '-', '×', '÷'];

function parseExpr(a: number, op: Op, b: number): { instructions: ReturnType<typeof createProgram>; dataValues: Record<number, number> } {
  // Memory layout: addr 20 = operand A, addr 21 = operand B, addr 22 = result
  const A_ADDR = 20;
  const B_ADDR = 21;
  const RESULT_ADDR = 22;

  const typeMap: Record<Op, 'ADD' | 'SUB' | 'MUL' | 'DIV'> = {
    '+': 'ADD',
    '-': 'SUB',
    '×': 'MUL',
    '÷': 'DIV',
  };

  const instructions = createProgram([
    { type: 'LOAD', operand: A_ADDR },
    { type: typeMap[op], operand: B_ADDR },
    { type: 'STORE', operand: RESULT_ADDR },
    { type: 'HALT', operand: null },
  ]);

  const dataValues: Record<number, number> = {
    [A_ADDR]: a,
    [B_ADDR]: b,
    [RESULT_ADDR]: 0,
  };

  return { instructions, dataValues };
}

export function ExpressionInput() {
  const loadCustomProgram = useSimulatorStore((s) => s.loadCustomProgram);
  const play = useSimulatorStore((s) => s.play);
  const phase = useSimulatorStore((s) => s.phase);
  const accumulator = useSimulatorStore((s) => s.accumulator);
  const ram = useSimulatorStore((s) => s.ram);

  const [a, setA] = useState<number | ''>('');
  const [b, setB] = useState<number | ''>('');
  const [op, setOp] = useState<Op>('+');
  const [error, setError] = useState<string | null>(null);


  const result = phase === 'COMPLETE' ? ram[22]?.value ?? accumulator : null;

  function handleLoad() {
    setError(null);
    if (a === '' || b === '') { setError('Enter both numbers.'); return; }
    const numA = Number(a), numB = Number(b);
    if (!Number.isInteger(numA) || !Number.isInteger(numB)) { setError('Integers only (0–99).'); return; }
    if (numA < 0 || numA > 99 || numB < 0 || numB > 99) { setError('Numbers must be 0–99.'); return; }
    if (op === '÷' && numB === 0) { setError('Cannot divide by zero.'); return; }
    const { instructions, dataValues } = parseExpr(numA, op, numB);
    const opSymbol: Record<Op, string> = { '+': 'Add', '-': 'Subtract', '×': 'Multiply', '÷': 'Divide' };
    loadCustomProgram(instructions, dataValues, `${opSymbol[op]} ${numA} ${op} ${numB}`);
  }

  function handleRun() {
    handleLoad();
    // Small delay so state is set before play is called
    setTimeout(() => play(), 50);
  }

  const typeMap: Record<Op, string> = { '+': 'ADD', '-': 'SUB', '×': 'MUL', '÷': 'DIV' };
  const opcodeMap: Record<string, number> = { LOAD: 1, ADD: 3, SUB: 4, MUL: 5, DIV: 6, STORE: 2, HALT: 0 };

  // Live preview of compiled instructions
  const hasInput = a !== '' && b !== '';
  const asmLines = hasInput ? [
    { asm: `LOAD 20`, desc: `Load ${a} into ACC`, machine: `${opcodeMap.LOAD}20` },
    { asm: `${typeMap[op]} 21`, desc: `${typeMap[op]} ${b} with ACC`, machine: `${opcodeMap[typeMap[op]]}21` },
    { asm: `STORE 22`, desc: `Store result at addr 22`, machine: `${opcodeMap.STORE}22` },
    { asm: `HALT`, desc: `Stop execution`, machine: `000` },
  ] : [];

  function handlePreset(type: 'countdown' | 'multiplier') {
    if (type === 'countdown') {
      setA(5); setOp('-'); setB(1);
      const instructions = createProgram([
        { type: 'LOAD', operand: 20 }, // counter
        { type: 'SUB', operand: 21 }, // decrement
        { type: 'STORE', operand: 20 },
        { type: 'JNZ', operand: 0 },  // loop if not zero
        { type: 'HALT', operand: null },
      ]);
      loadCustomProgram(instructions, { 20: 5, 21: 1 }, 'Countdown Loop');
    } else {
      setA(3); setOp('×'); setB(4);
      // Multiplier logic already exists in SAMPLE_PROGRAMS, but here we can inject a custom one
      handleLoad(); // default to calculator logic for now or add custom multi-step
    }
  }

  return (
    <div className="px-5 py-4">
      {/* Top Row: Presets & Info */}
      <div className="flex items-center gap-6 mb-4 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <Library className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Logic Presets:</span>
          <div className="flex items-center gap-1.5 ml-2">
            <button onClick={() => handlePreset('countdown')} className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all">Countdown Loop</button>
            <button onClick={() => handlePreset('multiplier')} className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all">Advanced Multiplier</button>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-[10px] font-medium text-zinc-600 italic">
          <span>Tip: Press Space to Play/Pause, Arrow Right to Step</span>
        </div>
      </div>

      {/* Calculator row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Calculator className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dynamic Compiler</span>
        </div>

        {/* Expression builder */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="number" min={0} max={99} value={a}
            onChange={(e) => { setA(e.target.value === '' ? '' : Number(e.target.value)); }}
            placeholder="0"
            className="w-16 px-2 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm text-center focus:outline-none focus:border-zinc-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
          />
          <div className="flex items-center gap-1 p-1 rounded border border-zinc-800 bg-zinc-900 shadow-inner">
            {OPS.map((o) => (
              <button key={o} onClick={() => { setOp(o); }}
                className={cn('w-8 h-7 rounded text-sm font-bold transition-all',
                  op === o ? 'bg-zinc-100 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                )}
              >{o}</button>
            ))}
          </div>
          <input
            type="number" min={0} max={99} value={b}
            onChange={(e) => { setB(e.target.value === '' ? '' : Number(e.target.value)); }}
            placeholder="0"
            className="w-16 px-2 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm text-center focus:outline-none focus:border-zinc-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
          />
          <span className="text-zinc-500 font-bold">=</span>
          <AnimatePresence mode="wait">
            {phase === 'COMPLETE' && result !== null ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-mono text-lg font-bold text-emerald-400">{result}</span>
              </motion.div>
            ) : (
              <motion.div key="placeholder" className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 w-20 h-9 flex items-center justify-center shadow-inner">
                <span className="font-mono text-zinc-600 text-sm">?</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="w-3.5 h-3.5" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleLoad}
            className="px-5 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 text-sm font-bold hover:bg-zinc-800 hover:text-zinc-100 transition-all shadow-lg">
            Load Code
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleRun}
            className="flex items-center gap-2 px-6 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-sm font-bold hover:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/5">
            <Play className="w-4 h-4" fill="currentColor" />Run Simulation
          </motion.button>
        </div>
      </div>

      {/* ─── Code Translation Panel ─────────────────────── */}
      <AnimatePresence>
        {hasInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded bg-zinc-900 border border-zinc-800">
                  <Code className="w-3 h-3 text-zinc-400" />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Hardware-Level Instruction Mapping</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                {/* Column: Assembly */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mb-2 px-1">Assembly</div>
                  <div className="space-y-1">
                    {asmLines.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="font-mono text-blue-300 bg-blue-500/5 border border-blue-500/10 rounded-md px-3 py-1.5 shadow-sm"
                      >{line.asm}</motion.div>
                    ))}
                  </div>
                </div>
                {/* Column: What it does */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Logic Trace</div>
                  <div className="space-y-1">
                    {asmLines.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                        className="text-zinc-400 bg-zinc-900/50 border border-zinc-800/50 rounded-md px-3 py-1.5"
                      >{line.desc}</motion.div>
                    ))}
                  </div>
                </div>
                {/* Column: Machine Code */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-violet-400/80 uppercase tracking-widest mb-2 px-1">Machine Code</div>
                  <div className="space-y-1">
                    {asmLines.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.2 }}
                        className="font-mono text-violet-300 bg-violet-500/5 border border-violet-500/10 rounded-md px-3 py-1.5 shadow-sm"
                      >{line.machine}</motion.div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500 font-medium bg-zinc-900/30 p-2 rounded border border-zinc-800/50">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>The Von Neumann architecture stores both these instructions and your data in the same RAM bank.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


