import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import moraTimings from "../public/voices/line-0.json";
// 音声ファイルの拡張子は scripts/generate-voice.ts の AUDIO_CONFIG.format に合わせる
const VOICE_EXT = "mp3";

export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  // フェードイン
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // タイトルのバウンス
  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100, mass: 0.5 },
  });

  // 背景色アニメーション
  const hue = interpolate(frame, [0, fps * 6], [220, 280], {
    extrapolateRight: "clamp",
  });

  type MoraTiming = (typeof moraTimings)[number];

  // 現在のモーラを取得
  const currentMora = moraTimings.find(
    (m: MoraTiming) => currentSec >= m.startSec && currentSec < m.endSec
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue + 40}, 70%, 10%))`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <Audio src={staticFile(`voices/line-0.${VOICE_EXT}`)} />

      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
        <h1
          style={{
            fontSize: 72,
            color: "white",
            margin: 0,
            fontWeight: "bold",
            letterSpacing: "-2px",
            textShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          Hello, Remotion!
        </h1>
      </div>

      {/* 字幕エリア */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            borderRadius: 16,
            padding: "20px 40px",
            maxWidth: 1400,
            textAlign: "center",
          }}
        >
          {moraTimings.map((mora: MoraTiming, i: number) => {
            const isSpoken = currentSec >= mora.startSec;
            const isCurrent = mora === currentMora;
            return (
              <span
                key={i}
                style={{
                  fontSize: 48,
                  color: isCurrent
                    ? "#FFD700"
                    : isSpoken
                    ? "white"
                    : "rgba(255,255,255,0.3)",
                  fontWeight: isCurrent ? "bold" : "normal",
                  transition: "color 0.05s",
                  display: "inline-block",
                  transform: isCurrent ? "scale(1.2)" : "scale(1)",
                }}
              >
                {mora.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
