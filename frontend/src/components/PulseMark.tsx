import { cn } from "@/lib/utils";

/**
 * The Pulse mark: a heartbeat that ends in a live dot, on a soft tonal tile. Drawn with theme
 * colours, so it follows light and dark; public/favicon.svg is the same drawing in light colours.
 */
export function PulseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-12", className)}>
      <rect width="64" height="64" rx="18" className="fill-fab" />
      <path
        d="M8 37h10l5-15 7 26 6-19h7"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-fab-foreground"
      />
      <circle cx="50.5" cy="29" r="5.5" className="fill-severe" />
    </svg>
  );
}
