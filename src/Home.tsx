import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  ShoppingCart,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  DollarSign,
  MoreVertical,
  Shield,
  Send,
  Headphones,
  Bell,
  Trophy,
  ArrowLeft,
  Trash2,
  Check,
  X,
  Wallet,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";

const supabase = createBrowserClient(
  "https://xolmmviokbzniodfuwev.supabase.co",
  "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ"
);
const B = "#0a0f1e";
const R = "#22c55e";
const B2 = "#3b82f6";

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

export default function Home({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [nextClaim, setNextClaim] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const countdown = useCountdown(nextClaim);
  const [balance, setBalance] = useState(0);
  const [incomeRows, setIncomeRows] = useState<any[]>([
    { label: "Total Income", balance: 0 },
    { label: "Daily Income", balance: 0 },
    { label: "Team Income%", balance: 0 },
    { label: "Referral%", balance: 0 },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [orderStats, setOrderStats] = useState<any>({
    total: 0,
    processing: 0,
    bought: 0,
    sold: 0,
  });
  const [liveTeamCount, setLiveTeamCount] = useState(0);
  const [teamCount, setTeamCount] = useState({
    aCount: 0,
    bcCount: 0,
    eCount: 0,
    bECount: 0,
  });
  const [teamListOpen, setTeamListOpen] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState("all");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [ann, setAnn] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isValidMember, setIsValidMember] = useState(false);
  const [airdropOpen, setAirdropOpen] = useState(false);
  const [airdrops, setAirdrops] = useState<any[]>([]);
  const [adminPageOpen, setAdminPageOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const navigate = useNavigate();
  const bellRef = useRef<any>(null);
  const menuRef = useRef<any>(null);

  // FIXED: referral_total -> referral_income
  const availableBalance =
    (profile?.balance || 0) +
    (profile?.total_deposit || 0) +
    (profile?.total_income || 0) +
    (profile?.referral_income || 0);
  const totalBalance = availableBalance;
  const totalOrders = profile?.lifetime_order || 0;
  const boughtCount = profile?.lifetime_bought || 0;
  const soldCount = profile?.lifetime_sold || 0;

  useEffect(() => {
    getData();
    getAnnouncements();
    getAirdrops();
    document.addEventListener("mousedown", handleClickOutside);
    const channel = supabase
      .channel("announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          getAnnouncements();
        }
      )
      .subscribe();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    if (bellRef.current && !bellRef.current.contains(event.target))
      setBellOpen(false);
    if (menuRef.current && !menuRef.current.contains(event.target))
      setMenuOpen(false);
  };

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
      p_user_id: profile?.id,
      p_percent: 0.013,
    });
    if (error) {
      toast.error(error.message);
    } else if (data?.success) {
      toast.success(`+${Number(data.new_profit).toFixed(2)} Profit Credited`);
      setNextClaim(data.next_claim_at);
      getData();
    } else {
      toast.error(data?.message);
      if (data?.next_claim_at) setNextClaim(data.next_claim_at);
    }
    setClaiming(false);
  };

  const getData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const currentUserId = user.id;
      setCurrentUserId(currentUserId);
      const { data: freshProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUserId)
        .single();
      if (!freshProfile) {
        return;
      }
      setProfile(freshProfile);
      const myId = freshProfile.id;
      setBalance(freshProfile.wallet_balance || 0);
      setIsAdmin(
        [
          "businesstech10002@gmail.com",
          "hiratabeerkarachi3090@gmail.com",
        ].includes(user.email)
      );
      setIsValidMember((freshProfile.total_deposit || 0) >= 30);
      if (freshProfile.last_daily_claim) {
        const last = new Date(freshProfile.last_daily_claim);
        const reset = new Date(last);
        reset.setUTCHours(0, 0, 0, 0);
        const next = new Date(reset.getTime() + 24 * 60 * 60 * 1000);
        if (last >= reset) setNextClaim(next.toISOString());
      }
      // FIXED: referral_total -> referral_income
      setIncomeRows([
        { label: "Total Income", balance: freshProfile.total_income || 0 },
        { label: "Daily Income", balance: freshProfile.daily_income || 0 },
        { label: "Team Income%", balance: 0 },
        { label: "Referral%", balance: freshProfile.referral_income || 0 },
      ]);
      setOrderStats({
        total: freshProfile.lifetime_order || 0,
        processing: 0,
        bought: freshProfile.lifetime_bought || 0,
        sold: freshProfile.lifetime_sold || 0,
      });
      const { data: l1, error: l1Error } = await supabase
        .from("profiles")
        .select("id,wallet_balance")
        .eq("referred_by", myId);
      if (l1Error) alert(`L1 ERROR: ${l1Error.message}`);
      const { data: l2, error: l2Error } = l1?.length
        ? await supabase
            .from("profiles")
            .select("id,wallet_balance")
            .in(
              "referred_by",
              l1.map((x) => x.id)
            )
        : { data: [], error: null };
      const { data: l3, error: l3Error } = l2?.length
        ? await supabase
            .from("profiles")
            .select("id,wallet_balance")
            .in(
              "referred_by",
              l2.map((x) => x.id)
            )
        : { data: [], error: null };
      const totalA = l1?.length || 0;
      const totalBC = (l2?.length || 0) + (l3?.length || 0);
      const validA =
        l1?.filter((x) => (x.wallet_balance || 0) >= 30).length || 0;
      const validBC =
        [...(l2 || []), ...(l3 || [])].filter(
          (x) => (x.wallet_balance || 0) >= 30
        ).length || 0;
      setTeamCount({
        aCount: totalA,
        bcCount: totalBC,
        eCount: validA,
        bECount: validBC,
      });
      setLiveTeamCount(totalA + totalBC);
    } catch (error: any) {
      alert("CRITICAL ERROR: " + error.message);
      console.error(error);
    }
    const { data: reads } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", currentUserId);
    setReadIds(reads?.map((r) => r.announcement_id) || []);
  };

  const getAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnn(data);
  };

  const getAirdrops = async () => {
    const { data } = await supabase
      .from("airdrops")
      .select("*")
      .eq("status", "active");
    if (data) setAirdrops(data);
  };

  const openBell = async () => {
    setBellOpen(true);
    if (!currentUserId || ann.length === 0) return;
    const unreadIds = ann
      .filter((a) => !readIds.includes(a.id))
      .map((a) => a.id);
    if (unreadIds.length === 0) return;
    const inserts = unreadIds.map((id) => ({
      user_id: currentUserId,
      announcement_id: id,
    }));
    await supabase.from("announcement_reads").insert(inserts);
    setReadIds([...readIds, ...unreadIds]);
  };

  const teamBoxes = [
    {
      key: "eCount",
      label: "Valid A Enthusiast",
      value: teamCount.eCount,
      icon: <Users className="w-5 h-5 mx-auto mt-1" style={{ color: B2 }} />,
    },
    {
      key: "bECount",
      label: "Valid B/C Enthusiast",
      value: teamCount.bECount,
      icon: <Users className="w-5 h-5 mx-auto mt-1" style={{ color: R }} />,
    },
  ];

  const orderBoxes = [
    {
      label: "Orders",
      value: orderStats.total,
      icon: (
        <ShoppingCart className="w-5 h-5 mx-auto mt-1" style={{ color: B2 }} />
      ),
    },
    {
      label: "Processing",
      value: orderStats.processing,
      icon: (
        <Clock className="w-5 h-5 mx-auto mt-1" style={{ color: "#feab30" }} />
      ),
    },
    {
      label: "Bought",
      value: orderStats.bought,
      icon: (
        <ArrowDownCircle
          className="w-5 h-5 mx-auto mt-1"
          style={{ color: R }}
        />
      ),
    },
    {
      label: "Sold",
      value: orderStats.sold,
      icon: (
        <ArrowUpCircle className="w-5 h-5 mx-auto mt-1" style={{ color: R }} />
      ),
    },
  ];

  if (adminPageOpen)
    return (
      <AdminDashboard
        onBack={() => {
          setAdminPageOpen(false);
          getData();
          getAnnouncements();
        }}
      />
    );

  const unreadCount = ann.filter((a) => !readIds.includes(a.id)).length;

  return (
    <div className="max-w-md mx-auto px-0 pt-0 pb-2 bg-white min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#fff", color: B, border: "1px solid #e5e7eb" },
        }}
      />
      <div className="flex items-center justify-between h-14 px-3 bg-white">
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
        <div className="flex items-center gap-2">
          <button
            onClick={openBell}
            className="relative p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            style={{ color: B }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center px-0.5">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setAirdropOpen(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#22c55e] to-[#3b82f6] text-white"
          >
            Airdrop
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              style={{ color: B }}
            >
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border-gray-100 w-44 z-50">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setAdminPageOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold hover:bg-green-50"
                      style={{ color: R }}
                    >
                      <Shield size={14} style={{ color: R }} /> Admin Panel
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="px-3">
        <div className="rounded-2xl p-3 mb-2 relative overflow-hidden bg-gradient-to-r from-[#3b82f6] to-[#1e40af]">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 bg-white -translate-y-8 translate-x-8" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-1 opacity-80">
              <DollarSign size={12} className="text-white" />
              <p className="text-xs font-medium text-white">Wallet Balance</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white leading-tight">
              ${totalBalance.toFixed(2)}
            </p>
            <p className="text-xs text-white opacity-60 mt-0.5">USDT</p>
          </div>
        </div>
        <div className="rounded-xl mb-2 overflow-hidden bg-gradient-to-r from-[#22c55e] to-[#3b82f6]">
          <div className="flex items-center px-3 py-3 bg-white/20">
            <span
              className="text-xs font-bold text-white"
              style={{ width: "46%" }}
            >
              Table Name
            </span>
            <span
              className="text-xs font-bold text-white text-center"
              style={{ width: "26%" }}
            >
              Balance
            </span>
            <span
              className="text-xs font-bold text-white text-right"
              style={{ width: "28%" }}
            >
              Total
            </span>
          </div>
          {incomeRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center px-3 py-3 border-b border-white/10"
            >
              <span
                className="text-xs font-bold text-white"
                style={{ width: "46%" }}
              >
                {row.label}
              </span>
              <span
                className="text-xs font-bold text-center"
                style={{ width: "26%", color: "#ffffff" }}
              >
                ${row.balance.toFixed(2)}
              </span>
              <span
                className="text-xs font-bold text-right"
                style={{ width: "28%", color: "#ffffff" }}
              >
                ${row.balance.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-[#ffffff] rounded-xl p-3 mb-2 shadow-sm">
          <p className="text-xs font-bold mb-2" style={{ color: B }}>
            My Team
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="flex flex-col items-center text-center">
              <Users className="w-5 h-5 mx-auto mt-1" style={{ color: B2 }} />
              <p
                className="text-base font-bold leading-tight mt-0.5"
                style={{ color: "#111827" }}
              >
                {teamCount.aCount}
              </p>
              <p className="text-[9px] text-gray-500 leading-tight">
                Total A<br /> Members
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Trophy
                className="w-5 h-5 mx-auto mt-1"
                style={{ color: "#feab30" }}
              />
              <p
                className="text-base font-bold leading-tight mt-0.5"
                style={{ color: "#111827" }}
              >
                {teamCount.bcCount}
              </p>
              <p className="text-[9px] text-gray-500 leading-tight">
                Total B/C
                <br /> Members
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              {teamBoxes[0].icon}
              <p
                className="text-base font-bold leading-tight mt-0.5"
                style={{ color: "#111827" }}
              >
                {teamBoxes[0].value}
              </p>
              <p className="text-[9px] text-gray-500 leading-tight">
                Valid A<br /> Enthusiast
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              {teamBoxes[1].icon}
              <p
                className="text-base font-bold leading-tight mt-0.5"
                style={{ color: "#111827" }}
              >
                {teamBoxes[1].value}
              </p>
              <p className="text-[9px] text-gray-500 leading-tight">
                Valid B/C
                <br /> Enthusiast
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 mb-2 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold" style={{ color: B }}>
              My Orders
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="text-sm font-bold bg-gradient-to-r from-[#22c55e] to-[#3b82f6] bg-clip-text text-transparent"
            >
              Check Orders &gt;
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {orderBoxes.map((box) => (
              <div
                key={box.label}
                className="flex flex-col items-center text-center"
              >
                {box.icon}
                <p
                  className="text-base font-bold leading-tight mt-0.5"
                  style={{ color: "#111827" }}
                >
                  {box.value}
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">
                  {box.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {bellOpen && (
        <NotificationsModal
          ann={ann}
          readIds={readIds}
          onClose={() => setBellOpen(false)}
        />
      )}
      {airdropOpen && (
        <AirdropModal
          airdrops={airdrops}
          onClose={() => setAirdropOpen(false)}
        />
      )}
    </div>
  );
}

function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnn, setNewAnn] = useState("");
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    const { data: u } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: d } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: w } = await supabase
      .from("withdraw_requests")
      .select("*,profiles(email)")
      .order("created_at", { ascending: false });
    const { data: a } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(u || []);
    setDeposits(d || []);
    setWithdrawals(w || []);
    setAnnouncements(a || []);
  };
  const addAnnouncement = async () => {
    if (!newAnn.trim()) return;
    await supabase.from("announcements").insert({ message: newAnn });
    setNewAnn("");
    loadData();
    toast.success("Announcement sent to all users");
  };
  const deleteAnn = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id);
    loadData();
    toast.success("Deleted");
  };
  const updateWithdraw = async (id: string, status: string) => {
    if (status === "approved") {
      const { data, error } = await supabase.rpc("admin_approve_withdraw", {
        p_id: id,
      });
      if (error) toast.error(error.message);
      else toast.success(data);
    } else {
      const { data, error } = await supabase.rpc("admin_reject_withdraw", {
        p_id: id,
      });
      if (error) toast.error(error.message);
      else toast.success(data);
    }
    loadData();
  };
  const totalDeposit = deposits.reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalWithdraw = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((a, b) => a + Number(b.amount || 0), 0);
  const totalBalance = users.reduce(
    (a, b) => a + Number(b.wallet_balance || 0),
    0
  );
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 flex items-center p-4 bg-white border-b">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center mr-3"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold bg-gradient-to-r from-[#22c55e] to-[#3b82f6] bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto bg-white">
        {["overview", "users", "deposits", "withdrawals", "announcements"].map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                tab === t
                  ? "bg-gradient-to-r from-[#22c55e] to-[#3b82f6] text-white"
                  : "bg-gray-100"
              }`}
            >
              {t.toUpperCase()}
            </button>
          )
        )}
      </div>
      <div className="p-3">
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Total Accounts"
              value={users.length}
              icon={<Users />}
            />
            <StatCard
              title="Total Balance"
              value={`$${totalBalance.toFixed(2)}`}
              icon={<DollarSign />}
            />
            <StatCard
              title="Total Deposit"
              value={`$${totalDeposit.toFixed(2)}`}
              icon={<Wallet />}
            />
            <StatCard
              title="Total Withdraw"
              value={`$${totalWithdraw.toFixed(2)}`}
              icon={<Wallet />}
            />
            <StatCard
              title="Total Pending"
              value={withdrawals.filter((w) => w.status === "pending").length}
              icon={<Clock />}
            />
            <StatCard
              title="Total Approved"
              value={withdrawals.filter((w) => w.status === "approved").length}
              icon={<Check />}
            />
            <StatCard
              title="Total Reject"
              value={withdrawals.filter((w) => w.status === "rejected").length}
              icon={<X />}
            />
          </div>
        )}
        {tab === "users" && (
          <div className="bg-white rounded-xl p-3 max-h-[70vh] overflow-y-auto">
            <p className="font-bold mb-2 sticky top-0 bg-white py-1">
              All Registered Users: {users.length}
            </p>
            {users.map((u) => (
              <div
                key={u.id}
                className="flex justify-between py-2 border-b text-xs"
              >
                <span className="truncate mr-2">{u.email}</span>
                <span>${Number(u.wallet_balance || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "deposits" && (
          <div className="bg-white rounded-xl p-3 max-h-[70vh] overflow-y-auto">
            <p className="font-bold mb-2">Now Payment Deposits</p>
            {deposits.map((d) => (
              <div
                key={d.id}
                className="flex justify-between py-2 border-b text-xs"
              >
                <span>{d.email}</span>
                <span className="text-green-600">+${d.amount}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "withdrawals" && (
          <div className="bg-white rounded-xl p-3 max-h-[70vh] overflow-y-auto">
            <p className="font-bold mb-2">Withdrawal Requests</p>
            {withdrawals.map((w) => (
              <div key={w.id} className="py-3 border-b text-xs">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{w.profiles?.email}</p>
                    <p className="text-gray-500">
                      {new Date(w.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      w.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : w.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 mb-2">
                  <p>
                    <b>Amount:</b> ${w.amount}
                  </p>
                  <p>
                    <b>Network:</b> {w.network}
                  </p>
                  <p>
                    <b>Fee:</b> ${w.fee}
                  </p>
                  <p className="text-green-600">
                    <b>Pay:</b> ${w.final_amount}
                  </p>
                </div>
                <p className="text-[10px] bg-gray-100 p-1 rounded break-all mb-2">
                  <b>Address:</b> {w.address}
                </p>
                {w.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateWithdraw(w.id, "approved")}
                      className="flex-1 px-2 py-1.5 bg-green-500 text-white rounded flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => updateWithdraw(w.id, "rejected")}
                      className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded flex items-center justify-center gap-1"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {tab === "announcements" && (
          <div className="bg-white rounded-xl p-3">
            <p className="font-bold mb-2">Send Announcement to All Users</p>
            <div className="flex gap-2 mb-3">
              <textarea
                value={newAnn}
                onChange={(e) => setNewAnn(e.target.value)}
                placeholder="Write announcement"
                rows={3}
                className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <button
                onClick={addAnnouncement}
                className="px-4 py-2 bg-gradient-to-r from-[#22c55e] to-[#3b82f6] text-white rounded-lg text-sm font-bold"
              >
                Send
              </button>
            </div>
            <p className="font-bold mb-2 mt-4">Previous Announcements</p>
            <div className="max-h-[40vh] overflow-y-auto">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center py-2 border-b text-sm"
                >
                  <p className="whitespace-pre-wrap">{a.message}</p>
                  <button onClick={() => deleteAnn(a.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        {icon} <p className="text-xs text-gray-500">{title}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function NotificationsModal({ ann, readIds, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="sticky top-0 z-10 flex items-center p-4 border-b bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center absolute left-4"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-center flex-1 bg-gradient-to-r from-[#22c55e] to-[#3b82f6] bg-clip-text text-transparent">
          Notifications
        </h1>
        <div className="w-9" />
      </div>
      <div className="overflow-y-auto h-[calc(100vh-56px)]">
        {ann.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">
            No announcements
          </p>
        ) : (
          ann.map((a: any) => (
            <div
              key={a.id}
              className={`w-full flex items-start gap-3 px-4 py-3 border-b border-gray-50 text-left ${
                readIds.includes(a.id) ? "opacity-60" : ""
              }`}
            >
              {!readIds.includes(a.id) && (
                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></span>
              )}
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {a.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AirdropModal({ airdrops, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      {" "}
      <div className="sticky top-0 z-10 flex items-center p-4 border-b bg-white">
        {" "}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center absolute left-4"
        >
          {" "}
          <ArrowLeft size={18} />{" "}
        </button>{" "}
        <h1 className="text-base font-bold text-center flex-1 bg-gradient-to-r from-[#22c55e] to-[#3b82f6] bg-clip-text text-transparent">
          {" "}
          Airdrop{" "}
        </h1>{" "}
        <div className="w-9" />{" "}
      </div>{" "}
      <div className="p-4 overflow-y-auto h-[calc(100vh-56px)]">
        {" "}
        {airdrops.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No active airdrops</p>
        ) : (
          <div className="space-y-3">
            {" "}
            {airdrops.map((a: any) => (
              <div
                key={a.id}
                className="rounded-xl p-4 border"
                style={{ background: "#FEFFEF", borderColor: "#FEF9C3" }}
              >
                {" "}
                <p className="text-sm font-extrabold mb-1">{a.title}</p>{" "}
                {a.description && (
                  <p className="text-xs text-gray-500 mb-2">{a.description}</p>
                )}{" "}
                <p className="text-lg font-extrabold" style={{ color: R }}>
                  {" "}
                  ${Number(a.amount).toFixed(2)}{" "}
                </p>{" "}
              </div>
            ))}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div>
  );
}
