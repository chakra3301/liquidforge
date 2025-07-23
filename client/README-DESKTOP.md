# NFT Maker - Liquid Forge Desktop App

A powerful desktop application for creating and managing NFT collections with layer-based generation.

## Features

- **Layer-based NFT Generation**: Upload ZIP files with organized layer folders
- **Rarity Management**: Set custom rarity weights for individual assets
- **Real-time Preview**: See your NFT collection as you build it
- **Asset Management**: Organize and manage your NFT assets efficiently
- **Desktop Native**: Full desktop application with native file dialogs

## Installation

### For Users (Download)
1. Download the latest release for your platform:
   - **macOS**: `NFT Maker - Liquid Forge.app` (ARM64)
   - **Windows**: `NFT Maker - Liquid Forge Setup.exe`
   - **Linux**: `nft-maker-liquid-forge.AppImage`

2. Install and run the application

### For Developers (Build from Source)

1. **Prerequisites**
   - Node.js 18+ 
   - npm or yarn

2. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd nft-maker/client
   npm install
   ```

3. **Development Mode**
   ```bash
   npm run electron-dev
   ```

4. **Build for Production**
   ```bash
   npm run dist
   ```

## Usage

### Getting Started

1. **Launch the App**: Open the NFT Maker application
2. **Login**: Use the demo account:
   - Email: `demo@user.com`
   - Password: `demo123`

### Creating a Project

1. **Upload ZIP File**: 
   - Click "Upload Project" or drag & drop a ZIP file
   - Your ZIP should contain folders for each layer (e.g., `backgrounds/`, `character/`, `accessories/`)

2. **Layer Structure Example**:
   ```
   my-nft-project.zip
   ├── backgrounds/
   │   ├── blue.png
   │   ├── red.png
   │   └── green.png
   ├── character/
   │   ├── male.png
   │   └── female.png
   └── accessories/
       ├── hat.png
       ├── glasses.png
       └── necklace.png
   ```

3. **Configure Layers**: 
   - Set rarity percentages for each layer
   - Adjust z-index for proper layering
   - Configure asset rarity weights

4. **Generate NFTs**: 
   - Set the number of NFTs to generate
   - Click "Generate Collection"
   - Download your generated NFTs

### File Formats

- **Images**: PNG, JPG, JPEG
- **Project Upload**: ZIP files only
- **Output**: PNG files

## Development

### Project Structure

```
client/
├── public/
│   ├── electron.js          # Main Electron process
│   ├── preload.js           # Preload script for security
│   └── index.html           # Main HTML file
├── src/                     # React application
├── dist/                    # Built desktop app
└── package.json             # Dependencies and scripts
```

### Available Scripts

- `npm start` - Start React development server
- `npm run electron` - Run Electron app (requires React server)
- `npm run electron-dev` - Run both React and Electron in development
- `npm run build` - Build React app for production
- `npm run dist` - Build complete desktop app
- `npm run electron-pack` - Package the app for distribution

### Building for Different Platforms

The app automatically builds for the current platform. To build for other platforms:

```bash
# macOS
npm run dist -- --mac

# Windows
npm run dist -- --win

# Linux
npm run dist -- --linux

# All platforms
npm run dist -- --mac --win --linux
```

## Troubleshooting

### Common Issues

1. **App won't start**: 
   - Check if port 5001 is available
   - Ensure Node.js is installed

2. **Upload fails**:
   - Verify ZIP file structure
   - Check file permissions

3. **Images not loading**:
   - Refresh the app
   - Check if assets are properly uploaded

### Logs

Desktop app logs are available in:
- **macOS**: `~/Library/Logs/NFT Maker - Liquid Forge/`
- **Windows**: `%APPDATA%\NFT Maker - Liquid Forge\logs\`
- **Linux**: `~/.config/NFT Maker - Liquid Forge/logs/`

## License

This project is licensed under the MIT License.

## Support

For issues and feature requests, please create an issue in the repository. 