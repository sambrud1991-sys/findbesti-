import { Loader2, Wifi, WifiOff, CheckCircle2, AlertCircle } from "lucide-react";

type Status = "joining" | "waiting" | "connected" | "reconnecting" | "failed" | "ended";

interface Props {
  status: Status;
  className?: string;
}

const CONFIG: Record<
  Status,
  { label: string; dot: string; text: string; bg: string; Icon: any; spin?: boolean }
> = {
  joining: {
    label: "Joining…",
    dot: "bg-amber-400",
    text: "text-amber-100",
    bg: "bg-amber-500/20 border-amber-300/30",
    Icon: Loader2,
    spin: true,
  },
  waiting: {
    label: "Waiting for user…",
    dot: "bg-sky-400",
    text: "text-sky-100",
    bg: "bg-sky-500/20 border-sky-300/30",
    Icon: Loader2,
    spin: true,
  },
  connected: {
    label: "Connected",
    dot: "bg-emerald-400 animate-pulse",
    text: "text-emerald-100",
    bg: "bg-emerald-500/20 border-emerald-300/30",
    Icon: CheckCircle2,
  },
  reconnecting: {
    label: "Reconnecting…",
    dot: "bg-orange-400",
    text: "text-orange-100",
    bg: "bg-orange-500/25 border-orange-300/40",
    Icon: Wifi,
    spin: true,
  },
  failed: {
    label: "Connection failed",
    dot: "bg-red-500",
    text: "text-red-100",
    bg: "bg-red-500/25 border-red-300/40",
    Icon: AlertCircle,
  },
  ended: {
    label: "Call ended",
    dot: "bg-slate-400",
    text: "text-slate-100",
    bg: "bg-slate-500/25 border-slate-300/30",
    Icon: WifiOff,
  },
};

const CallStatusPill = ({ status, className = "" }: Props) => {
  const c = CONFIG[status];
  const Icon = c.Icon;
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${c.bg} ${c.text} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <Icon size={14} className={c.spin ? "animate-spin" : ""} />
      <span className="text-xs font-semibold">{c.label}</span>
    </div>
  );
};

export default CallStatusPill;
