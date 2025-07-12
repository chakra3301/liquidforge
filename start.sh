#!/bin/bash

echo "🚀 Starting NFT Art Generator Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads extracted generated temp

# Set permissions
chmod 755 uploads extracted generated temp

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 NFT Art Generator is ready to use!"
echo ""
echo "To start the application:"
echo "  npm run dev          # Start both backend and frontend"
echo "  npm run server       # Start backend only (port 5000)"
echo "  npm run client       # Start frontend only (port 3000)"
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo ""
echo "📚 Check README.md for detailed usage instructions" 