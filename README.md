# Tiktok-Discord-RPC Connector

Mirrors your TikTok LIVE status to Discord Rich Presence. While you're live, your Discord profile shows a "Playing" card with the stream title, viewer count, like count, and clickable buttons that take viewers straight to your TikTok live or profile.

![preview](docs/preview.png)

## How it works

The script connects to TikTok via [`tiktok-live-connector`](https://www.npmjs.com/package/tiktok-live-connector) and listens for room user and like events. It pushes that state to your Discord client every 15 seconds via [`discord-rpc`](https://www.npmjs.com/package/discord-rpc) over the local IPC transport. When the stream ends, the activity is cleared.

## Prerequisites

- Node.js 18+
- The Discord **desktop app** running and signed in on the same machine (RPC won't work with the web client)
- A Discord application (created in the Developer Portal — see below)

## Setup

### 1. Create a Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Give it a name (this is what shows up under "Playing" — e.g., "TikTok Live Presence").
3. Copy the **Application ID** from the General Information page. You'll need this for `.env`.
4. Go to **Rich Presence -> Art Assets** and upload an image. Name the asset key `tiktok_logo` (or whatever you set `DISCORD_LARGE_IMAGE_KEY` to). Note: Discord caches assets, so it may take a few minutes for new uploads to be usable.

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
TIKTOK_USERNAME=your_tiktok_username
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_LARGE_IMAGE_KEY=tiktok_logo
```

### 3. Install and run

```bash
npm install
npm run dev
```

Or build and run the compiled output:

```bash
npm run build
npm start
```

## Usage

Start the script before (or while) you go live on TikTok. It will:

1. Connect to your Discord client over local IPC.
2. Connect to your TikTok room and subscribe to viewer/like events.
3. Update your Discord activity every 15 seconds while you're live.
4. Clear the activity when the stream ends or disconnects.

## Troubleshooting

**The activity card doesn't appear at all.**
- Make sure the Discord desktop app is open and you're signed in.
- In Discord: User Settings -> Activity Privacy -> "Display current activity as a status message" must be enabled.
- Check the console output. If you see `[Discord] Failed to connect to Discord RPC`, Discord isn't running or RPC isn't reachable.

**The card appears but the buttons don't show.**
- Discord intentionally hides RPC buttons from you on your *own* profile. Have a friend look at your profile, or check from a second account, to see them.
- Buttons also don't render on Discord mobile, even for other users.

**The image doesn't load.**
- Asset key in `.env` must match the asset name in the Developer Portal exactly.
- Discord can take several minutes to propagate newly uploaded assets.

**TikTok connection fails.**
- `tiktok-live-connector` uses an unofficial API and can break when TikTok changes things upstream. Check the package's GitHub for known issues.
- The username in `.env` should be without the `@`.

## Notes

- This uses an **unofficial** TikTok API. It may stop working without warning if TikTok changes their internals.
- Discord must be running on the same machine as the script — RPC is a local IPC connection.
- Presence is updated every 15 seconds to respect Discord's rate limits.

## License

MIT — see [LICENSE](LICENSE).
