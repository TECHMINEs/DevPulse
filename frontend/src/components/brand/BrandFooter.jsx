/** "Created by Pranav Jangid | TECHMINES" credit — rendered at the bottom of every page. */
const BrandFooter = ({ className = '' }) => (
  <footer className={`w-full border-t border-red-900/60 bg-black px-4 py-4 ${className}`}>
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center font-mono text-xs sm:text-sm text-neutral-400">
      <span>
        Created by <span className="font-semibold text-white">Pranav Jangid</span>
      </span>
      <span className="text-neutral-700" aria-hidden="true">|</span>
      <a
        href="https://github.com/TECHMINEs"
        target="_blank"
        rel="noopener noreferrer"
        className="font-black uppercase tracking-wider text-[#FF0000] hover:text-[#00FFFF] transition-colors drop-shadow-[0_0_6px_rgba(255,0,0,0.8)]"
      >
        TECHMINES
      </a>
      <span className="text-neutral-700" aria-hidden="true">·</span>
      <a
        href="https://www.linkedin.com/in/pranavjangid"
        target="_blank"
        rel="noopener noreferrer"
        className="uppercase tracking-wider text-[#00FFFF] hover:text-[#FF0000] transition-colors"
      >
        LinkedIn
      </a>
    </p>
  </footer>
);

export default BrandFooter;
