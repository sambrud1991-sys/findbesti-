import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Mic, Check, X, Loader2, ArrowLeft, ShieldAlert } from "lucide-react";

type PermState = "idle" | "checking" | "granted" | "denied" | "unsupported";

interface PreCallPermissionGateProps {
  callType: "audio" | "video";
  children: React.ReactNode;
}

const PreCallPermissionGate = ({ callType, children }: PreCallPermissionGateProps) => {
  const navigate = useNavigate();
  const needsCamera = callType === "video";

  const [micState, setMicState] = useState<PermState>("idle");
  const [camState, setCamState] = useState<PermState>(needsCamera ? "idle" : "granted");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const request = useCallback(async () => {
    setErrorMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("unsupported");
      if (needsCamera) setCamState("unsupported");
      setErrorMsg("Aapka browser camera/mic access support nahi karta.");
      return;
    }

    setMicState("checking");
    if (needsCamera) setCamState("checking");

    // Request mic first
    let micStream: MediaStream | null = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicState("granted");
    } catch (err: any) {
      setMicState("denied");
      setErrorMsg(err?.message || "Mic permission denied");
    }

    let camStream: MediaStream | null = null;
    if (needsCamera) {
      try {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCamState("granted");
      } catch (err: any) {
        setCamState("denied");
        setErrorMsg((prev) => prev || err?.message || "Camera permission denied");
      }
    }

    // Release probe streams so Agora can acquire fresh tracks
    micStream?.getTracks().forEach((t) => t.stop());
    camStream?.getTracks().forEach((t) => t.stop());
  }, [needsCamera]);

  // Auto-run on mount
  useEffect(() => {
    request();
  }, [request]);

  const allGranted =
    micState === "granted" && (!needsCamera || camState === "granted");

  const StatusIcon = ({ state }: { state: PermState }) => {
    if (state === "checking") return <Loader2 size={18} className="animate-spin text-primary-foreground/70" />;
    if (state === "granted") return <Check size={18} className="text-green-400" />;
    if (state === "denied" || state === "unsupported") return <X size={18} className="text-destructive" />;
    return <div className="w-[18px] h-[18px] rounded-full border border-primary-foreground/40" />;
  };

  if (ready && allGranted) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.6)] flex flex-col items-center justify-between py-10 px-6 safe-top safe-bottom">
      <div className="w-full flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft size={20} className="text-primary-foreground" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-foreground/15 flex items-center justify-center">
          <ShieldAlert size={28} className="text-primary-foreground" />
        </div>
        <h1 className="text-primary-foreground text-2xl font-extrabold">Permission Checklist</h1>
        <p className="text-primary-foreground/80 text-sm max-w-xs">
          Call start karne se pehle {needsCamera ? "camera aur mic" : "mic"} access allow karein.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Mic size={18} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-primary-foreground font-bold text-sm">Microphone</p>
            <p className="text-primary-foreground/70 text-xs">
              {micState === "granted" && "Allowed"}
              {micState === "checking" && "Requesting..."}
              {micState === "denied" && "Denied — browser settings me allow karein"}
              {micState === "unsupported" && "Browser supported nahi"}
              {micState === "idle" && "Waiting"}
            </p>
          </div>
          <StatusIcon state={micState} />
        </div>

        {needsCamera && (
          <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-2xl px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center">
              <Camera size={18} className="text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-primary-foreground font-bold text-sm">Camera</p>
              <p className="text-primary-foreground/70 text-xs">
                {camState === "granted" && "Allowed"}
                {camState === "checking" && "Requesting..."}
                {camState === "denied" && "Denied — browser settings me allow karein"}
                {camState === "unsupported" && "Browser supported nahi"}
                {camState === "idle" && "Waiting"}
              </p>
            </div>
            <StatusIcon state={camState} />
          </div>
        )}

        {errorMsg && (
          <p className="text-primary-foreground/90 text-xs bg-destructive/40 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-2">
        {allGranted ? (
          <button
            onClick={() => setReady(true)}
            className="w-full h-12 rounded-full bg-primary-foreground text-primary font-extrabold shadow-xl active:scale-95 transition-transform"
          >
            Start Call
          </button>
        ) : (
          <button
            onClick={request}
            disabled={micState === "checking" || camState === "checking"}
            className="w-full h-12 rounded-full bg-primary-foreground text-primary font-extrabold shadow-xl active:scale-95 transition-transform disabled:opacity-60"
          >
            {micState === "checking" || camState === "checking" ? "Checking..." : "Request Permissions"}
          </button>
        )}
        <button
          onClick={() => navigate(-1)}
          className="w-full h-11 rounded-full bg-primary-foreground/15 text-primary-foreground font-semibold active:scale-95 transition-transform"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PreCallPermissionGate;
