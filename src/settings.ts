import { App, PluginSettingTab, Setting } from "obsidian";
import SpotifyControllerPlugin from "./main";

export interface SpotifySettings {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
}

export const DEFAULT_SETTINGS: SpotifySettings = {
	clientId: "",
	clientSecret: "",
	refreshToken: "",
};

export class SpotifySettingTab extends PluginSettingTab {
	plugin: SpotifyControllerPlugin;

	constructor(app: App, plugin: SpotifyControllerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Spotify Controller Settings" });

		new Setting(containerEl)
			.setName("Client ID")
			.setDesc("Spotify app Client ID")
			.addText((text) =>
				text
					.setPlaceholder("Paste Client ID")
					.setValue(this.plugin.settings.clientId)
					.onChange(async (value) => {
						this.plugin.settings.clientId = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Client Secret")
			.setDesc("Spotify app Client Secret")
			.addText((text) =>
				text
					.setPlaceholder("Paste Client Secret")
					.setValue(this.plugin.settings.clientSecret)
					.onChange(async (value) => {
						this.plugin.settings.clientSecret = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Refresh Token")
			.setDesc("Spotify OAuth Refresh Token")
			.addTextArea((text) =>
				text
					.setPlaceholder("Paste Refresh Token")
					.setValue(this.plugin.settings.refreshToken)
					.onChange(async (value) => {
						this.plugin.settings.refreshToken = value.trim();
						await this.plugin.saveSettings();
					})
			);
	}
}