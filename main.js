"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SpotifyControllerPlugin3
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/nowplaying.ts
var import_obsidian = require("obsidian");

// src/spotify.ts
var plugin = null;
var accessToken = null;
var tokenExpiry = 0;
function setPluginInstance(p) {
  plugin = p;
}
async function refreshAccessToken() {
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
      Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`)
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Spotify token refresh failed");
  }
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1e3 - 6e4;
  return accessToken;
}
async function spotifyFetch(endpoint, method = "GET") {
  const token = await refreshAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    console.error("Spotify API error:", res.status, text);
    throw new Error(`Spotify API error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}
async function getActiveDeviceId() {
  const data = await spotifyFetch("/me/player/devices");
  const device = data.devices.find((d) => d.is_active);
  if (!device) throw new Error("No active Spotify device");
  return device.id;
}
var getCurrentlyPlaying = () => spotifyFetch("/me/player/currently-playing");
var playSpotify = async () => spotifyFetch(
  `/me/player/play?device_id=${await getActiveDeviceId()}`,
  "PUT"
);
var pauseSpotify = async () => spotifyFetch(
  `/me/player/pause?device_id=${await getActiveDeviceId()}`,
  "PUT"
);
var nextTrack = () => spotifyFetch("/me/player/next", "POST");
var previousTrack = () => spotifyFetch("/me/player/previous", "POST");
var seekTo = async (ms) => spotifyFetch(
  `/me/player/seek?position_ms=${Math.floor(ms)}&device_id=${await getActiveDeviceId()}`,
  "PUT"
);

// src/nowplaying.ts
var NOW_PLAYING_VIEW_TYPE = "spotify-now-playing";
var NowPlayingView = class extends import_obsidian.ItemView {
  interval = null;
  isPlaying = false;
  isDragging = false;
  duration = 0;
  art;
  title;
  artist;
  progress;
  progressContainer;
  time;
  playBtn;
  constructor(leaf) {
    super(leaf);
  }
  getViewType() {
    return NOW_PLAYING_VIEW_TYPE;
  }
  getDisplayText() {
    return "Spotify Now Playing";
  }
  onOpen() {
    const el = this.contentEl;
    el.empty();
    const wrapper = el.createDiv("spotify-wrapper");
    this.art = wrapper.createEl("img", { cls: "spotify-art" });
    this.title = wrapper.createDiv("spotify-title");
    this.artist = wrapper.createDiv("spotify-artist");
    this.progressContainer = wrapper.createDiv(
      "spotify-progress-container"
    );
    this.progress = this.progressContainer.createDiv(
      "spotify-progress-bar"
    );
    this.time = wrapper.createDiv("spotify-time");
    const controls = wrapper.createDiv("spotify-controls");
    const prev = controls.createEl("button", { text: "Previous" });
    this.playBtn = controls.createEl("button", { text: "Play" });
    const next = controls.createEl("button", { text: "Next" });
    prev.onclick = () => previousTrack();
    next.onclick = () => nextTrack();
    this.playBtn.onclick = async () => {
      try {
        this.isPlaying ? await pauseSpotify() : await playSpotify();
      } catch {
        new import_obsidian.Notice("Spotify API failed");
      }
    };
    this.progressContainer.onmousedown = (e) => {
      this.isDragging = true;
      this.previewSeek(e);
    };
    this.progressContainer.onmousemove = (e) => {
      if (this.isDragging) this.previewSeek(e);
    };
    window.onmouseup = async (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      await this.commitSeek(e);
    };
    this.refresh();
    this.interval = window.setInterval(() => this.refresh(), 1e3);
  }
  async refresh() {
    if (this.isDragging) return;
    try {
      const data = await getCurrentlyPlaying();
      if (!data || !data.item) return;
      const track = data.item;
      this.isPlaying = data.is_playing;
      this.duration = track.duration_ms;
      this.art.src = track.album.images[0]?.url ?? "";
      this.art.onclick = () => window.open(track.external_urls.spotify, "_blank");
      this.title.textContent = track.name;
      this.artist.textContent = track.artists.map((a) => a.name).join(", ");
      this.playBtn.textContent = this.isPlaying ? "Pause" : "Play";
      const pct = data.progress_ms / this.duration * 100;
      this.progress.style.width = `${pct}%`;
      this.time.textContent = this.format(data.progress_ms) + " / " + this.format(this.duration);
    } catch (e) {
      console.error(e);
    }
  }
  previewSeek(e) {
    const rect = this.progressContainer.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1
    );
    this.progress.style.width = `${ratio * 100}%`;
  }
  async commitSeek(e) {
    const rect = this.progressContainer.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1
    );
    await seekTo(this.duration * ratio);
  }
  format(ms) {
    const s = Math.floor(ms / 1e3);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }
  onClose() {
    if (this.interval) clearInterval(this.interval);
  }
};

// src/settings.ts
var import_obsidian2 = require("obsidian");
var DEFAULT_SETTINGS = {
  clientId: "",
  clientSecret: "",
  refreshToken: ""
};
var SpotifySettingTab = class extends import_obsidian2.PluginSettingTab {
  plugin;
  constructor(app, plugin2) {
    super(app, plugin2);
    this.plugin = plugin2;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Spotify Controller Settings" });
    new import_obsidian2.Setting(containerEl).setName("Client ID").setDesc("Spotify app Client ID").addText(
      (text) => text.setPlaceholder("Paste Client ID").setValue(this.plugin.settings.clientId).onChange(async (value) => {
        this.plugin.settings.clientId = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Client Secret").setDesc("Spotify app Client Secret").addText(
      (text) => text.setPlaceholder("Paste Client Secret").setValue(this.plugin.settings.clientSecret).onChange(async (value) => {
        this.plugin.settings.clientSecret = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Refresh Token").setDesc("Spotify OAuth Refresh Token").addTextArea(
      (text) => text.setPlaceholder("Paste Refresh Token").setValue(this.plugin.settings.refreshToken).onChange(async (value) => {
        this.plugin.settings.refreshToken = value.trim();
        await this.plugin.saveSettings();
      })
    );
  }
};

// src/main.ts
var SpotifyControllerPlugin3 = class extends import_obsidian3.Plugin {
  settings;
  async onload() {
    console.log("Spotify Controller Plugin loading...");
    await this.loadSettings();
    this.addSettingTab(new SpotifySettingTab(this.app, this));
    setPluginInstance(this);
    this.registerView(
      NOW_PLAYING_VIEW_TYPE,
      (leaf) => new NowPlayingView(leaf)
    );
    this.addRibbonIcon("music", "Spotify Controller", async () => {
      await this.activateView();
    });
    this.app.workspace.onLayoutReady(() => {
      this.activateView();
    });
    console.log("Spotify Controller Plugin loaded.");
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(NOW_PLAYING_VIEW_TYPE);
  }
  async activateView() {
    const workspace = this.app.workspace;
    let leaf = workspace.getLeavesOfType(NOW_PLAYING_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: NOW_PLAYING_VIEW_TYPE,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
