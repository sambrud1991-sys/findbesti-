import { useState } from "react";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REASONS = [
  "Inappropriate content",
  "Harassment or bullying",
  "Spam or scam",
  "Fake profile",
  "Underage user",
  "Other",
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName: string;
}

const ReportDialog = ({ open, onOpenChange, reportedUserId, reportedUserName }: ReportDialogProps) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason: selectedReason,
        description: description.trim() || null,
      });
      if (error) throw error;
      toast.success("Report submitted successfully");
      onOpenChange(false);
      setSelectedReason("");
      setDescription("");
    } catch {
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flag size={18} className="text-destructive" />
            Report {reportedUserName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Select a reason for reporting:</p>
          <div className="space-y-1.5">
            {REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedReason === reason
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Additional details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            className="w-full h-20 px-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            onClick={handleSubmit}
            disabled={!selectedReason || submitting}
            className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm disabled:opacity-50 hover:bg-destructive/90 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
