import type { Instruction, InstructionType } from './types';

export const INSTRUCTION_SET: Record<InstructionType, { opcode: number; description: string; needsOperand: boolean }> = {
  LOAD: { opcode: 1, description: 'Load value from memory into accumulator', needsOperand: true },
  STORE: { opcode: 2, description: 'Store accumulator value to memory', needsOperand: true },
  ADD: { opcode: 3, description: 'Add value from memory to accumulator', needsOperand: true },
  SUB: { opcode: 4, description: 'Subtract value from memory from accumulator', needsOperand: true },
  MUL: { opcode: 5, description: 'Multiply accumulator by value from memory', needsOperand: true },
  DIV: { opcode: 6, description: 'Divide accumulator by value from memory', needsOperand: true },
  JMP: { opcode: 7, description: 'Jump to memory address', needsOperand: true },
  JZ: { opcode: 8, description: 'Jump to address if accumulator is zero', needsOperand: true },
  JNZ: { opcode: 9, description: 'Jump to address if accumulator is not zero', needsOperand: true },
  AND: { opcode: 10, description: 'AND accumulator with value from memory', needsOperand: true },
  OR: { opcode: 11, description: 'OR accumulator with value from memory', needsOperand: true },
  NOT: { opcode: 12, description: 'NOT accumulator (invert all bits)', needsOperand: false },
  CMP: { opcode: 13, description: 'Compare accumulator with memory value', needsOperand: true },
  HALT: { opcode: 0, description: 'Stop execution', needsOperand: false },
};

export const SAMPLE_PROGRAMS: { name: string; instructions: { type: InstructionType; operand: number | null; comment?: string }[] }[] = [
  {
    name: 'Basic Math',
    instructions: [
      { type: 'LOAD', operand: 20, comment: 'Load value 20 into accumulator' },
      { type: 'ADD', operand: 21, comment: 'Add value 15 (at addr 21)' },
      { type: 'STORE', operand: 22, comment: 'Store result at address 22' },
      { type: 'HALT', operand: null, comment: 'Stop execution' },
    ],
  },
  {
    name: 'Counter Loop',
    instructions: [
      { type: 'LOAD', operand: 20, comment: 'Load counter value (5)' },
      { type: 'CMP', operand: 21, comment: 'Compare with target (0)' },
      { type: 'JZ', operand: 7, comment: 'Jump to end if zero' },
      { type: 'SUB', operand: 22, comment: 'Decrement by 1' },
      { type: 'STORE', operand: 20, comment: 'Store back counter' },
      { type: 'JMP', operand: 0, comment: 'Loop back to start' },
      { type: 'HALT', operand: null, comment: 'End' },
    ],
  },
  {
    name: 'Multiply by Addition',
    instructions: [
      { type: 'LOAD', operand: 20, comment: 'Load multiplicand (3)' },
      { type: 'STORE', operand: 23, comment: 'Store as running total' },
      { type: 'LOAD', operand: 21, comment: 'Load multiplier (4)' },
      { type: 'CMP', operand: 22, comment: 'Compare with 1' },
      { type: 'JZ', operand: 10, comment: 'Jump to end if counter is 1' },
      { type: 'SUB', operand: 22, comment: 'Decrement counter' },
      { type: 'STORE', operand: 21, comment: 'Save counter' },
      { type: 'LOAD', operand: 23, comment: 'Load running total' },
      { type: 'ADD', operand: 20, comment: 'Add multiplicand again' },
      { type: 'STORE', operand: 23, comment: 'Save new total' },
      { type: 'JMP', operand: 2, comment: 'Repeat' },
      { type: 'LOAD', operand: 23, comment: 'Load final result' },
      { type: 'HALT', operand: null, comment: 'End' },
    ],
  },
];

export function createProgram(instructions: { type: InstructionType; operand: number | null }[]): Instruction[] {
  return instructions.map((inst, index) => ({
    opcode: inst.type,
    operand: inst.operand,
    address: index,
    description: INSTRUCTION_SET[inst.type].description,
  }));
}

export function getInstructionName(opcode: number): InstructionType | 'UNKNOWN' {
  const entry = Object.entries(INSTRUCTION_SET).find(([, info]) => info.opcode === opcode);
  return entry ? (entry[0] as InstructionType) : 'UNKNOWN';
}
