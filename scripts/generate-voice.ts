import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

// 出力音声フォーマット設定
const AUDIO_CONFIG = {
  // VOICEVOX 側のサンプリングレート（デフォルト 24000）
  samplingRate: 16000,
  // ffmpeg で変換する最終フォーマット: "mp3" | "wav"
  format: "mp3" as "mp3" | "wav",
  // MP3 のビットレート（format が mp3 のときのみ有効）
  mp3Bitrate: "32k",
};

const VOICEVOX_URL = "http://localhost:50021";

// VOICEVOX に送るテキストの読み仮名変換マップ
// （字幕表示には影響せず、発音だけ修正される）
const PRONUNCIATION_MAP: Record<string, string> = {
  Remotion: "リモーション",
  React: "リアクト",
  TypeScript: "タイプスクリプト",
  useCurrentFrame: "ユーズカレントフレーム",
  interpolate: "インターポレート",
  pnpm: "ピーエヌピーエム",
  Studio: "スタジオ",
};

function applyPronunciationMap(text: string): string {
  return Object.entries(PRONUNCIATION_MAP).reduce(
    (t, [word, reading]) => t.replaceAll(word, reading),
    text
  );
}

type AudioQuery = {
  accent_phrases: AccentPhrase[];
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana: string;
};

type AccentPhrase = {
  moras: Mora[];
  accent: number;
  pause_mora: Mora | null;
  is_interrogative: boolean;
};

type Mora = {
  text: string;
  consonant: string | null;
  consonant_length: number | null;
  vowel: string;
  vowel_length: number;
  pitch: number;
};

type MoraTiming = { text: string; startSec: number; endSec: number };

type VoiceResult = {
  file: string;
  moraTimings: MoraTiming[];
  durationSec: number;
};

type ManifestEntry = {
  index: number;
  text: string;
  audioFile: string;
  durationSec: number;
  moraTimings: MoraTiming[];
};

async function generateVoice(
  text: string,
  outputFile: string,
  speakerId = 1
): Promise<VoiceResult> {
  // 1. audio_query でクエリ取得（タイミング情報含む）
  const ttsText = applyPronunciationMap(text);
  const queryRes = await fetch(
    `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(ttsText)}&speaker=${speakerId}`,
    { method: "POST" }
  );
  if (!queryRes.ok) throw new Error(`audio_query failed: ${queryRes.status}`);
  const query: AudioQuery = await queryRes.json();

  // VOICEVOX 側のサンプリングレートを下げる
  query.outputSamplingRate = AUDIO_CONFIG.samplingRate;
  query.outputStereo = false;

  // 2. synthesis で WAV 生成
  const synthRes = await fetch(
    `${VOICEVOX_URL}/synthesis?speaker=${speakerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    }
  );
  if (!synthRes.ok) throw new Error(`synthesis failed: ${synthRes.status}`);
  const wavBuffer = Buffer.from(await synthRes.arrayBuffer());

  // 3. ファイル保存（WAV を一時ファイルとして書き出し）
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  if (AUDIO_CONFIG.format === "mp3") {
    const tmpWav = outputFile.replace(/\.mp3$/, ".tmp.wav");
    fs.writeFileSync(tmpWav, wavBuffer);
    // ffmpeg で MP3 に変換（mono, 低ビットレート）
    execFileSync("ffmpeg", [
      "-y", "-i", tmpWav,
      "-ac", "1",
      "-b:a", AUDIO_CONFIG.mp3Bitrate,
      outputFile,
    ]);
    fs.unlinkSync(tmpWav);
  } else {
    fs.writeFileSync(outputFile, wavBuffer);
  }

  // 4. モーラタイミングを計算
  let currentSec = query.prePhonemeLength;
  const moraTimings: VoiceResult["moraTimings"] = [];

  for (const phrase of query.accent_phrases) {
    for (const mora of phrase.moras) {
      const duration =
        (mora.consonant_length ?? 0) + mora.vowel_length;
      moraTimings.push({
        text: mora.text,
        startSec: currentSec,
        endSec: currentSec + duration,
      });
      currentSec += duration;
    }
    if (phrase.pause_mora) {
      currentSec +=
        (phrase.pause_mora.consonant_length ?? 0) +
        phrase.pause_mora.vowel_length;
    }
  }

  const durationSec = currentSec + query.postPhonemeLength;
  return { file: outputFile, moraTimings, durationSec };
}

type VoiceLine = { text: string; speaker: number };

// --- 実行 ---
const lines: VoiceLine[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "voices.json"), "utf-8")
);

(async () => {
  const manifest: ManifestEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const { text, speaker } = lines[i];
    const ext = AUDIO_CONFIG.format;
    const outputFile = path.join("public", "voices", `line-${i}.${ext}`);
    console.log(`[${i + 1}/${lines.length}] Generating: "${text}"`);
    const result = await generateVoice(text, outputFile, speaker);
    console.log(`  → ${outputFile} (${result.durationSec.toFixed(2)}s)`);
    manifest.push({
      index: i,
      text,
      audioFile: `line-${i}.${ext}`,
      durationSec: result.durationSec,
      moraTimings: result.moraTimings,
    });
  }

  const manifestPath = path.join("public", "voices", "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved to: ${manifestPath}`);
  console.log("Done!");
})();
