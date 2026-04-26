import { Avatar } from "@/components/Brand";

export function OccupancyTrack({
  name,
  seats,
  occupiedSeats,
  passengerNames = [],
  compact = false,
}: {
  name: string;
  seats: number;
  occupiedSeats: number;
  passengerNames?: string[];
  compact?: boolean;
}) {
  const safeSeats = Math.max(1, seats);
  const filled = Math.max(0, Math.min(occupiedSeats, safeSeats));

  return (
    <div
      className={`rounded-[24px] border border-border bg-surface-2/60 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <p className="label-cockpit text-[10px] text-muted-foreground">Ocupação atual</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar
            name={name}
            size={compact ? 42 : 48}
            iniciais={name.slice(0, 2).toUpperCase()}
          />
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {filled}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Array.from({ length: safeSeats }, (_, index) => {
              const active = index < filled;
              const passengerName = passengerNames[index];
              return (
                <div
                  key={index}
                  title={passengerName ?? (active ? "Lugar ocupado" : "Lugar livre")}
                  className={`relative h-10 w-10 rounded-full border-2 ${
                    active
                      ? "border-primary bg-primary/15"
                      : "border-dashed border-primary/25 bg-background"
                  }`}
                >
                  {active ? (
                    <span className="absolute inset-1 rounded-full bg-primary/20" />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {filled}/{safeSeats} vagas ocupadas
            </p>
            <span className="rounded-full bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
              {Math.max(0, safeSeats - filled)} livre(s)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
