# SocketClicker 🚀

## Overview
SocketClicker is a powerful Chrome extension designed for remote command execution and automated web interactions. It provides a reliable and efficient way to manage and execute commands through a local server interface.

## Features
- 🔄 Remote command execution system
- 📊 Reliable publication workflow
- 🔄 Command queue management
- 🛡️ Duplicate command prevention
- 📝 Comprehensive logging system
- ⚡ Fast and efficient DOM interactions
- 🕒 Smart element waiting mechanism

## Installation
1. Clone the repository
```bash
git clone https://github.com/list91/SocketClicker.git
cd SocketClicker
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run build
```

4. Load the extension in Chrome
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory from the project

## Usage
1. Start the local server (required for command processing)
2. The extension will automatically connect to the local server
3. Commands can be sent through the server API
4. Monitor command execution through the extension's detailed logging

## API Documentation
### Command Structure
```typescript
interface Command {
    id: string;
    command: string;
    params?: {
        content?: string;
        [key: string]: any;
    };
    time_created: string;
}
```

### Available Commands
- `publication`: Execute publication workflow
- More commands can be added through the command executor

## Development
- Built with TypeScript and Webpack
- Uses Chrome Extension Manifest V3
- Implements modern async/await patterns
- Comprehensive error handling

## Version History
- v1.0.0 - First stable release
  - Complete publication workflow
  - Command queue management
  - Duplicate command prevention
  - Comprehensive logging

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, please open an issue in the GitHub repository.

---
Made with ❤️ by list91
