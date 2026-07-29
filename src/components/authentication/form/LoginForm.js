
// components/form/LoginForm.js
"use client";
import { useEffect, useState } from "react";
import SmartInput, { MailIcon, LockIcon } from "../ui/SmartInput.jsx";

export default function LoginForm({
  appLogoSrc = "/favicon.ico",
  appName = "SkillmatriX",
  onSubmit,                // ✅ now accepted
  onSwitch,                // go to signup
  onForgot,
 
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const r = localStorage.getItem("auth:remember");
      const em = localStorage.getItem("auth:email");
      if (r === "1" && em) {
        setRemember(true);
        setEmail(em);
      }
    } catch {}
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();               // ✅ important
    setError("");
   
    setLoading(true);
    try {
      if (remember) {
        localStorage.setItem("auth:remember", "1");
        localStorage.setItem("auth:email", email);
      } else {
        localStorage.removeItem("auth:remember");
        localStorage.removeItem("auth:email");
      }
      // ✅ call parent API
      await onSubmit?.({ email, password });
      // success navigation handled in AuthLayout (setMode("Home"))
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const emailStatus = email ? (/\S+@\S+\.\S+/.test(email) ? "valid" : "invalid") : "idle";
  const pwdStatus = password ? (password.length >= 6 ? "valid" : "invalid") : "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Branding */}
      <div className="flex flex-col items-center gap-2">
        <img src={appLogoSrc} alt={`${appName} logo`} className="w-12 h-12 rounded-md object-contain" />
        <span className="text-sm font-semibold text-[#2A2771]/90">{appName}</span>
      </div>
      <h2 className="text-xl font-semibold text-[#2A2771] text-center">Sign in</h2>
{error && (
  <div className="mb-4 flex items-start gap-2 bg-red-100 border border-red-300 text-black-800 px-4 py-3 rounded-lg text-sm">
    
    {/* Warning Icon */}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-600"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.516 11.59c.75 1.334-.213 2.99-1.742 2.99H3.483c-1.53 0-2.492-1.656-1.742-2.99L8.257 3.1zM9 7a1 1 0 112 0v3a1 1 0 11-2 0V7zm1 7a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
        clipRule="evenodd"
      />
    </svg>

    <span>{error}</span>
  </div>
)}

      {/* Inputs */}
      <SmartInput
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        icon={MailIcon}
        status={emailStatus}
        message={email && !/\S+@\S+\.\S+/.test(email) ? "Please enter a valid email" : ""}
      />
      <SmartInput
        id="login-password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        icon={LockIcon}
        status={pwdStatus}
        
      />

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me
        </label>
        <button type="button" onClick={onForgot} className="text-[#2A2771] hover:underline">
          Forgot?
        </button>
      </div>

    

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-md bg-[#2A2771] text-white py-2.5 font-medium shadow-sm hover:bg-[#241f67] ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

    
      <div className="text-xs text-[#2A2771]/70 text-center">
        Don’t have an account?{" "}
        <button type="button" className="underline underline-offset-2" onClick={onSwitch}>
          Sign up
        </button>
      </div>
    </form>
  );
}
