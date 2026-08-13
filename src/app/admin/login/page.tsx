"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await loginAction(password);
    if (success) {
      router.push("/admin");
    } else {
      setError("Invalid password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="neon-card p-8 border border-white/5 rounded-xl bg-terminal-900/50">
        <h1 className="text-xl font-mono text-white mb-6">Admin Login</h1>
        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-terminal-800 text-white p-2 rounded border border-white/10 mb-4"
          placeholder="Password"
        />
        <button type="submit" className="w-full btn-neon text-xs">Login</button>
      </form>
    </div>
  );
}
