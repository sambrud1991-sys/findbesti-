import { mockUsers } from "@/data/mockData";
import { Video, Phone, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const callHistory = [
  { user: mockUsers[0], type: "incoming" as const, duration: "5:32", time: "2 min ago" },
  { user: mockUsers[2], type: "outgoing" as const, duration: "12:45", time: "1 hr ago" },
  { user: mockUsers[4], type: "missed" as const, duration: "", time: "3 hr ago" },
  { user: mockUsers[5], type: "incoming" as const, duration: "8:15", time: "Yesterday" },
  { user: mockUsers[1], type: "outgoing" as const, duration: "3:22", time: "Yesterday" },
  { user: mockUsers[6], type: "missed" as const, duration: "", time: "2 days ago" },
];

const callIcons = {
  incoming: { icon: PhoneIncoming, color: "text-online" },
  outgoing: { icon: PhoneOutgoing, color: "text-primary" },
  missed: { icon: PhoneMissed, color: "text-destructive" },
};

const CallPage = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass-card px-4 pt-4 pb-3 animate-slide-up">
        <h1 className="text-xl font-extrabold text-foreground mb-3">Calls</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
              navigate(`/video-call/${randomUser.id}`);
            }}
            className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
          >
            <span className="flex items-center gap-2">
              <Video size={18} />
              Random Video Call
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold opacity-90">
              <Coins size={10} />
              {videoRate} coins / min
            </span>
          </button>
          <button
            onClick={() => {
              const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
              navigate(`/audio-call/${randomUser.id}`);
            }}
            className="flex-1 bg-online text-primary-foreground py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
          >
            <span className="flex items-center gap-2">
              <Phone size={18} />
              Voice Call
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold opacity-90">
              <Coins size={10} />
              {audioRate} coins / min
            </span>
          </button>
        </div>
      </header>

      {/* Call history */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Clock size={14} />
          Recent Calls
        </h2>
        <div className="space-y-1">
          {callHistory.map((call, i) => {
            const CallIcon = callIcons[call.type].icon;
            const iconColor = callIcons[call.type].color;
            return (
              <div key={i} className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-muted/30 transition-colors animate-stagger-in" style={{ animationDelay: `${200 + i * 80}ms` }}>
                <img src={call.user.avatar} alt={call.user.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-foreground">{call.user.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <CallIcon size={12} className={iconColor} />
                    <span className="text-xs text-muted-foreground">
                      {call.type === "missed" ? "Missed" : call.duration} · {call.time}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/video-call/${call.user.id}`)}
                    className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Video size={16} className="text-primary" />
                  </button>
                  <button
                    onClick={() => navigate(`/audio-call/${call.user.id}`)}
                    className="w-9 h-9 rounded-full bg-online/10 flex items-center justify-center hover:bg-online/20 transition-colors"
                  >
                    <Phone size={16} className="text-online" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CallPage;
