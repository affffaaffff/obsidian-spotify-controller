import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import {
	getCurrentlyPlaying,
	playSpotify,
	pauseSpotify,
	nextTrack,
	previousTrack,
	seekTo,
} from "./spotify";

export const NOW_PLAYING_VIEW_TYPE = "spotify-now-playing";

export class NowPlayingView extends ItemView {
	private interval: number | null = null;
	private isPlaying = false;
	private isDragging = false;
	private duration = 0;

	private art!: HTMLImageElement;
	private title!: HTMLElement;
	private artist!: HTMLElement;
	private progress!: HTMLElement;
	private progressContainer!: HTMLElement;
	private time!: HTMLElement;
	private playBtn!: HTMLButtonElement;

	constructor(leaf: WorkspaceLeaf) {
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
				new Notice("Spotify API failed");
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
		this.interval = window.setInterval(() => this.refresh(), 1000);
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
			this.art.onclick = () =>
				window.open(track.external_urls.spotify, "_blank");

			this.title.textContent = track.name;
			this.artist.textContent = track.artists
				.map((a: any) => a.name)
				.join(", ");

			this.playBtn.textContent = this.isPlaying ? "Pause" : "Play";

			const pct = (data.progress_ms / this.duration) * 100;
			this.progress.style.width = `${pct}%`;

			this.time.textContent =
				this.format(data.progress_ms) +
				" / " +
				this.format(this.duration);
		} catch (e) {
			console.error(e);
		}
	}

	previewSeek(e: MouseEvent) {
		const rect = this.progressContainer.getBoundingClientRect();
		const ratio = Math.min(
			Math.max((e.clientX - rect.left) / rect.width, 0),
			1
		);
		this.progress.style.width = `${ratio * 100}%`;
	}

	async commitSeek(e: MouseEvent) {
		const rect = this.progressContainer.getBoundingClientRect();
		const ratio = Math.min(
			Math.max((e.clientX - rect.left) / rect.width, 0),
			1
		);
		await seekTo(this.duration * ratio);
	}

	format(ms: number) {
		const s = Math.floor(ms / 1000);
		return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
	}

	onClose() {
		if (this.interval) clearInterval(this.interval);
	}
}