const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const path = require('path'); // NAYA
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_SERVICE_KEY = "sb_secret_mRvteDwNqepLahUPQpjb2A_BPJft4nd";
const NOW_API_KEY = "AFXPEX5-T5RM0F2-JAKJ1XH-BFGGCMP";
const IPN_SECRET = "i7m918XE49tWLLfvS8LW1XeUNE59genM";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

app.use(cors());
app.use(bodyParser.json());

// API ROUTES YAHAN
app.post("/api/deposit/create-invoice", async (req, res) => { ...wesa hi code... });
app.post("/api/webhook/nowpayments", async (req, res) => { ...wesa hi code... });

// YE 3 LINE SABSE LAST ME ADD KARO
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));