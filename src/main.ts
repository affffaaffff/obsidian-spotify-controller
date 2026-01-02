import { Plugin, WorkspaceLeaf } from "obsidian";
import { NowPlayingView, NOW_PLAYING_VIEW_TYPE } from "./nowplaying";
import {
	SpotifySettingTab,
	DEFAULT_SETTINGS,
	SpotifySettings,
} from "./settings";
import { setPluginInstance } from "./spotify";

export default class SpotifyControllerPlugin extends Plugin {
	settings: SpotifySettings;

	async onload() {
		console.log("Spotify Controller Plugin loading...");

		await this.loadSettings();
		this.addSettingTab(new SpotifySettingTab(this.app, this));

		setPluginInstance(this);

		this.registerView(
			NOW_PLAYING_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new NowPlayingView(leaf)
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
				active: true,
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
}