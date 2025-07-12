# Liquid Forge: NFT Generator

A futuristic cyberpunk-themed NFT generator with layer-based asset management, rarity controls, and compatibility rules.

## Features

- 🔐 **User Authentication** - Secure login/register system
- 🎨 **Layer Management** - Organize assets into layers with drag-and-drop
- 🎲 **Rarity Controls** - Set rarity percentages for layers and individual assets
- ⚡ **Compatibility Rules** - Prevent certain assets from being placed together
- 🖼️ **NFT Generation** - Generate unique NFTs with rarity-based selection
- 🌌 **Cyberpunk UI** - Dark theme with cyan accents and glowing effects
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, Tailwind CSS, React Router, Axios
- **Backend**: Node.js, Express, SQLite3
- **Authentication**: JWT, bcryptjs
- **File Processing**: Multer, Sharp
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chakra3301/liquid-forge.git
   cd liquid-forge
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (from root directory)
   npm run dev:server
   
   # Start frontend server (from client directory)
   cd client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Deployment to Vercel

### Automatic Deployment

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically detect the configuration

2. **Environment Variables**
   In your Vercel project settings, add these environment variables:
   ```
   JWT_SECRET=your-production-secret-key
   NODE_ENV=production
   ```

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - The `vercel.json` configuration handles routing between frontend and backend

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add JWT_SECRET
   vercel env add NODE_ENV
   ```

## Project Structure

```
liquid-forge/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.js
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── database/           # Database configuration
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── index.js
│   └── package.json
├── data/                   # SQLite database (created on first run)
├── uploads/                # User uploaded files
├── generated/              # Generated NFT images
├── vercel.json            # Vercel configuration
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `DELETE /api/projects/:id` - Delete project

### Layers
- `GET /api/layers/:projectId` - Get project layers
- `POST /api/layers` - Create new layer
- `PUT /api/layers/:id` - Update layer
- `DELETE /api/layers/:id` - Delete layer

### Assets
- `GET /api/assets/:projectId` - Get project assets
- `POST /api/upload` - Upload assets
- `DELETE /api/assets/:id` - Delete asset

### Generation
- `POST /api/generate` - Generate NFTs
- `GET /api/download/:projectId` - Download generated NFTs

### Compatibility
- `GET /api/rarity/compatibility/:projectId` - Get compatibility rules
- `POST /api/rarity/compatibility` - Add compatibility rule
- `DELETE /api/rarity/compatibility/:id` - Remove compatibility rule

## Database Schema

### Users
- `id` (PRIMARY KEY)
- `email` (UNIQUE)
- `password` (HASHED)
- `created_at`

### Projects
- `id` (PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `name`
- `description`
- `created_at`

### Layers
- `id` (PRIMARY KEY)
- `project_id` (FOREIGN KEY)
- `name`
- `order_index`
- `rarity_percentage`
- `created_at`

### Assets
- `id` (PRIMARY KEY)
- `layer_id` (FOREIGN KEY)
- `filename`
- `filepath`
- `rarity_percentage`
- `created_at`

### Asset Compatibility
- `id` (PRIMARY KEY)
- `project_id` (FOREIGN KEY)
- `asset1_id` (FOREIGN KEY)
- `asset2_id` (FOREIGN KEY)
- `created_at`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team. 