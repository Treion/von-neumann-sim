import { create } from 'zustand';
import type { SimulationState, Phase, MicroStep, ComponentInfo } from '@/lib/simulation/types';
import { createInitialState, step, reset } from '@/lib/simulation/engine';
import { INSTRUCTION_SET } from '@/lib/simulation/instructions';

interface SimulatorStore extends SimulationState {
  // Actions
  stepForward: () => void;
  play: () => void;
  pause: () => void;
  resetSimulation: (programIndex?: number) => void;
  setSpeed: (speed: number) => void;
  selectComponent: (id: string | null) => void;
  hoverComponent: (id: string | null) => void;
  loadProgram: (programIndex: number) => void;
  loadCustomProgram: (program: import('@/lib/simulation/types').Instruction[], dataValues: Record<number, number>, name: string) => void;
  tick: () => void;
  toggleDetailedInspectionMode: () => void;
  setDetailedComponentView: (view: 'none' | 'alu' | 'cu' | 'alu-adder' | 'cu-decoder' | 'cache' | 'clock' | 'registers' | 'ram') => void;
  overrideMemory: (address: number, value: number) => void;
  overrideRegister: (id: string, value: number) => void;
  
  // Getters
  getComponentInfo: (id: string) => ComponentInfo | null;
  getPhaseDescription: () => string;
  getMicroStepDescription: () => string;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  ...createInitialState(0),

  stepForward: () => {
    const state = get();
    if (state.phase === 'COMPLETE') return;
    const newState = step(state);
    set({ ...newState });
  },

  play: () => {
    const state = get();
    if (state.phase === 'COMPLETE') {
      get().resetSimulation();
      return;
    }
    set({ isRunning: true, isPaused: false });
    
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      const current = get();
      if (current.phase === 'COMPLETE' || current.isPaused) {
        if (intervalId) clearInterval(intervalId);
        set({ isRunning: false });
        return;
      }
      const newState = step(current);
      set({ ...newState });
    }, state.speed);
  },

  pause: () => {
    if (intervalId) clearInterval(intervalId);
    set({ isPaused: true, isRunning: false });
  },

  resetSimulation: (programIndex?: number) => {
    if (intervalId) clearInterval(intervalId);
    const state = get();
    const newState = reset(state, programIndex !== undefined ? programIndex : undefined);
    set({ ...newState });
  },

  setSpeed: (speed: number) => {
    set({ speed });
    const state = get();
    if (state.isRunning && !state.isPaused) {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        const current = get();
        if (current.phase === 'COMPLETE' || current.isPaused) {
          if (intervalId) clearInterval(intervalId);
          set({ isRunning: false });
          return;
        }
        const newState = step(current);
        set({ ...newState });
      }, speed);
    }
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponent: id });
  },

  hoverComponent: (id: string | null) => {
    set({ hoveredComponent: id });
  },

  loadProgram: (programIndex: number) => {
    if (intervalId) clearInterval(intervalId);
    const newState = createInitialState(programIndex);
    set({ ...newState });
  },

  loadCustomProgram: (program, dataValues, name) => {
    if (intervalId) clearInterval(intervalId);
    const freshState = createInitialState(0);
    const ram: import('@/lib/simulation/types').MemoryCell[] = freshState.ram.map((cell) => ({ ...cell, value: 0, isInstruction: false, instruction: undefined }));
    program.forEach((inst, i) => {
      ram[i] = {
        address: i,
        value: INSTRUCTION_SET[inst.opcode].opcode * 100 + (inst.operand || 0),
        isInstruction: true,
        instruction: inst,
      };
    });
    Object.entries(dataValues).forEach(([addr, val]) => {
      ram[Number(addr)] = { address: Number(addr), value: val, isInstruction: false };
    });
    set({ ...freshState, ram, program, programName: name });
  },

  tick: () => {
    const state = get();
    if (state.phase === 'COMPLETE' || state.isPaused) return;
    const newState = step(state);
    set({ ...newState });
  },

  toggleDetailedInspectionMode: () => {
    const state = get();
    const newValue = !state.isDetailedInspectionMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('detailedInspectionMode', String(newValue));
    }
    set({ isDetailedInspectionMode: newValue });
  },

  setDetailedComponentView: (view) => {
    set({ detailedComponentView: view });
  },

  overrideMemory: (address, value) => {
    const state = get();
    // Only allow manual overrides when paused or idle
    if (state.isRunning) return;
    const newRam = [...state.ram];
    if (address >= 0 && address < newRam.length) {
      newRam[address] = { ...newRam[address], value, isInstruction: false };
    }
    set({ ram: newRam });
  },

  overrideRegister: (id, value) => {
    const state = get();
    // Only allow manual overrides when paused or idle
    if (state.isRunning) return;
    
    if (id === 'pc') set({ pc: value });
    else if (id === 'accumulator') set({ accumulator: value });
    else if (id === 'mar') set({ mar: value });
    else if (id === 'mbr') set({ mbr: value });
    else if (id.startsWith('r')) {
      const idx = parseInt(id.replace('r', ''));
      if (idx >= 0 && idx < state.generalRegisters.length) {
        const newRegs = [...state.generalRegisters];
        newRegs[idx] = value;
        set({ generalRegisters: newRegs });
      }
    }
  },

  getComponentInfo: (id: string): ComponentInfo | null => {
    const state = get();
    
    const components: Record<string, ComponentInfo> = {
      cpu: {
        id: 'cpu',
        name: 'Central Processing Unit (CPU)',
        description: 'The brain of the computer. Executes instructions and coordinates all operations.',
        extendedDescription: [
          'The CPU is the primary component of a computer that acts as its "brain." It is responsible for processing most of the data inside the computer system and executing instructions from computer programs.',
          'It operates by repeatedly performing the Fetch-Execute Cycle: fetching an instruction from memory, decoding it to understand what action is required, and executing that action.',
          'A typical CPU contains several key sub-components including the Control Unit (CU), Arithmetic Logic Unit (ALU), and specialized high-speed storage locations known as Registers.'
        ],
        currentValue: `Cycle: ${state.clockCycle}, Phase: ${state.phase}`,
        justHappened: state.history.length > 0 ? state.history[state.history.length - 1].description : 'Idle',
        details: [
          `Current Phase: ${state.phase}`,
          `Clock Cycle: ${state.clockCycle}`,
          `Status: ${state.isRunning ? 'Running' : state.phase === 'COMPLETE' ? 'Complete' : 'Paused'}`,
        ],
      },
      cu: {
        id: 'cu',
        name: 'Control Unit (CU)',
        description: 'Directs the operation of the processor. Tells other components what to do.',
        extendedDescription: [
          'The Control Unit coordinates and directs the operation of all other parts of the computer architecture. It does not execute program instructions directly; rather, it decodes them and routes timing and control signals to other components.',
          'During the Decode phase, the CU interprets the instruction held in the Current Instruction Register (CIR). During the Execute phase, it sends specific control signals (like READ, WRITE, or ALU operation codes) across the Control Bus to orchestrate the hardware.',
          'It essentially acts as the orchestra conductor of the CPU, ensuring data flows correctly between the ALU, memory, and registers at exactly the right time.'
        ],
        currentValue: state.cir ? `Executing: ${state.cir.opcode}` : 'Idle',
        justHappened: state.signals.filter(s => s.from === 'CU').map(s => `${s.type.toUpperCase()} signal to ${s.to}: ${s.value}`).join(', ') || 'No active signals',
        details: [
          `Current Instruction: ${state.cir?.opcode || 'None'}`,
          `Control Signals Active: ${state.signals.filter(s => s.from === 'CU').length}`,
          `Phase: ${state.phase}`,
        ],
      },
      alu: {
        id: 'alu',
        name: 'Arithmetic Logic Unit (ALU)',
        description: 'Performs mathematical and logical operations.',
        extendedDescription: [
          'The ALU is a digital circuit used to perform arithmetic and logic operations. It represents the fundamental building block of the central processing unit.',
          'Arithmetic operations include addition, subtraction, multiplication, and division. Logic operations involve boolean comparisons like AND, OR, NOT, and XOR.',
          'The ALU takes input operands (typically from the Accumulator and the Memory Buffer Register), performs the operation dictated by the Control Unit, and outputs the result back to the Accumulator while updating the Status Flags (Zero, Negative, Carry, Overflow).'
        ],
        currentValue: `ACC = ${state.accumulator}`,
        justHappened: state.history.filter(h => h.description.includes('ALU')).pop()?.description || 'Idle',
        details: [
          `Accumulator: ${state.accumulator}`,
          `Status: Z=${state.statusRegister.zero ? '1' : '0'} N=${state.statusRegister.negative ? '1' : '0'}`,
          `Last Operation: ${state.cir?.opcode || 'None'}`,
        ],
      },
      pc: {
        id: 'pc',
        name: 'Program Counter (PC)',
        description: 'Holds the address of the next instruction to be fetched.',
        extendedDescription: [
          'The Program Counter (sometimes called the Instruction Pointer) is a special-purpose register that keeps track of where the CPU is in its execution sequence.',
          'At the start of the Fetch cycle, the PC\'s value is copied to the Memory Address Register (MAR) so the instruction can be retrieved from RAM. Immediately after fetching, the PC is incremented to point to the next consecutive memory address.',
          'During branch or jump instructions, the PC can be deliberately overwritten with a new address, allowing the program to execute loops or conditional statements rather than just moving linearly.'
        ],
        currentValue: `Address: ${state.pc}`,
        justHappened: state.history.filter(h => h.description.includes('PC')).pop()?.description || 'Idle',
        details: [
          `Current Value: ${state.pc}`,
          `Next Instruction: ${state.ram[state.pc]?.isInstruction ? state.ram[state.pc].instruction?.opcode || 'Data' : 'Data'}`,
          `Auto-increments after fetch`,
        ],
      },
      mar: {
        id: 'mar',
        name: 'Memory Address Register (MAR)',
        description: 'Holds the memory address being accessed.',
        extendedDescription: [
          'The Memory Address Register holds the physical memory address of the data or instruction that the CPU needs to read from or write to main memory (RAM).',
          'It acts as the strict gateway to the Address Bus. Any address generated by the CPU (either from the Program Counter for instructions or from the operand of an instruction for data) must first be loaded into the MAR.',
          'Once loaded, the MAR continuously asserts this address onto the Address Bus so the memory controller can locate the correct cell during a READ or WRITE operation.'
        ],
        currentValue: `Address: ${state.mar}`,
        justHappened: state.history.filter(h => h.description.includes('MAR')).pop()?.description || 'Idle',
        details: [
          `Current Address: ${state.mar}`,
          `Connected to Address Bus`,
          `Used for both reads and writes`,
        ],
      },
      mbr: {
        id: 'mbr',
        name: 'Memory Buffer Register (MBR)',
        description: 'Holds data being transferred to/from memory.',
        extendedDescription: [
          'The Memory Buffer Register (also known as the Memory Data Register or MDR) acts as a two-way staging area for all data moving between the CPU and main memory.',
          'During a memory READ, the data retrieved from the RAM cell located at the MAR\'s address travels via the Data Bus and is temporarily stored in the MBR before being routed to the Accumulator or CIR.',
          'During a memory WRITE, data from the CPU (usually the Accumulator) is first placed into the MBR, and then pushed across the Data Bus into the RAM cell specified by the MAR.'
        ],
        currentValue: `Value: ${state.mbr}`,
        justHappened: state.history.filter(h => h.description.includes('MBR')).pop()?.description || 'Idle',
        details: [
          `Current Value: ${state.mbr}`,
          `Connected to Data Bus`,
          `Temporary storage for memory operations`,
        ],
      },
      cir: {
        id: 'cir',
        name: 'Current Instruction Register (CIR)',
        description: 'Holds the instruction currently being executed.',
        extendedDescription: [
          'The Current Instruction Register holds the actual instruction (both opcode and operand) that has just been fetched from memory and is currently being processed.',
          'Once the instruction arrives from the MBR, it sits in the CIR. The Control Unit then splits it: the opcode is decoded to determine what hardware needs to activate, and the operand provides the necessary data or memory address for the execution.',
          'Isolating the instruction in the CIR is crucial because the MBR might be overwritten during the Execute phase if the instruction requires fetching additional data from memory.'
        ],
        currentValue: state.cir ? `${state.cir.opcode} ${state.cir.operand ?? ''}` : 'Empty',
        justHappened: state.history.filter(h => h.description.includes('CIR')).pop()?.description || 'Idle',
        details: [
          `Opcode: ${state.cir?.opcode || 'None'}`,
          `Operand: ${state.cir?.operand ?? 'None'}`,
          `Description: ${state.cir?.description || 'None'}`,
        ],
      },
      accumulator: {
        id: 'accumulator',
        name: 'Accumulator (ACC)',
        description: 'Primary register for arithmetic and logic operations.',
        extendedDescription: [
          'The Accumulator is the main general-purpose register used by the ALU. It is the default source for one of the operands in mathematical operations, and the default destination for the results.',
          'In a classic Von Neumann architecture, operations like ADD typically mean "Add the value in the MBR to the value already in the Accumulator, and store the result back in the Accumulator."',
          'Because it sits directly inside the CPU core, accessing the Accumulator is significantly faster than reading from or writing to main RAM.'
        ],
        currentValue: `Value: ${state.accumulator}`,
        justHappened: state.history.filter(h => h.description.includes('ACC') || h.description.includes('accumulator')).pop()?.description || 'Idle',
        details: [
          `Value: ${state.accumulator} (0x${state.accumulator.toString(16).toUpperCase().padStart(2, '0')})`,
          `Binary: ${state.accumulator.toString(2).padStart(8, '0')}`,
          `Status: ${state.statusRegister.zero ? 'Zero' : state.statusRegister.negative ? 'Negative' : 'Positive'}`,
        ],
      },
      ram: {
        id: 'ram',
        name: 'Random Access Memory (RAM)',
        description: 'Volatile memory that stores active programs and data.',
        extendedDescription: [
          'RAM is the primary memory component of the Von Neumann architecture. It stores both the instructions of the running program and the data those instructions operate on (the Stored Program Concept).',
          'It is divided into discrete cells, each with a unique sequential address. The CPU accesses these cells by placing an address on the Address Bus and asserting a READ or WRITE signal.',
          'RAM is volatile, meaning it loses all its contents when power is removed. Despite being fast, accessing RAM is still orders of magnitude slower than accessing internal CPU registers or cache.'
        ],
        currentValue: `${state.ram.filter(c => c.value !== 0).length} cells used`,
        justHappened: state.history.filter(h => h.description.includes('RAM') || h.description.includes('memory')).pop()?.description || 'Idle',
        details: [
          `Size: ${state.ram.length} cells`,
          `Active: ${state.ram.filter(c => c.value !== 0).length} cells`,
          `Last Accessed: Address ${state.mar}`,
        ],
      },
      rom: {
        id: 'rom',
        name: 'Read-Only Memory (ROM)',
        description: 'Non-volatile memory containing firmware and boot code.',
        extendedDescription: [
          'ROM is a type of non-volatile memory whose contents are permanently programmed during manufacturing. It retains its data even when the computer is powered off.',
          'It typically stores critical bootstrap firmware (like the BIOS or UEFI) that tells the CPU how to start up, initialize hardware components, and load the main operating system into RAM.',
          'As the name implies, the CPU can read from ROM using the standard address and data buses, but it cannot write new data to it during normal operation.'
        ],
        currentValue: '16 bytes (boot firmware)',
        justHappened: 'ROM is static - read-only',
        details: [
          `Size: ${state.rom.length} bytes`,
          `Contents: Boot firmware constants`,
          `Read-only: Cannot be modified`,
        ],
      },
      l1cache: {
        id: 'l1cache',
        name: 'L1 Cache',
        description: 'Fastest cache, closest to CPU. Smallest but quickest.',
        extendedDescription: [
          'Level 1 Cache is a tiny, incredibly fast memory block built directly into the CPU core. It operates at the exact same clock speed as the processor.',
          'It exploits the Principle of Locality: programs tend to access the same data or instructions repeatedly, or access memory addresses that are close to each other. By keeping copies of recently accessed RAM data here, the CPU avoids the massive latency penalty of fetching from main memory.',
          'A cache "hit" means the data was found instantly in L1. A cache "miss" means the CPU must stall and check L2, L3, or ultimately fetch from the much slower RAM.'
        ],
        currentValue: `${state.l1Cache.lines.filter(l => l.valid).length}/${state.l1Cache.size} lines`,
        justHappened: `Hits: ${state.l1Cache.hits}, Misses: ${state.l1Cache.misses}`,
        details: [
          `Lines: ${state.l1Cache.size}`,
          `Used: ${state.l1Cache.lines.filter(l => l.valid).length}`,
          `Hit Rate: ${state.l1Cache.hits + state.l1Cache.misses > 0 ? Math.round((state.l1Cache.hits / (state.l1Cache.hits + state.l1Cache.misses)) * 100) : 0}%`,
        ],
      },
      l2cache: {
        id: 'l2cache',
        name: 'L2 Cache',
        description: 'Intermediate cache between L1 and L3.',
        extendedDescription: [
          'Level 2 Cache acts as a secondary buffer between the ultra-fast L1 cache and main memory. It is larger than L1 but slightly slower.',
          'Modern CPUs often have dedicated L2 cache per core. If an instruction or data block isn\'t found in L1 (an L1 miss), the CPU immediately searches the L2 cache.',
          'The multi-tiered cache hierarchy balances the trade-off between memory speed and memory cost/size. L2 provides a safety net that catches many of the requests that fall through L1.'
        ],
        currentValue: `${state.l2Cache.lines.filter(l => l.valid).length}/${state.l2Cache.size} lines`,
        justHappened: `Hits: ${state.l2Cache.hits}, Misses: ${state.l2Cache.misses}`,
        details: [
          `Lines: ${state.l2Cache.size}`,
          `Used: ${state.l2Cache.lines.filter(l => l.valid).length}`,
          `Hit Rate: ${state.l2Cache.hits + state.l2Cache.misses > 0 ? Math.round((state.l2Cache.hits / (state.l2Cache.hits + state.l2Cache.misses)) * 100) : 0}%`,
        ],
      },
      l3cache: {
        id: 'l3cache',
        name: 'L3 Cache',
        description: 'Largest cache, shared across cores.',
        extendedDescription: [
          'Level 3 Cache is the largest and slowest of the CPU caches, but still significantly faster than main RAM. It is typically shared across all the processing cores on a multi-core chip.',
          'It acts as the final on-chip fallback before hitting system memory. Because it is shared, it also serves as a fast synchronization pool where different cores can exchange data without writing back to RAM.',
          'L3 cache sizes heavily influence the performance of complex applications like gaming or video rendering, which process large working sets of data.'
        ],
        currentValue: `${state.l3Cache.lines.filter(l => l.valid).length}/${state.l3Cache.size} lines`,
        justHappened: `Hits: ${state.l3Cache.hits}, Misses: ${state.l3Cache.misses}`,
        details: [
          `Lines: ${state.l3Cache.size}`,
          `Used: ${state.l3Cache.lines.filter(l => l.valid).length}`,
          `Hit Rate: ${state.l3Cache.hits + state.l3Cache.misses > 0 ? Math.round((state.l3Cache.hits / (state.l3Cache.hits + state.l3Cache.misses)) * 100) : 0}%`,
        ],
      },
      clock: {
        id: 'clock',
        name: 'System Clock',
        description: 'Generates timing signals to synchronize all operations.',
        extendedDescription: [
          'The System Clock is an oscillator that continuously generates a steady, pulsing electrical signal (the clock tick).',
          'This signal acts as the metronome for the entire computer. Every transition (usually on the rising edge of the clock pulse) triggers the circuitry in the CPU to advance to the next micro-step in the Fetch-Execute cycle.',
          'Clock speed is measured in Hertz (Hz), representing cycles per second. A 3 GHz processor pulses 3 billion times a second, meaning it can transition between states 3 billion times per second.'
        ],
        currentValue: `Cycle: ${state.clockCycle}`,
        justHappened: state.isRunning ? `Tick ${state.clockCycle} completed` : 'Stopped',
        details: [
          `Current Cycle: ${state.clockCycle}`,
          `Speed: ${state.speed}ms per cycle`,
          `Status: ${state.isRunning ? 'Running' : 'Stopped'}`,
        ],
      },
      addressBus: {
        id: 'addressBus',
        name: 'Address Bus',
        description: 'Carries memory addresses from CPU to memory.',
        extendedDescription: [
          'The Address Bus is a uni-directional set of wires connecting the CPU to memory and I/O devices. It solely carries the memory address that the CPU wants to access.',
          'Because it is uni-directional, addresses only flow OUT from the CPU (specifically from the Memory Address Register).',
          'The width of the Address Bus (number of wires) determines the maximum amount of memory the CPU can address. An 8-bit bus can only address 256 cells, while a 64-bit bus can theoretically address 16 exabytes of memory.'
        ],
        currentValue: state.activeBuses.address ? `Active: ${state.mar}` : 'Idle',
        justHappened: state.activeBuses.address ? `Transmitting address ${state.mar}` : 'No activity',
        details: [
          `Status: ${state.activeBuses.address ? 'ACTIVE' : 'Idle'}`,
          `Current Value: ${state.activeBuses.address ? state.mar : 'None'}`,
          `Width: 8-bit (addresses 0-255)`,
        ],
      },
      dataBus: {
        id: 'dataBus',
        name: 'Data Bus',
        description: 'Carries actual data between CPU and memory.',
        extendedDescription: [
          'The Data Bus is a bi-directional pathway used to transmit the actual data or instruction values between the CPU, RAM, and I/O components.',
          'During a READ, memory dumps the contents of the addressed cell onto the Data Bus, and the CPU absorbs it into the MBR. During a WRITE, the CPU asserts data from the MBR onto the bus, and memory captures it.',
          'The width of the Data Bus defines the "word size" of the machine (e.g., a 32-bit or 64-bit architecture), determining how much data can be moved in a single clock cycle.'
        ],
        currentValue: state.activeBuses.data ? `Active: ${state.mbr}` : 'Idle',
        justHappened: state.activeBuses.data ? `Transmitting data ${state.mbr}` : 'No activity',
        details: [
          `Status: ${state.activeBuses.data ? 'ACTIVE' : 'Idle'}`,
          `Current Value: ${state.activeBuses.data ? state.mbr : 'None'}`,
          `Width: 8-bit`,
        ],
      },
      controlBus: {
        id: 'controlBus',
        name: 'Control Bus',
        description: 'Carries command and control signals.',
        extendedDescription: [
          'The Control Bus is a collection of individual control lines that dictate the operations occurring across the system. It carries the commands generated by the Control Unit.',
          'While the Address Bus specifies "where" and the Data Bus carries "what", the Control Bus specifies "how" and "when".',
          'Common signals include Memory Read, Memory Write, Interrupt Requests, and Clock synchronization signals. It ensures components do not try to put data on the Data Bus simultaneously (bus contention).'
        ],
        currentValue: state.activeBuses.control ? 'Active' : 'Idle',
        justHappened: state.signals.filter(s => s.type === 'control').map(s => `${s.from} -> ${s.to}: ${s.value}`).join(', ') || 'No signals',
        details: [
          `Status: ${state.activeBuses.control ? 'ACTIVE' : 'Idle'}`,
          `Active Signals: ${state.signals.filter(s => s.type === 'control').length}`,
          `Commands: READ, WRITE, LOAD, INCREMENT, etc.`,
        ],
      },
      registers: {
        id: 'registers',
        name: 'General Purpose Registers',
        description: 'Fast storage locations for temporary data.',
        extendedDescription: [
          'General Purpose Registers (GPRs) are high-speed memory slots directly embedded within the CPU core. Unlike special-purpose registers (like PC or MAR), programmers and compilers can freely use GPRs to hold intermediate calculation results.',
          'By loading frequently used variables from RAM into these registers, programs execute significantly faster because they bypass the latency of the memory buses.',
          'A typical modern processor might have 16 or 32 of these registers. Optimizing compiler algorithms focus heavily on "register allocation" to maximize their usage.'
        ],
        currentValue: `R0=${state.generalRegisters[0]} R1=${state.generalRegisters[1]} R2=${state.generalRegisters[2]} R3=${state.generalRegisters[3]}`,
        justHappened: 'General registers - user accessible',
        details: state.generalRegisters.map((val, i) => `R${i}: ${val}`),
      },
    };
    
    return components[id] || null;
  },

  getPhaseDescription: () => {
    const state = get();
    const descriptions: Record<Phase, string> = {
      IDLE: 'System ready. Press Play or Step to start.',
      FETCH: 'Fetching next instruction from memory...',
      DECODE: 'Decoding instruction to determine operation...',
      EXECUTE: 'Executing the instruction...',
      WRITEBACK: 'Writing results back to registers/memory...',
      COMPLETE: 'Program execution complete.',
    };
    return descriptions[state.phase];
  },

  getMicroStepDescription: () => {
    const state = get();
    if (!state.microStep) return '';
    
    const descriptions: Record<MicroStep, string> = {
      FETCH_PC_TO_MAR: 'Copy Program Counter to Memory Address Register',
      FETCH_READ_MEMORY: 'Read instruction from RAM into Memory Buffer Register',
      FETCH_MBR_TO_CIR: 'Copy instruction from MBR to Current Instruction Register',
      FETCH_INCREMENT_PC: 'Increment Program Counter for next instruction',
      DECODE_INSTRUCTION: 'Control Unit decodes opcode and operand',
      EXECUTE_LOAD_MAR: 'Load operand address into MAR',
      EXECUTE_READ_MEMORY: 'Read data from RAM into MBR',
      EXECUTE_ALU_OPERATION: 'ALU performs the operation',
      EXECUTE_STORE_MAR: 'Load destination address into MAR for STORE',
      EXECUTE_WRITE_MEMORY: 'Write data from MBR to RAM',
      EXECUTE_JUMP: 'Update Program Counter for jump',
      WRITEBACK_RESULT: 'Operation complete, results stored',
    };
    return descriptions[state.microStep];
  },
}));
