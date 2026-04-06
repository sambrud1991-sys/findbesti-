import { useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminVerificationsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-verifications", filter],
    queryFn: async () => {
      let query = supabase
        .from("profile_verifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;

      // Fetch display names
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const profiles: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase.rpc("get_public_profiles");
        (profileData || []).forEach((p: any) => {
          profiles[p.user_id] = p.display_name || "User";
        });
      }
      return (data || []).map((r: any) => ({ ...r, display_name: profiles[r.user_id] || "User" }));
    },
  });

  const handleAction = async (id: string, userId: string, action: "approved" | "rejected") => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("profile_verifications")
        .update({ status: action, admin_notes: adminNotes || null, reviewed_by: (await supabase.auth.getUser()).data.user?.id })
        .eq("id", id);
      if (error) throw error;

      if (action === "approved") {
        // Update profile is_verified - use admin RLS policy
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ is_verified: true } as any)
          .eq("user_id", userId);
        if (profileErr) console.error("Profile update error:", profileErr);
      }

      toast.success(action === "approved" ? "User verified!" : "Verification rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      setSelectedRequest(null);
      setAdminNotes("");
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      pending: { color: "bg-amber-500/15 text-amber-600", icon: Clock },
      approved: { color: "bg-green-500/15 text-green-600", icon: CheckCircle },
      rejected: { color: "bg-red-500/15 text-red-600", icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color}`}>
        <Icon size={10} /> {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} className="text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Verification Requests</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
              filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !requests?.length ? (
        <div className="text-center py-12">
          <ShieldCheck size={48} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} verification requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <div
              key={req.id}
              className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => { setSelectedRequest(req); setAdminNotes(req.admin_notes || ""); }}
            >
              <img src={req.selfie_url} alt="Selfie" className="w-14 h-14 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate">{req.display_name}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {statusBadge(req.status)}
              <Eye size={16} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <img src={selectedRequest.selfie_url} alt="Selfie" className="w-full aspect-square object-cover rounded-xl" />
              <div>
                <p className="font-bold text-foreground">{selectedRequest.display_name}</p>
                <p className="text-xs text-muted-foreground">Status: {statusBadge(selectedRequest.status)}</p>
              </div>
              {selectedRequest.status === "pending" && (
                <>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Admin notes (optional, visible to user if rejected)"
                    className="w-full bg-muted rounded-xl p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, "rejected")}
                      disabled={processing}
                      className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm disabled:opacity-50"
                    >
                      {processing ? "..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleAction(selectedRequest.id, selectedRequest.user_id, "approved")}
                      disabled={processing}
                      className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
                    >
                      {processing ? "..." : "Approve ✓"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationsPage;
