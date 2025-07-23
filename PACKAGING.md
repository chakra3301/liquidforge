# Liquid Forge NFT Maker - Packaging Guide

This guide will help you package the Liquid Forge NFT Maker application for distribution.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- For Windows builds: Windows machine or WSL
- For macOS builds: macOS machine
- For Linux builds: Linux machine

## Quick Start

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 2. Build the Application

```bash
# Navigate to client directory
cd client

# Build for current platform
npm run package

# Or build for specific platforms:
npm run package-mac    # macOS
npm run package-win    # Windows
npm run package-linux  # Linux
npm run package-all    # All platforms
```

## Build Options

### macOS
- Creates `.dmg` installer and `.zip` archive
- Supports both Intel (x64) and Apple Silicon (arm64)
- Files: `Liquid Forge NFT Maker-{version}-mac.dmg` and `Liquid Forge NFT Maker-{version}-mac.zip`

### Windows
- Creates `.exe` installer and portable `.exe`
- Supports x64 architecture
- Files: `Liquid Forge NFT Maker Setup {version}.exe` and `Liquid Forge NFT Maker-{version}-win.exe`

### Linux
- Creates `.AppImage` and `.deb` package
- Supports x64 architecture
- Files: `Liquid Forge NFT Maker-{version}.AppImage` and `liquid-forge-nft-maker_{version}_amd64.deb`

## Distribution

### What's Included

The packaged application includes:
- ✅ Complete React frontend (built and optimized)
- ✅ Node.js backend server
- ✅ SQLite database (auto-initialized)
- ✅ All required dependencies
- ✅ Electron runtime

### File Sizes

- **macOS**: ~150-200MB
- **Windows**: ~150-200MB  
- **Linux**: ~150-200MB

### Installation

#### macOS
1. Download the `.dmg` file
2. Double-click to mount
3. Drag the app to Applications folder
4. Launch from Applications

#### Windows
1. Download the `.exe` installer
2. Run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

#### Linux
1. Download the `.AppImage` file
2. Make executable: `chmod +x "Liquid Forge NFT Maker-{version}.AppImage"`
3. Run: `./"Liquid Forge NFT Maker-{version}.AppImage"`

## Troubleshooting

### Build Issues

**Error: "electron-builder not found"**
```bash
npm install --save-dev electron-builder
```

**Error: "Missing icon files"**
- The app will use default icons if custom icons are missing
- To add custom icons, place them in `client/public/`:
  - `icon.icns` (macOS)
  - `icon.ico` (Windows)
  - `icon.png` (Linux)

**Error: "Permission denied" (Linux)**
```bash
chmod +x "Liquid Forge NFT Maker-{version}.AppImage"
```

### Runtime Issues

**App won't start**
- Check if the backend server is running (should start automatically)
- Look for error messages in the console
- Ensure all dependencies are included

**Database issues**
- The app creates a fresh database on first run
- Database is stored in the app's data directory
- No external database setup required

## Customization

### App Icon
Replace the icon files in `client/public/`:
- `icon.icns` (macOS - 512x512)
- `icon.ico` (Windows - 256x256)
- `icon.png` (Linux - 512x512)

### App Name
Edit `client/package.json`:
```json
{
  "build": {
    "productName": "Your Custom App Name"
  }
}
```

### Version
Update version in `client/package.json`:
```json
{
  "version": "1.0.0"
}
```

## Security Notes

- The packaged app includes a local SQLite database
- No internet connection required for basic functionality
- All data is stored locally on the user's machine
- The backend server runs locally on port 5001

## Support

For issues with packaging or distribution:
1. Check the console output for error messages
2. Ensure all dependencies are properly installed
3. Verify the build configuration in `package.json`
4. Test the development version first: `npm run electron-dev` 