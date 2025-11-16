"use client";

import React, { useState, useMemo, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useRouter } from "next/navigation";

// ----------- ここにホワイトリスト登録メールアドレスを書く -----------
// ここに許可するユーザーのメールアドレスを列挙（小文字で）
const allowedUsers = [
  "alloweduser1@example.com",
  "alloweduser2@example.com",
];

// 曜日順（並び替え用）
const weekdayOrder = ["日", "月", "火", "水", "木", "金", "土"];

// episode型
type Episode = {
  id: string;
  episodeNumber: number;
  date: string;
  watched: boolean;
};

// drama型
type Drama = {
  id: string;
  title: string;
  weekday: string;
  time: string;
  episodes: Episode[];
};

export default function Page() {
  const router = useRouter();

  // 認証関連状態
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ドラマ関連状態（元のあなたのコード）
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [selectedDramaId, setSelectedDramaId] = useState<string | null>(null);

  // 入力欄
  const [titleInput, setTitleInput] = useState("");
  const [weekdayInput, setWeekdayInput] = useState("月");
  const [timeInput, setTimeInput] = useState("21:00");

  // スマホUI用：一覧の開閉
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // 画面幅判定
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // --- Firebase認証状態監視 ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // ホワイトリストチェック（メールは小文字に変換して比較）
        const email = firebaseUser.email?.toLowerCase() || "";
        if (!allowedUsers.includes(email)) {
          setAuthError("あなたはアクセス権限がありません。ログアウトします。");
          signOut(auth);
          setUser(null);
        } else {
          setUser(firebaseUser);
          setAuthError(null);
        }
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------
  // ① localStorage から読み込み
  // --------------------------
  React.useEffect(() => {
    if (!authChecked) return;
    if (!user) return;

    const saved = localStorage.getItem("dramas");
    if (saved) {
      setDramas(JSON.parse(saved));
    }
  }, [authChecked, user]);

  // --------------------------
  // ② localStorage に保存
  // --------------------------
  React.useEffect(() => {
    if (!user) return;
    localStorage.setItem("dramas", JSON.stringify(dramas));
  }, [dramas, user]);

  // ドラマ追加（12回分を自動生成）
  const addDrama = () => {
    if (!titleInput.trim()) return;

    const newDramaId = crypto.randomUUID();

    const now = new Date();
    const currentWeekday = now.getDay();
    const targetWeekday = weekdayOrder.indexOf(weekdayInput);

    const diff = targetWeekday - currentWeekday;
    const firstDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + diff + (diff < 0 ? 7 : 0)
    );

    const episodes: Episode[] = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(firstDate);
      date.setDate(firstDate.getDate() + 7 * i);
      const dateStr = date.toISOString().split("T")[0];

      return {
        id: crypto.randomUUID(),
        episodeNumber: i + 1,
        date: dateStr,
        watched: false,
      };
    });

    const newDrama: Drama = {
      id: newDramaId,
      title: titleInput.trim(),
      weekday: weekdayInput,
      time: timeInput,
      episodes,
    };

    setDramas((prev) => [...prev, newDrama]);
    setTitleInput("");

    if (isMobile) {
      setShowMobileMenu(false); // スマホは追加したら自動で閉じる
    }
  };

  // 選択中ドラマ
  const selectedDrama = useMemo(
    () => dramas.find((d) => d.id === selectedDramaId) || null,
    [selectedDramaId, dramas]
  );

  const toggleWatched = (episodeId: string) => {
    if (!selectedDrama) return;

    setDramas((prev) =>
      prev.map((d) =>
        d.id !== selectedDrama.id
          ? d
          : {
              ...d,
              episodes: d.episodes.map((e) =>
                e.id === episodeId ? { ...e, watched: !e.watched } : e
              ),
            }
      )
    );
  };

  const setWatchedUntil = (n: number) => {
    if (!selectedDrama) return;

    setDramas((prev) =>
      prev.map((d) =>
        d.id !== selectedDrama.id
          ? d
          : {
              ...d,
              episodes: d.episodes.map((e) => ({
                ...e,
                watched: e.episodeNumber <= n,
              })),
            }
      )
    );
  };

  const deleteDrama = (id: string) => {
    setDramas((prev) => prev.filter((d) => d.id !== id));
    if (selectedDramaId === id) setSelectedDramaId(null);
  };

  // 並び替え
  const sortedDramas = useMemo(() => {
    return [...dramas].sort(
      (a, b) =>
        weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday)
    );
  }, [dramas]);

  // ログアウト処理
  const handleLogout = async () => {
    await signOut(auth);
    router.refresh();
  };

  if (!authChecked) {
    return <div>認証を確認中...</div>;
  }

  if (!user) {
    router.push("/login");
    return <div>ログインしてください...</div>;
  }

  if (authError) {
    return (
      <div style={{ padding: 20, color: "red" }}>
        {authError}
      </div>
    );
  }

  // --------------------------
  // 見た目（元のコードのスタイルそのまま）
  // --------------------------
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    height: "100vh",
    overflow: "hidden",
    background: "#ffffff",
    color: "#000000",
  };

  const leftMenuStyle: React.CSSProperties = {
    width: isMobile ? "100%" : "240px",
    padding: "12px",
    borderRight: isMobile ? "none" : "1px solid #ccc",
    borderBottom: isMobile ? "1px solid #ccc" : "none",
    overflowY: "auto",
    background: "#fafafa",
  };

  const dramaItemStyle = (selected: boolean): React.CSSProperties => ({
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "8px",
    background: selected ? "#bbdefb" : "#f0f0f0",
    cursor: "pointer",
    border: "1px solid #ddd",
  });

  const episodeCardStyle = (watched: boolean): React.CSSProperties => ({
    padding: "14px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: watched ? "#dcedc8" : "#fff",
  });

  return (
    <div style={containerStyle}>
      {/* ログアウトボタン */}
      <div style={{ position: "fixed", top: 12, right: 12 }}>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 12px",
            background: "#e53935",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ログアウト
        </button>
      </div>

      {/* ▼▼ スマホ用：一覧を開閉 ▼▼ */}
      {isMobile && (
        <div style={{ padding: "12px" }}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #aaa",
              background: "#eee",
              fontSize: "16px",
            }}
          >
            {showMobileMenu ? "ドラマ一覧を閉じる" : "ドラマ一覧を開く"}
          </button>

          {/* 折りたたみメニュー */}
          {showMobileMenu && (
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  ...leftMenuStyle,
                  maxHeight: "60vh",
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <h2>ドラマ一覧</h2>

                {/* 追加フォーム */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="ドラマ名"
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                  <select
                    value={weekdayInput}
                    onChange={(e) => setWeekdayInput(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  >
                    {weekdayOrder.map((w) => (
                      <option key={w}>{w}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                  <button
                    onClick={addDrama}
                    style={{
                      padding: "10px",
                      background: "#0070f3",
                      color: "#fff",
                      borderRadius: "6px",
                      border: "none",
                    }}
                  >
                    追加（12回生成）
                  </button>
                </div>

                {/* 一覧 */}
                {sortedDramas.map((d) => {
                  const watchedCount = d.episodes.filter((e) => e.watched).length;
                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDramaId(d.id);
                        setShowMobileMenu(false);
                      }}
                      style={dramaItemStyle(d.id === selectedDramaId)}
                    >
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                      <div>{d.weekday}曜 {d.time}</div>
                      <div
                        style={{
                          marginTop: "4px",
                          display: "inline-block",
                          padding: "2px 6px",
                          background: "#0070f3",
                          color: "#fff",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        {watchedCount} / 12
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDrama(d.id);
                        }}
                        style={{
                          marginTop: "6px",
                          width: "100%",
                          padding: "6px",
                          background: "#e53935",
                          color: "#fff",
                          borderRadius: "6px",
                          border: "none",
                        }}
                      >
                        削除
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ▼▼ PC用メニュー（スマホでは非表示） ▼▼ */}
      {!isMobile && (
        <div style={leftMenuStyle}>
          <h2>ドラマ一覧</h2>

          {/* 追加フォーム */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="ドラマ名"
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <select
              value={weekdayInput}
              onChange={(e) => setWeekdayInput(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              {weekdayOrder.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
            <button
              onClick={addDrama}
              style={{
                padding: "10px",
                background: "#0070f3",
                color: "#fff",
                borderRadius: "6px",
                border: "none",
              }}
            >
              追加（12回生成）
            </button>
          </div>

          {sortedDramas.map((d) => {
            const watchedCount = d.episodes.filter((e) => e.watched).length;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDramaId(d.id)}
                style={dramaItemStyle(d.id === selectedDramaId)}
              >
                <div style={{ fontWeight: 600 }}>{d.title}</div>
                <div>{d.weekday}曜 {d.time}</div>
                <div
                  style={{
                    marginTop: "4px",
                    padding: "2px 6px",
                    background: "#0070f3",
                    color: "#fff",
                    borderRadius: "4px",
                    fontSize: "12px",
                    display: "inline-block",
                  }}
                >
                  {watchedCount} / 12
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDrama(d.id);
                  }}
                  style={{
                    marginTop: "6px",
                    width: "100%",
                    padding: "6px",
                    background: "#e53935",
                    color: "#fff",
                    borderRadius: "6px",
                    border: "none",
                  }}
                >
                  削除
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ▼▼ エピソード一覧（共通） ▼▼ */}
      <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
        {selectedDrama ? (
          <>
            <h2>
              {selectedDrama.title}（{selectedDrama.weekday}曜 {selectedDrama.time}）
            </h2>

            <div style={{ marginBottom: "20px" }}>
              <div>第何回まで視聴済みにする？</div>
              <input
                type="range"
                min={0}
                max={12}
                onChange={(e) => setWatchedUntil(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </div>

            {selectedDrama.episodes.map((ep) => (
              <div key={ep.id} style={episodeCardStyle(ep.watched)}>
                <div style={{ fontWeight: 600 }}>
                  第{ep.episodeNumber}回（{ep.date}）
                </div>
                <button
                  onClick={() => toggleWatched(ep.id)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px",
                    background: ep.watched ? "#81c784" : "#eee",
                    borderRadius: "6px",
                    border: "none",
                  }}
                >
                  {ep.watched ? "未視聴にする" : "視聴済みにする"}
                </button>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: "#666" }}>ドラマを選択してね</div>
        )}
      </div>
    </div>
  );
}
