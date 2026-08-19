import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  Copy,
  Check,
  Users,
  Zap,
  Sparkles,
  RefreshCw,
  Crown,
  Gem,
  Star,
  Award,
  Medal,
  Trophy,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const supabase = createBrowserClient(
  "https://xolmmviokbzniodfuwev.supabase.co",
  "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ"
);

const B = "#0a0f1e"; // bg navy
const R = "#22c55e"; // green
const B2 = "#3b82f6"; // blue

export default function Earn({ onLogout }: { onLogout?: () => void }) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [isValidMember, setIsValidMember] = useState(false);
  const [profile, setProfile] = useState<any>(null); // NEW: pura profile
  const [nextClaim, setNextClaim] = useState<string | null>(null); // NEW
  const navigate = useNavigate();

  // NEW: Countdown hook
  function useCountdown(targetDate: string | null) {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
      if (!targetDate) return;
      const update = () => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        if (diff <= 0) {
          setTimeLeft("00:00:00");
          return;
        }
        const h = Math.floor(diff / 1000 / 60 / 60);
        const m = Math.floor(diff / 1000 / 60) % 60;
        const s = Math.floor(diff / 1000) % 60;
        setTimeLeft(
          `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
            .toString()
            .padStart(2, "0")}`
        );
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }, [targetDate]);
    return timeLeft;
  }
  const countdown = useCountdown(nextClaim);

  useEffect(() => {
    getProfileData();
  }, []);

  // FORMULAS
  const availableBalance =
    (profile?.balance || 0) +
    (profile?.total_deposit || 0) +
    (profile?.total_income || 0);
  const totalBalance = availableBalance;
  const totalOrders = profile?.lifetime_order || 0;
  const boughtCount = profile?.lifetime_bought || 0;
  const soldCount = profile?.lifetime_sold || 0;

  const getProfileData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*") // pura profile lelo
      .eq("user_id", user.id)
      .single();
    if (data) {
      setProfile(data);
      setReferralCode(data.referral_code || null);

      // Next claim time set karo
      if (data.last_daily_claim) {
        const last = new Date(data.last_daily_claim);
        const reset = new Date(last);
        reset.setUTCHours(0, 0, 0, 0);
        const next = new Date(reset.getTime() + 24 * 60 * 60 * 1000);
        if (last >= reset) setNextClaim(next.toISOString());
      }

      setIsValidMember((data.total_deposit || 0) >= 30);
    }
  };

  // PURANA checkCooldown delete - ab nextClaim se hoga

  const handleDailyReserve = async () => {
    if (!isValidMember)
      return toast.error(
        "Minimum deposit $30 required to activate Daily Reserve"
      );

    setClaiming(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc("claim_daily_reserve", {
      p_user_id: profile?.id, // FIX: p_uid ki jagah p_user_id
      p_percent: 0.013,
    });

    if (error) {
      toast.error(error.message);
    } else if (data?.success) {
      toast.success(`+${Number(data.new_profit).toFixed(2)} Profit Credited`);
      setNextClaim(data.next_claim_at);
      getProfileData(); // profile refresh
    } else {
      toast.error(data?.message);
      if (data?.next_claim_at) setNextClaim(data.next_claim_at);
    }
    setClaiming(false);
  };

  const refLink = referralCode
    ? `${window.location.origin}/?joinRef=${referralCode}`
    : "";

  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-3 pb-2 min-h-screen bg-white">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#fff", color: B, border: "1px solid #e5e7eb" },
        }}
      />
      {/* HEADER - CLOUD NOVA */}
      <div className="flex items-center justify-between h-14 mb-2">
        <div className="flex items-center">
          <img
            src="https://i.postimg.cc/N0gWRR7y/file-0000065008208aa040951f95e8071.png"
            className="h-10 w-10 rounded-full object-cover"
            alt="Cloud Nova"
          />
          <h1 className="text-base font-bold bg-gradient-to-r from-[#22c55e] to-[#3b82f6] bg-clip-text text-transparent leading-tight ml-3">
            CLOUD NOVA
          </h1>
        </div>
        <div></div>
      </div>

      {/* Coming Soon Card - CHOTA */}
      <div className="rounded-xl p-3 mb-2 text-center relative overflow-hidden bg-gradient-to-r from-[#22c55e] to-[#3b82f6]">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Zap size={90} className="text-white" />
        </div>
        <div className="relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-1"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <Zap size={18} style={{ color: "#FFFFFF" }} />
          </div>
          <h2 className="text-xs font-bold text-white mb-0.5">Coming Soon</h2>
          <p className="text-white/70 text-[10px] leading-tight">
            Staking, yield farming & more
          </p>
          <div
            className="mt-2 inline-flex items-center gap-1 text-white/80 text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            Development
          </div>
        </div>
      </div>

      {/* LEVEL UPGRADE HEADING LINE */}
      <div className="text-center mb-1.5">
        <p className="text-xs font-bold bg-gradient-to-r from-[#22c55e] to-[#3b82f6] bg-clip-text text-transparent">
          Level Upgrade & Earn More 💎
        </p>
        <p className="text-[9px] text-gray-400 mt-0.5">
          Invite friends and unlock higher commissions
        </p>
      </div>

      {/* Commission Tiers - 6 LEVELS CHOTTE */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { level: "Level 1", pct: "10%", icon: Trophy, iconColor: "#f59e0b" },
          { level: "Level 2", pct: "5%", icon: Medal, iconColor: "#ef4444" },
          { level: "Level 3", pct: "2%", icon: Award, iconColor: "#8b5cf6" },
          { level: "Level 4", pct: "1%", icon: Star, iconColor: "#06b6d4" },
          { level: "Level 5", pct: "0.5%", icon: Gem, iconColor: "#ec4899" },
          { level: "Level 6", pct: "0.2%", icon: Crown, iconColor: "#f97316" },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.level}
              className="rounded-lg p-2 text-center border shadow-sm overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #E8F5E9 100%)",
                borderColor: "#bbf7d0",
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mb-1"
                style={{ background: `${t.iconColor}20` }}
              >
                <Icon size={14} style={{ color: t.iconColor }} />
              </div>
              <div className="rounded-md py-1 mb-1" style={{ background: B2 }}>
                <p className="text-sm font-extrabold" style={{ color: "#fff" }}>
                  {t.pct}
                </p>
              </div>
              <p className="text-[10px] font-bold" style={{ color: "#000" }}>
                {t.level}
              </p>
            </div>
          );
        })}
      </div>

      {/* DAILY RESERVE BUTTON - LEVELS KE BAAD GAP KE SATH */}
      <div className="mt-3">
        {!isValidMember && (
          <p className="text-center text-xs mb-1" style={{ color: "#ef4444" }}>
            Deposit $30+ to activate Daily Reserve
          </p>
        )}
        {isValidMember && nextClaim && countdown !== "00:00:00" && (
          <p className="text-center text-xs mb-1" style={{ color: "#d97706" }}>
            Wait for Next Claim {countdown}
          </p>
        )}
        <button
          onClick={handleDailyReserve}
          disabled={
            claiming ||
            !isValidMember ||
            (!!nextClaim && countdown !== "00:00:00")
          }
          className="w-full flex items-center justify-center gap-1 font-bold text-sm rounded-xl h-9 text-white transition-all active:scale-95 disabled:opacity-60 mb-4"
          style={{
            background:
              claiming || (!!nextClaim && countdown !== "00:00:00")
                ? "#4b5563"
                : !isValidMember
                ? "#9ca3af"
                : R,
          }}
        >
          {claiming ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Claiming...
            </>
          ) : (
            <>
              <Sparkles size={14} /> Daily Reserve 1.3%
            </>
          )}
        </button>
      </div>
    </div>
  );
}
