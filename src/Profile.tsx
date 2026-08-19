import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import { toast, Toaster } from "react-hot-toast";
import MyTeam from "./MyTeam";
import { QRCodeSVG } from "qrcode.react";
import { authenticator } from "otplib";
import {
  LogOut,
  Shield,
  Users,
  ShoppingBag,
  Copy,
  Check,
  Settings,
  Phone,
  Globe,
  Hash,
  Calendar,
  ChevronRight,
  Mail,
  Lock,
  Wallet,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Camera,
  Upload,
  User,
  DollarSign,
} from "lucide-react";
const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ";
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const R = "#DC2626";
const B = "#1E3A8A";
const B2 = "#2563EB";
const G = "#22c55e";
const BG = "#FFFFFF";
type Profile = {
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  referral_code: string | null;
  role: string | null;
  level: number | null;
  created_at: string | null;
  avatar_url: string | null;
  balance: number | null;
  total_deposit: number | null;
  total_withdraw: number | null;
  uid: string | null;
  totp_enabled: boolean | null;
  totp_secret: string | null;
  withdraw_address_trc: string | null;
  withdraw_address_bep: string | null;
  withdraw_lock_until: string | null;
  bep20_locked_until: string | null;
};
type BindAddr = {
  bep20_address: string | null;
  trc20_address: string | null;
  bind_at: string | null;
};
export default function ProfileTab() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [supaUid, setSupaUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [secret, setSecret] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [l1Count, setL1Count] = useState(0);
  const [l2Count, setL2Count] = useState(0);
  const [l3Count, setL3Count] = useState(0);
  const [l1Members, setL1Members] = useState<any[]>([]);
  const [l2Members, setL2Members] = useState<any[]>([]);
  const [l3Members, setL3Members] = useState<any[]>([]);
  const [bindAddr, setBindAddr] = useState<BindAddr | null>(null);
  const [bep20Input, setBep20Input] = useState("");
  const [trc20Input, setTrc20Input] = useState("");
  const [savingBind, setSavingBind] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetup, setTotpSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQr, setTotpQr] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState(""); // FIX 1: Naya state for inline error

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(user.id);
      setSupaUid(user.id);
      let { data: profData, error: profError } = await supabase
        .from("profiles")
        .select(
          "id, user_id, uid, totp_enabled, totp_secret, referral_code, balance, total_deposit, total_withdraw, total_income, daily_income, team_income, referral_income, orders_count, bought_count, sold_count, withdraw_address_bep, withdraw_address_trc, withdraw_lock_until, bep20_locked_until, country_code, phone, email, full_name, level, created_at, avatar_url, role"
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (profError) {
        alert("PROFILE FETCH ERROR: " + profError.message);
        console.error("Profile fetch error:", profError);
        setLoading(false);
        return;
      }
      if (!profData) {
        alert("PROFILE NOT FOUND IN DB. Signup me insert fail hua hai.");
      }
      const finalPhone = profData?.phone || user.phone || null;
      const finalCountry =
        profData?.country_code || (user.phone?.startsWith("+92") ? "PK" : null);
      const finalUid = profData?.user_id?.slice(0, 8);
      const myId = profData?.id;
      if (myId) {
        const { data: l1, error: l1Err } = await supabase
          .from("profiles")
          .select(
            "id, user_id, username, email, full_name, wallet_balance, uid"
          )
          .eq("referred_by", myId);
        if (l1Err) alert("L1 FETCH ERROR: " + l1Err.message);
        const { data: l2, error: l2Err } =
          l1 && l1.length > 0
            ? await supabase
                .from("profiles")
                .select(
                  "id, user_id, username, email, full_name, wallet_balance, uid"
                )
                .in(
                  "referred_by",
                  l1.map((x) => x.id)
                )
            : { data: [] };
        if (l2Err) alert("L2 FETCH ERROR: " + l2Err.message);
        const { data: l3, error: l3Err } =
          l2 && l2.length > 0
            ? await supabase
                .from("profiles")
                .select(
                  "id, user_id, username, email, full_name, wallet_balance, uid"
                )
                .in(
                  "referred_by",
                  l2.map((x) => x.id)
                )
            : { data: [] };
        if (l3Err) alert("L3 FETCH ERROR: " + l3Err.message);
        setL1Count(l1?.length || 0);
        setL2Count(l2?.length || 0);
        setL3Count(l3?.length || 0);
        setL1Members(l1 || []);
        setL2Members(l2 || []);
        setL3Members(l3 || []);
      }
      setProfile({
        name: profData?.full_name || user.email?.split("@")[0] || "User",
        email: profData?.email || user.email,
        phone: finalPhone,
        country: finalCountry,
        referral_code: profData?.referral_code || null,
        role: user.user_metadata?.role === "admin" ? "admin" : null,
        level: profData?.level || 0,
        created_at: profData?.created_at || user.created_at,
        avatar_url: profData?.avatar_url || null,
        balance: profData?.balance ?? 0,
        total_deposit: profData?.total_deposit ?? 0,
        total_withdraw: profData?.total_withdraw ?? 0,
        uid: finalUid,
        totp_enabled: profData?.totp_enabled,
        totp_secret: profData?.totp_secret,
        withdraw_address_trc: profData?.withdraw_address_trc,
        withdraw_address_bep: profData?.withdraw_address_bep,
        withdraw_lock_until: profData?.withdraw_lock_until,
        bep20_locked_until: profData?.bep20_locked_until,
      });
      setBep20Input(profData?.withdraw_address_bep ?? "");
      setTrc20Input(profData?.withdraw_address_trc ?? "");
      setTotpEnabled(!!profData?.totp_enabled);
      setLoading(false);
    })();
  }, [navigate]);
  useEffect(() => {
    const lockTime =
      profile?.bep20_locked_until || profile?.withdraw_lock_until;
    if (!lockTime) return;
    const interval = setInterval(() => {
      const diff = new Date(lockTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("00h 00m 00s");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 1000 / 60 / 60);
      const m = Math.floor(diff / 1000 / 60) % 60;
      const s = Math.floor(diff / 1000) % 60;
      setTimeLeft(
        `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(
          s
        ).padStart(2, "0")}s`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [profile?.bep20_locked_until, profile?.withdraw_lock_until]);
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supaUid) return;
    setUploadingAvatar(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${supaUid}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert("AVATAR UPLOAD ERROR: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", supaUid);
    if (updateError) {
      alert("AVATAR SAVE ERROR: " + updateError.message);
      setUploadingAvatar(false);
      return;
    }
    setProfile((prev) => (prev ? { ...prev, avatar_url: avatarUrl } : null));
    setUploadingAvatar(false);
    toast.success("Profile picture updated âœ“");
  };
  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };
  const refLink = profile?.referral_code
    ? `${window.location.origin}/ref/${profile.referral_code}`
    : "";
  const handleCopy = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleCopyUid = () => {
    if (!profile?.uid) return;
    navigator.clipboard.writeText(profile.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };
  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };
  const saveBindAddr = async () => {
    if (!supaUid) return;
    if (!bep20Input.trim() && !trc20Input.trim()) {
      alert("Please enter at least one address");
      return;
    }
    setSavingBind(true);
    const lockTime = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const { error } = await supabase
      .from("profiles")
      .update({
        bep20_address: bep20Input.trim() || null,
        bep20_locked_until: lockTime.toISOString(),
        withdraw_address_bep: bep20Input.trim() || null,
        withdraw_address_trc: trc20Input.trim() || null,
        withdraw_lock_until: lockTime.toISOString(),
      })
      .eq("user_id", supaUid);
    if (error) {
      alert("BIND ADDRESS ERROR: " + error.message);
      setSavingBind(false);
      return;
    }
    setSavingBind(false);
    toast.success("Address Saved. 72 Hour Lock Reset");
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            withdraw_address_bep: bep20Input,
            withdraw_address_trc: trc20Input,
            withdraw_lock_until: lockTime.toISOString(),
            bep20_locked_until: lockTime.toISOString(),
          }
        : null
    );
  };
  const generate2FA = () => {
    setTotpError("");
    const newSecret = authenticator.generateSecret();
    setSecret(newSecret);
  }; // FIX: error reset
  const verifyTotp = async () => {
    setTotpError(""); // FIX 2: Pehle error clear
    const isValid = authenticator.verify({ token: totpCode, secret });
    if (!isValid) {
      setTotpError("Invalid Code. Please check Google Authenticator app");
      return;
    } // FIX 2: alert ki jagah state
    setTotpVerifying(true);
    const { error } = await supabase
      .from("profiles")
      .update({ totp_secret: secret, totp_enabled: true })
      .eq("user_id", supaUid);
    if (error) {
      setTotpError("2FA SAVE ERROR: " + error.message);
      setTotpVerifying(false);
      return;
    } // FIX 2: alert ki jagah state
    toast.success("2FA Enabled");
    setTotpEnabled(true);
    setSecret("");
    setTotpCode("");
    setProfile((prev) => (prev ? { ...prev, totp_enabled: true } : null));
    setTotpVerifying(false);
  };
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: BG }}
      >
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${G} transparent` }}
        />
      </div>
    );
  }
  const displayName = profile?.name || profile?.email?.split("@")[0] || "User";
  const initial = displayName[0].toUpperCase();
  const isAdmin = profile?.role === "admin";
  const shortUid = profile?.uid || "------";
  const hasBind = !!(
    profile?.withdraw_address_trc || profile?.withdraw_address_bep
  );
  const unlocked = profile?.bep20_locked_until
    ? new Date(profile.bep20_locked_until) <= new Date()
    : false;
  const inp =
    "w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 text-gray-800 placeholder-gray-400 font-mono shadow-sm";
  const btnGradient =
    "w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all active:scale-95 shadow-sm";
  const btnOutline =
    "w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all active:scale-95 shadow-sm border";
  // === TEAM LIST RENDER ===
  if (activeSection) {
    if (activeSection === "team") {
      return (
        <div className="h-screen flex-col" style={{ background: BG }}>
          <Toaster position="top-right" />
          <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white shrink-0">
            <button
              onClick={() => setActiveSection(null)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft size={18} style={{ color: B }} />
            </button>
            <h1
              className="text-base font-bold text-center flex-1"
              style={{ color: B }}
            >
              My Team
            </h1>
            <div className="w-9" />
          </div>
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="rounded-2xl p-3 bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <p className="font-bold text-sm">Team Overview</p>
                </div>
                <span className="bg-white text-[#0f172a] text-xs font-bold px-3 py-1 rounded-full">
                  {l1Count + l2Count + l3Count} total
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 p-2 rounded-xl text-center">
                  <p className="text-xs opacity-80">Total A Members</p>
                  <p className="text-xl font-extrabold">{l1Count}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-xl text-center">
                  <p className="text-xs opacity-80">Total B Members</p>
                  <p className="text-xl font-extrabold">{l2Count}</p>
                </div>
                <div className="bg-white/10 p-2 rounded-xl text-center">
                  <p className="text-xs opacity-80">Total C Members</p>
                  <p className="text-xl font-extrabold">{l3Count}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-48 flex-1 overflow-y-auto">
            <div className="bg-white rounded-xl p-3 shadow-sm border">
              <p
                className="text-sm font-bold mb-1 sticky top-0 bg-white py-1 z-10"
                style={{ color: B }}
              >
                A Enthusiast: {l1Count}
              </p>
              {l1Members.length === 0 ? (
                <p className="text-xs text-gray-400 mb-2">No members yet</p>
              ) : (
                l1Members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#22c55e] flex items-center justify-center">
                        <User size={12} color="#fff" />
                      </div>
                      <span className="font-medium truncate max-w-[120px]">
                        {m.username || m.full_name || m.email}
                      </span>
                    </div>
                    <span className="font-bold text-green-600">
                      ${Number(m.wallet_balance || 0).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
              <p
                className="text-sm font-bold mb-0.1 mt-2 sticky top-0 bg-white py-1 z-10"
                style={{ color: B }}
              >
                B Enthusiast: {l2Count}
              </p>
              {l2Members.length === 0 ? (
                <p className="text-xs text-gray-400 mb-2">No members yet</p>
              ) : (
                l2Members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
                        <User size={12} color="#fff" />
                      </div>
                      <span className="font-medium truncate max-w-[120px]">
                        {m.username || m.full_name || m.email}
                      </span>
                    </div>
                    <span className="font-bold text-green-600">
                      ${Number(m.wallet_balance || 0).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
              <p
                className="text-sm font-bold mb-0.1 mt-2 sticky top-0 bg-white py-1 z-10"
                style={{ color: B }}
              >
                C Enthusiast: {l3Count}
              </p>
              {l3Members.length === 0 ? (
                <p className="text-xs text-gray-400">No members yet</p>
              ) : (
                l3Members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 text-xs last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#8b5cf6] flex items-center justify-center">
                        <User size={12} color="#fff" />
                      </div>
                      <span className="font-medium truncate max-w-[120px]">
                        {m.username || m.full_name || m.email}
                      </span>
                    </div>
                    <span className="font-bold text-green-600">
                      ${Number(m.wallet_balance || 0).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
              <div className="h-4"></div>
            </div>
          </div>
        </div>
      );
    }
    const titles: any = {
      team: "My Team",
      nft: "NFT Collections",
      security: "Security",
      settings: "Account Settings",
      bind: "Withdrawal Address Bind",
      admin: "Admin Panel",
    };
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            activeSection === "bind" ||
            activeSection === "security" ||
            activeSection === "settings"
              ? `linear-gradient(135deg, ${G} 0%, ${B} 100%)`
              : BG,
        }}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#fff",
              color: B,
              border: "1px solid #e0e0e0",
            },
          }}
        />
        <div
          className="sticky top-0 z-10 flex items-center gap-3 p-4 border-b border-gray-100"
          style={{ background: "#fff" }}
        >
          <button
            onClick={() => setActiveSection(null)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft size={18} style={{ color: B }} />
          </button>
          <h1
            className="text-base font-bold text-center flex-1"
            style={{ color: B }}
          >
            {titles[activeSection]}
          </h1>
          <div className="w-9" />
        </div>
        <div className="p-4">
          {activeSection === "settings" && (
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-5 shadow-lg bg-white">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Account Details
                </p>
                <div className="rounded-xl p-3 divide-y divide-gray-100 border-gray-100 bg-white">
                  {[
                    { Icon: Hash, label: "UID", value: profile?.uid },
                    {
                      Icon: Hash,
                      label: "Referral Code",
                      value: profile?.referral_code,
                    },
                    { Icon: Mail, label: "Email", value: profile?.email },
                    { Icon: Phone, label: "Phone", value: profile?.phone },
                    { Icon: Globe, label: "Country", value: profile?.country },
                    {
                      Icon: Calendar,
                      label: "Member Since",
                      value: profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "short", day: "numeric" }
                          )
                        : "-",
                    },
                  ].map((row) => {
                    const IconComponent = row.Icon;
                    return (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-2 text-gray-400">
                          <IconComponent size={13} />
                          <p className="text-xs">{row.label}</p>
                        </div>
                        <p
                          className="text-xs font-semibold text-right truncate max-w-[55%]"
                          style={{ color: B }}
                        >
                          {row.value || "-"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {activeSection === "bind" && (
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-5 shadow-lg bg-white">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                      unlocked
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {unlocked ? "âœ“ Unlocked" : `Lock: ${timeLeft}`}
                  </span>
                </div>
                <p className="text-center text-xs text-gray-500 mb-4">
                  After binding address, 72 hours security lock will apply
                </p>
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      BEP20 Address (BSC)
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={bep20Input}
                      onChange={(e) => setBep20Input(e.target.value)}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      TRC20 Address (TRON)
                    </label>
                    <input
                      type="text"
                      placeholder="T..."
                      value={trc20Input}
                      onChange={(e) => setTrc20Input(e.target.value)}
                      className={inp}
                    />
                  </div>
                </div>
                {hasBind && (
                  <div
                    className="rounded-xl px-4 py-3 mb-5 flex items-start gap-3"
                    style={{ background: unlocked ? "#F0FDF4" : "#FEFCE8" }}
                  >
                    <Clock
                      size={16}
                      style={{
                        color: unlocked ? "#16a34a" : "#CA8A04",
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: unlocked ? "#15803d" : "#92400e" }}
                      >
                        Security Hold Active
                      </p>
                      {!unlocked && (
                        <p className="text-xs font-medium text-yellow-700 mt-0.5">
                          Withdraw will unlock in {timeLeft}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <button
                  onClick={saveBindAddr}
                  disabled={savingBind}
                  className={btnGradient}
                  style={{ background: `linear-gradient(135deg, ${G}, ${B})` }}
                >
                  {savingBind
                    ? "Saving..."
                    : hasBind
                    ? "Update Address & Reset Timer"
                    : "Bind Address"}
                </button>
              </div>
            </div>
          )}
          {activeSection === "security" && (
            <div className="max-w-lg mx-auto">
              <div className="rounded-2xl p-5 shadow-lg bg-white">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Google Authenticator (2FA)
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: totpEnabled ? "#F0FDF4" : "#FEFCE8" }}
                  >
                    <Lock
                      size={15}
                      style={{ color: totpEnabled ? "#16a34a" : "#CA8A04" }}
                    />
                  </div>
                  <p className="text-sm font-bold" style={{ color: B }}>
                    Google Authenticator
                  </p>
                  {totpEnabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-700">
                      Active
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {/* FIX 3: Inline Error Box */}
                  {totpError && (
                    <div className="bg-red-500/10 border-2 border-red-400 p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600" />
                      <p className="text-sm font-bold text-red-700">
                        {totpError}
                      </p>
                    </div>
                  )}

                  {!totpEnabled && !secret && (
                    <button
                      onClick={generate2FA}
                      className={btnGradient}
                      style={{
                        background: `linear-gradient(135deg, ${G}, ${B})`,
                      }}
                    >
                      Generate QR Code
                    </button>
                  )}
                  {!totpEnabled && secret && (
                    <div>
                      <div className="flex justify-center p-2 bg-white rounded border">
                        <QRCodeSVG
                          value={`otpauth://totp/CloudNova:${profile?.email}?secret=${secret}&issuer=CloudNova`}
                          size={150}
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 p-2 rounded mt-2">
                        <p className="text-xs break-all flex-1">
                          Secret: {secret}
                        </p>
                        <button onClick={handleCopySecret}>
                          {copiedSecret ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      <input
                        value={totpCode}
                        onChange={(e) => {
                          setTotpCode(e.target.value);
                          setTotpError("");
                        }}
                        placeholder="Enter 6 digit code"
                        maxLength={6}
                        className={inp + " mt-2"}
                      />
                      <button
                        onClick={verifyTotp}
                        disabled={totpVerifying}
                        className={btnGradient + " mt-2"}
                        style={{ background: G }}
                      >
                        {totpVerifying ? "Verifying..." : "Verify & Enable"}
                      </button>
                    </div>
                  )}
                  {totpEnabled && (
                    <div
                      className="rounded-xl px-4 py-3 flex items-center gap-2"
                      style={{ background: "#F0FDF4" }}
                    >
                      <CheckCircle2 size={16} className="text-green-600" />
                      <p className="text-sm font-semibold text-green-700">
                        âœ“ 2FA is Active
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {activeSection === "nft" && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl">
              NFT Collections content here
            </div>
          )}
          {activeSection === "admin" && (
            <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl">
              Admin Panel content here
            </div>
          )}
        </div>
        {showTwoFactor && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowTwoFactor(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-bold" style={{ color: B }}>
                  Setup 2FA
                </p>
                <button onClick={() => setShowTwoFactor(false)}>
                  <X size={16} />
                </button>
              </div>
              <div
                className="flex items-start gap-2 rounded-lg p-3 mb-3"
                style={{ background: "#FEF2F2" }}
              >
                <AlertCircle size={14} className="text-red-600" />
                <p className="text-xs text-red-700">
                  2FA is not connected yet. Backend required.
                </p>
              </div>
              <button
                onClick={() => setShowTwoFactor(false)}
                className={btnGradient}
                style={{ background: R }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      className="max-w-md mx-auto px-4 pt-2 pb-20"
      style={{ background: BG, minHeight: "100vh" }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#fff", color: B, border: "1px solid #e0e0e0" },
        }}
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        className="hidden"
      />
      <div className="flex items-center gap-3 mb-4">
        <img
          src="https://i.postimg.cc/N0gWRR7y/file-0000065008208aa040951f95e8071.png"
          className="w-10 h-10 rounded-full"
          alt="Cloud Nova"
        />
        <h1 className="text-base font-bold bg-gradient-to-r from-green-500 to-blue-700 bg-clip-text text-transparent">
          CLOUD NOVA
        </h1>
      </div>
      <div
        className="rounded-xl p-4 flex items-center gap-3 mb-4 shadow-sm"
        style={{ background: B }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0 relative overflow-hidden"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          ) : (
            initial
          )}
          <div className="absolute bottom-0 right-0 bg-white rounded-full p-1">
            {uploadingAvatar ? (
              <Upload size={10} className="text-blue-600 animate-pulse" />
            ) : (
              <Camera size={10} className="text-blue-600" />
            )}
          </div>
        </button>
        <div>
          <p
            className="text-base font-bold truncate leading-tight"
            style={{ color: "#fff" }}
          >
            {displayName}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-white/70 truncate">UID: {shortUid}</p>
            <button onClick={handleCopyUid} className="p-0.5">
              {copiedUid ? (
                <Check size={12} className="text-green-300" />
              ) : (
                <Copy size={12} className="text-white/70" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ color: "#fff", background: "rgba(255,255,255,0.2)" }}
            >
              Level: {profile?.level ?? 0}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ color: "#fff", background: "rgba(255,255,255,0.2)" }}
            >
              Deposit: ${profile?.total_deposit ?? 0}
            </span>
            {isAdmin && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ color: R, background: "#FEF2F2" }}
              >
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 shadow-sm border-gray-100 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} style={{ color: B2 }} />
          <p className="text-xs font-bold" style={{ color: B }}>
            My Referral Link
          </p>
        </div>
        <div
          className="rounded-xl p-3 flex items-center gap-2"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <p className="text-xs font-mono flex-1 truncate text-gray-500">
            {refLink || "Loading..."}
          </p>
          <button
            onClick={handleCopy}
            disabled={!refLink}
            className="flex-shrink-0 p-1"
            style={{ color: copied ? R : B2 }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { icon: <Users size={16} />, label: "My Team", key: "team" },
          {
            icon: <ShoppingBag size={16} />,
            label: "NFT Collections",
            key: "nft",
          },
          {
            icon: <Wallet size={16} />,
            label: "Withdrawal Address Bind",
            key: "bind",
          },
          { icon: <Lock size={16} />, label: "Security", key: "security" },
          {
            icon: <Settings size={16} />,
            label: "Account Settings",
            key: "settings",
          },
          ...(isAdmin
            ? [
                {
                  icon: <Shield size={16} />,
                  label: "Admin Panel",
                  key: "admin",
                },
              ]
            : []),
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => setActiveSection(btn.key)}
            className={btnOutline}
            style={{
              background: `linear-gradient(135deg, ${G}, ${B})`,
              borderColor: "transparent",
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: "#fff" }}>{btn.icon}</span>
              <span className="text-sm font-bold" style={{ color: "#fff" }}>
                {btn.label}
              </span>
            </div>
            <ChevronRight size={15} style={{ color: "#fff" }} />
          </button>
        ))}
        <button
          onClick={handleLogout}
          className={btnGradient}
          style={{ background: R }}
        >
          <span className="flex items-center justify-center gap-2">
            <LogOut size={16} /> Logout
          </span>
        </button>
      </div>
    </div>
  );
}
