import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import {
  ArrowLeft,
  Copy,
  Check,
  Zap,
  Clock,
  AlertCircle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ";
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const R = "#DC2626";
const B = "#1E3A8A";
const G = "#22c55e";
const BG = "#F8FAFC";
type NetTab = "bep20" | "trc20";
type PaymentInfo = {
  address: string;
  amount: number;
  qr: string;
  paymentId: string;
  currency: string;
};
type PaymentStatus =
  | "idle"
  | "generating"
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "expired";

const STATUS_LABEL: Record<PaymentStatus, { label: string; color: string }> = {
  waiting: { label: "Waiting for payment...", color: "#6B7280" },
  confirming: { label: "Confirming on chain...", color: "#3B82F6" },
  confirmed: { label: "Confirmed", color: "#22c55e" },
  sending: { label: "Sending...", color: "#8B5CF6" },
  partially_paid: { label: "Partial payment received", color: "#F97316" },
  finished: { label: "Payment complete âœ“", color: "#22c55e" },
  failed: { label: "Payment failed", color: R },
  expired: { label: "Payment expired", color: "#9CA3AF" },
  idle: { label: "", color: "" },
};

const getReferralReward = (amt: number) => {
  if (amt >= 200) return 16;
  if (amt >= 100) return 8;
  if (amt >= 50) return 5;
  if (amt >= 30) return 3;
  return 0;
};

// CHANGED: 1.2% -> 1.3%
const getNftLevel = (amt: number) => {
  if (amt >= 2000) return { label: "Level 4 - 2.0% daily", daily: amt * 0.02 };
  if (amt >= 500) return { label: "Level 3 - 1.5% daily", daily: amt * 0.015 };
  if (amt >= 100) return { label: "Level 2 - 1.3% daily", daily: amt * 0.013 };
  return { label: "Level 1 - 1.0% daily", daily: amt * 0.01 };
};

export default function Deposit({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [netTab, setNetTab] = useState<NetTab>("bep20");
  const [amount, setAmount] = useState("");
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minDeposit, setMinDeposit] = useState(30);
  const [maxDeposit, setMaxDeposit] = useState(50000);
  const [showFallback, setShowFallback] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [manualBep20Addr, setManualBep20Addr] = useState("");
  const [manualTrc20Addr, setManualTrc20Addr] = useState("");
  const [manualBep20Qr, setManualBep20Qr] = useState("");
  const [manualTrc20Qr, setManualTrc20Qr] = useState("");
  const [depositProcessed, setDepositProcessed] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const [profileData, settingsRows] = await Promise.all([
        supabase
          .from("profiles")
          .select("totp_enabled")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("admin_settings")
          .select("key, value")
          .in("key", [
            "min_deposit",
            "max_deposit",
            "usdt_bep20_address",
            "usdt_trc20_address",
            "bep20_qr_url",
            "trc20_qr_url",
          ]),
      ]);
      setTotpEnabled(!!profileData.data?.totp_enabled);
      if (settingsRows.data) {
        const m: Record<string, string> = {};
        settingsRows.data.forEach((r: { key: string; value: string }) => {
          m[r.key] = r.value ?? "";
        });
        if (m["min_deposit"]) setMinDeposit(parseFloat(m["min_deposit"]) ?? 30);
        if (m["max_deposit"]) setMaxDeposit(parseFloat(m["max_deposit"]));
        if (m["usdt_bep20_address"])
          setManualBep20Addr(m["usdt_bep20_address"]);
        if (m["usdt_trc20_address"])
          setManualTrc20Addr(m["usdt_trc20_address"]);
        if (m["bep20_qr_url"]) setManualBep20Qr(m["bep20_qr_url"]);
        if (m["trc20_qr_url"]) setManualTrc20Qr(m["trc20_qr_url"]);
      }
      setLoading(false);
    })();
  }, [navigate]);

  // DEPOSIT SUCCESS + LEVEL + REFERRAL LOGIC
  useEffect(() => {
    const processDeposit = async () => {
      if (
        (status === "finished" || status === "confirmed") &&
        payment &&
        !depositProcessed
      ) {
        setDepositProcessed(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const amt = payment.amount;

        // 1. Deposit transaction
        await supabase.from("transactions").insert({
          user_id: user.id,
          type: "deposit",
          amount: amt,
          status: "completed",
          network: netTab,
        });

        // 2. Balance + TotalDeposit
        await supabase.rpc("increment_balance", {
          p_user_id: user.id,
          p_amount: amt,
        });
        const { data: prof } = await supabase
          .from("profiles")
          .select("current_level, id, referred_by, total_deposit")
          .eq("user_id", user.id)
          .single();
        const newTotalDeposit = (prof?.total_deposit || 0) + amt;
        await supabase
          .from("profiles")
          .update({ total_deposit: newTotalDeposit })
          .eq("user_id", user.id);

        // 3. LEVEL UPGRADE
        if (prof?.current_level === 0 && amt >= 30) {
          await supabase
            .from("profiles")
            .update({ current_level: 1 })
            .eq("user_id", user.id);
          await supabase.rpc("increment_balance", {
            p_user_id: user.id,
            p_amount: 3,
          });
          await supabase.from("transactions").insert({
            user_id: user.id,
            type: "level_upgrade_bonus",
            amount: 3,
            status: "completed",
            description: "Level 1 Upgrade Bonus",
          });
          toast.success("ðŸŽ‰ Level 1 Unlocked! $3 Bonus Credited");
        }

        // 4. REFERRAL REWARD - FIXED
        if (prof?.referred_by) {
          const { count } = await supabase
            .from("transactions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("type", "deposit");
          if (count === 1) {
            const reward = getReferralReward(amt);
            if (reward > 0) {
              // FIX: profiles.id se upline ka user_id nikalo
              const { data: uplineProf } = await supabase
                .from("profiles")
                .select("user_id")
                .eq("id", prof.referred_by)
                .single();

              if (uplineProf?.user_id) {
                await supabase.rpc("increment_balance", {
                  p_user_id: uplineProf.user_id, // ✅ ab user_id ja raha
                  p_amount: reward,
                });
                await supabase.from("transactions").insert({
                  user_id: uplineProf.user_id, // ✅ ab user_id ja raha
                  type: "referral_reward",
                  amount: reward,
                  status: "completed",
                  description: `Referral Reward $${reward} From: ${user.id}`,
                });
                toast.success(`Referral Reward $${reward} sent to upline`);
              }
            }
          }
        }
        toast.success(`Deposit $${amt} Successful!`);
      }
    };
    processDeposit();
  }, [status, payment, depositProcessed, netTab]);

  if (loading || totpEnabled === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BG }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${G} transparent` }}
        />
      </div>
    );
  }

  const parsedAmt = Number(amount);
  const nftInfo =
    !isNaN(parsedAmt) && parsedAmt >= minDeposit
      ? getNftLevel(parsedAmt)
      : null;

  const handleGenerate = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!amount || isNaN(parsedAmt) || parsedAmt < minDeposit) {
      toast.error(`Minimum deposit is $${minDeposit} USDT`);
      return;
    }
    if (parsedAmt > maxDeposit) {
      toast.error(`Maximum deposit is $${maxDeposit.toLocaleString()} USDT`);
      return;
    }
    setStatus("generating");
    setPayment(null);
    setShowFallback(false);
    setDepositProcessed(false);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmt,
          userId: user.id,
          network: netTab === "bep20" ? "usdtbep" : "usdttrc",
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok || data.error) {
        const manualAddr =
          netTab === "bep20" ? manualBep20Addr : manualTrc20Addr;
        if (manualAddr) {
          setShowFallback(true);
          toast("Auto deposit unavailable. Use manual address.", {
            icon: "â„¹ï¸",
          });
        } else {
          toast.error(data.error ?? "Failed to generate payment address");
        }
        setStatus("idle");
        return;
      }
      setPayment({
        address: data.address!,
        amount: data.amount!,
        qr: data.qr!,
        paymentId: data.paymentId!,
        currency: data.currency!,
      });
      setStatus("waiting");
      startPolling(data.paymentId!);
    } catch {
      const manualAddr = netTab === "bep20" ? manualBep20Addr : manualTrc20Addr;
      if (manualAddr) {
        setShowFallback(true);
        toast("Auto deposit unavailable. Use manual address.", {
          icon: "â„¹ï¸",
        });
      } else {
        toast.error("Network error. Please try again.");
      }
      setStatus("idle");
    }
  };

  // FIXED: startPolling with proper brackets
  const startPolling = (paymentId: string) => {
    setPolling(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 120;

    const poll = async () => {
      try {
        const res = await fetch(`/api/nowpayments/status/${paymentId}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as any;
        const st = data.status ?? "waiting";
        setStatus(st as PaymentStatus);

        if (st === "finished" || st === "confirmed") {
          setPolling(false);
          return;
        }

        if (st === "failed" || st === "expired") {
          toast.error(`Payment ${st}. Please try again.`);
          setPolling(false);
          return;
        }
      } catch (err) {
        console.error("Polling error", err);
      }

      attempts++;
      if (attempts < MAX_ATTEMPTS) setTimeout(poll, 30000);
      else setPolling(false);
    };

    setTimeout(poll, 30000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };
  const handleReset = () => {
    setPayment(null);
    setStatus("idle");
    setAmount("");
    setPolling(false);
    setShowFallback(false);
    setDepositProcessed(false);
  };
  const currentManualAddr =
    netTab === "bep20" ? manualBep20Addr : manualTrc20Addr;
  const currentManualQr = netTab === "bep20" ? manualBep20Qr : manualTrc20Qr;

  return (
    <div className="min-h-screen pb-8" style={{ background: BG }}>
      <Toaster position="top-right" />
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white flex items-center justify-center"
          >
            <ArrowLeft size={18} style={{ color: B }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: B }}>
            Deposit USDT
          </h1>
        </div>

        {/* NETWORK TABS */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setNetTab("bep20")}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: netTab === "bep20" ? G : "#fff",
              color: netTab === "bep20" ? "#fff" : B,
            }}
          >
            BEP20
          </button>
          <button
            onClick={() => setNetTab("trc20")}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: netTab === "trc20" ? G : "#fff",
              color: netTab === "trc20" ? "#fff" : B,
            }}
          >
            TRC20
          </button>
        </div>

        {/* AMOUNT INPUT */}
        {!payment && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">
              Amount USDT
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min $${minDeposit}`}
              className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none"
            />
            {nftInfo && (
              <p className="text-xs mt-2" style={{ color: G }}>
                {nftInfo.label} = ${nftInfo.daily.toFixed(2)}/day
              </p>
            )}
            <button
              onClick={handleGenerate}
              disabled={status === "generating"}
              className="w-full mt-3 py-3 rounded-xl font-bold text-white"
              style={{ background: G }}
            >
              {status === "generating" ? "Generating..." : "Generate Address"}
            </button>
          </div>
        )}

        {/* PAYMENT INFO */}
        {payment && (
          <div className="bg-white rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">
              Send {payment.amount} {payment.currency}
            </p>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl mb-2">
              <p className="text-xs font-mono break-all">{payment.address}</p>
              <button onClick={() => handleCopy(payment.address)}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: STATUS_LABEL[status].color }}
            >
              <Clock size={12} />
              {STATUS_LABEL[status].label}
            </div>
            <button
              onClick={handleReset}
              className="w-full mt-3 py-2 rounded-xl text-sm font-bold border"
            >
              New Deposit
            </button>
          </div>
        )}

        {/* MANUAL FALLBACK */}
        {showFallback && currentManualAddr && (
          <div className="bg-yellow-50 rounded-2xl p-4 mt-4">
            <p className="text-xs font-bold mb-1" style={{ color: "#B45309" }}>
              Manual Deposit
            </p>
            <p className="text-xs break-all">{currentManualAddr}</p>
          </div>
        )}
      </div>
    </div>
  );
}
