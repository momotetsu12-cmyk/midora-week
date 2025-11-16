"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/"); // ログイン成功したらトップへ遷移
    } catch (err: any) {
      setError(err.message || "認証に失敗しました");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h1>{isRegister ? "新規登録" : "ログイン"}</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ padding: 8, fontSize: 16 }}
        />
        <button type="submit" style={{ padding: 10, fontSize: 16 }}>
          {isRegister ? "登録してログイン" : "ログイン"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          エラー: {error}
        </p>
      )}

      <button
        onClick={() => {
          setError(null);
          setIsRegister(!isRegister);
        }}
        style={{ marginTop: 20, fontSize: 14, color: "#0070f3", background: "none", border: "none", cursor: "pointer" }}
      >
        {isRegister ? "アカウントをお持ちですか？ログイン" : "アカウントがなければ登録"}
      </button>
    </div>
  );
}
