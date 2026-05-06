import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CPU_COMPONENTS, REGISTERS, BUSES } from '@/lib/landingData';
import { RegisterFlowDiagram } from './RegisterDiagram';

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber:   { bg: 'bg-amber-500/5',   border: 'border-amber-500/30',  text: 'text-amber-400',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  rose:    { bg: 'bg-rose-500/5',    border: 'border-rose-500/30',   text: 'text-rose-400',   badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  emerald: { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30',text: 'text-emerald-400',badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  cyan:    { bg: 'bg-cyan-500/5',    border: 'border-cyan-500/30',   text: 'text-cyan-400',   badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  violet:  { bg: 'bg-violet-500/5',  border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  blue:    { bg: 'bg-blue-500/5',    border: 'border-blue-500/30',   text: 'text-blue-400',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  orange:  { bg: 'bg-orange-500/5',  border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  teal:    { bg: 'bg-teal-500/5',    border: 'border-teal-500/30',   text: 'text-teal-400',   badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
};

/* ─── Section wrapper ─────────────────────────────────────── */
export function SectionTitle({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <div className="text-center mb-16">
      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-zinc-700 text-zinc-400 mb-4">{tag}</span>
      <h2 className="text-4xl font-extrabold text-zinc-100 mb-3">{title}</h2>
      <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">{sub}</p>
    </div>
  );
}

/* ─── Clickable component card ───────────────────────────── */
function ComponentCard({ item }: { item: typeof CPU_COMPONENTS[0] | typeof REGISTERS[0] }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[item.color] ?? COLOR_MAP.amber;

  return (
    <motion.div
      layout
      onClick={() => setOpen(!open)}
      whileHover={{ y: -4 }}
      className={cn(
        'rounded-2xl border p-6 cursor-pointer transition-colors duration-300 select-none',
        'bg-zinc-900 border-zinc-800',
        open && `${c.border} ${c.bg}`
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border', c.bg, c.border)}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', c.badge)}>{item.abbr}</span>
            <span className="text-xs text-zinc-500">{item.tagline}</span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mt-1">{item.name}</h3>
          <p className="text-sm text-zinc-400 mt-1">{item.simple}</p>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          className="text-zinc-600 text-lg shrink-0 mt-1"
        >▾</motion.div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={cn('mt-5 pt-5 border-t', c.border.replace('/30', '/20'))}>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">{item.detail}</p>
              {'analogy' in item && (
                <div className={cn('rounded-lg border px-4 py-3 text-xs text-zinc-300 italic mb-4', c.border, c.bg)}>
                  💡 {(item as typeof CPU_COMPONENTS[0]).analogy}
                </div>
              )}
              {'facts' in item && (
                <ul className="space-y-1.5">
                  {((item as typeof CPU_COMPONENTS[0]).facts).map((f, i) => (
                    <li key={i} className={cn('flex items-start gap-2 text-xs', c.text)}>
                      <span className="mt-0.5">▸</span>{f}
                    </li>
                  ))}
                </ul>
              )}
              {'width' in item && (
                <span className={cn('inline-block text-xs font-mono mt-3 px-2 py-1 rounded border', c.badge)}>{(item as typeof REGISTERS[0]).width}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── CPU Section ────────────────────────────────────────── */
export function CpuSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24">
      <SectionTitle
        tag="Inside the CPU"
        title="The CPU's Two Engines"
        sub="The processor has two distinct units working together. Click each to learn how they work."
      />
      {/* Animated CPU diagram */}
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-center">
          {/* CU box */}
          <motion.div whileHover={{ scale: 1.03 }} className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-8 py-5 text-center cursor-default">
            <div className="text-2xl mb-1">🧭</div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Control Unit</div>
            <div className="text-[10px] text-zinc-500 mt-1">Directs traffic</div>
          </motion.div>

          {/* Signal arrows between CU and ALU */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-1 bg-zinc-800 overflow-hidden rounded-full">
              <motion.div className="absolute inset-y-0 left-0 bg-amber-500 w-8 rounded-full"
                animate={{ x: ['-100%', '250%'] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">CONTROL SIGNALS</span>
            <div className="relative w-24 h-1 bg-zinc-800 overflow-hidden rounded-full">
              <motion.div className="absolute inset-y-0 left-0 bg-rose-500 w-8 rounded-full"
                animate={{ x: ['250%', '-100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
            </div>
          </div>

          {/* ALU box */}
          <motion.div whileHover={{ scale: 1.03 }} className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-8 py-5 text-center cursor-default">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">ALU</div>
            <div className="text-[10px] text-zinc-500 mt-1">Does the math</div>
          </motion.div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {CPU_COMPONENTS.map((c) => <ComponentCard key={c.id} item={c} />)}
      </div>
    </section>
  );
}

/* ─── Registers Section ──────────────────────────────────── */
export function RegistersSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-800">
      <SectionTitle
        tag="Registers"
        title="The CPU's Tiny Notebooks"
        sub="Registers are ultra-fast storage slots built directly into the CPU. Click any node in the diagram to see what it does, and step through the data flow."
      />
      {/* Interactive register flow diagram */}
      <RegisterFlowDiagram />
      {/* Detail cards */}
      <h3 className="text-lg font-bold text-zinc-100 mb-4 mt-12">Deep Dive — Click to expand</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REGISTERS.map((r) => <ComponentCard key={r.id} item={r} />)}
      </div>
    </section>
  );
}

/* ─── Buses Section ──────────────────────────────────────── */
function BusCard({ bus }: { bus: typeof BUSES[0] }) {
  const [hovered, setHovered] = useState(false);
  const c = COLOR_MAP[bus.color];

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      className={cn('rounded-2xl border p-6 transition-colors duration-300 cursor-default', 'bg-zinc-900',
        hovered ? `${c.border} ${c.bg}` : 'border-zinc-800'
      )}
    >
      {/* animated bus line */}
      <div className="relative h-2 bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <motion.div
          className={cn('absolute inset-y-0 left-0 w-10 rounded-full', bus.color === 'cyan' ? 'bg-cyan-500' : bus.color === 'violet' ? 'bg-violet-500' : 'bg-amber-500')}
          animate={hovered ? { x: bus.id === 'address' ? ['-100%', '600%'] : bus.id === 'data' ? ['-100%', '600%', '-100%'] : ['-100%', '600%'] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', c.badge)}>{bus.direction}</span>
      </div>
      <h3 className="text-lg font-bold text-zinc-100 mb-1">{bus.name}</h3>
      <p className="text-sm text-zinc-400 mb-4">{bus.simple}</p>

      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-zinc-300 leading-relaxed">{bus.detail}</p>
            <div className={cn('text-xs italic text-zinc-400 border-l-2 pl-3', bus.color === 'cyan' ? 'border-cyan-500' : bus.color === 'violet' ? 'border-violet-500' : 'border-amber-500')}>
              {bus.analogy}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!hovered && <p className="text-xs text-zinc-600 mt-2 italic">Hover to learn more…</p>}
    </motion.div>
  );
}

export function BusesSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24 border-t border-zinc-800">
      <SectionTitle
        tag="The Connectors"
        title="The Three Buses"
        sub={`Components don't magically talk to each other. They need highways — electrical pathways called buses. Hover each to see how data flows.`}
      />
      {/* Live bus demo */}
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-center">
            <div className="text-xs font-bold text-zinc-300">CPU</div>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            {[
              { label: 'Address Bus', color: 'bg-cyan-500', dir: 1 },
              { label: 'Data Bus', color: 'bg-violet-500', dir: -1 },
              { label: 'Control Bus', color: 'bg-amber-500', dir: 1 },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-zinc-600 w-20 shrink-0">{b.label}</span>
                <div className="relative flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('absolute inset-y-0 w-8 rounded-full', b.color)}
                    animate={{ x: b.dir > 0 ? ['-100%', '700%'] : ['700%', '-100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: b.dir > 0 ? 0 : 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-center">
            <div className="text-xs font-bold text-zinc-300">RAM</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {BUSES.map((b) => <BusCard key={b.id} bus={b} />)}
      </div>
    </section>
  );
}
