const paths = {
  script: 'M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5',
  assets: 'M3 5h18v14H3z M3 16l6-6 5 5 3-3 4 4 M16 8h.01',
  board: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  review: 'M4 4h16v16H4z M10 8l6 4-6 4z',
  settings: 'M4 7h16 M4 17h16 M8 4v6 M16 14v6',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  folder: 'M3 6h7l2 3h9v11H3z',
  close: 'M6 6l12 12 M18 6L6 18',
  chat: 'M4 4h16v13H9l-5 4z M8 8h8 M8 12h5',
  export: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
} as const;
export function Icon({ name, size = 19 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
