"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Truck, Eye, EyeOff, Loader2, Shield, Users, BarChart3, Settings } from "lucide-react";

const demoAccounts = [
  { email: "fleet@transitops.com", role: "Fleet Manager", color: "text-amber-400", icon: Truck },
  { email: "dispatch@transitops.com", role: "Dispatcher", color: "text-blue-400", icon: Settings },
  { email: "safety@transitops.com", role: "Safety Officer", color: "text-green-400", icon: Shield },
  { email: "finance@transitops.com", role: "Financial Analyst", color: "text-purple-400", icon: BarChart3 },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#111118] border-r border-white/5 p-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-black font-bold text-lg">T</div>
            <div>
              <span className="text-xl font-bold text-white">TransitOps</span>
              <p className="text-xs text-gray-500">Smart Transport Platform</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Digitize your<br />
              <span className="text-amber-400">transport operations</span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Manage vehicles, drivers, trips, maintenance, fuel, and analytics in one centralized platform.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Real-time fleet tracking & KPIs",
              "Automated driver license validation",
              "Smart dispatch with business rules",
              "Operational cost analytics & ROI",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-600">
          © 2026 TransitOps. Hackathon Build.
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black font-bold">T</div>
            <span className="font-bold text-white">TransitOps</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-8">Enter your credentials to access TransitOps</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <p className="text-xs text-gray-600 text-center mb-3 font-medium uppercase tracking-wider">
              Demo Accounts (password: password123)
            </p>
            <div className="space-y-2">
              {demoAccounts.map(({ email: demoEmail, role, color, icon: Icon }) => (
                <button
                  key={demoEmail}
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword("password123");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-8 bg-[#1a1a28] border border-white/5 hover:border-amber-500/20 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon size={13} className={color} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${color}`}>{role}</p>
                    <p className="text-[10px] text-gray-600">{demoEmail}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
