import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import manifest from "../public/voices/manifest.json";

const FPS = 30;
const GAP_FRAMES = 25;
const GREEN = "#7FE020";
const BG = "#09130a";

type ManifestEntry = (typeof manifest)[number];
type SegmentInfo = ManifestEntry & { startFrame: number; durationFrames: number };

const segments: SegmentInfo[] = (() => {
  let start = 0;
  return manifest.map((entry) => {
    const frames = Math.ceil(entry.durationSec * FPS);
    const seg = { ...entry, startFrame: start, durationFrames: frames };
    start += frames + GAP_FRAMES;
    return seg;
  });
})();

export const TOTAL_FRAMES =
  segments[segments.length - 1].startFrame +
  segments[segments.length - 1].durationFrames +
  GAP_FRAMES;

// --- 共通コンポーネント ---

const Subtitle: React.FC<{ moraTimings: ManifestEntry["moraTimings"] }> = ({ moraTimings }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 52,
        left: 80,
        right: 80,
        background: "rgba(0,0,0,0.72)",
        borderRadius: 14,
        padding: "16px 32px",
        textAlign: "center",
        border: `1px solid rgba(127,224,32,0.18)`,
      }}
    >
      {moraTimings.map((mora, i) => {
        const isSpoken = currentSec >= mora.startSec;
        const isCurrent = currentSec >= mora.startSec && currentSec < mora.endSec;
        return (
          <span
            key={i}
            style={{
              fontSize: 42,
              color: isCurrent ? GREEN : isSpoken ? "white" : "rgba(255,255,255,0.22)",
              fontWeight: isCurrent ? "bold" : "normal",
              display: "inline-block",
              transform: isCurrent ? "scale(1.18)" : "scale(1)",
            }}
          >
            {mora.text}
          </span>
        );
      })}
    </div>
  );
};

const SlideIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 80 } });
  const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ transform: `translateY(${(1 - progress) * 60}px)`, opacity }}>
      {children}
    </div>
  );
};

const Code: React.FC<{ children: string }> = ({ children }) => (
  <div
    style={{
      background: "#162016",
      border: `1px solid rgba(127,224,32,0.25)`,
      borderRadius: 12,
      padding: "22px 30px",
      fontFamily: "'Courier New', monospace",
      fontSize: 34,
      color: "#b8f080",
      whiteSpace: "pre",
      textAlign: "left",
      lineHeight: 1.6,
    }}
  >
    {children}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 50, color: "white", fontWeight: "bold", textAlign: "center" }}>
    {children}
  </div>
);

const Accent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: GREEN }}>{children}</span>
);

const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 30, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
    {children}
  </div>
);

const Center: React.FC<{ children: React.ReactNode; gap?: number }> = ({ children, gap = 28 }) => (
  <AbsoluteFill
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap,
      paddingBottom: 160,
    }}
  >
    {children}
  </AbsoluteFill>
);

// --- 各シーン ---

// Scene 0: タイトル
const Scene0: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 55 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Center>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
        <div style={{ fontSize: 34, color: GREEN, fontWeight: "bold", letterSpacing: 6, marginBottom: 10 }}>
          ずんだもんと学ぶ
        </div>
        <div style={{ fontSize: 116, color: "white", fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>
          Remotion
        </div>
        <div style={{ fontSize: 54, color: "rgba(255,255,255,0.88)", marginTop: 10, fontWeight: "bold" }}>
          動画制作入門
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.35)", marginTop: 22 }}>
          TypeScript × React × VOICEVOX
        </div>
      </div>
    </Center>
  );
};

// Scene 1: React で動画
const Scene1: React.FC = () => (
  <Center>
    <SlideIn>
      <Label><Accent>React</Accent> で動画を作る</Label>
    </SlideIn>
    <SlideIn delay={8}>
      <Code>{`export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "red" }} />
  );
};`}</Code>
    </SlideIn>
    <SlideIn delay={18}>
      <Sub>React コンポーネントがそのまま動画になるのだ！</Sub>
    </SlideIn>
  </Center>
);

// Scene 2: TypeScript
const Scene2: React.FC = () => (
  <Center>
    <SlideIn>
      <Label><span style={{ color: "#4F9EF8" }}>TypeScript</span> で型安全に</Label>
    </SlideIn>
    <SlideIn delay={8}>
      <Code>{`type SceneProps = {
  title: string;
  color: string;
};

const Scene: React.FC<SceneProps> = ({ title, color }) => ...`}</Code>
    </SlideIn>
  </Center>
);

// Scene 3: useCurrentFrame
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const barWidth = (frame % 90) / 90;
  return (
    <Center>
      <SlideIn>
        <Label><Accent>useCurrentFrame</Accent> でフレームを取得</Label>
      </SlideIn>
      <SlideIn delay={8}>
        <Code>{`const frame = useCurrentFrame();
// frame = ${String(frame).padStart(3, "0")}`}</Code>
      </SlideIn>
      <SlideIn delay={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Sub>frame</Sub>
          <div style={{ width: 500, height: 14, background: "rgba(255,255,255,0.12)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${barWidth * 100}%`, height: "100%", background: GREEN, borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 32, color: GREEN, minWidth: 56, textAlign: "right" }}>{frame}</div>
        </div>
      </SlideIn>
    </Center>
  );
};

// Scene 4: interpolate
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const demo = interpolate(frame % (fps * 2), [0, fps], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Center>
      <SlideIn>
        <Label><Accent>interpolate</Accent> で値を変化させる</Label>
      </SlideIn>
      <SlideIn delay={8}>
        <Code>{`const opacity = interpolate(
  frame,     // 現在フレーム
  [0, 30],   // 入力範囲
  [0, 1],    // 出力範囲
);`}</Code>
      </SlideIn>
      <SlideIn delay={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Sub>opacity</Sub>
          <div style={{ width: 420, height: 14, background: "rgba(255,255,255,0.12)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${demo * 100}%`, height: "100%", background: GREEN, borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 32, color: GREEN, minWidth: 60 }}>{demo.toFixed(2)}</div>
        </div>
      </SlideIn>
    </Center>
  );
};

// Scene 5: Studio
const Scene5: React.FC = () => (
  <Center>
    <SlideIn>
      <Label>Remotion <Accent>Studio</Accent> でプレビュー</Label>
    </SlideIn>
    <SlideIn delay={10}>
      <div style={{
        background: "#111",
        borderRadius: 14,
        overflow: "hidden",
        width: 900,
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{ background: "#222", padding: "10px 18px", display: "flex", gap: 8 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ padding: "20px 28px", fontFamily: "monospace", fontSize: 32, lineHeight: 1.8 }}>
          <div><span style={{ color: GREEN }}>$</span><span style={{ color: "white" }}> pnpm start</span></div>
          <div style={{ color: "rgba(255,255,255,0.45)" }}>
            Server ready - Local: <span style={{ color: "#60CFFF" }}>http://localhost:3000</span>
          </div>
        </div>
      </div>
    </SlideIn>
  </Center>
);

// Scene 6: アウトロ
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 8, stiffness: 50 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const dots = Array.from({ length: 18 }, (_, i) => ({
    x: (i * 137.5) % 100,
    y: (i * 73.3) % 80,
    size: 8 + (i % 4) * 7,
    color: [GREEN, "#FFD700", "#FF6B6B", "#60CFFF", "white"][i % 5],
    delay: (i * 4) % 24,
  }));
  return (
    <AbsoluteFill style={{ paddingBottom: 160 }}>
      {dots.map((dot, i) => {
        const y = interpolate(Math.max(0, frame - dot.delay), [0, 50], [dot.y - 15, dot.y + 8], { extrapolateRight: "clamp" });
        const dotOpacity = interpolate(frame, [0, 20], [0, 0.6], { extrapolateRight: "clamp" });
        return (
          <div key={i} style={{
            position: "absolute", left: `${dot.x}%`, top: `${y}%`,
            width: dot.size, height: dot.size, borderRadius: "50%",
            background: dot.color, opacity: dotOpacity,
          }} />
        );
      })}
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
          <div style={{ fontSize: 44, color: GREEN, fontWeight: "bold", marginBottom: 12 }}>
            さあ、始めるのだ！
          </div>
          <div style={{ fontSize: 96, color: "white", fontWeight: 900 }}>
            Let's Remotion!
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.4)", marginTop: 20 }}>
            Happy Video Making with ずんだもん
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const SCENES = [Scene0, Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];

// --- メインコンポジション ---

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ background: BG, fontFamily: "sans-serif" }}>
    {segments.map((seg, i) => {
      const Scene = SCENES[i];
      return (
        <Sequence key={i} from={seg.startFrame} durationInFrames={seg.durationFrames + GAP_FRAMES}>
          <AbsoluteFill>
            {Scene && <Scene />}
            <Subtitle moraTimings={seg.moraTimings} />
            <Sequence durationInFrames={seg.durationFrames}>
              <Audio src={staticFile(`voices/line-${i}.mp3`)} />
            </Sequence>
          </AbsoluteFill>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
