const P = {
  single: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>,
  rgb: <><circle cx="9" cy="9" r="5" /><circle cx="15" cy="9" r="5" /><circle cx="12" cy="15" r="5" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  fit: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  palette: <path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z" />,
  threshold: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" /></>,
  size: <><circle cx="7" cy="14" r="2.5" /><circle cx="16" cy="10" r="5" /></>,
  upload: <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M5 19h14" />,
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m7 10 5 5 5-5" />,
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
