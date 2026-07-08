import { useEffect, useState } from "react";
import { Video, Phone, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Coins, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

type CallStatus = "accepted" | "rejected" | "missed" | "cancelled" | "completed";
type CallType = "audio" | "video";

interface CallRow {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: CallStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

interface OtherProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const formatDuration = (s: number) => {
  if (!s || s <= 0) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const CallPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<CallRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, OtherProfile>>({});
  const [loading, setLoading] = useState(true);

  const { data: rates } = useQuery({
    queryKey: ["call-rates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("audio_call_rate, video_call_rate")
        .maybeSingle();
      return data;
    },
    staleTime: 60_000,
  });

  const audioRate = rates?.audio_call_rate ?? 3;
  const videoRate = rates?.video_call_rate ?? 5;

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("call_history")
      .select("*")
      .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("started_at", { ascending: false })
      .limit(50);
    const rows = (data || []) as CallRow[];
    setHistory(rows);

    // Fetch counter-party profiles in one shot
    const otherIds = Array.from(
      new Set(rows.map((r) => (r.caller_id === user.id ? r.receiver_id : r.caller_id)))
    );
    if (otherIds.length) {
      const { data: profs } = await supabase.rpc("get_public_profiles");
      const map: Record<string, OtherProfile> = {};
      (profs || []).forEach((p: any) => {
        if (otherIds.includes(p.user_id)) {
          map[p.user_id] = {
            user_id: p.user_id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
          };
        }
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  // Realtime refresh on new/updated rows
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("call_history_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "call_history" },
        () => fetchHistory()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getStatusMeta = (row: CallRow) => {
    const isOutgoing = row.caller_id === user?.id;
    if (row.status === "completed" || row.status === "accepted") {
      return isOutgoing
        ? { icon: PhoneOutgoing, color: "text-primary", label: formatDuration(row.duration_seconds) || "Connected" }
        : { icon: PhoneIncoming, color: "text-online", label: formatDuration(row.duration_seconds) || "Connected" };
    }
    if (row.status === "missed" && !isOutgoing) {
      return { icon: PhoneMissed, color: "text-destructive", label: "Missed" };
    }
    if (row.status === "cancelled" || row.status === "missed") {
      return { icon: PhoneOutgoing, color: "text-muted-foreground", label: isOutgoing ? "Cancelled" : "Missed" };
    }
    if (row.status === "rejected") {
      return {
        icon: isOutgoing ? PhoneOutgoing : PhoneMissed,
        color: "text-destructive",
        label: isOutgoing ? "Declined" : "Rejected",
      };
    }
    return { icon: PhoneOutgoing, color: "text-muted-foreground", label: row.status };
  };

  const timeAgo = (iso: string) => {
    try {
      return formatDistanceToNow(new Date(iso), { addSuffix: false });
    } catch {
      return "";
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass-card px-4 pt-4 pb-3 animate-slide-up">
        <h1 className="text-xl font-extrabold text-foreground mb-3">Calls</h1>
        <div className="flex gap-2">
          <div className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold text-sm shadow-lg">
            <span className="flex items-center gap-2">
              <Video size={18} />
              Video Call
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold opacity-90">
              <Coins size={10} />
              {videoRate} coins / min
            </span>
          </div>
          <div className="flex-1 bg-online text-primary-foreground py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold text-sm shadow-lg">
            <span className="flex items-center gap-2">
              <Phone size={18} />
              Voice Call
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold opacity-90">
              <Coins size={10} />
              {audioRate} coins / min
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Clock size={14} />
          Recent Calls
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <Phone size={32} className="text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No calls yet</p>
            <p className="text-muted-foreground/70 text-xs mt-1">
              Start a call from a chat to see it here
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {history.map((row, i) => {
              const otherId = row.caller_id === user?.id ? row.receiver_id : row.caller_id;
              const other = profiles[otherId];
              const meta = getStatusMeta(row);
              const CallIcon = meta.icon;
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-muted/30 transition-colors animate-stagger-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {other?.avatar_url ? (
                    <img
                      src={other.avatar_url}
                      alt={other.display_name || "User"}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold ring-1 ring-border">
                      {getInitials(other?.display_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">
                      {other?.display_name || "User"}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <CallIcon size={12} className={meta.color} />
                      <span className="text-xs text-muted-foreground truncate">
                        {row.call_type === "video" ? "Video" : "Voice"}
                        {meta.label ? ` · ${meta.label}` : ""}
                        {` · ${timeAgo(row.started_at)} ago`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/video-call/${otherId}`)}
                      className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                      aria-label="Video call"
                    >
                      <Video size={16} className="text-primary" />
                    </button>
                    <button
                      onClick={() => navigate(`/audio-call/${otherId}`)}
                      className="w-9 h-9 rounded-full bg-online/10 flex items-center justify-center hover:bg-online/20 transition-colors"
                      aria-label="Voice call"
                    >
                      <Phone size={16} className="text-online" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallPage;
