# SocketClicker Browser Extension

Chrome extension for automated web interactions through remote commands. Works in conjunction with proxy-pilot server to execute automated browser actions.

## Integration with proxy-pilot

SocketClicker is designed to work seamlessly with the proxy-pilot server:
- proxy-pilot sends commands to control browser actions
- SocketClicker executes these commands and provides feedback
- Communication happens via local HTTP endpoints (default port: 5000)
- Supports command queuing and sequential execution

## Features

- Execute remote commands on web pages
- Support for multiple action types:
  - Navigation ('go')
  - Input ('input')
  - Click ('click')
- Robust element detection and interaction
- Advanced error handling and logging
- Command history tracking

## Requirements

- Chrome browser
- Local proxy-pilot server running on port 5000
- Node.js and npm for development

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

Example command via PowerShell:

```powershell
Invoke-WebRequest -Uri http://localhost:5000/add_command -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"command": "execute_sequence", "params": {"data": [{"on_start": 0, "action": "go", "value": "https://www.youtube.com/"}, {"on_start": 8000, "action": "input", "element_xpath": "//*[@id=''search'']", "value": "test search"}, {"on_start": 1000, "action": "click", "element_xpath": "//*[@id=''search-icon-legacy'']"}]}}'
```

## Architecture

The extension consists of three main components:

1. Background Script (background.ts):
   - Manages command polling and execution
   - Implements robust element detection
   - Handles command history
   - Provides comprehensive error handling

2. Content Script (content.ts):
   - Executes page-specific interactions
   - Communicates with background script
   - Handles DOM manipulation

3. Popup Interface:
   - Displays extension status
   - Provides minimal user interface

## Key Features

### Element Detection
- Advanced element visibility checks
- Robust XPath-based element location
- Automatic retry mechanism for dynamic content

### Command Execution
- Sequential command execution
- Configurable delays between actions
- Comprehensive error handling
- Detailed logging for debugging

## Permissions

Required permissions:
- tabs
- activeTab
- scripting
- webNavigation
- storage
- debugger

## Development

To start development:

1. Run in development mode:
```bash
npm run dev
```

2. Make changes to the source files in `src/`
3. The extension will automatically rebuild on changes

## Project Structure

```
src/
├── background.ts   # Main extension logic
├── content.ts      # Page interaction logic
├── popup.ts        # UI logic
├── manifest.json   # Extension configuration
└── popup.html      # UI layout
