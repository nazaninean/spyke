function Icon({ name, size = 20 }) {
  const paths = {
    brain: (
      <>
        <path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.2A3 3 0 0 0 4.5 13a3 3 0 0 0 2 5.65V19a2.5 2.5 0 0 0 5 0V5.5a2.5 2.5 0 0 0-2-2.45Z" />
        <path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.2a3 3 0 0 1 1.5 4.8 3 3 0 0 1-2 5.65V19a2.5 2.5 0 0 1-5 0V5.5a2.5 2.5 0 0 1 2-2.45ZM8 9.5c1.5 0 2.5 1 2.5 2.5M16 9.5c-1.5 0-2.5 1-2.5 2.5M7 15c1.5-.2 2.6.3 3.5 1.5M17 15c-1.5-.2-2.6.3-3.5 1.5" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    spark: <path d="m12 3 1.35 4.65L18 9l-4.65 1.35L12 15l-1.35-4.65L6 9l4.65-1.35L12 3ZM5 16l.75 2.25L8 19l-2.25.75L5 22l-.75-2.25L2 19l2.25-.75L5 16Z" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export default Icon