import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import {
  Clock,
  Lock,
  Wallet,
  Check,
  ArrowLeftRight,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ";
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const R = "#DC2626";
const B = "#1E3A8A";
const G = "#22c55e";
const BG = "linear-gradient(135deg, #22c55e 0%, #1E3A8A 100%)";
type Network = "BEP20" | "TRC20";

type WDSettings = {
  min_withdraw: number;
  max_withdraw: number;
  withdraw_process_hours: number;
};
const DEFAULT_WD: WDSettings = {
  min_withdraw: 30,
  max_withdraw: 10000,
  withdraw_process_hours: 72,
};

export default function Withdraw({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0); // YE AB AVAILABLE BALANCE HAI
  const [balLoading, setBalLoading] = useState(true);
  const [wdSettings, setWdSettings] = useState<WDSettings>(DEFAULT_WD);
  const [profile, setProfile] = useState<any>(undefined);
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null);
  const [hasPending, setHasPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [network, setNetwork] = useState<Network>("TRC20");
  const [amount, setAmount] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // FIX: Error 3 second me auto hide
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => {
      setErrorMsg("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const [profileData, settingsRows, pendingData] = await Promise.all([
        supabase
         .from("profiles")
         .select(
            "wallet_balance, total_deposit, total_income, totp_enabled, bep20_address, trc20_address, bep20_locked_until, trc20_locked_until"
          )
         .eq("user_id", user.id)
         .single(),
        supabase.from("admin_settings").select("key, value"),
        supabase
         .from("withdraw_requests")
         .select("id")
         .eq("user_id", user.id)
         .eq("status", "pending")
         .limit(1),
      ]);

      // FIXED: wallet_balance + total_income = Daily Reserve add
      const wallet = parseFloat(String(profileData.data?.wallet_balance?? 0)) || 0;
      const income = parseFloat(String(profileData.data?.total_income?? 0)) || 0; // <-- YE LINE THEEK KI
      const availableBalance = wallet + income; // SAHI

      setBalance(availableBalance); // FIXED
      setTotpEnabled(!!profileData.data?.totp_enabled);
      setProfile(profileData.data);
      setHasPending((pendingData.data?.length || 0) > 0);

      if (settingsRows.data) {
        const m: Record<string, string> = {};
        settingsRows.data.forEach((r: any) => {
          m[r.key] = r.value?? "";
        });
        setWdSettings({
          min_withdraw: parseFloat(m["min_withdraw"])?? 30,
          max_withdraw: parseFloat(m["max_withdraw"])?? 10000,
          withdraw_process_hours: parseFloat(m["withdraw_process_hours"])?? 72,
        });
      }
      setBalLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    const lockTime =
      network === "BEP20"
       ? profile?.bep20_locked_until
        : profile?.trc20_locked_until;
    if (!lockTime) {
      setTimeLeft("");
      return;
    }
    const interval = setInterval(() => {
      const diff = new Date(lockTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Unlocked");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 1000 / 60 / 60);
      const m = Math.floor(diff / 1000 / 60) % 60;
      const s = Math.floor(diff / 1000) % 60;
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [profile?.bep20_locked_until, profile?.trc20_locked_until, network]);

  if (balLoading || profile === undefined || totpEnabled === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: BG }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `#fff transparent` }}
        />
      </div>
    );
  }

  const lockTime =
    network === "BEP20"
     ? profile?.bep20_locked_until
      : profile?.trc20_locked_until;
  const isLocked = lockTime? new Date(lockTime) > new Date() : false;
  const selectedAddress =
    network === "BEP20"? profile?.bep20_address : profile?.trc20_address;
  const hasBind =!!selectedAddress;
  const bep20Addr = profile?.bep20_address;
  const trc20Addr = profile?.trc20_address;

  const amt = Number(amount);
  const feePercent = network === "BEP20"? 5 : 8;
  const fee = parseFloat(((amt * feePercent) / 100).toFixed(2));
  const netAmt = parseFloat((amt - fee).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (hasPending) {
      setErrorMsg(
        "You already have 1 pending withdrawal. New request is blocked."
      );
      return;
    }
    if (isLocked) {
      setErrorMsg(`Security lock is active. ${timeLeft} remaining.`);
      return;
    }
    if (!hasBind) {
      setErrorMsg("Please bind a withdrawal address from Profile first.");
      return;
    }
    if (!amount.trim() || isNaN(amt)) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }
    if (amt < wdSettings.min_withdraw) {
      setErrorMsg(`Minimum withdrawal amount is $${wdSettings.min_withdraw}.`);
      return;
    }
    if (amt > balance) {
      // YE AB AVAILABLE BALANCE CHECK KAREGA
      setErrorMsg("Insufficient balance.");
      return;
    }
    if (totpCode.length!== 6) {
      setErrorMsg("Please enter a valid 6-digit Google Authenticator code.");
      return;
    }
    if (password.length === 0) {
      setErrorMsg("Please enter your account password.");
      return;
    }

    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.rpc("request_withdraw", {
      p_user_id: user.id,
      p_amount: amt,
      p_network: network,
      p_address: selectedAddress,
    });

    setSubmitting(false);
    if (error || (data && data.startsWith("Error:"))) {
      toast.error((data || error.message).replace("Error: ", ""));
      return;
    }

    setSubmitted(true);
    toast.success(data || "Withdrawal request submitted successfully.");
  };

  const inp =
    "w-full bg-white border-2 border-black rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-black font-semibold";

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: BG }}
      >
        <Toaster />
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#E8F5E9" }}
          >
            <Check size={32} style={{ color: G }} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-black">
            Withdrawal Submitted
          </h2>
          <p className="text-sm text-gray-600 mb-1">
            Status: <span className="font-bold text-yellow-600">Pending</span>
          </p>
          <p className="text-xs text-gray-600 mb-1">
            Amount:{" "}
            <span className="font-semibold text-black">
              {amt.toFixed(2)} USDT ({network})
            </span>
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Fee: ${fee.toFixed(2)} | You will receive:{" "}
            <span className="font-semibold text-green-600">
              ${netAmt.toFixed(2)}
            </span>
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white text-sm"
            style={{ background: G }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <Toaster />
      <div className="max-w-md mx-auto px-4 pt-3">
        <div
          className="rounded-2xl p-3 mb-3 bg-white/10 backdrop-blur-md border-white/20"
          style={{ background: B }}
        >
          <div>
            <p className="text-xs text-white opacity-80 mb-0.5">
              Available Balance
            </p>
            <p className="text-2xl font-extrabold text-white">
              ${balance.toFixed(2)} {/* CHANGED */}
            </p>
          </div>
          <div className="flex justify-between text-xs text-white opacity-80 mt-1">
            <p>Min: {wdSettings.min_withdraw}</p>
            <p>Max: {wdSettings.max_withdraw.toLocaleString()}</p>
          </div>
        </div>

        {/* TIMER UI - 100% FIXED AS PER SCREENSHOT */}
        {isLocked && hasBind? (
          <div className="relative mt-2">
            {/* Background blurred form - halka dikhega */}
            <div className="absolute inset-0 opacity-10 blur-md pointer-events-none rounded-2xl">
              <div className="bg-white rounded-2xl p-4 border-2 border-black h-full"></div>
            </div>

            {/* Timer Card */}
            <div className="relative bg-gradient-to-br from-yellow-800 to-yellow-900 border-2 border-yellow-500 rounded-2xl p-6 shadow-2xl">
              <p className="font-bold text-yellow-300 text-xl mb-3 text-center">
                🔒 Security Lock Active
              </p>
              <p className="text-4xl font-mono text-white mb-3 text-center">
                {timeLeft}
              </p>

              {/* FIX 1: Green Bold English Line */}
              <p
                className="text-sm font-extrabold mb-4 text-center"
                style={{ color: G }}
              >
                Please wait until 72 hours are completed
              </p>

              {/* FIX 2: Both Addresses Black Bold on Dark BG */}
              <div className="space-y-3 text-left bg-black/50 p-3 rounded-xl border-yellow-700/50">
                {bep20Addr && (
                  <div>
                    <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">
                      BEP20 Address
                    </p>
                    <p className="text-xs font-mono text-white font-bold break-all">
                      {bep20Addr}
                    </p>
                  </div>
                )}
                {trc20Addr && (
                  <div>
                    <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">
                      TRC20 Address
                    </p>
                    <p className="text-xs font-mono text-white font-bold break-all">
                      {trc20Addr}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-2xl border-2 border-black">
            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMsg && (
                <div className="bg-red-600 border-2 border-red-700 p-3 rounded-xl flex items-center gap-2 mb-2 animate-fade-in">
                  <AlertCircle size={16} className="text-white" />
                  <p className="text-sm font-bold text-white">{errorMsg}</p>
                </div>
              )}
              {hasPending && (
                <div className="bg-red-500/20 p-3 rounded-xl text-sm font-bold text-red-700 mb-3 border-2 border-red-400">
                  ⚠️ You already have 1 pending withdrawal. New request is
                  blocked.
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-black mb-1.5 block flex items-center gap-1.5">
                  <ArrowLeftRight size={12} /> Select Network
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setNetwork("BEP20")}
                    className="flex-1 py-2 text-sm font-bold rounded-xl transition border-2"
                    style={{
                      background: network === "BEP20"? B : "#fff",
                      color: network === "BEP20"? "#fff" : B,
                      borderColor: B,
                    }}
                  >
                    BEP20
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetwork("TRC20")}
                    className="flex-1 py-2 text-sm font-bold rounded-xl transition border-2"
                    style={{
                      background: network === "TRC20"? B : "#fff",
                      color: network === "TRC20"? "#fff" : B,
                      borderColor: B,
                    }}
                  >
                    TRC20
                  </button>
                </div>
                <div className="rounded-xl bg-gray-100 px-3 py-2 border-2 border-black">
                  <p className="text-xs text-gray-700 uppercase font-bold">
                    {network} Bound Address
                  </p>
                  <p className="text-xs font-mono text-black break-all">
                    {selectedAddress || "--- Not Bound ---"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-black mb-1 block">
                  Amount (USDT)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={`Min ${wdSettings.min_withdraw}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={inp + " flex-1"}
                  />
                  <div className="bg-gray-100 rounded-xl px-3 py-2.5 text-xs font-bold text-black flex items-center border-2 border-black">
                    Total: ${balance.toFixed(2)} {/* CHANGED */}
                  </div>
                </div>
                {amt > 0 && (
                  <p className="text-xs text-gray-700 mt-1 font-semibold">
                    Fee: {feePercent}% = ${fee.toFixed(2)} | You will receive:{" "}
                    <span className="font-bold text-green-600">
                      ${netAmt.toFixed(2)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-black mb-1 block flex items-center gap-1.5">
                  <Lock size={11} /> Google Authenticator Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={inp + " text-center tracking-widest font-mono"}
                  maxLength={6}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-black mb-1 block flex items-center gap-1.5">
                  <KeyRound size={11} /> Account Password
                </label>
                <input
                  type="password"
                  placeholder="Enter account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inp}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg mt-2"
                style={{ background: `linear-gradient(135deg, ${G}, ${B})` }}
              >
                {submitting? "Processing..." : `Submit Withdrawal`}
              </button>
            </form>
          </div>
        )}

        <div className="h-4"></div>
      </div>
    </div>
  );
}