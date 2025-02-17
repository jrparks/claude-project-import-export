# Claude Project Import Export

## Overview

Claude Project Import Export is a Visual Studio Code extension that allows you to export an entire project as a single text file, making it easy to upload project files to Claude AI for analysis or review.

## Features

- 📂 Export entire project as a single text file
- 🗂️ Support for multiple workspace folders
- 🚫 Ignore common binary and large file types
- 🛠️ Customizable export options

## Installation Methods

### Method 1: Install from VSIX File

1. Open Visual Studio Code
2. Click on the Extensions view icon (square icon on the left sidebar) or press `Ctrl+Shift+X`
3. Click on the "..." (More Actions) menu in the top right of the Extensions view
4. Select "Install from VSIX..."
5. Navigate to and select the `claude-project-import-export-1.0.0.vsix` file
6. Click "Install"

### Method 2: Manual Installation

1. Create a new directory in VS Code extensions folder:
   - Windows: `%USERPROFILE%\.vscode\extensions`
   - macOS/Linux: `~/.vscode/extensions`
2. Unzip the `.vsix` file (it's essentially a zip archive)
3. Place the extracted contents in a new directory in the extensions folder

### Method 3: From Visual Studio Code Marketplace

1. Open Visual Studio Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Search for "Claude Project Exporter"
4. Click "Install"

## Usage

1. Open a project in Visual Studio Code
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
3. Type "Export Project for Claude"
4. Select the workspace folder to export
5. Choose a save location (recommended .claude extension)

### Verifying Installation

1. Restart Visual Studio Code
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
3. Type "Export Project for Claude"
4. You should see the extension's command appear

## Troubleshooting

- If the extension doesn't show up, check:
  - VS Code's extensions view for any error messages
  - Ensure you're using a compatible VS Code version
  - Verify the extension is enabled in Extensions view

## Development (Local Installation)

### 1. Prepare Your Development Environment:

- Install Node.js (version 16 or later)
- Install Visual Studio Code
- Install Git

### 2. Clone the Repository:

```bash
git clone https://github.com/jrparks/claude-project-import-export
cd claude-project-import-export
```

### 3. Install Dependencies:

```bash
npm install
```

### 4. Compile the Extension:

```bash
npm run compile
```

### 5. Debug and Run:

- Open the project in VS Code
- Press `F5` or go to Run and Debug view
- Select "Run Extension" configuration
- This will open a new VS Code window with your extension loaded

## Packaging the Extension

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Package the extension
rm -rf out
npm install
npm run compile
npx tsc -p .
vsce package
```

## Requirements

- Visual Studio Code 1.85.0 or later
- Node.js 16 or later

## Known Limitations

- Large projects may take some time to export
- Some very large binary files are automatically ignored

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Project Link: [https://github.com/jrparks/claude-project-import-export](https://github.com/jrparks/claude-project-import-export)