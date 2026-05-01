import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ShieldCheck, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type DiagnosticsResponse = {
  overall_ok: boolean;
  checked_at: string;
  status: {
    key_id: { configured: boolean; prefix: string; length: number; valid_format: boolean; mode: "test" | "live" | "unknown"; has_whitespace: boolean };
    key_secret: { configured: boolean; length: number; valid_length: boolean; has_whitespace: boolean };
    auth_check: { ok: boolean; status: number; error: string | null };
  };
};

const StatusRow = ({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
    {ok ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    )}
  </div>
);

const AdminRazorpayDiagnosticsPage = () => {
  const [lastError, setLastError] = useState<string | null>(null);

  const { data, isFetching, refetch, error } = useQuery<DiagnosticsResponse>({
    queryKey: ["razorpay-diagnostics"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("razorpay-diagnostics");
      if (res.error) throw new Error(res.error.message);
      if ((res.data as any)?.error) throw new Error((res.data as any).error);
      return res.data as DiagnosticsResponse;
    },
    retry: 0,
  });

  // Capture latest error from the create-order function for context
  const probeOrderFunction = async () => {
    setLastError(null);
    try {
      const res = await supabase.functions.invoke("create-razorpay-order", {
        body: { product_type: "premium", plan_name: "__diagnostic_probe__", amount: 1 },
      });
      if (res.error) {
        setLastError(res.error.message);
      } else if ((res.data as any)?.error) {
        setLastError((res.data as any).error);
      } else {
        setLastError("No error — function reached order creation step.");
      }
    } catch (e: any) {
      setLastError(e?.message || "Unknown error");
    }
  };

  const s = data?.status;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Razorpay Diagnostics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sirf configuration health dikhata hai. Koi bhi secret value reveal nahi hoti.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Re-check
        </Button>
        <Button variant="outline" onClick={probeOrderFunction} className="gap-2">
          <Activity className="h-4 w-4" />
          Probe Order Function
        </Button>
      </div>

      {/* Overall status */}
      <Card className="p-5">
        {isFetching && !data ? (
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <div className="flex items-center gap-3 text-destructive">
            <XCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Diagnostics call failed</p>
              <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
            </div>
          </div>
        ) : data ? (
          <div className="flex items-center gap-3">
            {data.overall_ok ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-bold text-green-600">All checks passed</p>
                  <p className="text-xs text-muted-foreground">Razorpay credentials valid hain aur API authenticate ho rahi hai.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="font-bold text-yellow-600">Issues detected</p>
                  <p className="text-xs text-muted-foreground">Niche details dekhein aur secrets update karein.</p>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Card>

      {/* Detailed checks */}
      {s && (
        <Card className="p-5 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Key ID</h2>
            <Badge variant={s.key_id.mode === "live" ? "default" : "secondary"}>
              {s.key_id.mode.toUpperCase()}
            </Badge>
          </div>
          <StatusRow label="Configured" ok={s.key_id.configured} hint={s.key_id.configured ? `Length: ${s.key_id.length}` : "Secret missing"} />
          <StatusRow label="Format valid" ok={s.key_id.valid_format} hint={`Prefix: ${s.key_id.prefix || "—"} (must start with rzp_test_ or rzp_live_)`} />
          <StatusRow label="No leading/trailing whitespace" ok={!s.key_id.has_whitespace} hint={s.key_id.has_whitespace ? "Re-paste without spaces/newlines" : undefined} />

          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mt-6 mb-2">Key Secret</h2>
          <StatusRow label="Configured" ok={s.key_secret.configured} hint={s.key_secret.configured ? `Length: ${s.key_secret.length}` : "Secret missing"} />
          <StatusRow label="Length looks valid" ok={s.key_secret.valid_length} hint="Razorpay secrets are typically 20–40 chars" />
          <StatusRow label="No leading/trailing whitespace" ok={!s.key_secret.has_whitespace} />

          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mt-6 mb-2">Live Auth Probe</h2>
          <StatusRow
            label="Razorpay API authenticated"
            ok={s.auth_check.ok}
            hint={
              s.auth_check.ok
                ? `HTTP ${s.auth_check.status} from /v1/orders`
                : s.auth_check.error
                ? `Error: ${s.auth_check.error}`
                : "Not run"
            }
          />

          <p className="text-xs text-muted-foreground mt-4">
            Last checked: {new Date(data!.checked_at).toLocaleString()}
          </p>
        </Card>
      )}

      {/* Last function error */}
      <Card className="p-5">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
          Last Order Function Error
        </h2>
        {lastError ? (
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
            {lastError}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            "Probe Order Function" pe click karke create-razorpay-order ka latest error capture karein.
          </p>
        )}
      </Card>
    </div>
  );
};

export default AdminRazorpayDiagnosticsPage;
