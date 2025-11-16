"use client";

import React, { useState, useMemo } from "react";

// 曜日順の並び設定（0=日曜 → 6=土曜）
const weekdayOrder = ["日", "月", "火", "水", "木", "金", "土"];

// ドラマ1件の型
type Episode = {
  id: string;
  episodeNumber: number; // 第n回
  date: string;
  watched: boolean;
};

type Drama = {
  id: string;
  title: string;
  weekday: string; // 曜日
  time: string; // 放送時間
  episodes: Episode[];
};

export default function Page() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [selectedDramaId, setSelectedDramaId] = useState<string | null>(null);

  // 入力欄
  const [titleInput, setTitleInput] = useState("");
  const [weekdayInput, setWeekdayInput] = useState("月");
  const [timeInput, setTimeInput] = useState("21:00");

  // ドラマ追加 → 12回分のエピソード生成
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
  };

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

  const sortedDramas = useMemo(() => {
    // 注意: sortは破壊的なのでコピーしてからsort
    return [...dramas].sort(
      (a, b) =>
        weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday)
    );
  }, [dramas]);

  // --- レスポンシブ用スタイル ---
  // 画面幅600px以下で文字サイズを小さく、右側の幅調整
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    height: "100vh",
    overflow: "hidden",
    fontFamily: "sans-serif",
    backgroundColor: "#fff",
    color: "#222",
  };

  const leftMenuStyle: React.CSSProperties = {
    width: "240px",
    borderRight: "1px solid #ccc",
    padding: "12px",
    overflowY: "auto",
  };

  const dramaItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "8px",
    background: isSelected ? "#bbdefb" : "#f0f0f0",
    cursor: "pointer",
    border: "1px solid #ddd",
    userSelect: "none",
  });

  const rightPanelStyle: React.CSSProperties = {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
  };

  const episodeCardStyle = (watched: boolean): React.CSSProperties => ({
    padding: "14px",
    marginBottom: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: watched ? "#dcedc8" : "#fff",
  });

  // メディアクエリ的にスタイル変更するために簡単にJSで判定
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      style={{
        ...containerStyle,
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      {/* 左メニュー */}
      <div
        style={{
          ...leftMenuStyle,
          width: isMobile ? "100%" : "240px",
          borderRight: isMobile ? "none" : "1px solid #ccc",
          borderBottom: isMobile ? "1px solid #ccc" : "none",
          maxHeight: isMobile ? "auto" : "100vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            marginBottom: "12px",
            fontSize: isMobile ? "20px" : "24px",
          }}
        >
          ドラマ一覧
        </h2>

        {/* 追加フォーム */}
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="ドラマ名を入力"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: isMobile ? "14px" : "16px",
            }}
          />
          <select
            value={weekdayInput}
            onChange={(e) => setWeekdayInput(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            {weekdayOrder.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <input
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            type="time"
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: isMobile ? "14px" : "16px",
            }}
          />
          <button
            onClick={addDrama}
            style={{
              padding: "10px",
              background: "#0070f3",
              color: "#fff",
              borderRadius: "6px",
              fontSize: isMobile ? "14px" : "16px",
              border: "none",
              cursor: "pointer",
            }}
          >
            追加（12回自動生成）
          </button>
        </div>

        {/* ドラマ一覧 */}
        {sortedDramas.map((d) => {
          const watchedCount = d.episodes.filter((e) => e.watched).length;
          return (
            <div
              key={d.id}
              onClick={() => setSelectedDramaId(d.id)}
              style={dramaItemStyle(d.id === selectedDramaId)}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: isMobile ? "16px" : "18px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={d.title}
              >
                {d.title}
              </div>
              <div
                style={{
                  fontSize: isMobile ? "12px" : "14px",
                  color: "#444",
                }}
              >
                {d.weekday}曜 {d.time}
              </div>

              {/* バッジ */}
              <div
                style={{
                  marginTop: "4px",
                  display: "inline-block",
                  padding: "2px 6px",
                  fontSize: isMobile ? "10px" : "12px",
                  background: "#0070f3",
                  color: "#fff",
                  borderRadius: "4px",
                  userSelect: "none",
                }}
              >
                {watchedCount} / 12 回
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteDrama(d.id);
                }}
                style={{
                  marginTop: "6px",
                  padding: "6px",
                  width: "100%",
                  background: "#e53935",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: isMobile ? "12px" : "14px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                12回まとめて削除
              </button>
            </div>
          );
        })}
      </div>

      {/* 右側：エピソード一覧 */}
      <div
        style={{
          ...rightPanelStyle,
          width: isMobile ? "100%" : "auto",
          fontSize: isMobile ? "14px" : "16px",
        }}
      >
        {selectedDrama ? (
          <>
            <h2
              style={{
                marginBottom: "12px",
                fontSize: isMobile ? "18px" : "24px",
                wordBreak: "keep-all",
              }}
            >
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
                <div
                  style={{
                    fontSize: isMobile ? "16px" : "18px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={`第${ep.episodeNumber}回（${ep.date}）`}
                >
                  第{ep.episodeNumber}回（{ep.date}）
                </div>

                <button
                  onClick={() => toggleWatched(ep.id)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: ep.watched ? "#81c784" : "#eeeeee",
                    fontSize: isMobile ? "14px" : "16px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {ep.watched ? "未視聴にする" : "視聴済みにする"}
                </button>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: "#666", fontSize: isMobile ? "14px" : "16px" }}>
            左からドラマを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
