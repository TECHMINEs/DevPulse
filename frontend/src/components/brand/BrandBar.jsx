/**
 * TECHMINES brand bar — identical across every portfolio project.
 * Fixed height (h-11 / 2.75rem) so sticky page headers can sit directly beneath it.
 */
const BrandBar = ({ project }) => (
  <header className="sticky top-0 z-[60] h-11 bg-black border-b border-red-900/60 px-4 flex items-center justify-between gap-3 select-none shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
    <a
      href="https://github.com/TECHMINEs"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 min-w-0"
      aria-label="TECHMINES on GitHub"
    >
      <img
        src="/techmines-logo.jpg"
        alt="TECHMINES logo"
        width={28}
        height={28}
        className="w-7 h-7 object-cover border border-[#FF0000] shadow-[0_0_8px_rgba(255,0,0,0.6)] group-hover:shadow-[0_0_14px_rgba(0,255,255,0.7)] group-hover:border-[#00FFFF] transition-all"
      />
      <span className="font-mono font-black uppercase tracking-[0.2em] text-sm text-[#FF0000] group-hover:text-[#00FFFF] transition-colors drop-shadow-[0_0_6px_rgba(255,0,0,0.7)]">
        TECHMINES
      </span>
    </a>
    <span className="hidden sm:block truncate font-mono text-[11px] uppercase tracking-wider text-neutral-500">
      <span className="text-neutral-700">{'// '}</span>{project}
    </span>
  </header>
);

export default BrandBar;
