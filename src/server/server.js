const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// Constants
const PORT = 3001;
const API_KEY = process.env.API_KEY || 'xP9dR7tK2mB5vZ3q';
const PHOTOS_DIR = '/var/www/photo-view.slyrix.com/photos';
const THUMBNAILS_DIR = '/var/www/photo-view.slyrix.com/thumbnails';
const DATA_DIR = '/var/www/photo-view.slyrix.com/data';

// Create directories if they don't exist
fs.ensureDirSync(PHOTOS_DIR);
fs.ensureDirSync(THUMBNAILS_DIR);
fs.ensureDirSync(DATA_DIR);

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = file.fieldname === 'thumbnail' ? THUMBNAILS_DIR : PHOTOS_DIR;
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Initialize Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(bodyParser.json());

// API Key middleware
const checkApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    next();
};

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        message: 'Photo API is operational',
        timestamp: Date.now()
    });
});

// Upload endpoint
app.post('/api/upload-photo', checkApiKey, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files.photo) {
            return res.status(400).json({
                success: false,
                error: 'No photo uploaded'
            });
        }

        const photoFile = req.files.photo[0];
        const photoFilename = photoFile.filename;

        const photoPath = path.join(PHOTOS_DIR, photoFilename);
        const framePath = path.join(PHOTOS_DIR, 'wedding-frame.png');
        const outputFilename = photoFilename.replace('original_', 'wedding_');
        const outputPath = path.join(PHOTOS_DIR, outputFilename);

        // Save metadata
        let metadata = {};
        try {
            if (req.body.metadata) {
                metadata = JSON.parse(req.body.metadata);
            }
        } catch (err) {
            console.warn('Invalid metadata JSON:', err.message);
        }

        const photoId = metadata.filename || path.basename(photoFilename);
        const metadataPath = path.join(DATA_DIR, `${photoId}.json`);

        fs.writeJsonSync(metadataPath, {
            ...metadata,
            photoId,
            serverTimestamp: Date.now()
        });

        // 🧠 Automatically Apply the Frame
        if (fs.existsSync(framePath)) {
            const originalBuffer = await fs.readFile(photoPath);
            const frameBuffer = await fs.readFile(framePath);

            const frameMeta = await sharp(frameBuffer).metadata();
            const targetWidth = frameMeta.width;
            const targetHeight = frameMeta.height;

            const resizedPhoto = await sharp(originalBuffer)
                .resize({
                    width: Math.round(targetWidth * 0.85),
                    height: Math.round(targetHeight * 0.85),
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .toBuffer();

            const canvas = await sharp({
                create: {
                    width: targetWidth,
                    height: targetHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            }).png().composite([
                {
                    input: resizedPhoto,
                    left: Math.floor((targetWidth - Math.round(targetWidth * 0.85)) / 2),
                    top: Math.floor((targetHeight - Math.round(targetHeight * 0.85)) / 2)
                },
                { input: frameBuffer, left: 0, top: 0 }
            ])
                .jpeg({ quality: 90 })
                .toBuffer();

            await fs.writeFile(outputPath, canvas);
        }

        res.json({
            success: true,
            photoId,
            framedUrl: `/photos/${outputFilename}`,
            message: 'Photo uploaded and framed successfully'
        });
    } catch (error) {
        console.error('Upload or framing error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during upload or framing'
        });
    }
});

// Serve static files
app.use('/photos', express.static(PHOTOS_DIR));
app.use('/thumbnails', express.static(THUMBNAILS_DIR));

// Create a simple HTML index page to handle photo requests
app.get('/photo/:photoId', (req, res) => {
    const photoId = req.params.photoId;
    // Check for different versions of the photo (original, print, etc.)
    const possibleFilenames = [
        photoId,
        `original_${photoId}`,
        `print_${photoId}`
    ];

    // Find the first filename that exists
    let foundFile = false;
    let actualFilename = photoId;

    for (const filename of possibleFilenames) {
        if (fs.existsSync(path.join(PHOTOS_DIR, filename))) {
            actualFilename = filename;
            foundFile = true;
            break;
        }
    }

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Wedding Photo</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; max-width: 1200px; margin: 0 auto; padding: 20px; text-align: center; }
        .photo-container { margin-top: 30px; }
        img { max-width: 100%; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <h1>Wedding Photo</h1>
      <div class="photo-container">
        <img src="/photos/${actualFilename}" alt="Wedding Photo">
      </div>
    </body>
    </html>
  `);
});


// Default route
app.get('/', (req, res) => {
    res.send('Wedding Photo API is running');
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Photo API server running on port ${PORT}`);
});

// Handle termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Shutting down...');
    server.close(() => {
        console.log('Server stopped.');
        process.exit(0);
    });
});
