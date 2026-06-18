"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "motion/react";
import Link from "next/link";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    const err = searchParams.get("error");
    if (err === "banned_user") return "Your account has been banned.";
    if (err) return "Invalid email or password.";
    return null;
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error === "banned_user") {
        setError("Your account has been banned.");
        setLoading(false);
        return;
      }

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        router.push("/services/admin");
        return;
      }

      setError("Invalid email or password.");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full bg-[#111111] text-zinc-50 overflow-hidden font-sans">
      <div className="relative flex flex-col items-center justify-center w-full p-8">
        <div className="absolute top-8 left-8">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 font-semibold text-sm transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center text-center mb-10"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="mb-6 rounded-[2rem] bg-white p-5 shadow-[0_20px_40px_rgba(0,0,0,0.06)] inline-flex"
            >
              <svg width="52" height="52" viewBox="0 0 366 357" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M211.713 307.81c34.152-5.907 65.566-21.841 89.276-45.285 23.711-23.444 38.365-53.06 41.647-84.165s-4.995-61.928-23.524-87.593-46.252-44.71-78.787-54.124l-19.299 49.189c20.555 5.947 38.069 17.979 49.775 34.193 11.706 16.215 16.935 35.687 14.862 55.338-2.074 19.652-11.332 38.362-26.311 53.173-14.98 14.81-34.826 24.877-56.401 28.609z" fill="#111111" />
                <path d="m133.226 324.474 78.652-16.815-8.788-50.656zm21.129-277.3c-34.322 4.82-66.225 19.75-90.668 42.43-24.442 22.68-40.029 51.816-44.296 82.802s3.029 62.055 20.734 88.295 44.81 46.155 77.03 56.596l20.85-48.552c-20.356-6.596-37.479-19.178-48.665-35.755s-15.795-36.206-13.099-55.782 12.543-37.982 27.985-52.31 35.597-23.761 57.28-26.806z" fill="#111111" />
                <path d="M233.332 33.009 154.185 47.32l7.178 50.91z" fill="#111111" />
              </svg>
            </motion.div>

            <h1 className="font-naston text-3xl tracking-widest text-white mb-2">Admin Panel</h1>
            <p className="font-instrument text-lg italic text-zinc-500">Sign in to manage the platform</p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</label>
              <input
                type="email"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="admin@optzive.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
              <input
                type="password"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 font-medium"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="active:scale-[0.97] transition-transform duration-150 w-full mt-2 bg-primary text-[#111111] hover:brightness-110 font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

export default function ServicesLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
