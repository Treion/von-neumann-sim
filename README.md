# Von Neumann Simulator

> An interactive learning website that teaches the fundamentals of Von Neumann computer architecture through a fully visual, step-by-step hardware simulation. Users can write assembly-like programs, watch them execute through the CPU cycle, and inspect every component in real time.

<p align="center">
  <img src="https://github.com/Treion/von-neumann-sim/blob/main/Screenshot_20260506_170137.png?raw=true" alt="Banner" width="100%"/>
</p>

<p align="center">
  <img src="https://github.com/Treion/von-neumann-sim/blob/main/Screenshot_20260506_170627.png?raw=true" alt="Banner" width="100%"/>
</p>

---

## Features

- **CPU Simulation** — Live visualization of the Control Unit, ALU, Program Counter, MAR, MBR, CIR, Accumulator, and general-purpose registers (R0–R3)
- **Memory Hierarchy** — Simulated RAM with L1, L2, and L3 cache layers
- **Execution Controls** — Play, Step, and Reset controls with adjustable clock speed
- **Execution Trace** — Cycle-by-cycle log of every instruction fetch, decode, execute, writeback, and complete stage
- **Dynamic Compiler** — Write and compile simple arithmetic expressions directly in the browser
- **Logic Presets** — Pre-loaded programs including Basic Math, Counter Loop, Multiply by Addition, Countdown Loop, and Advanced Multiplier
- **Component Inspector** — Click any hardware component to view its current state and description

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/von-neumann-simulator.git
cd von-neumann-simulator
```

**2. Install dependencies**

```bash
npm install
```

**3. Start the development server**

```bash
npm run dev
```

**4. Open the app**

Navigate to `http://localhost:5173` (or whichever port is shown in your terminal) in your browser.
