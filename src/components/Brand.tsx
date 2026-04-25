import * as React from "react";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center font-semibold tracking-tight ${className}`}>
      <span>Car</span>
      <span className="text-primary">Uni</span>
    </span>
  );
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="1" y="1" width="22" height="22" rx="6" fill="currentColor" className="text-primary" />
        <path d="M5 14.5h2l1.2-3.5h7.6l1.2 3.5h2v-1.4l-2.4-3.6a2 2 0 0 0-1.66-.9H8.86a2 2 0 0 0-1.66.9L5 13.1v1.4Z M7.5 16.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z M16.5 16.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" fill="oklch(var(--background))" />
      </svg>
      <BrandMark className="text-base" />
    </div>
  );
}

export function CnhBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="CNH verificada · documentos validados em 12/03/25"
      className={`inline-flex items-center gap-1 rounded-md bg-success/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success ${className}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      CNH
    </span>
  );
}

export function Avatar({ name, color, size = 32, iniciais }: { name: string; color: string; size?: number; iniciais?: string }) {
  const init = iniciais ?? name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-[11px] text-background select-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {init}
    </span>
  );
}

export function PresenceBar({ value, label = true }: { value: number; label?: boolean }) {
  const tone = value >= 95 ? "bg-success" : value >= 85 ? "bg-primary" : "bg-warn";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      {label && <span className="num text-[11px] tabular-nums text-foreground">{value}%</span>}
    </div>
  );
}

export function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-warn" aria-hidden>
        <path d="M12 17.3 6.18 21l1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.82 4.73L17.82 21z" />
      </svg>
      <span className="num font-medium">{value.toFixed(1)}</span>
    </span>
  );
}