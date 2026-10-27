import ReadmeButton from './ReadmeButton';

export default function MobileNotice() {
  return (
    <main className="mobile-notice">
      <svg width="56" height="56" viewBox="0 0 34 34" aria-hidden="true">
        <defs>
          <linearGradient id="mobile-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#12d68c" /><stop offset="1" stopColor="#7b3ff2" />
          </linearGradient>
        </defs>
        <rect width="34" height="34" rx="10" fill="url(#mobile-g)" />
        <circle cx="12" cy="13" r="3.2" fill="#fff" /><circle cx="22" cy="13" r="3.2" fill="#fff" opacity=".7" />
        <circle cx="17" cy="22" r="3.2" fill="#fff" opacity=".45" />
      </svg>
      <span className="wordmark">OmniGene</span>
      <h1>You need a desktop to view this application</h1>
      <p>OmniGene draws large spatial plots and works best on a laptop or desktop computer. Please open this page on a larger screen.</p>
      <ReadmeButton />
    </main>
  );
}
