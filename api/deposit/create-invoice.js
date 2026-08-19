import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_SERVICE_KEY = "sb_secret_mRvteDwNqepLahUPQpjb2A_BPJft4nd";
const NOW_API_KEY = "AFXPEX5-T5RM0F2-JAKJ1XH-BFGGCMP";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { user_id, amount } = req.body;

  // RULE 1: MINIMUM $30 - Function me bhi yehi check hai
  if (amount < 30) {
    return res.status(400).json({ error: "Minimum deposit $30 hai" });
  }

  // RULE 2: status = pending - Function isi ko dhoondta hai
  const { data: deposit, error } = await supabase
    .from("deposits")
    .insert({ user_id, amount, status: "pending" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  try {
    // BEP20 + TRC20 dono
    const [bsc, trc] = await Promise.all([
      fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "x-api-key": NOW_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          pay_currency: "usdtbsc",
          order_id: deposit.id,
          ipn_callback_url: "https://tysdwc.csb.app/api/webhook/nowpayments",
        }),
      }).then((r) => r.json()),
      fetch("https://api.nowpayments.io/v1/invoice", {
        method: "POST",
        headers: {
          "x-api-key": NOW_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          pay_currency: "usdttrc20",
          order_id: deposit.id,
          ipn_callback_url: "https://tysdwc.csb.app/api/webhook/nowpayments",
        }),
      }).then((r) => r.json()),
    ]);

    await supabase
      .from("deposits")
      .update({
        payment_id: bsc.id,
        wallet_address: bsc.pay_address + "|" + trc.pay_address,
      })
      .eq("id", deposit.id);

    res.status(200).json({
      deposit_id: deposit.id,
      bep20: {
        address: bsc.pay_address,
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bsc.pay_address}`,
      },
      trc20: {
        address: trc.pay_address,
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${trc.pay_address}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
