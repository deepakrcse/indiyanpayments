import { cn } from '@/lib/cn';

/** A small shape drifting gently in place; staggered so they never move in step. */
function Floater({ className, delay, children }: { className: string; delay: string; children: React.ReactNode }) {
  return (
    <div className={cn('pointer-events-none absolute animate-float motion-reduce:animate-none', className)} style={{ animationDelay: delay }}>
      {children}
    </div>
  );
}

/**
 * Abstract shapes around the sign-in card, drawn from the logo itself — its navy flame and gold
 * arrow — so the page feels like the brand rather than decoration added on top. Everything sits
 * at the edges, away from the form, at low contrast; phones get a lighter set, and nothing moves
 * for people who prefer reduced motion. Purely decorative: hidden from assistive technology.
 */
export function LoginBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Soft colour fields — the logo's navy at the top, its gold at the bottom right. */}
      <div className="absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -right-24 -bottom-32 size-80 rounded-full bg-gold-100/70 blur-3xl" />

      {/* Top-left: a large flame swoosh, the emblem's curve. */}
      <svg className="absolute -top-24 -left-28 w-[30rem] opacity-[0.16] max-sm:-left-40 max-sm:w-80 sm:opacity-[0.2]" viewBox="0 0 400 400" fill="none">
        <defs>
          <linearGradient id="lb-flame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2f5bbf" />
            <stop offset="1" stopColor="#022c71" />
          </linearGradient>
        </defs>
        <path d="M60 360C10 250 40 120 170 40c-50 90-40 170 20 230 50 50 120 60 190 40-70 80-230 140-320 50Z" fill="url(#lb-flame)" />
        <path d="M95 330C70 240 100 150 190 80" stroke="#b77f37" strokeWidth="5" strokeLinecap="round" />
        <path d="M140 345C130 280 150 220 210 170" stroke="#b77f37" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </svg>

      {/* Bottom-right: gold concentric rings. */}
      <svg className="absolute -right-20 -bottom-20 w-[26rem] opacity-50 max-sm:w-64" viewBox="0 0 300 300" fill="none">
        {[140, 112, 84, 56].map((r, i) => (
          <circle key={r} cx="150" cy="150" r={r} stroke="#d4a35c" strokeOpacity={0.55 - i * 0.1} strokeWidth="1.5" strokeDasharray={i % 2 ? '4 7' : undefined} />
        ))}
        <circle cx="150" cy="150" r="22" fill="#d4a35c" fillOpacity="0.18" />
      </svg>

      {/* Top-right: a patch of gold dots. */}
      <svg className="absolute top-16 right-[8%] w-44 opacity-60 max-md:hidden" viewBox="0 0 140 100">
        {Array.from({ length: 7 * 5 }, (_, i) => (
          <circle key={i} cx={10 + (i % 7) * 20} cy={10 + Math.floor(i / 7) * 20} r="2.2" fill="#b77f37" fillOpacity={0.25 + ((i * 7) % 5) * 0.1} />
        ))}
      </svg>

      {/* Bottom: two flowing lines, navy fading into gold. */}
      <svg className="absolute inset-x-0 bottom-0 h-48 w-full opacity-40" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="lb-wave" x1="0" x2="1">
            <stop offset="0" stopColor="#022c71" stopOpacity="0" />
            <stop offset="0.35" stopColor="#2f5bbf" />
            <stop offset="0.75" stopColor="#b77f37" />
            <stop offset="1" stopColor="#b77f37" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 140C240 80 420 190 720 130S1200 60 1440 110" stroke="url(#lb-wave)" strokeWidth="2" />
        <path d="M0 170C260 120 480 200 760 160S1220 110 1440 150" stroke="url(#lb-wave)" strokeWidth="1.2" opacity="0.6" />
      </svg>

      {/* Behind the card: a faint navy-to-gold halo, turning very slowly. */}
      <div className="absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 max-sm:hidden">
        <div
          className="size-full rounded-full opacity-[0.22] [animation:spin_90s_linear_infinite] motion-reduce:[animation:none]"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #2f5bbf 70deg, transparent 150deg, #d4a35c 230deg, transparent 310deg)',
            mask: 'radial-gradient(circle, transparent 64%, #000 65%, #000 66%, transparent 67%)',
            WebkitMask: 'radial-gradient(circle, transparent 64%, #000 65%, #000 66%, transparent 67%)',
          }}
        />
      </div>

      {/* Small shapes drifting at the edges. */}
      <Floater className="top-[18%] left-[12%] max-md:hidden" delay="0s">
        <div className="size-4 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-[0_6px_14px_-4px_rgb(183_127_55/0.6)]" />
      </Floater>
      <Floater className="top-[30%] right-[14%] max-md:hidden" delay="1.5s">
        <div className="size-9 rotate-12 rounded-xl border-2 border-brand-300/70" />
      </Floater>
      <Floater className="bottom-[22%] left-[16%] max-md:hidden" delay="3s">
        <svg className="size-7 text-brand-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 4v16M4 12h16" />
        </svg>
      </Floater>
      <Floater className="right-[20%] bottom-[16%] max-sm:right-[8%] max-sm:bottom-[6%]" delay="4.5s">
        <div className="size-6 rounded-full border-[3px] border-gold-400/70" />
      </Floater>
      <Floater className="top-[62%] left-[6%] max-md:hidden" delay="2.2s">
        <div className="size-2.5 rounded-full bg-brand-500/60" />
      </Floater>
      <Floater className="top-[9%] left-[42%] max-sm:top-[4%] max-sm:left-[70%]" delay="5.2s">
        <div className="size-3 rotate-45 rounded-[3px] bg-gold-500/50" />
      </Floater>
    </div>
  );
}
