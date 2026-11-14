/**
 * TECHMINES brand bar — identical across every portfolio project and styled like the
 * header on techmines.github.io. Fixed height (h-11 / 2.75rem) so sticky headers and
 * sidebars can sit directly beneath it.
 */
const BrandBar = ({ project }) => {
  const base = import.meta.env.BASE_URL || '/';
  return (
    <header className="tm-brandbar sticky top-0 z-[60] h-11 px-4 flex items-center justify-between gap-3 select-none border-b border-line bg-black/90 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <a
          href="https://techmines.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 min-w-0 no-underline"
          aria-label="TECHMINES — Pranav Jangid's portfolio"
        >
          <img
            src={`${base}techmines-logo.jpg`}
            alt="TECHMINES logo"
            width={28}
            height={28}
            className="w-7 h-7 object-cover border-2 border-[#FF2626] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
          />
          <span className="font-display font-bold uppercase tracking-[0.03em] text-base text-white">
            TECHMINES
          </span>
        </a>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-[rgba(255,38,38,0.15)] text-[#FF2626] border border-[rgba(255,38,38,0.3)] rounded">
          Interactive Browser Demo
        </span>
      </div>
      <span className="truncate font-mono font-bold text-[11px] uppercase tracking-[0.16em] text-dim">
        {project}
      </span>
    </header>
  );
};

export default BrandBar;
