import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { callChannelName, sendCallSignal } from "@/lib/callSignaling";

/**
 * Caller-side signaling: broadcasts an "invite" to the receiver as soon as
 * the caller lands on the call page, and listens on their own channel for
 * accept/reject responses. If the receiver rejects (or ignores) the call,
 * the caller is bounced back.
 */
export const useCallerSignaling = ({
  targetUserId,
  callType,
  onEnd,
}: {
  targetUserId: string;
  callType: "audio" | "video";
  onEnd: () => Promise<void> | void;
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const acceptedRef = useRef(false);

  useEffect(() => {
    if (!user || !targetUserId) return;

    let cancelled = false;

    // Fetch caller profile for pretty display on the receiver side
    const send = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      await sendCallSignal({
        type: "invite",
        fromUserId: user.id,
        fromName: profile?.display_name || "Unknown",
        fromAvatar: profile?.avatar_url || undefined,
        toUserId: targetUserId,
        callType,
      });
    };
    send();

    // Listen for accept/reject on caller's own channel
    const channel = supabase
      .channel(callChannelName(user.id))
      .on("broadcast", { event: "accept" }, ({ payload }) => {
        if ((payload as any)?.fromUserId === targetUserId) {
          acceptedRef.current = true;
          toast.success("Call accepted");
        }
      })
      .on("broadcast", { event: "reject" }, async ({ payload }) => {
        if ((payload as any)?.fromUserId === targetUserId) {
          toast.error("Call declined");
          await onEnd();
          navigate(-1);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      // If the caller leaves before acceptance, tell the receiver to stop ringing
      if (!acceptedRef.current) {
        sendCallSignal({
          type: "cancel",
          fromUserId: user.id,
          toUserId: targetUserId,
          callType,
        }).catch(() => {});
      }
    };
  }, [user?.id, targetUserId, callType]);
};
