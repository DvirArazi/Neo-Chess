export type LocalTimeControl = {
  id: string;
  label: string;
  initialMs: number;
  incrementMs: number;
  isUnlimited?: boolean;
};

export const LOCAL_TIME_CONTROLS: LocalTimeControl[] = [
  { id: "bullet", label: "Bullet", initialMs: 2 * 60 * 1000, incrementMs: 1000 },
  { id: "blitz", label: "Blitz", initialMs: 5 * 60 * 1000, incrementMs: 3000 },
  { id: "rapid", label: "Rapid", initialMs: 10 * 60 * 1000, incrementMs: 5000 },
  { id: "classical", label: "Classical", initialMs: 30 * 60 * 1000, incrementMs: 20000 },
  {
    id: "unlimited",
    label: "Unlimited",
    initialMs: Number.POSITIVE_INFINITY,
    incrementMs: 0,
    isUnlimited: true,
  },
];

export function formatClock(clockMs: number): string {
  if (!Number.isFinite(clockMs)) return "∞";

  const totalSeconds = Math.ceil(Math.max(0, clockMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimeControlSubtext(timeControl: LocalTimeControl): string {
  if (timeControl.isUnlimited) return "∞";

  return `${Math.round(timeControl.initialMs / 60000)}m|${
    Math.round(timeControl.incrementMs / 1000)
  }s`;
}
