# NFT Art Generator

A comprehensive web application for generating NFT art collections with layer-based generation, rarity weighting, and metadata management.

## Features

### 🎨 Layer Management
- Upload ZIP files containing organized layer folders
- Drag-and-drop layer reordering
- Visual layer preview with asset counts
- Layer-specific transformations (position, scale, rotation)

### ⚖️ Rarity System
- Set custom rarity weights for each asset
- Real-time rarity percentage calculations
- Rarity statistics and validation
- Weighted random selection during generation

### 🖼️ Canvas Editor
- Customizable canvas dimensions (up to 4000x4000)
- Background color selection
- Layer transformation controls
- Real-time canvas preview

### 🚀 NFT Generation
- Generate 1-10,000 unique NFTs
- Automatic duplicate prevention
- Sharp-based image compositing
- Custom collection metadata

### 📦 Export & Download
- Download all generated images as ZIP
- Export metadata as JSON or CSV
- Collection statistics and analytics
- Batch download capabilities

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **Sharp** - Image processing
- **Multer** - File uploads
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Beautiful DnD** - Drag and drop
- **React Dropzone** - File uploads
- **Lucide React** - Icons

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nft-art-generator
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Start the development servers**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start them separately
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Usage

### 1. Create an Account
- Register with email and password
- Login to access the dashboard

### 2. Upload Project
- Create a new project
- Upload a ZIP file with the following structure:
  ```
  master.zip
  ├── background/
  │   ├── bg1.png
  │   └── bg2.png
  ├── character/
  │   ├── char1.png
  │   └── char2.png
  ├── head/
  │   ├── head1.png
  │   └── head2.png
  └── accessories/
      ├── acc1.png
      └── acc2.png
  ```

### 3. Configure Layers
- Reorder layers using drag-and-drop
- Set layer visibility and settings
- Preview layer assets

### 4. Set Rarity Weights
- Assign rarity weights to each asset
- View rarity percentages and statistics
- Validate rarity configuration

### 5. Configure Canvas
- Set canvas dimensions
- Choose background color
- Apply layer transformations

### 6. Generate NFTs
- Set generation count (1-10,000)
- Configure collection metadata
- Start generation process
- Monitor generation progress

### 7. Download Results
- Download all images as ZIP
- Export metadata as JSON or CSV
- View generation statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/upload/projects` - Get user projects
- `POST /api/upload` - Upload project ZIP

### Layers
- `GET /api/layers/:projectId` - Get project layers
- `PUT /api/layers/:projectId/order` - Update layer order
- `GET /api/layers/:projectId/settings` - Get canvas settings
- `PUT /api/layers/:projectId/settings` - Update canvas settings

### Rarity
- `GET /api/rarity/:projectId` - Get rarity configuration
- `PUT /api/rarity/:projectId` - Update rarity weights
- `GET /api/rarity/:projectId/stats` - Get rarity statistics

### Generation
- `POST /api/generate/:projectId` - Generate NFTs
- `GET /api/generate/:projectId/status` - Get generation status

### Download
- `GET /api/download/:projectId/zip` - Download all as ZIP
- `GET /api/download/:projectId/metadata` - Download metadata JSON
- `GET /api/download/:projectId/csv` - Download metadata CSV

## Project Structure

```
nft-art-generator/
├── server/                 # Backend code
│   ├── database/          # Database setup
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   └── index.js           # Server entry point
├── client/                # Frontend code
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── index.js       # App entry point
│   └── package.json
├── uploads/               # Uploaded ZIP files
├── extracted/             # Extracted project files
├── generated/             # Generated NFT images
├── temp/                  # Temporary files
└── package.json
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Database
The application uses SQLite by default. The database file (`nft_generator.db`) will be created automatically on first run.

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Configure a production database (PostgreSQL recommended)
3. Set up proper JWT secret
4. Configure file storage (AWS S3 recommended)
5. Set up reverse proxy (nginx)

### Frontend
1. Build the React app: `npm run build`
2. Serve static files from the `client/build` directory
3. Configure API proxy in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## Roadmap

- [ ] Real-time generation progress
- [ ] Advanced image filters and effects
- [ ] Batch project management
- [ ] Cloud storage integration
- [ ] Advanced rarity algorithms
- [ ] Social features and sharing
- [ ] Mobile app version 