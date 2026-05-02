import { WebcastPushConnection } from 'tiktok-live-connector';
import * as DiscordRPC from 'discord-rpc';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_LARGE_IMAGE_KEY = process.env.DISCORD_LARGE_IMAGE_KEY || 'tiktok_logo';

if (!TIKTOK_USERNAME || !DISCORD_CLIENT_ID) {
    console.error("Missing TIKTOK_USERNAME or DISCORD_CLIENT_ID in .env file.");
    process.exit(1);
}

// Ensure the Discord RPC library uses the IPC transport (local desktop app)
DiscordRPC.register(DISCORD_CLIENT_ID);
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

// State to hold stream data
let isLive = false;
let viewerCount = 0;
let likeCount = 0;
let roomTitle = 'Live Stream';
let streamStartTime: Date | null = null;

// Discord rate limits presence updates to once every 15 seconds.
const UPDATE_INTERVAL_MS = 15000;

/**
 * Updates the Discord Rich Presence card using the current local state.
 */
async function updateDiscordPresence() {
    if (!rpc || !isLive) return;

    try {
        await rpc.setActivity({
            details: `Just Chatting | ${roomTitle}`,
            state: `${viewerCount.toLocaleString()} watching - ${likeCount.toLocaleString()} likes`,
            startTimestamp: streamStartTime || new Date(),
            largeImageKey: DISCORD_LARGE_IMAGE_KEY,
            largeImageText: 'Streaming on TikTok',
            buttons: [
                {
                    label: 'Watch Live',
                    url: `https://www.tiktok.com/@${TIKTOK_USERNAME}/live`
                },
                {
                    label: 'Profile',
                    url: `https://www.tiktok.com/@${TIKTOK_USERNAME}`
                }
            ]
        });
        console.log(`[Discord] Presence updated: ${viewerCount} viewers, ${likeCount} likes.`);
    } catch (error) {
        console.error("[Discord] Failed to set activity:", error);
    }
}

/**
 * Connects to TikTok and sets up event listeners to maintain local state.
 */
function connectTikTok() {
    console.log(`[TikTok] Connecting to room: @${TIKTOK_USERNAME}...`);

    const tiktokConnection = new WebcastPushConnection(TIKTOK_USERNAME as string);

    tiktokConnection.connect().then(state => {
        console.info(`[TikTok] Connected! Room ID: ${state.roomId}`);

        isLive = true;
        streamStartTime = new Date();

        // Initial setup from connection state
        if (state.roomInfo) {
            roomTitle = state.roomInfo.title || 'Live Stream';
        }

        // Force an immediate Discord update when we connect
        updateDiscordPresence();

    }).catch(err => {
        console.error('[TikTok] Failed to connect:', err);
        console.log('[TikTok] Reconnecting in 5 seconds...');
        setTimeout(connectTikTok, 5000);
    });

    // Listen to Viewer Count updates
    tiktokConnection.on('roomUser', data => {
        if (typeof data.viewerCount === 'number') {
            viewerCount = data.viewerCount;
        }
    });

    // Listen to Like updates
    tiktokConnection.on('like', data => {
        if (typeof data.totalLikeCount === 'number') {
            likeCount = data.totalLikeCount;
        }
    });

    // Handle stream end
    tiktokConnection.on('streamEnd', () => {
        console.log('[TikTok] Stream ended.');
        isLive = false;
        viewerCount = 0;
        likeCount = 0;

        // Clear Discord presence when stream ends
        rpc.clearActivity().catch(console.error);
    });

    // Handle disconnects gracefully
    tiktokConnection.on('disconnected', () => {
        console.log('[TikTok] Disconnected.');
        isLive = false;
        rpc.clearActivity().catch(console.error);
    });
}

// Wait for the RPC client to be fully ready before doing anything
rpc.on('ready', () => {
    console.log('[Discord] RPC ready.');

    // Connect to TikTok once Discord is ready
    connectTikTok();

    // Start the periodic update loop for Discord
    // We update every 15 seconds to respect Discord's strict rate limits
    setInterval(() => {
        if (isLive) {
            updateDiscordPresence();
        }
    }, UPDATE_INTERVAL_MS);
});

// Start Discord RPC Connection
console.log('[Discord] Connecting to Discord client...');
rpc.login({ clientId: DISCORD_CLIENT_ID }).catch(err => {
    console.error('[Discord] Failed to connect to Discord RPC (Is your Discord app open?):', err);
});
