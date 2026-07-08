import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { callChannelName, sendCallSignal, CallInvitePayload } from "@/lib/callSignaling";

const IncomingCallModal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<CallInvitePayload | null>(null);
  const ringRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(callChannelName(user.id))
      .on("broadcast", { event: "invite" }, ({ payload }) => {
        // ignore if already on a call screen
        if (/\/(video|audio)-call\//.test(window.location.pathname)) return;
        setIncoming(payload as CallInvitePayload);
      })
      .on("broadcast", { event: "cancel" }, () => {
        setIncoming(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ringtone
  useEffect(() => {
    if (incoming) {
      const a = new Audio("/ringtone.wav");
      a.loop = true;
      a.volume = 0.6;
      a.play().catch(() => {});
      ringRef.current = a;
      // auto-timeout after 30s
      const t = setTimeout(() => {
        handleReject();
      }, 30000);
      return () => {
        clearTimeout(t);
        a.pause();
        ringRef.current = null;
      };
    }
  }, [incoming?.fromUserId]);

  const handleAccept = async () => {
    if (!incoming || !user) return;
    const call = incoming;
    setIncoming(null);
    await sendCallSignal({
      type: "accept",
      fromUserId: user.id,
      toUserId: call.fromUserId,
      callType: call.callType,
    });
    navigate(`/${call.callType}-call/${call.fromUserId}`);
  };

  const handleReject = async () => {
    if (!incoming || !user) return;
    const call = incoming;
    setIncoming(null);
    await sendCallSignal({
      type: "reject",
      fromUserId: user.id,
      toUserId: call.fromUserId,
      callType: call.callType,
    });
  };

  if (!incoming) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-between py-16 px-6 animate-in fade-in">
      <div className="flex flex-col items-center gap-4 mt-8">
        <p className="text-white/70 text-sm font-semibold uppercase tracking-wider">
          Incoming {incoming.callType} call
        </p>
        <div className="relative">
          <img
            src={incoming.fromAvatar || "/placeholder.svg"}
            alt={incoming.fromName || "Caller"}
            className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-2xl"
          />
          <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mt-2">
          {incoming.fromName || "Unknown"}
        </h2>
      </div>

      <div className="flex items-center justify-center gap-16 mb-8">
        <button
          onClick={handleReject}
          className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          aria-label="Reject"
        >
          <PhoneOff size={26} className="text-white" />
        </button>
        <button
          onClick={handleAccept}
          className="w-16 h-16 rounded-full bg-online flex items-center justify-center shadow-xl active:scale-95 transition-transform animate-pulse"
          aria-label="Accept"
        >
          {incoming.callType === "video" ? (
            <Video size={26} className="text-white" />
          ) : (
            <Phone size={26} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default IncomingCallModal;
