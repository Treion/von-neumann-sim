import type { 
  SimulationState, 
  Phase, 
  MicroStep, 
  Instruction, 
  MemoryCell, 
  Signal,
  HistoryEntry,
  CacheLevel,
} from './types';
import { INSTRUCTION_SET, createProgram, SAMPLE_PROGRAMS } from './instructions';

const RAM_SIZE = 64;
const ROM_SIZE = 16;

function createEmptyCache(name: string, size: number): CacheLevel {
  return {
    name,
    size,
    lines: Array.from({ length: size }, () => ({ tag: null, data: 0, valid: false, lastAccess: 0 })),
    hits: 0,
    misses: 0,
  };
}

function createInitialRAM(program: Instruction[]): MemoryCell[] {
  const ram: MemoryCell[] = Array.from({ length: RAM_SIZE }, (_, i) => ({
    address: i,
    value: 0,
    isInstruction: false,
  }));
  
  // Place program in RAM starting at address 0
  program.forEach((inst, i) => {
    ram[i] = {
      address: i,
      value: INSTRUCTION_SET[inst.opcode].opcode * 100 + (inst.operand || 0),
      isInstruction: true,
      instruction: inst,
    };
  });
  
  // Set up data values for sample programs
  // Program 1: Basic Math - values at 20, 21
  ram[20] = { address: 20, value: 20, isInstruction: false };
  ram[21] = { address: 21, value: 15, isInstruction: false };
  ram[22] = { address: 22, value: 0, isInstruction: false };
  
  return ram;
}

function createROM(): MemoryCell[] {
  return Array.from({ length: ROM_SIZE }, (_, i) => ({
    address: i,
    value: [0xF0, 0x0F, 0xAA, 0x55, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0xFF, 0x00, 0xC3, 0x3C][i] || 0,
    isInstruction: false,
  }));
}

export function createInitialState(programIndex: number = 0): SimulationState {
  const program = createProgram(SAMPLE_PROGRAMS[programIndex].instructions);
  const ram = createInitialRAM(program);
  
  return {
    pc: 0,
    mar: 0,
    mbr: 0,
    cir: null,
    accumulator: 0,
    statusRegister: { zero: false, negative: false, overflow: false, carry: false },
    generalRegisters: [0, 0, 0, 0],
    ram,
    rom: createROM(),
    l1Cache: createEmptyCache('L1', 4),
    l2Cache: createEmptyCache('L2', 8),
    l3Cache: createEmptyCache('L3', 16),
    virtualMemory: new Map(),
    pageTable: new Map(),
    phase: 'IDLE',
    microStep: null,
    clockCycle: 0,
    isRunning: false,
    isPaused: true,
    speed: 1000,
    currentInstruction: null,
    signals: [],
    program,
    programName: SAMPLE_PROGRAMS[programIndex].name,
    history: [],
    selectedComponent: null,
    hoveredComponent: null,
    isDetailedInspectionMode: typeof window !== 'undefined' ? localStorage.getItem('detailedInspectionMode') === 'true' : false,
    detailedComponentView: 'none',
    activeBuses: { address: false, data: false, control: false },
  };
}

function checkCache(cache: CacheLevel, address: number, cycle: number): { hit: boolean; value: number; updatedCache: CacheLevel } {
  const lineIndex = address % cache.size;
  const line = cache.lines[lineIndex];
  
  if (line.valid && line.tag === address) {
    // Cache hit
    const updated = { ...cache };
    updated.lines = [...cache.lines];
    updated.lines[lineIndex] = { ...line, lastAccess: cycle };
    updated.hits = cache.hits + 1;
    return { hit: true, value: line.data, updatedCache: updated };
  }
  
  // Cache miss
  const updated = { ...cache };
  updated.lines = [...cache.lines];
  updated.misses = cache.misses + 1;
  return { hit: false, value: 0, updatedCache: updated };
}

function updateCache(cache: CacheLevel, address: number, value: number, cycle: number): CacheLevel {
  const lineIndex = address % cache.size;
  const updated = { ...cache };
  updated.lines = [...cache.lines];
  updated.lines[lineIndex] = { tag: address, data: value, valid: true, lastAccess: cycle };
  return updated;
}

export function readMemory(state: SimulationState, address: number): { value: number; state: SimulationState; fromCache: string | null } {
  const currentState = { ...state };
  
  // Check L1
  const l1Result = checkCache(currentState.l1Cache, address, currentState.clockCycle);
  if (l1Result.hit) {
    currentState.l1Cache = l1Result.updatedCache;
    return { value: l1Result.value, state: currentState, fromCache: 'L1' };
  }
  currentState.l1Cache = l1Result.updatedCache;
  
  // Check L2
  const l2Result = checkCache(currentState.l2Cache, address, currentState.clockCycle);
  if (l2Result.hit) {
    currentState.l2Cache = l2Result.updatedCache;
    // Promote to L1
    currentState.l1Cache = updateCache(currentState.l1Cache, address, l2Result.value, currentState.clockCycle);
    return { value: l2Result.value, state: currentState, fromCache: 'L2' };
  }
  currentState.l2Cache = l2Result.updatedCache;
  
  // Check L3
  const l3Result = checkCache(currentState.l3Cache, address, currentState.clockCycle);
  if (l3Result.hit) {
    currentState.l3Cache = l3Result.updatedCache;
    // Promote to L2 and L1
    currentState.l2Cache = updateCache(currentState.l2Cache, address, l3Result.value, currentState.clockCycle);
    currentState.l1Cache = updateCache(currentState.l1Cache, address, l3Result.value, currentState.clockCycle);
    return { value: l3Result.value, state: currentState, fromCache: 'L3' };
  }
  currentState.l3Cache = l3Result.updatedCache;
  
  // Read from RAM
  const ramValue = currentState.ram[address]?.value || 0;
  
  // Fill all caches
  currentState.l3Cache = updateCache(currentState.l3Cache, address, ramValue, currentState.clockCycle);
  currentState.l2Cache = updateCache(currentState.l2Cache, address, ramValue, currentState.clockCycle);
  currentState.l1Cache = updateCache(currentState.l1Cache, address, ramValue, currentState.clockCycle);
  
  return { value: ramValue, state: currentState, fromCache: null };
}

export function writeMemory(state: SimulationState, address: number, value: number): SimulationState {
  const currentState = { ...state };
  
  // Update RAM
  const newRam = [...currentState.ram];
  newRam[address] = { ...newRam[address], value };
  currentState.ram = newRam;
  
  // Update all caches
  currentState.l1Cache = updateCache(currentState.l1Cache, address, value, currentState.clockCycle);
  currentState.l2Cache = updateCache(currentState.l2Cache, address, value, currentState.clockCycle);
  currentState.l3Cache = updateCache(currentState.l3Cache, address, value, currentState.clockCycle);
  
  return currentState;
}

function createSignal(from: string, to: string, type: 'address' | 'data' | 'control', value: string | number, phase: Phase, microStep: MicroStep): Signal {
  return {
    id: `${from}-${to}-${Date.now()}`,
    from,
    to,
    type,
    value,
    active: true,
    phase,
    microStep,
  };
}

function addHistory(state: SimulationState, description: string): HistoryEntry {
  return {
    cycle: state.clockCycle,
    phase: state.phase,
    microStep: state.microStep,
    pc: state.pc,
    mar: state.mar,
    mbr: state.mbr,
    accumulator: state.accumulator,
    instruction: state.cir ? `${state.cir.opcode} ${state.cir.operand ?? ''}` : 'None',
    description,
  };
}

export function step(state: SimulationState): SimulationState {
  if (state.phase === 'COMPLETE') return state;
  
  let newState = { ...state };
  newState.clockCycle = state.clockCycle + 1;
  newState.signals = [];
  newState.activeBuses = { address: false, data: false, control: false };
  
  switch (state.phase) {
    case 'IDLE':
    case 'WRITEBACK': {
      // Start FETCH phase
      newState.phase = 'FETCH';
      newState.microStep = 'FETCH_PC_TO_MAR';
      newState.mar = newState.pc;
      newState.signals = [
        createSignal('PC', 'MAR', 'address', newState.pc, 'FETCH', 'FETCH_PC_TO_MAR'),
        createSignal('CU', 'PC', 'control', 'READ', 'FETCH', 'FETCH_PC_TO_MAR'),
      ];
      newState.activeBuses = { address: true, data: false, control: true };
      newState.history = [...newState.history, addHistory(newState, `PC (${newState.pc}) -> MAR`)].slice(-50);
      break;
    }
      
    case 'FETCH': {
      switch (state.microStep) {
        case 'FETCH_PC_TO_MAR': {
          newState.microStep = 'FETCH_READ_MEMORY';
          newState.signals = [
            createSignal('MAR', 'RAM', 'address', newState.mar, 'FETCH', 'FETCH_READ_MEMORY'),
            createSignal('CU', 'RAM', 'control', 'READ', 'FETCH', 'FETCH_READ_MEMORY'),
            createSignal('RAM', 'MBR', 'data', newState.ram[newState.mar]?.value || 0, 'FETCH', 'FETCH_READ_MEMORY'),
          ];
          newState.activeBuses = { address: true, data: true, control: true };
          
          // Check cache
          const memResult = readMemory(newState, newState.mar);
          newState = memResult.state;
          newState.mbr = memResult.value;
          
          newState.history = [...newState.history, addHistory(newState, 
            `Read RAM[${newState.mar}] = ${newState.mbr}${memResult.fromCache ? ` (from ${memResult.fromCache})` : ''}`)].slice(-50);
          break;
        }
          
        case 'FETCH_READ_MEMORY': {
          newState.microStep = 'FETCH_MBR_TO_CIR';
          const instructionValue = newState.mbr;
          const opcode = Math.floor(instructionValue / 100);
          const operand = instructionValue % 100;
          const entry = Object.entries(INSTRUCTION_SET).find(([, info]) => info.opcode === opcode);
          const instName = entry ? entry[0] as keyof typeof INSTRUCTION_SET : 'HALT';
          
          newState.cir = {
            opcode: instName,
            operand: operand,
            address: newState.pc,
            description: INSTRUCTION_SET[instName]?.description || 'Unknown',
          };
          newState.currentInstruction = newState.cir;
          
          newState.signals = [
            createSignal('MBR', 'CIR', 'data', instructionValue, 'FETCH', 'FETCH_MBR_TO_CIR'),
            createSignal('CU', 'CIR', 'control', 'LOAD', 'FETCH', 'FETCH_MBR_TO_CIR'),
          ];
          newState.activeBuses = { address: false, data: true, control: true };
          newState.history = [...newState.history, addHistory(newState, `MBR (${instructionValue}) -> CIR: ${instName} ${operand}`)].slice(-50);
          break;
        }
          
        case 'FETCH_MBR_TO_CIR': {
          newState.microStep = 'FETCH_INCREMENT_PC';
          newState.pc = newState.pc + 1;
          newState.signals = [
            createSignal('CU', 'PC', 'control', 'INCREMENT', 'FETCH', 'FETCH_INCREMENT_PC'),
          ];
          newState.activeBuses = { address: false, data: false, control: true };
          newState.history = [...newState.history, addHistory(newState, `PC incremented to ${newState.pc}`)].slice(-50);
          break;
        }
          
        case 'FETCH_INCREMENT_PC': {
          newState.phase = 'DECODE';
          newState.microStep = 'DECODE_INSTRUCTION';
          newState.signals = [
            createSignal('CIR', 'CU', 'data', `${newState.cir?.opcode} ${newState.cir?.operand ?? ''}`, 'DECODE', 'DECODE_INSTRUCTION'),
            createSignal('CU', 'ALU', 'control', 'PREPARE', 'DECODE', 'DECODE_INSTRUCTION'),
          ];
          newState.activeBuses = { address: false, data: true, control: true };
          newState.history = [...newState.history, addHistory(newState, `Decode: ${newState.cir?.opcode} operand=${newState.cir?.operand}`)].slice(-50);
          break;
        }
      }
      break;
    }
      
    case 'DECODE': {
      newState.phase = 'EXECUTE';
      const opcode = newState.cir?.opcode;
      const operand = newState.cir?.operand;
      
      if (opcode === 'HALT') {
        newState.phase = 'COMPLETE';
        newState.microStep = null;
        newState.signals = [createSignal('CU', 'System', 'control', 'HALT', 'COMPLETE', 'EXECUTE_ALU_OPERATION')];
        newState.activeBuses = { address: false, data: false, control: true };
        newState.history = [...newState.history, addHistory(newState, 'Program HALT')].slice(-50);
        newState.isRunning = false;
        newState.isPaused = true;
      } else if (opcode === 'NOT') {
        newState.microStep = 'EXECUTE_ALU_OPERATION';
        newState.accumulator = ~newState.accumulator & 0xFF;
        newState.signals = [
          createSignal('CU', 'ALU', 'control', 'NOT', 'EXECUTE', 'EXECUTE_ALU_OPERATION'),
          createSignal('ALU', 'ACC', 'data', newState.accumulator, 'EXECUTE', 'EXECUTE_ALU_OPERATION'),
        ];
        newState.activeBuses = { address: false, data: true, control: true };
        newState.history = [...newState.history, addHistory(newState, `ALU: NOT = ${newState.accumulator}`)].slice(-50);
      } else if (['LOAD', 'ADD', 'SUB', 'MUL', 'DIV', 'AND', 'OR', 'CMP'].includes(opcode || '')) {
        newState.microStep = 'EXECUTE_LOAD_MAR';
        newState.mar = operand || 0;
        newState.signals = [
          createSignal('CIR', 'MAR', 'address', operand || 0, 'EXECUTE', 'EXECUTE_LOAD_MAR'),
          createSignal('CU', 'MAR', 'control', 'LOAD', 'EXECUTE', 'EXECUTE_LOAD_MAR'),
        ];
        newState.activeBuses = { address: true, data: false, control: true };
        newState.history = [...newState.history, addHistory(newState, `CIR operand (${operand}) -> MAR`)].slice(-50);
      } else if (opcode === 'STORE') {
        newState.microStep = 'EXECUTE_STORE_MAR';
        newState.mar = operand || 0;
        newState.signals = [
          createSignal('CIR', 'MAR', 'address', operand || 0, 'EXECUTE', 'EXECUTE_STORE_MAR'),
          createSignal('CU', 'MAR', 'control', 'LOAD', 'EXECUTE', 'EXECUTE_STORE_MAR'),
        ];
        newState.activeBuses = { address: true, data: false, control: true };
        newState.history = [...newState.history, addHistory(newState, `STORE: operand (${operand}) -> MAR`)].slice(-50);
      } else if (['JMP', 'JZ', 'JNZ'].includes(opcode || '')) {
        newState.microStep = 'EXECUTE_JUMP';
        let shouldJump = false;
        if (opcode === 'JMP') shouldJump = true;
        else if (opcode === 'JZ') shouldJump = newState.accumulator === 0;
        else if (opcode === 'JNZ') shouldJump = newState.accumulator !== 0;
        
        if (shouldJump) {
          newState.pc = operand || 0;
          newState.signals = [
            createSignal('CIR', 'PC', 'address', operand || 0, 'EXECUTE', 'EXECUTE_JUMP'),
            createSignal('CU', 'PC', 'control', 'JUMP', 'EXECUTE', 'EXECUTE_JUMP'),
          ];
          newState.history = [...newState.history, addHistory(newState, `JUMP to ${operand}`)].slice(-50);
        } else {
          newState.signals = [
            createSignal('CU', 'PC', 'control', 'NO_JUMP', 'EXECUTE', 'EXECUTE_JUMP'),
          ];
          newState.history = [...newState.history, addHistory(newState, `NO JUMP (condition false)`)].slice(-50);
        }
        newState.activeBuses = { address: true, data: false, control: true };
      }
      break;
    }
      
    case 'EXECUTE': {
      switch (state.microStep) {
        case 'EXECUTE_LOAD_MAR': {
          newState.microStep = 'EXECUTE_READ_MEMORY';
          const memRead = readMemory(newState, newState.mar);
          newState = memRead.state;
          newState.mbr = memRead.value;
          newState.signals = [
            createSignal('MAR', 'RAM', 'address', newState.mar, 'EXECUTE', 'EXECUTE_READ_MEMORY'),
            createSignal('CU', 'RAM', 'control', 'READ', 'EXECUTE', 'EXECUTE_READ_MEMORY'),
            createSignal('RAM', 'MBR', 'data', newState.mbr, 'EXECUTE', 'EXECUTE_READ_MEMORY'),
          ];
          newState.activeBuses = { address: true, data: true, control: true };
          newState.history = [...newState.history, addHistory(newState, 
            `Read RAM[${newState.mar}] = ${newState.mbr}${memRead.fromCache ? ` (from ${memRead.fromCache})` : ''}`)].slice(-50);
          break;
        }
          
        case 'EXECUTE_READ_MEMORY': {
          newState.microStep = 'EXECUTE_ALU_OPERATION';
          const opcode2 = newState.cir?.opcode;
          const val = newState.mbr;
          let aluResult = newState.accumulator;
          let aluOp = '';
          
          switch (opcode2) {
            case 'LOAD': aluResult = val; aluOp = 'LOAD'; break;
            case 'ADD': aluResult = newState.accumulator + val; aluOp = 'ADD'; break;
            case 'SUB': aluResult = newState.accumulator - val; aluOp = 'SUB'; break;
            case 'MUL': aluResult = newState.accumulator * val; aluOp = 'MUL'; break;
            case 'DIV': aluResult = val !== 0 ? Math.floor(newState.accumulator / val) : 0; aluOp = 'DIV'; break;
            case 'AND': aluResult = newState.accumulator & val; aluOp = 'AND'; break;
            case 'OR': aluResult = newState.accumulator | val; aluOp = 'OR'; break;
            case 'CMP': 
              aluResult = newState.accumulator - val; 
              aluOp = 'CMP';
              newState.statusRegister = {
                zero: aluResult === 0,
                negative: aluResult < 0,
                overflow: false,
                carry: false,
              };
              break;
          }
          
          // Clamp to byte
          newState.accumulator = ((aluResult % 256) + 256) % 256;
          
          newState.signals = [
            createSignal('MBR', 'ALU', 'data', val, 'EXECUTE', 'EXECUTE_ALU_OPERATION'),
            createSignal('ACC', 'ALU', 'data', aluResult, 'EXECUTE', 'EXECUTE_ALU_OPERATION'),
            createSignal('CU', 'ALU', 'control', aluOp, 'EXECUTE', 'EXECUTE_ALU_OPERATION'),
            createSignal('ALU', 'ACC', 'data', newState.accumulator, 'EXECUTE', 'EXECUTE_ALU_OPERATION'),
          ];
          newState.activeBuses = { address: false, data: true, control: true };
          newState.history = [...newState.history, addHistory(newState, `ALU: ${aluOp} = ${newState.accumulator}`)].slice(-50);
          break;
        }
          
        case 'EXECUTE_ALU_OPERATION': {
          newState.phase = 'WRITEBACK';
          newState.microStep = 'WRITEBACK_RESULT';
          newState.signals = [];
          newState.activeBuses = { address: false, data: false, control: false };
          newState.history = [...newState.history, addHistory(newState, `Result stored in ACC: ${newState.accumulator}`)].slice(-50);
          break;
        }
          
        case 'EXECUTE_STORE_MAR': {
          newState.microStep = 'EXECUTE_WRITE_MEMORY';
          newState.mbr = newState.accumulator;
          newState.signals = [
            createSignal('ACC', 'MBR', 'data', newState.accumulator, 'EXECUTE', 'EXECUTE_WRITE_MEMORY'),
            createSignal('CU', 'MBR', 'control', 'LOAD', 'EXECUTE', 'EXECUTE_WRITE_MEMORY'),
          ];
          newState.activeBuses = { address: false, data: true, control: true };
          newState.history = [...newState.history, addHistory(newState, `ACC (${newState.accumulator}) -> MBR`)].slice(-50);
          break;
        }
          
        case 'EXECUTE_WRITE_MEMORY': {
          newState = writeMemory(newState, newState.mar, newState.mbr);
          newState.phase = 'WRITEBACK';
          newState.microStep = 'WRITEBACK_RESULT';
          newState.signals = [
            createSignal('MAR', 'RAM', 'address', newState.mar, 'EXECUTE', 'WRITEBACK_RESULT'),
            createSignal('MBR', 'RAM', 'data', newState.mbr, 'EXECUTE', 'WRITEBACK_RESULT'),
            createSignal('CU', 'RAM', 'control', 'WRITE', 'EXECUTE', 'WRITEBACK_RESULT'),
          ];
          newState.activeBuses = { address: true, data: true, control: true };
          newState.history = [...newState.history, addHistory(newState, `Write RAM[${newState.mar}] = ${newState.mbr}`)].slice(-50);
          break;
        }
          
        case 'EXECUTE_JUMP': {
          newState.phase = 'WRITEBACK';
          newState.microStep = 'WRITEBACK_RESULT';
          newState.signals = [];
          newState.activeBuses = { address: false, data: false, control: false };
          newState.history = [...newState.history, addHistory(newState, `Jump complete, PC = ${newState.pc}`)].slice(-50);
          break;
        }
      }
      break;
    }
  }
  
  return newState;
}

export function reset(state: SimulationState, programIndex?: number): SimulationState {
  const fresh = createInitialState(programIndex !== undefined ? programIndex : 0);
  fresh.isDetailedInspectionMode = state.isDetailedInspectionMode;
  fresh.detailedComponentView = state.detailedComponentView;
  fresh.selectedComponent = state.selectedComponent;
  return fresh;
}

export function runUntilComplete(state: SimulationState): SimulationState {
  let current = { ...state, isRunning: true, isPaused: false };
  
  while (current.phase !== 'COMPLETE' && current.clockCycle < 1000) {
    current = step(current);
  }
  
  return { ...current, isRunning: false, isPaused: true };
}
