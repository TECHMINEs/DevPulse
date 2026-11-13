/** "Created by Pranav Jangid | TECHMINES" credit — rendered at the bottom of every page. */
const linkClass =
  'tm-textlink font-display font-bold uppercase tracking-[0.05em] text-white hover:text-[#FF2626] transition-colors';

const BrandFooter = ({ className = '' }) => (
  <footer className={`tm-brandfooter w-full border-t border-line px-4 py-4 ${className}`}>
    <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-mono text-xs sm:text-sm text-dim">
      <span>
        Created by <span className="font-semibold text-white">Pranav Jangid</span>
      </span>
      <span className="text-stroke" aria-hidden="true">|</span>
      <a href="https://github.com/TECHMINEs" target="_blank" rel="noopener noreferrer" className={linkClass}>
        TECHMINES
      </a>
      <a href="https://techmines.github.io/" target="_blank" rel="noopener noreferrer" className={linkClass}>
        Portfolio
      </a>
      <a href="https://www.linkedin.com/in/pranavjangid" target="_blank" rel="noopener noreferrer" className={linkClass}>
        LinkedIn
      </a>
    </p>
  </footer>
);

export default BrandFooter;
