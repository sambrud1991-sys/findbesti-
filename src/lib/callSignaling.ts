import { supabase } from "@/integrations/supabase/client";

export type CallSignalType = "invite" | "accept" | "reject" | "cancel";

export interface CallInvitePayload {
  type: CallSignalType;
  fromUserId: string;
  fromName?: string;
  fromAvatar?: string;
  toUserId: string;
  callType: "audio" | "video";
}

export const callChannelName = (userId: string) => `call:${userId}`;

export const sendCallSignal = async (payload: CallInvitePayload) => {
  const channel = supabase.channel(callChannelName(payload.toUserId));
  await channel.subscribe();
  await channel.send({
    type: "broadcast",
    event: payload.type,
    payload,
  });
  // small delay to ensure delivery, then cleanup
  setTimeout(() => supabase.removeChannel(channel), 500);
};
