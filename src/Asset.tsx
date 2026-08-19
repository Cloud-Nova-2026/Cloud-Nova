import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowLeft,
  Gift,
  Users,
  DollarSign,
  Copy,
} from "lucide-react";
import Withdraw from "./Withdraw";

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ";
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const B = "#1E3A8A";
const G = "#22c55e";
const R = "#DC2626";
const Y = "#F59E0B";
const BG = "#f8fafc";

type Profile = {
  wallet_balance: number;
  total_deposit: number;
  total_withdraw: number;
  total_income: number;
  referral_income: number;
  bep20_address: string | null;
  trc20_address: string | null;
  bep20_locked_until: string | null;
  trc20_locked_until: string | null;
};
type Tx = {
  id: string;
  type: string;
  amount: number;
  fee: number;
  status: string;
  description: string | null;
  created_at: string;
};

// YAHAN NAYA DEPOSIT COMPONENT ADD KIYA - NowPayments wala
const Deposit = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [depositData, setDepositData] = useState<any>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleCreateInvoice = async () => {
    if (amount < 30) return alert("Minimum deposit $30 hai");
    setLoading(true);
    try {
      const res = await fetch("/api/deposit/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id,
          amount: Number(amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDepositData(data);
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  const copyAddress = (addr: string, type: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="p-4">
      {!depositData? (
        <div className="bg-white rounded-2xl p-4 border">
          <h2 className="text-lg font-bold mb-3" style={{ color: B }}>
            Deposit USDT
          </h2>
          <input
            type="number"
            min="30"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="border w-full p-3 rounded-xl mb-3"
            placeholder="Minimum $30"
          />
          <button
            onClick={handleCreateInvoice}
            disabled={loading}
            className="bg-blue-600 text-white w-full py-3 rounded-xl font-semibold"
          >
            {loading? "Generating..." : "Generate Address"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            * BEP20 aur TRC20 dono address milenge
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border">
          <h2 className="text-lg font-bold mb-3" style={{ color: G }}>
            Send USDT to Address
          </h2>

          <p className="mb-2 font-semibold text-sm">BEP20 Network</p>
          <img
            src={depositData.bep20.qr}
            className="w-40 h-40 mx-auto mb-2 rounded-lg"
          />
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg mb-4">
            <p className="text-xs break-all flex-1">{depositData.bep20.address}</p>
            <button onClick={() => copyAddress(depositData.bep20.address, "bep")}>
              <Copy size={16} />
            </button>
          </div>
          {copied === "bep" && <p className="text-xs text-green-600 -mt-3 mb-2">Copied!</p>}

          <p className="mb-2 font-semibold text-sm">TRC20 Network</p>
          <img
            src={depositData.trc20.qr}
            className="w-40 h-40 mx-auto mb-2 rounded-lg"
          />
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <p className="text-xs break-all flex-1">{depositData.trc20.address}</p>
            <button onClick={() => copyAddress(depositData.trc20.address, "trc")}>
              <Copy size={16} />
            </button>
          </div>
          {copied === "trc" && <p className="text-xs text-green-600 -mt-3 mb-2">Copied!</p>}

          <p className="text-sm text-green-600 mt-4 text-center">
            Payment confirm hone ke 30 sec me wallet update ho jayega
          </p>
        </div>
      )}
      <button
        onClick={onClose}
        className="mt-4 text-red-500 w-full font-semibold"
      >
        Close
      </button>
    </div>
  );
};

export default function Asset() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const [totalDeposit, setTotalDeposit] = useState(0);
  const [totalWithdraw, setTotalWithdraw] = useState(0);
  const [totalReferral, setTotalReferral] = useState(0);
  const [totalBonus, setTotalBonus] = useState(0);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(user);

      const { data: profData } = await supabase
       .from("profiles")
       .select("*")
       .eq("user_id", user.id)
       .single();

      const bep20 =
        profData?.bep20_address || profData?.withdraw_address_bep || null;
      const trc20 =
        profData?.trc20_address || profData?.withdraw_address_trc || null;

      setProfile({
        wallet_balance: profData?.wallet_balance?? 0,
        total_deposit: profData?.total_deposit?? 0,
        total_withdraw: profData?.total_withdraw?? 0,
        total_income: profData?.total_income?? 0,
        referral_income: profData?.referral_income?? 0,
        bep20_address: bep20,
        trc20_address: trc20,
        bep20_locked_until: profData?.bep20_locked_until?? null,
        trc20_locked_until: profData?.trc20_locked_until?? null,
      });

      const { data: txData } = await supabase
       .from("transactions")
       .select("*")
       .eq("user_id", user.id)
       .order("created_at", { ascending: false })
       .limit(100);
      const allTx = (txData?? []) as Tx[];
      setTxs(allTx);
      setTotalDeposit(profData?.total_deposit?? 0);
      setTotalWithdraw(
        allTx
         .filter((t) => t.type === "withdrawal" && t.status === "completed")
         .reduce((s, r) => s + r.amount, 0)
      );
      setTotalReferral(profData?.referral_income?? 0);
      setTotalBonus(
        allTx
         .filter(
            (t) => t.type === "level_upgrade_bonus" && t.status === "completed"
          )
         .reduce((s, r) => s + r.amount, 0)
      );

      setLoading(false);
      setRefreshing(false);
    },
    [navigate]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const profileChannel = supabase
     .channel("asset-profile-realtime")
     .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setProfile((prev) =>
            prev
             ? {
                 ...prev,
                  wallet_balance: payload.new.wallet_balance?? 0,
                  total_income: payload.new.total_income?? 0,
                  referral_income: payload.new.referral_income?? 0,
                }
              : null
          );
        }
      )
     .subscribe();

    const txChannel = supabase
     .channel("asset-realtime")
     .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          load(true);
        }
      )
     .subscribe();
    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(txChannel);
    };
  }, [user, load]);

  useEffect(() => {
    const bep = profile?.bep20_locked_until
     ? new Date(profile.bep20_locked_until).getTime()
      : 0;
    const trc = profile?.trc20_locked_until
     ? new Date(profile.trc20_locked_until).getTime()
      : 0;
    const lockTime = Math.max(bep, trc);
    if (!lockTime) {
      setTimeLeft("");
      return;
    }
    const interval = setInterval(() => {
      const diff = lockTime - Date.now();
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
  }, [profile?.bep20_locked_until, profile?.trc20_locked_until]);

  const txIcon = (type: string) => {
    if (type === "deposit") return <ArrowDownLeft size={14} />;
    if (type === "withdrawal") return <ArrowUpRight size={14} />;
    if (type === "referral_reward") return <Users size={14} />;
    if (type === "level_upgrade_bonus") return <Gift size={14} />;
    if (type === "daily_profit") return <TrendingUp size={14} />;
    return <Clock size={14} />;
  };
  const txTitle = (type: string) => {
    if (type === "deposit") return "Deposit";
    if (type === "withdrawal") return "Withdrawal";
    if (type === "referral_reward") return "Referral Reward";
    if (type === "level_upgrade_bonus") return "Level Bonus";
    if (type === "daily_profit") return "Daily Profit";
    return type;
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

  const availableBalance =
    (profile?.wallet_balance?? 0) + (profile?.total_income?? 0);
  const balance = availableBalance;
  const bepLocked = profile?.bep20_locked_until
   ? new Date(profile.bep20_locked_until) > new Date()
    : false;
  const trcLocked = profile?.trc20_locked_until
   ? new Date(profile.trc20_locked_until) > new Date()
    : false;
  const isLocked = bepLocked || trcLocked;

  if (activeSection) {
    const titles: any = { deposit: "Deposit", withdraw: "Withdraw" };
    return (
      <div className="min-h-screen" style={{ background: BG }}>
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
        <div>
          {activeSection === "deposit" && (
            <Deposit
              onClose={() => {
                setActiveSection(null);
                load(true);
              }}
            />
          )}
          {activeSection === "withdraw" && (
            <div className="relative">
              <div className="absolute inset-0 opacity-30 blur-[1px] pointer-events-none">
                <Withdraw onClose={() => {}} />
              </div>
              {isLocked? (
                <div className="relative z-10 p-4">
                  <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 border-2 border-yellow-500 rounded-2xl p-6 shadow-2xl">
                    <p className="font-bold text-yellow-300 text-xl mb-3 text-center">
                      🔒 Security Lock Active
                    </p>
                    <p className="text-4xl font-mono text-white mb-3 text-center">
                      {timeLeft}
                    </p>
                    <p
                      className="text-sm font-extrabold mb-4 text-center"
                      style={{ color: G }}
                    >
                      Please wait until 72 hours are completed
                    </p>
                    <div className="space-y-3 text-left bg-black/50 p-3 rounded-xl">
                      <div>
                        <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">
                          BEP20 Address
                        </p>
                        <p className="text-xs font-mono text-white font-bold break-all">
                          {profile?.bep20_address || (
                            <span className="text-red-400">Not Bound</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-yellow-200 font-bold uppercase tracking-wider">
                          TRC20 Address
                        </p>
                        <p className="text-xs font-mono text-white font-bold break-all">
                          {profile?.trc20_address || (
                            <span className="text-red-400">Not Bound</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Withdraw
                  onClose={() => {
                    setActiveSection(null);
                    load(true);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-md mx-auto px-3 pt-3 pb-20"
      style={{ background: BG, minHeight: "100vh" }}
    >
      <div className="flex items-center justify-between h-14 mb-2">
        <div className="flex items-center gap-2">
          <img
            src="https://i.postimg.cc/N0gWRR7y/file-0000065008208aa040951f95e8071.png"
            className="h-8 w-8 rounded-full"
            alt="Cloud Nova"
          />
          <h1 className="text-base font-bold bg-gradient-to-r from-[#22c55e] via-[#0f172a] to-[#22c55e] bg-clip-text text-transparent">
            CLOUD NOVA
          </h1>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-1.5 rounded-xl bg-white border-gray-200 hover:bg-gray-50"
          style={{ color: B }}
        >
          <RefreshCw size={14} className={refreshing? "animate-spin" : ""} />
        </button>
      </div>

      <div
        className="rounded-2xl p-3 mb-3 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${G}, ${B})` }}
      >
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 bg-white -translate-y-6 translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-1 mb-0.5 opacity-70">
            <Wallet size={12} className="text-white" />
            <p className="text-xs font-medium text-white">Available Balance</p>
          </div>
          <p className="text-2xl font-bold text-white leading-tight">
            ${balance.toFixed(2)}
          </p>
          <p className="text-xs text-white opacity-50 mt-0.5">USDT</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-xl p-3 border">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <DollarSign size={12} /> Total Deposit
          </p>
          <p className="text-lg font-bold" style={{ color: G }}>
            ${totalDeposit.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <ArrowUpRight size={12} /> Total Withdraw
          </p>
          <p className="text-lg font-bold" style={{ color: R }}>
            ${totalWithdraw.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Users size={12} /> Referral
          </p>
          <p className="text-lg font-bold" style={{ color: B }}>
            ${totalReferral.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Gift size={12} /> Bonus
          </p>
          <p className="text-lg font-bold" style={{ color: Y }}>
            ${totalBonus.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setActiveSection("deposit")}
          className="flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl h-9 active:scale-95"
          style={{ background: B }}
        >
          <ArrowDownLeft size={13} /> Deposit
        </button>
        <button
          onClick={() => setActiveSection("withdraw")}
          className="flex items-center justify-center gap-1.5 text-white font-semibold text-xs rounded-xl h-9 active:scale-95"
          style={{ background: G }}
        >
          <ArrowUpRight size={13} /> Withdraw
        </button>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <p className="text-sm font-bold" style={{ color: B }}>
            Transaction History
          </p>
          <p className="text-xs text-gray-500">{txs.length} records</p>
        </div>
        {!txs || txs.length === 0? (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map((item) => {
              const isCompleted = item.status === "completed";
              const isPending = item.status === "pending";
              const amountColor =
                item.type === "withdrawal"? "text-red-600" : "text-green-600";
              const sign = item.type === "withdrawal"? "-" : "+";
              const statusColor = isCompleted
               ? "text-green-600"
                : isPending
               ? "text-yellow-600"
                : "text-red-600";
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-start p-3 rounded-lg border bg-white"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100"
                      style={{ color: B }}
                    >
                      {txIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-bold text-black text-sm">
                        {txTitle(item.type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                      <p className={`text-xs font-bold mt-0.5 ${statusColor}`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${amountColor} text-sm`}>
                      {sign}${item.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}