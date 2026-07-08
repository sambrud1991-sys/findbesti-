import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { callChannelName, sendCallSignal } from "@/lib/callSignaling";

/**
 * Caller-side signaling + call history logging.
 * - Broadcasts an "invite" to the receiver on mount
 * - Listens for accept/reject on caller's own channel
 * - Persists a row in public.call_history and keeps its status/duration in sync
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
  const connectedAtRef = useRef<number | null>(null);
  const callRecordIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !targetUserId) return;

    let cancelled = false;

    const boot = async () => {
      // 1. Create the call_history row up-front (default status = 'missed')
      const { data: inserted } = await supabase
        .from("call_history")
        .insert({
          caller_id: user.id,
          receiver_id: targetUserId,
          call_type: callType,
          status: "missed",
        })
        .select("id")
        .maybeSingle();
      if (cancelled) return;
      callRecordIdRef.current = inserted?.id ?? null;

      // 2. Fetch caller profile for pretty display on the receiver popup
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      // 3. Broadcast the invite
      await sendCallSignal({
        type: "invite",
        fromUserId: user.id,
        fromName: profile?.display_name || "Unknown",
        fromAvatar: profile?.avatar_url || undefined,
        toUserId: targetUserId,
        callType,
      });
    };
    boot();

    // Listen on caller's own channel for accept / reject
    const channel = supabase
      .channel(callChannelName(user.id))
      .on("broadcast", { event: "accept" }, async ({ payload }) => {
        if ((payload as any)?.fromUserId !== targetUserId) return;
        acceptedRef.current = true;
        connectedAtRef.current = Date.now();
        toast.success("Call accepted");
        if (callRecordIdRef.current) {
          await supabase
            .from("call_history")
            .update({ status: "accepted", started_at: new Date().toISOString() })
            .eq("id", callRecordIdRef.current);
        }
      })
      .on("broadcast", { event: "reject" }, async ({ payload }) => {
        if ((payload as any)?.fromUserId !== targetUserId) return;
        toast.error("Call declined");
        if (callRecordIdRef.current) {
          await supabase
            .from("call_history")
            .update({ status: "rejected", ended_at: new Date().toISOString() })
            .eq("id", callRecordIdRef.current);
        }
        await onEnd();
        navigate(-1);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);

      const finalize = async () => {
        if (!callRecordIdRef.current) return;
        if (acceptedRef.current && connectedAtRef.current) {
          const duration = Math.round((Date.now() - connectedAtRef.current) / 1000);
          await supabase
            .from("call_history")
            .update({
              status: "completed",
              ended_at: new Date().toISOString(),
              duration_seconds: duration,
            })
            .eq("id", callRecordIdRef.current);
        } else {
          // caller left before pickup
          await supabase
            .from("call_history")
            .update({ status: "cancelled", ended_at: new Date().toISOString() })
            .eq("id", callRecordIdRef.current);
          sendCallSignal({
            type: "cancel",
            fromUserId: user.id,
            toUserId: targetUserId,
            callType,
          }).catch(() => {});
        }
      };
      finalize();
    };
  }, [user?.id, targetUserId, callType]);
};
