# Von Neumann Simulator

An interactive learning website that teaches the fundamentals of Von Neumann computer architecture through a fully visual, step-by-step hardware simulation. Users can write assembly-like programs, watch them execute through the CPU cycle, and inspect every component in real time.

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

## Tech Stack

- **Frontend** — TypeScript, Vite, Tailwind CSS
- **Backend / API** — Node.js (`api/` directory)
- **Database** — Drizzle ORM (`db/`, `drizzle.config.ts`)
- **Testing** — Vitest
- **Containerization** — Docker
- **Linting / Formatting** — ESLint, Prettier

---

## Getting Started

### Prerequisites

Make sure the following are installed on your machine before proceeding:

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) *(optional — only needed for the containerized setup)*

---

### Option 1 — Run Locally (without Docker)

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

---

### Option 2 — Run with Docker

**1. Clone the repository**

```bash
git clone https://github.com/your-username/von-neumann-simulator.git
cd von-neumann-simulator
```

**2. Set up environment variables**

```bash
cp .env.example .env
```

**3. Build and start the container**

```bash
docker build -t von-neumann-simulator .
docker run -p 3000:3000 --env-file .env von-neumann-simulator
```

**4. Open the app**

Navigate to `http://localhost:3000` in your browser.

---

## Project Structure

```
von-neumann-simulator/
├── api/                    # Backend API routes and server logic
├── contracts/              # Shared type contracts between frontend and backend
├── db/                     # Database schema and migrations (Drizzle ORM)
├── src/                    # Frontend source code
├── .env.example            # Environment variable template
├── .backend-features.json  # Feature flags for the backend
├── components.json         # UI component registry
├── drizzle.config.ts       # Drizzle ORM configuration
├── eslint.config.js        # ESLint rules
├── index.html              # HTML entry point
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # Base TypeScript configuration
├── tsconfig.node.json      # TypeScript config for Node/server build
├── tsconfig.server.json    # TypeScript config for the API server
├── vite.config.ts          # Vite bundler configuration
├── vitest.config.ts        # Vitest unit test configuration
├── vitest.test.config.ts   # Vitest integration test configuration
├── Dockerfile              # Docker build instructions
└── package.json            # Project dependencies and scripts
```

---

## Usage

1. **Select a program** from the sidebar (e.g., Basic Math, Counter Loop)
2. Press **Play** to run the full simulation automatically, or **Step** to advance one CPU cycle at a time
3. Watch the **Datapath** panel update as each instruction moves through Fetch, Decode, Execute, Writeback, and Complete stages
4. Click any component in the CPU or Memory panel to open the **Component Inspector**
5. Use the **Dynamic Compiler** at the bottom to enter a custom arithmetic expression and generate your own program

---

## License

This project is completely open source.
