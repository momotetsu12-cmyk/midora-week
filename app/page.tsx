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

    // 今日を基準に第1回の日付を作る
    const now = new Date();
    const currentWeekday = now.getDay();
    const targetWeekday = weekdayOrder.indexOf(weekdayInput);

    const diff = targetWeekday - currentWeekday;
    const firstDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + diff + (diff < 0 ? 7 : 0) // 今週に放送日が過ぎてたら翌週
    );

    // 12週分のデータを生成（第1回 → 第12回）
    const episodes: Episode[] = Array.from({ length: 12 }).map((_, i) => {
      const date = new Date(firstDate);
      date.setDate(firstDate.getDate() + 7 * i);
      const dateStr = date.toISOString().split("T")[0];

      return {
        id: crypto.randomUUID(),
        episodeNumber: i + 1, // 第n回（1始まり）
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

  // 選択しているドラマ
  const selectedDrama = useMemo(
    () => dramas.find((d) => d.id === selectedDramaId) || null,
    [selectedDramaId, dramas]
  );

  // 視聴済み切り替え
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

  // 一括で第 N 回まで視聴済みにする
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

  // 12回分まとめて削除
  const deleteDrama = (id: string) => {
    setDramas((prev) => prev.filter((d) => d.id !== id));
    if (selectedDramaId === id) setSelectedDramaId(null);
  };

  // 曜日順ソート
  const sortedDramas = useMemo(() => {
    return dramas.sort(
      (a, b) =>
        weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday)
    );
  }, [dramas]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* 左メニュー（ドラマ一覧） */}
      <div
        style={{
          width: "240px",
          borderRight: "1px solid #ccc",
          padding: "12px",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginBottom: "12px" }}>ドラマ一覧</h2>

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
              fontSize: "16px",
            }}
          />
          <select
            value={weekdayInput}
            onChange={(e) => setWeekdayInput(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "16px",
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
              fontSize: "16px",
            }}
          />
          <button
            onClick={addDrama}
            style={{
              padding: "10px",
              background: "#0070f3",
              color: "#fff",
              borderRadius: "6px",
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
              style={{
                padding: "10px",
                marginBottom: "8px",
                borderRadius: "8px",
                background: d.id === selectedDramaId ? "#e3f2fd" : "#f8f8f8",
                cursor: "pointer",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ fontWeight: 600 }}>{d.title}</div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {d.weekday}曜 {d.time}
              </div>

              {/* バッジ：視聴済みカウント */}
              <div
                style={{
                  marginTop: "4px",
                  display: "inline-block",
                  padding: "2px 6px",
                  fontSize: "12px",
                  background: "#0070f3",
                  color: "#fff",
                  borderRadius: "4px",
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
                  fontSize: "14px",
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
          flex: 1,
          padding: "16px",
          overflowY: "auto",
        }}
      >
        {selectedDrama ? (
          <>
            <h2 style={{ marginBottom: "12px" }}>
              {selectedDrama.title}（{selectedDrama.weekday}曜 {selectedDrama.time}）
            </h2>

            {/* 一括視聴済み */}
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

            {/* 各エピソード */}
            {selectedDrama.episodes.map((ep) => (
              <div
                key={ep.id}
                style={{
                  padding: "14px",
                  marginBottom: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: ep.watched ? "#e8f5e9" : "#fff",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 600 }}>
                  第{ep.episodeNumber}回（{ep.date}）
                </div>

                <button
                  onClick={() => toggleWatched(ep.id)}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    background: ep.watched ? "#9ccc65" : "#eeeeee",
                    fontSize: "16px",
                  }}
                >
                  {ep.watched ? "未視聴" : "視聴済みにする"}
                </button>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: "#666" }}>左からドラマを選択してください</div>
        )}
      </div>
    </div>
  );
}
