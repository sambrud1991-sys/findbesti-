import { useState, useRef } from "react";
import { ArrowLeft, Camera, CheckCircle, Clock, XCircle, ShieldCheck, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const VerificationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: verification, isLoading } = useQuery({
    queryKey: ["verification", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_verifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("is_verified").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user || !selectedFile) return;
    setUploading(true);
    try {
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/selfie_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("verification-selfies")
        .upload(path, selectedFile, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("verification-selfies").getPublicUrl(path);

      const { error: insertErr } = await supabase.from("profile_verifications").insert({
        user_id: user.id,
        selfie_url: urlData.publicUrl,
        status: "pending",
      });
      if (insertErr) throw insertErr;

      toast.success("Verification request submitted!");
      queryClient.invalidateQueries({ queryKey: ["verification"] });
      setSelectedFile(null);
      setPreview(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setUploading(false);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Under Review", desc: "Your selfie is being reviewed by our team." },
    approved: { icon: CheckCircle, color: "text-online", bg: "bg-online/10", label: "Verified ✓", desc: "Your profile is now verified!" },
    rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected", desc: "Please submit a new selfie." },
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">Profile Verification</h1>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Info Card */}
        <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={24} className="text-primary" />
            <h2 className="font-bold text-foreground">Get Verified</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload a clear selfie to verify your identity. Verified profiles get a badge and appear more trustworthy.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <li>✅ Clear face photo, good lighting</li>
            <li>✅ No filters, sunglasses, or masks</li>
            <li>✅ Should match your profile photo</li>
          </ul>
        </div>

        {/* Already verified */}
        {profile?.is_verified && (
          <div className="bg-online/10 rounded-2xl p-6 text-center border border-online/20">
            <CheckCircle size={48} className="text-online mx-auto mb-3" />
            <h3 className="font-bold text-lg text-foreground">You're Verified!</h3>
            <p className="text-sm text-muted-foreground mt-1">Your profile has the verified badge.</p>
          </div>
        )}

        {/* Current verification status */}
        {verification && !profile?.is_verified && (
          <div className={`${statusConfig[verification.status as keyof typeof statusConfig]?.bg} rounded-2xl p-4 border border-border/30`}>
            <div className="flex items-center gap-3">
              {(() => {
                const config = statusConfig[verification.status as keyof typeof statusConfig];
                const Icon = config?.icon || Clock;
                return <Icon size={24} className={config?.color} />;
              })()}
              <div>
                <h3 className="font-bold text-foreground">
                  {statusConfig[verification.status as keyof typeof statusConfig]?.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {statusConfig[verification.status as keyof typeof statusConfig]?.desc}
                </p>
                {verification.admin_notes && (
                  <p className="text-xs text-destructive mt-1">Note: {verification.admin_notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload section - show if no pending request */}
        {(!verification || verification.status === "rejected") && !profile?.is_verified && (
          <div className="space-y-4">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileSelect}
              className="hidden"
            />

            {preview ? (
              <div className="relative">
                <img src={preview} alt="Selfie preview" className="w-full aspect-square object-cover rounded-2xl" />
                <button
                  onClick={() => { setPreview(null); setSelectedFile(null); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
                >
                  <XCircle size={18} className="text-destructive" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-square rounded-2xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 transition-colors"
              >
                <Camera size={48} className="text-primary/50" />
                <span className="text-sm font-medium text-muted-foreground">Tap to take a selfie</span>
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;
