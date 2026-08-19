import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff } from "lucide-react";
import "./styles.css";
import Home from "./Home";
import Earn from "./Earn";
import Asset from "./Asset";
import Withdraw from "./Withdraw";
import Deposit from "./Deposit";
import Profile from "./Profile";

const SUPABASE_URL = "https://xolmmviokbzniodfuwev.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Fcfla_vbMH05qbRJxmx9Bg_h92KR9EQ";
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const colors = {
  blueDark: "#0f172a",
  green: "#22c55e",
  purple: "#8b5cf6",
  halfWhite: "#f8fafc",
};

// SIRF 5 COUNTRIES
const countries = [
  { code: "PK", name: "🇵🇰 +92" },
  { code: "IN", name: "🇮🇳 +91" },
  { code: "US", name: "🇺🇸 +1" },
  { code: "GB", name: "🇬🇧 +44" },
  { code: "AE", name: "🇦🇪 +971" },
];

const BottomNav = ({
  page,
  setPage,
}: {
  page: string;
  setPage: (p: string) => void;
}) => {
  const navItems = [
    {
      key: "home",
      label: "Home",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
    },
    {
      key: "earn",
      label: "Earn",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      ),
    },
    {
      key: "asset",
      label: "Asset",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
    },
    {
      key: "profile",
      label: "Profile",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
    },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "70px",
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 1000,
        paddingBottom: "5px",
      }}
    >
      {navItems.map((item) => (
        <div
          key={item.key}
          onClick={() => setPage(item.key)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: page === item.key ? colors.purple : "#9ca3af",
            fontSize: "12px",
            fontWeight: page === item.key ? "600" : "400",
            borderTop:
              page === item.key
                ? `3px solid ${colors.purple}`
                : "3px solid transparent",
            paddingTop: "5px",
            width: "25%",
          }}
        >
          <div style={{ fontSize: "22px", marginBottom: "2px" }}>
            {item.icon}
          </div>
          {item.label}
        </div>
      ))}
    </div>
  );
};

type PageState =
  | "login"
  | "register"
  | "register_otp"
  | "home"
  | "earn"
  | "asset"
  | "profile"
  | "withdraw"
  | "deposit"
  | "showcase";

export default function App() {
  const [page, setPage] = useState<PageState>("login");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countryCode, setCountryCode] = useState("PK");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [timer, setTimer] = useState(5);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [terms, setTerms] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setReferral(ref);
      sessionStorage.setItem("pending_referral_code", ref);
    }
  }, []);

  const goToWithdraw = () => setPage("withdraw");
  const goToDeposit = () => setPage("deposit");
  const isValidEmail = (email: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
      email.trim().toLowerCase()
    );
  const startShowcaseTimer = () => {
    setTimer(5);
    let count = 5;
    const runTimer = () => {
      setTimer(count);
      if (count === 0) {
        setPage("home");
        return;
      }
      count--;
      setTimeout(runTimer, 1000);
    };
    runTimer();
  };

  // FIXED: LEVEL 1,2,3 REFERRAL SAVE KARNE KA FUNCTION
const addReferralLevels = async (newUserId: string, directReferrerId: string) => {
  try {
    const levels = [];
    
    // Level 1
    levels.push({
      referrer_id: directReferrerId,
      referred_id: newUserId,
      level: 1,
    });

    // Level 2 nikalo
    const { data: l1 } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", directReferrerId)
      .single();

    if (l1?.referred_by) {
      levels.push({
        referrer_id: l1.referred_by,
        referred_id: newUserId,
        level: 2,
      });

      // Level 3 nikalo
      const { data: l2 } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", l1.referred_by)
        .single();

      if (l2?.referred_by) {
        levels.push({
          referrer_id: l2.referred_by,
          referred_id: newUserId,
          level: 3,
        });
      }
    }

    if (levels.length > 0) {
      await supabase.from("referrals").insert(levels);
    }
  } catch (e) {
    console.error("addReferralLevels error:", e);
  }
};

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!fullName.trim()) return setError("Enter your full name");
    if (!cleanUsername) return setError("Enter username");
    if (!isValidEmail(cleanEmail))
      return setError("Invalid Email! Use format: name@gmail.com");
    if (cleanEmail !== confirmEmail.trim().toLowerCase())
      return setError("Emails do not match");
    if (password !== confirmPassword) return setError("Passwords do not match");
    if (password.length < 6)
      return setError("Password must be at least 6 characters");
    if (!terms) return setError("Please accept Terms & Conditions");

    setLoading(true);

    // FIXED: USERNAME UNIQUE CHECK
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", cleanUsername)
      .single();

    if (existingUsername) {
      setLoading(false);
      return setError(
        "Ye username pehle se use ho raha hai. Koi aur try karein"
      );
    }

    const refCode =
      referral.trim().toUpperCase() ||
      sessionStorage.getItem("pending_referral_code") ||
      "";
    const country = countries.find((c) => c.code === countryCode);
    const dialCode = country?.name.split(" ")[1] || "+92";
    const fullPhone = dialCode + phone;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { name: fullName.trim(), phone: fullPhone, referral: refCode },
      },
    });

    if (signUpError) {
      setLoading(false);
      alert("SIGNUP ERROR: " + signUpError.message);
      return;
    }
    if (!data.user) {
      setLoading(false);
      setError("Registration failed. Please try again.");
      return;
    }

    // FIXED: UPLINE NIKALNE KA LOGIC - referral_code se
    let referredById = null;
    if (refCode) {
      const { data: uplineArr } = await supabase
        .from("profiles")
        .select("id, referral_code")
        .eq("referral_code", refCode)
        .limit(1);
      const upline = uplineArr && uplineArr.length > 0 ? uplineArr[0] : null;
      if (upline) referredById = upline.id;
      else alert(`Referral Code ${refCode} nahi mila`);
    }

    // 1. PROFILE INSERT - THEEK WALA
    const myRefCode = "REF" + data.user.id.slice(0, 6).toUpperCase();

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: data.user.id, // <-- id hona chahiye, user_id nahi
      full_name: fullName.trim(), // <-- name hona chahiye, full_name nahi
      username: cleanUsername,
      email: cleanEmail,
      phone: fullPhone,
      country_code: countryCode,
      referral_code: myRefCode, // <-- referral_code theek hai
      referred_by: referredById, // <-- referred_by theek hai
      balance: 0,
      wallet_balance: 0,
      total_deposit: 0,
      total_withdraw: 0,
      total_income: 0,
      daily_income: 0,
      team_income: 0,
      referral_income: 0,
      level: 0,
    });
    // STEP 2: ERROR CHECK ADD KIYA
    if (profileError) {
        setLoading(false);
          alert("PROFILE SAVE ERROR: " + profileError.message);
            return;
            }

    // 2. REFERRAL TRACKING - LEVEL 1,2,3
    if (refCode && referredById) {
      await addReferralLevels(data.user.id, referredById);
    }

    setLoading(false);
    sessionStorage.removeItem("pending_referral_code");
    window.location.replace("/showcase");
  };

  // STEP 1: YE FUNCTION COMPLETELY REPLACE KAR DIYA
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return setError("Enter the 6-digit OTP");
    setLoading(true);
    const { data: authData, error: verifyError } =
      await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: "signup",
      });
    if (verifyError || !authData.user) {
      setError(verifyError?.message || "Invalid OTP");
      setLoading(false);
      return;
    }

// 1. PROFILE INSERT KARO + referred_by SAVE KARO
const { error: profileError } = await supabase.from("profiles").insert({
  user_id: authData.user.id,
  email: cleanEmail,
  full_name: fullName,
  username: userName,
  phone: phone,
  referred_by: referredById || null, // YE LAZMI HAI L1 L2 L3 KE LIYE
  wallet_balance: 0,
  total_deposit: 0,
  created_at: new Date().toISOString(),
});

if (profileError) {
  console.error("Profile insert error:", profileError);
}

// 2. REFERRAL TRACKING - LEVEL 1,2,3
if (refCode && referredById) {
  await addReferralLevels(authData.user.id, referredById);
}
    setLoading(false);
    sessionStorage.removeItem("pending_referral_code");
    setSuccess("Account created successfully!");
    setTimeout(() => window.location.replace("/showcase"), 1000);
  };

  const handleLogin = async () => {
    setError("");
    setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail))
      return setError("Invalid Email! Use format: name@gmail.com");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setLoading(false);
    if (error)
      setError(
        error.message.toLowerCase().includes("confirm")
          ? "Please verify your email first"
          : "Wrong email or password"
      );
    else {
      setSuccess("Login Successful! ✅");
      setTimeout(() => {
        setPage("showcase");
        setSuccess("");
        startShowcaseTimer();
      }, 1500);
    }
  };

  const handleForgot = async () => {
    setError("");
    setSuccess("");
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail))
      return setError("Please enter a valid email first");
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) setError(error.message);
    else setSuccess("Password reset link sent! Check email");
  };

  if (page === "showcase") {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: `url('https://i.postimg.cc/BtWdKDFv/file-000007cf08208924f8ce754ccca19.png') no-repeat center`,
          backgroundSize: "contain",
          backgroundColor: "#000",
          position: "relative",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "5px",
            right: "2px",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: "bold",
            zIndex: 10,
          }}
        >
          {timer}s
        </div>
        <p
          style={{
            position: "absolute",
            bottom: "20px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#fff",
            textShadow: "0 0 5px #000",
          }}
        >
          Redirecting to Dashboard...
        </p>
      </div>
    );
  }

  if (page === "login" || page === "register" || page === "register_otp") {
    return (
      <div className="page">
        <div className="center-box">
          {page === "register" && (
            <div className="login-box signup-only signup-compact">
              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}
              <h2 className="title">CREATE ACCOUNT</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
              <input
                type="email"
                placeholder="Confirm Email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="input"
              />
              <div className="phone-input">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="country-select"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input phone-number"
                />
              </div>
              <div className="password-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </span>
              </div>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Referral Code"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                className="input"
              />
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                I agree to Terms & Conditions
              </label>
              <button
                className="btn"
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "REGISTERING..." : "REGISTER"}
              </button>
              <p className="switch">
                Already have account?{" "}
                <span onClick={() => setPage("login")}>Sign In</span>
              </p>
            </div>
          )}
          {page === "register_otp" && (
            <div className="login-box">
              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}
              <h2 className="title">VERIFY EMAIL</h2>
              <p>
                OTP sent to <b>{email}</b>
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="input"
              />
              <button
                className="btn"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? "VERIFYING..." : "VERIFY & CREATE ACCOUNT"}
              </button>
              <p className="switch">
                <span onClick={() => setPage("register")}>Back to Sign Up</span>
              </p>
            </div>
          )}
          {page === "login" && (
            <div className="login-box login-only">
              {error && <div className="error-box">{error}</div>}
              {success && <div className="success-box">{success}</div>}
              <h2 className="title">SIGN IN</h2>
              <input
                type="text"
                placeholder="Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
              <div className="password-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "Hide" : "Show"}
                </span>
              </div>
              <a className="forgot" onClick={handleForgot}>
                Forgot Password?
              </a>
              <button className="btn" onClick={handleLogin} disabled={loading}>
                {loading ? "LOGGING IN..." : "LOGIN"}
              </button>
              <p className="switch">
                New here?{" "}
                <span onClick={() => setPage("register")}>Create account</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (page === "home")
    return (
      <>
        <Home />
        <BottomNav page={page} setPage={setPage} />
      </>
    );
  if (page === "earn")
    return (
      <>
        <Earn />
        <BottomNav page={page} setPage={setPage} />
      </>
    );
  if (page === "asset")
    return (
      <>
        <Asset goToWithdraw={goToWithdraw} goToDeposit={goToDeposit} />
        <BottomNav page={page} setPage={setPage} />
      </>
    );
  if (page === "profile")
    return (
      <>
        <Profile setPage={setPage} />
        <BottomNav page={page} setPage={setPage} />
      </>
    );
  if (page === "withdraw") return <Withdraw onClose={() => setPage("asset")} />;
  if (page === "deposit") return <Deposit onClose={() => setPage("asset")} />;
  return null;
}
