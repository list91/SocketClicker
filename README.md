# SocketClicker Browser Extension

Chrome extension for automated web interactions through remote commands.

## Features

- Execute remote commands on web pages
- Support for multiple action types:
  - Navigation ('go')
  - Input ('input')
  - Click ('click')
- Automatic command history tracking
- Robust error handling and logging

## Requirements

- Chrome browser
- Local proxy-pilot server running on port 5000

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Build the extension:
```bash
npm run build
```
4. Load the extension in Chrome:
   - Open chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Testing

To add a test command via PowerShell:

```powershell
Invoke-WebRequest -Uri http://localhost:5000/add_command -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"command": "execute_sequence", "params": {"data": [{"on_start": 0, "action": "go", "value": "https://www.youtube.com/"}, {"on_start": 8000, "action": "input", "element_xpath": "//*[@id=''search'']", "value": "test search"}, {"on_start": 1000, "action": "click", "element_xpath": "//*[@id=''search-icon-legacy'']"}]}}'
```

This command will:
1. Navigate to YouTube
2. Wait 8 seconds
3. Enter "test search" in the search box
4. Wait 1 second
5. Click the search button

## Architecture

The extension consists of several key components:

1. Background Script (background.ts):
   - Polls for new commands every 3 seconds
   - Executes commands using appropriate APIs
   - Manages command history

2. Content Script (content.ts):
   - Handles page-specific interactions
   - Communicates with background script

3. Popup (popup.ts):
   - Provides extension UI
   - Shows extension status

## Permissions

The extension requires the following permissions:
- tabs
- activeTab
- scripting
- webNavigation
- storage
- debugger

## Error Handling

- All commands are executed with proper error handling
- Failed commands are logged with detailed error messages
- Commands are moved to history after execution (success or failure)

## Development

To start development:

1. Run in development mode:
```bash
npm run dev
```

2. Make changes to the source files in `src/`
3. The extension will be automatically rebuilt on changes
