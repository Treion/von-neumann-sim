export type InstructionType = 
  | 'LOAD'
  | 'STORE'
  | 'ADD'
  | 'SUB'
  | 'MUL'
  | 'DIV'
  | 'JMP'
  | 'JZ'
  | 'JNZ'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'CMP'
  | 'HALT';

export interface Instruction {
  opcode: InstructionType;
  operand: number | null;
  address: number;
  description: string;
}

export interface MemoryCell {
  address: number;
  value: number;
  isInstruction: boolean;
  instruction?: Instruction;
}

export interface CacheLine {
  tag: number | null;
  data: number;
  valid: boolean;
  lastAccess: number;
}

export interface CacheLevel {
  name: string;
  size: number;
  lines: CacheLine[];
  hits: number;
  misses: number;
}

export type Phase = 'IDLE' | 'FETCH' | 'DECODE' | 'EXECUTE' | 'WRITEBACK' | 'COMPLETE';
export type MicroStep = 
  | 'FETCH_PC_TO_MAR'
  | 'FETCH_READ_MEMORY'
  | 'FETCH_MBR_TO_CIR'
  | 'FETCH_INCREMENT_PC'
  | 'DECODE_INSTRUCTION'
  | 'EXECUTE_LOAD_MAR'
  | 'EXECUTE_READ_MEMORY'
  | 'EXECUTE_ALU_OPERATION'
  | 'EXECUTE_STORE_MAR'
  | 'EXECUTE_WRITE_MEMORY'
  | 'EXECUTE_JUMP'
  | 'WRITEBACK_RESULT';

export interface Signal {
  id: string;
  from: string;
  to: string;
  type: 'address' | 'data' | 'control';
  value: string | number;
  active: boolean;
  phase: Phase;
  microStep: MicroStep;
}

export interface SimulationState {
  // Registers
  pc: number;
  mar: number;
  mbr: number;
  cir: Instruction | null;
  accumulator: number;
  statusRegister: {
    zero: boolean;
    negative: boolean;
    overflow: boolean;
    carry: boolean;
  };
  generalRegisters: number[];
  
  // Memory
  ram: MemoryCell[];
  rom: MemoryCell[];
  
  // Cache
  l1Cache: CacheLevel;
  l2Cache: CacheLevel;
  l3Cache: CacheLevel;
  
  // Virtual Memory
  virtualMemory: Map<number, number>;
  pageTable: Map<number, number>;
  
  // Execution State
  phase: Phase;
  microStep: MicroStep | null;
  clockCycle: number;
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  currentInstruction: Instruction | null;
  signals: Signal[];
  
  // Program
  program: Instruction[];
  programName: string;
  
  // History
  history: HistoryEntry[];
  
  // UI
  selectedComponent: string | null;
  hoveredComponent: string | null;
  isDetailedInspectionMode: boolean;
  detailedComponentView: 'none' | 'alu' | 'cu' | 'alu-adder' | 'cu-decoder' | 'cache' | 'clock' | 'registers' | 'ram';
  activeBuses: {
    address: boolean;
    data: boolean;
    control: boolean;
  };
}

export interface HistoryEntry {
  cycle: number;
  phase: Phase;
  microStep: MicroStep | null;
  pc: number;
  mar: number;
  mbr: number;
  accumulator: number;
  instruction: string;
  description: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  extendedDescription: string[];
  currentValue: string;
  justHappened: string;
  details: string[];
}
