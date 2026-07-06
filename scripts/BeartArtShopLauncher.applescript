set projectPath to "/Users/pogofm/Documents/Codex/2026-07-02/new-chat"
set targetUrl to "http://localhost:3000/p/colorbear-art"
set launchCommand to "cd " & quoted form of projectPath & " && npm run local"

try
	do shell script "/usr/sbin/lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1"
	do shell script "/usr/bin/open " & quoted form of targetUrl
	display notification "网站已打开" with title "Beart Art Shop"
on error
	tell application "Terminal"
		activate
		do script launchCommand
	end tell
end try
