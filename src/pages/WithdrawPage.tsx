import { useEffect, useState } from "react";
import { ArrowLeft, IndianRupee, Loader2, Wallet, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MIN_WITHDRAW = 100;

const WithdrawPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [available, setAvailable] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [giftsRes, tasksRes, refRes, wRes] = await Promise.all([
      supabase.from("gift_transactions").select("coins_spent").eq("receiver_id", user.id),
      supabase.from("task_completions").select("coins_earned").eq("user_id", user.id),
      supabase.from("referrals").select("coins_awarded").eq("referrer_id", user.id),
      supabase.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    ]);
    const earned =
      (giftsRes.data ?? []).reduce((s, g) => s + (g.coins_spent ?? 0), 0) +
      (tasksRes.data ?? []).reduce((s, t) => s + (t.coins_earned ?? 0), 0) +
      (refRes.data ?? []).reduce((s, r) => s + (r.coins_awarded ?? 0), 0);
    const used = (wRes.data ?? [])
      .filter((w: any) => w.status === "completed" || w.status === "pending" || w.status === "processing")
      .reduce((s: number, w: any) => s + (w.amount ?? 0), 0);
    setAvailable(Math.max(0, earned - used));
    setWithdrawals(wRes.data ?? []);
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const amt = parseInt(amount, 10);
    if (!upiId || !upiId.includes("@")) return toast.error("Sahi UPI ID daalein (e.g. name@upi)");
    if (!amt || amt < MIN_WITHDRAW) return toast.error(`Minimum ₹${MIN_WITHDRAW} withdraw kar sakte hain`);
    if (amt > available) return toast.error("Itne earnings available nahi hain");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-withdrawal", {
        body: { upi_id: upiId, amount: amt },
      });
      if (error) throw error;
      if (data?.status === "completed") toast.success(`₹${amt} ${upiId} pe bhej diya! 🎉`);
      else toast.success("Withdrawal request submit ho gaya. Jaldi process hoga.");
      setAmount("");
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "Withdrawal fail ho gaya");
    } finally {
      setSubmitting(false);
    }
  };

  const statusIcon = (s: string) => {
    if (s === "completed" || s === "approved") return <CheckCircle size={14} className="text-online" />;
    if (s === "rejected" || s === "failed") return <XCircle size={14} className="text-destructive" />;
    return <Clock size={14} className="text-accent" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-nunito">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} /></button>
        <h1 className="text-lg font-bold">Withdraw Earnings</h1>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-lg ring-1 ring-border/30">
          <div className="flex items-center gap-2 text-xs opacity-90"><Wallet size={14} /> Available Earnings</div>
          <div className="mt-2 flex items-baseline gap-1">
            <IndianRupee size={26} />
            <span className="text-4xl font-extrabold">{loading ? "…" : available}</span>
          </div>
          <p className="text-[11px] opacity-80 mt-1">1 coin = ₹1 • Min ₹{MIN_WITHDRAW}</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-3 shadow-sm">
          <h2 className="font-bold text-sm">Withdraw to UPI</h2>
          <Input
            placeholder="UPI ID (e.g. name@upi)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value.trim())}
            maxLength={80}
            className="rounded-xl"
          />
          <Input
            type="number"
            inputMode="numeric"
            placeholder={`Amount (min ${MIN_WITHDRAW})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl"
          />
          <div className="flex gap-2">
            {[100, 250, 500, available].filter((v, i, a) => v >= MIN_WITHDRAW && a.indexOf(v) === i).slice(0, 4).map((v) => (
              <Button key={v} size="sm" variant="outline" className="flex-1 rounded-lg h-8 text-xs" onClick={() => setAmount(String(v))}>
                ₹{v}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={submitting || loading || available < MIN_WITHDRAW}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold h-11 shadow-lg"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : "Withdraw Now"}
          </Button>
          {available < MIN_WITHDRAW && (
            <p className="text-[11px] text-muted-foreground text-center">
              ₹{MIN_WITHDRAW - available} aur kamao withdraw karne ke liye
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-2 shadow-sm">
          <h2 className="font-bold text-sm mb-2">Withdrawal History</h2>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
          ) : withdrawals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Abhi tak koi withdrawal nahi</p>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="min-w-0">
                  <p className="font-bold text-sm">₹{w.amount}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{w.upi_id}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold capitalize">
                  {statusIcon(w.status)} {w.status}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default WithdrawPage;
