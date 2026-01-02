import SpotifyControllerPlugin from "./main";

let plugin: SpotifyControllerPlugin | null = null;
let accessToken: string | null = null;
let tokenExpiry = 0;

export function setPluginInstance(p: SpotifyControllerPlugin) {
	plugin = p;
}

async function refreshAccessToken(): Promise<string> {
	if (!plugin) throw new Error("Plugin not initialized");

	const { clientId, clientSecret, refreshToken } = plugin.settings;

	if (!clientId || !clientSecret || !refreshToken) {
		throw new Error("Spotify credentials not configured");
	}

	if (accessToken && Date.now() < tokenExpiry) {
		return accessToken;
	}

	const res = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
		}),
	});

	const data = await res.json();

	if (!data.access_token) {
		throw new Error("Spotify token refresh failed");
	}

	accessToken = data.access_token;
	tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000;

	return accessToken;
}

async function spotifyFetch(
	endpoint: string,
	method: "GET" | "POST" | "PUT" = "GET"
) {
	const token = await refreshAccessToken();

	const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	if (!res.ok && res.status !== 204) {
		const text = await res.text();
		console.error("Spotify API error:", res.status, text);
		throw new Error(`Spotify API error ${res.status}`);
	}

	return res.status === 204 ? null : res.json();
}

async function getActiveDeviceId(): Promise<string> {
	const data = await spotifyFetch("/me/player/devices");
	const device = data.devices.find((d: any) => d.is_active);
	if (!device) throw new Error("No active Spotify device");
	return device.id;
}

export const getCurrentlyPlaying = () =>
	spotifyFetch("/me/player/currently-playing");

export const playSpotify = async () =>
	spotifyFetch(
		`/me/player/play?device_id=${await getActiveDeviceId()}`,
		"PUT"
	);

export const pauseSpotify = async () =>
	spotifyFetch(
		`/me/player/pause?device_id=${await getActiveDeviceId()}`,
		"PUT"
	);

export const nextTrack = () =>
	spotifyFetch("/me/player/next", "POST");

export const previousTrack = () =>
	spotifyFetch("/me/player/previous", "POST");

export const seekTo = async (ms: number) =>
	spotifyFetch(
		`/me/player/seek?position_ms=${Math.floor(ms)}&device_id=${await getActiveDeviceId()}`,
		"PUT"
	);