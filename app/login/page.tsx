"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(
    searchParams.get("error") ? "Invalid email or password." : null
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Signup State
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setLoginError("Invalid email or password.");
        setIsLoggingIn(false);
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        return;
      }

      setLoginError("Invalid email or password.");
    } catch {
      setLoginError("Invalid email or password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupError(null);
    setIsSigningUp(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;
      setSignupError(data?.message ?? "Registration failed");
      setIsSigningUp(false);
      return;
    }

    const result = await signIn("credentials", {
      email: signupEmail,
      password: signupPassword,
      redirect: false,
    });

    setIsSigningUp(false);

    if (result?.ok) {
      router.push("/onboarding");
      return;
    }

    setActiveTab("login");
  };

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setSignupError(null);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#111111] text-zinc-50 overflow-hidden font-sans flex-col lg:flex-row">
      {/* LEFT SIDE: Brand */}
      <div className="relative flex flex-col items-center justify-center lg:w-1/2 p-8 bg-primary text-[#111111] min-h-[40vh] lg:min-h-screen">
        {/* Subtle decorative elements could go here */}
        <div className="absolute top-8 left-8">
          <Link href="/" className="text-[#111111]/60 hover:text-[#111111] font-semibold text-sm transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{
              background: "#ffffff",
              borderRadius: "2rem",
              padding: "28px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.06)"
            }}
            className="mb-8"
          >
            <svg width="72" height="72" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
              <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
              <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <h1 className="font-naston text-4xl md:text-6xl tracking-widest text-[#111111] mb-5">
              OPTIZIVE
            </h1>
            <p className="font-instrument text-2xl md:text-3xl italic text-[#111111]/80 max-w-[340px] mx-auto leading-tight">
              Precision tools for the modern digital merchant.
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE: Forms */}
      <div className="relative flex flex-col items-center justify-start lg:w-1/2 p-6 md:p-12 lg:p-12 bg-[#111111] overflow-hidden">
        <div className="w-full max-w-md pt-4 md:pt-8 lg:pt-12">
          {/* Tab Switcher */}
          <div className="flex relative bg-[#1a1a1a] p-1.5 rounded-2xl mb-6 border border-white/5">
            {["login", "signup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "login" | "signup")}
                className={`relative flex-1 py-3 text-sm font-semibold rounded-xl transition-colors duration-300 ${
                  activeTab === tab ? "text-[#111111]" : "text-zinc-400 hover:text-zinc-200"
                }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 capitalize">{tab}</span>
              </button>
            ))}
          </div>

          {/* Form Area */}
          <div className="relative min-h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {activeTab === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
                    <div>
                      <h2 className="text-3xl font-naston text-white mb-2">Welcome back</h2>
                      <p className="text-zinc-400 text-sm font-archivo">Enter your credentials to access your account.</p>
                    </div>

                    <div className="flex flex-col gap-5 mt-2">
                      <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                        <input
                          type="email"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          placeholder="name@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex justify-between">
                          Password
                          <a href="#" className="text-primary/80 hover:text-primary normal-case tracking-normal">Forgot?</a>
                        </label>
                        <input
                          type="password"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {loginError && <p className="text-sm text-red-400 font-medium">{loginError}</p>}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="btn-press w-full mt-2 bg-primary text-[#111111] hover:brightness-110 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingIn ? "Signing in..." : "Sign in"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="flex flex-col gap-6">
                    <div>
                      <h2 className="text-3xl font-naston text-white mb-2">Create an account</h2>
                      <p className="text-zinc-400 text-sm font-archivo">Join the smartest supply chain network.</p>
                    </div>

                    <div className="flex flex-col gap-5 mt-2">
                      <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                        <input
                          type="text"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          placeholder="Jane Doe"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</label>
                        <input
                          type="email"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          placeholder="name@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                        <input
                          type="password"
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    {signupError && <p className="text-sm text-red-400 font-medium">{signupError}</p>}

                    <button
                      type="submit"
                      disabled={isSigningUp}
                      className="btn-press w-full mt-2 bg-primary text-[#111111] hover:brightness-110 font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSigningUp ? "Creating account..." : "Create account"}
                    </button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Shared Social Login underneath */}
          <div className="mt-6">
            <div className="relative flex items-center mb-6">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Or continue with</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn-press w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-[#111111] font-bold py-4 rounded-xl transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForms />
    </Suspense>
  );
}
