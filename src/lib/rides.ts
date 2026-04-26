import type { DashboardSummaryResponse, MyRide } from "@/lib/api";

const EXCLUDED_RIDE_STATUSES = new Set(["CANCELLED"]);

function getRideEndMs(scheduledAt: string, durationSeconds: number | null | undefined) {
  return new Date(scheduledAt).getTime() + ((durationSeconds ?? 0) + 15 * 60) * 1000;
}

export function pickRelevantMyRide(rides: MyRide[], now = Date.now()): MyRide | null {
  return (
    rides
      .filter((ride) => {
        if (EXCLUDED_RIDE_STATUSES.has(ride.status)) return false;
        const start = new Date(ride.scheduledAt).getTime();
        return start >= now || getRideEndMs(ride.scheduledAt, ride.route.durationSeconds) > now;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ??
    null
  );
}

export function pickRelevantSummaryRide(
  rides: DashboardSummaryResponse["nextRides"],
  now = Date.now(),
) {
  return (
    rides
      .filter((ride) => {
        if (EXCLUDED_RIDE_STATUSES.has(ride.status)) return false;
        return new Date(ride.scheduledAt).getTime() >= now;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0] ??
    null
  );
}
