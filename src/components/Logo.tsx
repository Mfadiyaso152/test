interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon-only' | 'light' | 'dark';
}

export function Logo({ size = 40, className = '', variant = 'full' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="brandPinGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#FF6B53" />
            <stop offset="50%" stopColor="#FF9EB4" />
            <stop offset="100%" stopColor="#2B1B3D" />
          </linearGradient>

          <linearGradient id="brandAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B53" />
            <stop offset="100%" stopColor="#FF9EB4" />
          </linearGradient>

          <linearGradient id="brandPlumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3C2E4C" />
            <stop offset="100%" stopColor="#2B1B3D" />
          </linearGradient>
        </defs>

        {/* Outer Pin Contour */}
        <path
          d="M 60 110 C 60 110, 16 75, 16 46 C 16 22, 35.7 6, 60 6 C 84.3 6, 104 22, 104 46 C 104 75, 60 110, 60 110 Z"
          fill="none"
          stroke="url(#brandPinGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Curved Top Arc */}
        <path
          d="M 33 34 C 40 22, 56 18, 69 22"
          fill="none"
          stroke="url(#brandAccentGrad)"
          strokeWidth="6.5"
          strokeLinecap="round"
        />

        {/* Dynamic Arc */}
        <path
          d="M 46 64 C 36 57, 34 43, 40 33 C 48 20, 68 20, 77 30 C 82 36, 84 46, 80 54"
          fill="none"
          stroke="url(#brandPinGrad)"
          strokeWidth="7.5"
          strokeLinecap="round"
        />

        {/* Checkmark Accent */}
        <path
          d="M 44 56 L 56 68 L 86 36"
          fill="none"
          stroke="url(#brandAccentGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Base Anchor line */}
        <path
          d="M 60 98 L 76 74"
          fill="none"
          stroke="url(#brandPinGrad)"
          strokeWidth="7.5"
          strokeLinecap="round"
        />

        <circle cx="94" cy="22" r="3.5" fill="url(#brandAccentGrad)" />
      </svg>
    </div>
  );
}
