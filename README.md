# Remotion Tryout

ずんだもんと学ぶ Remotion 動画制作入門。
TypeScript + React + VOICEVOX で構成された Remotion プロジェクトです。

## 必要なもの

- [mise](https://mise.jdx.dev/) (Node.js 24 / pnpm 10 の管理)
- Docker Desktop (VOICEVOX Engine 用)

## セットアップ

```sh
# 依存関係のインストール
pnpm install

# VOICEVOX Engine を起動
docker compose -f devenv/compose.yml --env-file devenv/.env up -d
```

## 開発

```sh
# Remotion Studio を起動（ブラウザで http://localhost:3000）
pnpm start

# 音声を生成（voices.json を編集後に実行）
pnpm gen:voice
```

## 動画生成

```sh
# フル解像度 (1920x1080) で書き出し → out/video.mp4
pnpm build
```

## 台本の編集

`voices.json` にセリフと話者 ID を記述します。

```json
[
  { "text": "こんにちは！ずんだもんなのだ！", "speaker": 3 }
]
```

編集後は `pnpm gen:voice` で音声を再生成してください。
生成された音声・タイミングファイル (`public/voices/`) は `.gitignore` 対象です。

### 読み仮名の調整

英単語の読みがおかしい場合は `scripts/generate-voice.ts` の `PRONUNCIATION_MAP` に追加します。

```ts
const PRONUNCIATION_MAP: Record<string, string> = {
  Remotion: "リモーション",
  // 追加例:
  // GitHub: "ギットハブ",
};
```

### 話者 ID

VOICEVOX の話者 ID は以下で確認できます。

```sh
curl http://localhost:50021/speakers | python3 -m json.tool
```

ずんだもんのノーマルボイスは `3` です。
