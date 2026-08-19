import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createBrowserClient } from "@supabase/ssr";
import {
  ArrowLeft,
  ShoppingCart,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

const supabase = createBrowserClient(
  "https://xolmmviokbzniodfuwev.supabase.co",
  "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ"
);

const B = "#1E3A8A";
const R = "#DC2626";

type Deposit = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  network?: string | null;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  network?: string | null;
};

const statusColor = (s: string) => {
  if (s === "approved") return "#16a34a";
  if (s === "pending") return "#d97706";
  if (s === "rejected") return R;
  return "#6b7280";
};

const Skel = () => (
  <div className="bg-white rounded-xl p-4 mb-3 animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 rounded w-1/3" />
    <div className="h-3 bg-gray-100 rounded w-1/2" />
  </div>
);

export default function Orders() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"deposits" | "withdrawals">("deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState<any>({
    total: 0,
    processing: 0,
    bought: 0,
    sold: 0,
  });

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // FIX: orders_count bhi uthao taake Home se match kare
    const { data: profile } = await supabase
      .from("profiles")
      .select("orders_count, bought_count, sold_count, processing")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setOrderStats({
        total: profile.orders_count || 0,
        processing: profile.processing || 0,
        bought: profile.bought_count || 0,
        sold: profile.sold_count || 0,
      });
    }

    const [{ data: deps }, { data: wds }] = await Promise.all([
      supabase
        .from("deposits")
        .select("id, amount, status, created_at, network")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("withdrawals")
        .select("id, amount, status, created_at, network")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    setDeposits((deps ?? []) as Deposit[]);
    setWdrawals((wds ?? []) as Withdrawal[]);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const rows: (Deposit | Withdrawal)[] =
    tab === "deposits" ? deposits : withdrawals;

  return (
    <div
      className="max-w-md mx-auto px-4 pt-10 pb-10 min-h-screen"
      style={{ background: "#F8F9FA" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white transition-colors"
          style={{ color: B }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: B }}>
          My Orders
        </h1>
      </div>

      {/* Summary row - FIX: DB se real counts */}
      <div className="grid grid-cols-4 gap-2 bg-white rounded-xl p-4 shadow-sm mb-5">
        {[
          {
            icon: <ShoppingCart size={18} style={{ color: "#3b82f6" }} />,
            label: "Total",
            count: orderStats.total,
          },
          {
            icon: <Clock size={18} style={{ color: "#eab308" }} />,
            label: "Processing",
            count: orderStats.processing,
          },
          {
            icon: <ArrowDownCircle size={18} style={{ color: "#22c55e" }} />,
            label: "Bought",
            count: orderStats.bought,
          },
          {
            icon: <ArrowUpCircle size={18} style={{ color: R }} />,
            label: "Sold",
            count: orderStats.sold,
          },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            {s.icon}
            <p className="text-xl font-bold text-gray-900">{s.count}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border-gray-200 mb-4">
        {(["deposits", "withdrawals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors capitalize"
            style={{
              background: tab === t ? B : "#fff",
              color: tab === t ? "#fff" : "#6b7280",
              border: "1px solid #e5e7eb",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => <Skel key={i} />)
      ) : rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm text-gray-400">No {tab} yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="bg-white rounded-xl px-4 py-3 shadow-sm border-gray-100 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-bold" style={{ color: B }}>
                  ${Number(row.amount).toFixed(2)} USDT
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {fmt(row.created_at)}
                </p>
                {(row as Deposit).network && (
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {(row as Deposit).network}
                  </p>
                )}
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                style={{
                  background: `${statusColor(row.status)}18`,
                  color: statusColor(row.status),
                }}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
