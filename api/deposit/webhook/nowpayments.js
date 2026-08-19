import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_SERVICE_KEY = "sb_secret_mRvteDwNqepLahUPQpjb2A_BPJft4nd";
const IPN_SECRET = "i7m918XE49tWLLfvS8LW1XeUNE59genM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const signature = req.headers["x-nowpayments-sig"];
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac("sha512", IPN_SECRET)
    .update(body)
    .digest("hex");

  if (hash !== signature)
    return res.status(400).json({ error: "Invalid signature" });

  if (req.body.payment_status === "finished") {
    const { data: deposit } = await supabase
      .from("deposits")
      .select("id")
      .eq("payment_id", req.body.payment_id)
      .single();

    if (deposit) {
      // YAHAN TUMHARA PORA admin_approve_deposit FUNCTION CHALEGA
      await supabase.rpc("admin_approve_deposit", { p_id: deposit.id });
    }
  }

  res.status(200).json({ status: "ok" });
}
