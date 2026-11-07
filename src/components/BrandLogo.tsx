// src/components/BrandLogo.tsx
import type { SVGProps } from "react";

// Trophy with a star, two-tone: outlined strokes, a soft tinted cup, and solid star and base.
// 24x24 grid, 2px stroke, same style as lucide icons.
// Everything uses `currentColor`, so it follows the text colour in light and dark mode.
export default function SportsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* cup, softly tinted */}
      <path
        d="M7 3h10v6.5a5 5 0 0 1-10 0V3z"
        fill="currentColor"
        fillOpacity={0.15}
      />
      {/* handles */}
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      {/* stem */}
      <path d="M12 14.5V18" />
      {/* solid pedestal */}
      <path d="M9 18h6l1 3H8z" fill="currentColor" />
      {/* solid star inside the cup */}
      <path
        d="M12 5.7L12.56 7.23L14.19 7.29L12.9 8.29L13.35 9.86L12 8.95L10.65 9.86L11.1 8.29L9.81 7.29L11.44 7.23Z"
        fill="currentColor"
        strokeWidth={0.6}
      />
    </svg>
  );
}

export { SportsIcon as BrandLogoIcon };
