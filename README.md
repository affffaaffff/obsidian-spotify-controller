# Obsidian Spotify Controller

Control Spotify playback directly from Obsidian.

This plugin adds a dedicated “Now Playing” view that allows you to control Spotify without leaving your notes. All authentication is handled securely using Obsidian’s settings system. No credentials are hard-coded or committed to version control.

---

## Features

- Play and pause Spotify
- Skip to next and previous tracks
- Seek within the current track using a draggable progress bar
- View album artwork and track information
- Click album artwork to open the track in Spotify
- Secure OAuth authentication via Obsidian Settings
- No external servers required
- Desktop-only plugin

---

## Requirements

- Obsidian Desktop
- An active Spotify account
- Spotify must be open and playing on at least one device

---

## Installation (Manual)

1. Download the latest release from this repository
2. Extract the files into:

   `.obsidian/plugins/obsidian-spotify`

3. Ensure the folder contains:
   - `main.js`
   - `manifest.json`
   - `styles.css`

4. Restart Obsidian
5. Enable **Spotify Controller** from Community Plugins

---

## Spotify Setup (Required)

You must create a Spotify Developer application and generate a refresh token.

---

### Step 1: Create a Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Open the app settings
4. Add the following Redirect URI exactly:

http://127.0.0.1:8080/callback

Save the settings.

---

### Step 2: Generate an Authorization Code

Open the following URL in your browser (replace `YOUR_CLIENT_ID`):

https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://127.0.0.1:8080/callback&scope=user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing

After authorizing, you will be redirected to a URL like:

http://127.0.0.1:8080/callback?code=AUTH_CODE

Copy the `code` value from the URL.

---

### Step 3: Exchange Code for Refresh Token

Run the following command in your terminal (replace values accordingly):

curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=http://127.0.0.1:8080/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"

The response will contain a `refresh_token`. Copy and save it.

---

### Step 4: Configure the Plugin

In Obsidian:

1. Open Settings
2. Go to Community Plugins → Spotify Controller
3. Enter:
   - Client ID
   - Client Secret
   - Refresh Token
4. Close settings

No restart is required.

---

## Usage

- Click the music icon in the left ribbon to open the Spotify view
- Use Play, Pause, Next, and Previous buttons
- Drag the progress bar to seek within the track
- Click the album artwork to open the track in Spotify

Spotify must already be playing on a device.

---

## Security

- No Spotify credentials are stored in code
- All sensitive data is stored locally using Obsidian’s plugin data storage
- No user data is transmitted to external services

---

## Limitations

- Desktop-only
- Requires an active Spotify playback device
- Volume control is not currently supported

---

## Development

To build the plugin locally:

npm install
npm run build

The compiled `main.js` file is loaded by Obsidian.

---
