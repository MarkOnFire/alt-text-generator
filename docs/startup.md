# Startup automation (macOS)

Use a launchd agent to run the watcher automatically at login.

1) Update `.env.local` with correct `WATCH_ROOT`, `EXPORT_ROOT`, and optional `OPENAI_API_KEY`.
2) Install dependencies: `npm install`.
3) Create `~/Library/LaunchAgents/com.alttext.watcher.plist` with this content (adjust the repo path):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.alttext.watcher</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd /Users/mriechers/Developer/alt-text-generator && npm run watch</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StandardOutPath</key><string>/tmp/alt-text-watcher.out</string>
  <key>StandardErrorPath</key><string>/tmp/alt-text-watcher.err</string>
</dict>
</plist>
```

4) Load the agent: `launchctl load ~/Library/LaunchAgents/com.alttext.watcher.plist`.
5) Verify it is active: `launchctl list | grep com.alttext.watcher`.
6) To stop/reload: `launchctl unload ~/Library/LaunchAgents/com.alttext.watcher.plist` (edit the plist if paths change, then load again).

The agent will keep the watcher running in the background so users can just drop images into `WATCH_ROOT` and pick up exports from `EXPORT_ROOT`.
