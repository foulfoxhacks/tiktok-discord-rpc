
# TikTok‑Discord‑RPC Connector
### Mirror your TikTok LIVE status to Discord Rich Presence

[![Release](https://img.shields.io/badge/release-v1.0.0-blue?style=for-the-badge)](https://github.com/foulfoxhacks/tiktok-discord-rpc/releases)
[![Node](https://img.shields.io/badge/Node-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

A lightweight Node.js bridge that mirrors your TikTok LIVE status to Discord Rich Presence. While you're streaming, your Discord profile shows a "Playing" card with the stream title, viewer count, like count, and clickable buttons that take viewers straight to your live or profile.

![preview](docs/preview.png)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Discord App Setup](#discord-app-setup)
- [Configuration](#configuration)
- [Example Usage](#example-usage)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Development & Contributing](#development--contributing)
- [Changelog](#changelog)
- [License](#license)
- [Contact](#contact)

---

## Overview

This project listens to a TikTok LIVE room over the unofficial WebSocket API and pushes the current state to your local Discord client over IPC. Your "Playing" card updates with viewer count, like count, the stream title, and two action buttons (Watch Live / Profile) that anyone viewing your Discord profile can click.

Designed for:
- TikTok creators who also hang out on Discord
- Streamers who want zero‑touch presence updates while live
- Anyone who finds OBS+Discord plugins overkill for a simple status mirror

---

## Key Features

- Auto‑detects when you go live and clears presence when the stream ends
- Live viewer count, like count, and stream title
- Two clickable buttons (Watch Live / Profile) on your Discord profile
- Auto‑reconnect to TikTok on connection drops
- Respects Discord's 15‑second presence rate limit
- Configurable via a single `.env` file
- Pure Node.js / TypeScript — no native dependencies

---

## Requirements

- **Node.js:** 18 or later
- **Discord:** Desktop client running on the same machine (RPC uses local IPC)
- **Discord Developer App:** A free application from the [Discord Developer Portal](https://discord.com/developers/applications)
- **TikTok:** A public account with LIVE access

---

## Quick Start

1. **Clone the repo**
   ~~~bash
   git clone https://github.com/foulfoxhacks/tiktok-discord-rpc.git
   cd tiktok-discord-rpc
   ~~~

2. **Install dependencies**
   ~~~bash
   npm install
   ~~~

3. **Configure your `.env`**
   ~~~bash
   cp .env.example .env
   # then edit .env with your TikTok username and Discord client ID
   ~~~

4. **Run it**
   ~~~bash
   npm run dev
   ~~~

   Or build and run the compiled output:
   ~~~bash
   npm run build
   npm start
   ~~~

---

## Discord App Setup

1. Go to the **[Discord Developer Portal](https://discord.com/developers/applications)** and click **New Application**.
2. Give it the name you want to appear under "Playing" (e.g., `TikTok Live Presence`).
3. From **General Information**, copy the **Application ID** — this is your `DISCORD_CLIENT_ID`.
4. Go to **Rich Presence → Art Assets** and upload an image. Name the asset key `tiktok_logo` (or whatever you set `DISCORD_LARGE_IMAGE_KEY` to).

   > Discord caches assets — newly uploaded images can take a few minutes to become available.

5. Save. No OAuth, redirect URIs, or bot setup needed for local Rich Presence.

---

## Configuration

All configuration lives in `.env`:

~~~env
# Your TikTok username (without the @)
TIKTOK_USERNAME=your_tiktok_username

# Application ID from the Discord Developer Portal
DISCORD_CLIENT_ID=your_discord_application_id

# Asset key uploaded under Rich Presence → Art Assets
DISCORD_LARGE_IMAGE_KEY=tiktok_logo
~~~

| Variable | Required | Description |
|----------|----------|-------------|
| `TIKTOK_USERNAME` | Yes | Your TikTok handle without the leading `@` |
| `DISCORD_CLIENT_ID` | Yes | Application ID from the Discord Developer Portal |
| `DISCORD_LARGE_IMAGE_KEY` | No | Discord asset key for the large image. Defaults to `tiktok_logo` |

---

## Example Usage

Once your `.env` is filled in, just run the script before (or while) you go live:

~~~bash
npm run dev
~~~

You should see logs like:

~~~
[Discord] Connecting to Discord client...
[Discord] RPC ready.
[TikTok] Connecting to room: @your_username...
[TikTok] Connected! Room ID: 7xxxxxxxxxxxxxxxxxx
[Discord] Presence updated: 3 viewers, 153 likes.
~~~

Leave it running in the background — it'll update Discord every 15 seconds and clear your activity when the stream ends.

---

## How It Works

The script connects to TikTok's live room WebSocket via [`tiktok-live-connector`](https://www.npmjs.com/package/tiktok-live-connector) and listens for `roomUser` (viewer count) and `like` events. It pushes the current state to your Discord client every 15 seconds via [`discord-rpc`](https://www.npmjs.com/package/discord-rpc) over local IPC.

**Update flow:**

1. `rpc.login()` connects to the local Discord client over IPC
2. On the `ready` event, the TikTok connection is opened
3. Viewer/like state is held locally and refreshed on each event
4. Every 15 seconds, the most recent state is pushed via `rpc.setActivity()`
5. On `streamEnd` or `disconnected`, `rpc.clearActivity()` removes the card

This avoids hammering Discord's API and keeps the integration resilient to brief TikTok disconnects.

---

## Troubleshooting

- **The activity card doesn't appear at all.**
  Make sure the Discord desktop app is open. In Discord: **User Settings → Activity Privacy → Display current activity as a status message** must be enabled. Check the console for `[Discord] Failed to connect to Discord RPC` — that means Discord isn't running or IPC isn't reachable.

- **The card shows but the buttons don't.**
  Discord intentionally hides RPC buttons on your *own* profile. Have a friend (or a second account) view your profile to confirm they're rendering. Buttons also don't show on Discord mobile, even for other users.

- **The image is missing or shows a placeholder.**
  The asset key in `.env` must exactly match the key uploaded in the Developer Portal. New assets can take several minutes to propagate.

- **TikTok connection fails.**
  `tiktok-live-connector` uses an unofficial API and can break when TikTok changes things. Check the package's [GitHub issues](https://github.com/zerodytrash/TikTok-Live-Connector/issues). Also confirm your username is correct and *without* the `@`.

- **Activity shows briefly then disappears.**
  Likely a Discord rate limit. The script already throttles to once every 15 seconds — if you've modified `UPDATE_INTERVAL_MS`, raise it back up.

---

## Development & Contributing

- **Code style:** TypeScript strict mode, `tsc` for builds, `ts-node` for dev.
- **Project layout:** Source in `src/`, build output in `dist/`.
- **Local dev:** `npm run dev` runs the TS source directly via `ts-node`.
- **Contributing:** Fork → branch → PR. Include a clear description and reproduction steps for bug fixes.
- **Issues:** Please include your Node version, OS, and the relevant console output.

---

## Changelog

- **v1.0.0** — Initial release: TikTok LIVE → Discord Rich Presence bridge with viewer count, like count, stream title, and Watch Live / Profile buttons.

---

## License

~~~text
MIT License

Copyright (c) 2026 Aleksandr "Sammy" Freyermuth

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
~~~

---

## Contact

Created by **FoulFoxHacks** — open issues or PRs on GitHub: <https://github.com/foulfoxhacks/tiktok-discord-rpc>.
