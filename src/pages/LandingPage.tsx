import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Cpu, Play, ArrowDown } from 'lucide-react';
import { CpuSection, RegistersSection, BusesSection } from '@/components/landing/Sections';
import { FdeCycleSection, MemorySection, StoredProgramSection } from '@/components/landing/MoreSections';
import { QuizSection } from '@/components/landing/QuizSection';

function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24 text-center overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px]" />
      {/* Radial fade at edges */}
      <div className="absolute inset-0 bg-radial-at-center from-transparent via-transparent to-zinc-950 pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-400 uppercase tracking-widest"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Interactive Learning Guide
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 via-zinc-300 to-zinc-600"
        >
          Von Neumann<br />Architecture
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Every computer built since 1945 uses this design. Scroll through this interactive guide to understand
          exactly how your CPU, memory, and buses work — then jump into the live simulator.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          <Link to="/simulator">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-zinc-100 text-zinc-950 font-bold text-lg hover:bg-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.12)]"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Go To Simulator
            </motion.button>
          </Link>
          <a href="#learn" className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-zinc-700 text-zinc-400 font-semibold text-sm hover:text-zinc-100 hover:border-zinc-500 transition-all">
            Start Learning
            <ArrowDown className="w-4 h-4" />
          </a>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ArrowDown className="w-5 h-5 text-zinc-700" />
      </motion.div>
    </section>
  );
}

function ArchitectureOverview() {
  return (
    <section id="learn" className="max-w-4xl mx-auto px-6 py-16 border-t border-zinc-800">
      <div className="text-center mb-12">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-700 text-zinc-400 mb-4">Overview</span>
        <h2 className="text-4xl font-extrabold text-zinc-100 mb-3">The Big Picture</h2>
        <p className="text-zinc-400 max-w-xl mx-auto">Four components. One bus system. Every computer ever made.</p>
      </div>

      {/* Top-level architecture visual */}
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-4 justify-center">
          {/* CPU block */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 flex-1 min-w-0">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">CPU</div>
            <div className="grid grid-cols-2 gap-2">
              {[['🧭','CU','amber'],['⚡','ALU','rose'],['📍','PC','emerald'],['📋','CIR','blue'],['🏦','ACC','orange'],['📮','MAR','cyan']].map(([icon,name,c])=>(
                <div key={name} className={`rounded border p-2 text-center text-xs font-medium border-${c}-500/20 bg-${c}-500/5 text-${c}-400`}>
                  <div className="text-sm">{icon}</div>{name}
                </div>
              ))}
            </div>
          </div>

          {/* Bus column */}
          <div className="flex flex-col justify-center items-center gap-4 px-4">
            {[['Address Bus','bg-cyan-500'],['Data Bus','bg-violet-500'],['Control Bus','bg-amber-500']].map(([label,bg],i)=>(
              <div key={label} className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative h-1 w-28 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 w-8 rounded-full ${bg}`}
                    animate={{ x: i === 1 ? ['700%','-100%','700%'] : ['-100%','700%','-100%'] }}
                    transition={{ duration: 1.8 + i * 0.4, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <span className="text-[9px] text-zinc-600 font-mono whitespace-nowrap hidden md:block">{label}</span>
              </div>
            ))}
          </div>

          {/* Memory block */}
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 flex-1 min-w-0">
            <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">Memory</div>
            <div className="space-y-2">
              {[['RAM','volatile — programs & data','violet'],['ROM','firmware — read-only','zinc'],['Cache','L1/L2/L3 — fast copies','teal']].map(([name,desc])=>(
                <div key={name} className="rounded border border-zinc-700 bg-zinc-900 p-2">
                  <div className="text-xs font-bold text-zinc-300">{name}</div>
                  <div className="text-[10px] text-zinc-500">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-900/50 px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto">
          <Cpu className="w-8 h-8 text-zinc-100" />
        </div>
        <h2 className="text-4xl font-extrabold text-zinc-100">Ready to run it yourself?</h2>
        <p className="text-zinc-400 leading-relaxed">
          Open the simulator, load a program, and step through every clock cycle.
          Watch the registers change, buses fire, and the ALU calculate — all in real time.
        </p>
        <Link to="/simulator">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-zinc-100 text-zinc-950 font-bold text-xl hover:bg-white transition-all shadow-[0_0_50px_rgba(255,255,255,0.12)]"
          >
            <Play className="w-6 h-6" fill="currentColor" />
            Go To Simulator
          </motion.button>
        </Link>
      </motion.div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-blue-500/30">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-zinc-100" />
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-100">Von Neumann Simulator</span>
        </div>
        <Link to="/simulator">
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 text-zinc-300 text-sm font-semibold hover:bg-zinc-800 transition-all"
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            Simulator
          </motion.button>
        </Link>
      </header>

      {/* Content */}
      <Hero />
      <ArchitectureOverview />
      <CpuSection />
      <RegistersSection />
      <BusesSection />
      <FdeCycleSection />
      <MemorySection />
      <StoredProgramSection />
      <QuizSection />
      <FinalCTA />
    </div>
  );
}
