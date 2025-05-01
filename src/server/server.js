// Modified server.js with improved stability
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// Constants
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'xP9dR7tK2mB5vZ3q';
const PHOTOS_DIR = process.env.PHOTOS_DIR || '/var/www/photo-view.slyrix.com/photos';
const THUMBNAILS_DIR = process.env.THUMBNAILS_DIR || '/var/www/photo-view.slyrix.com/thumbnails';
const DATA_DIR = process.env.DATA_DIR || '/var/www/photo-view.slyrix.com/data';

// Create directories if they don't exist
try {
    fs.ensureDirSync(PHOTOS_DIR);
    fs.ensureDirSync(THUMBNAILS_DIR);
    fs.ensureDirSync(DATA_DIR);
    console.log('Directories created/verified successfully');
} catch (err) {
    console.error('Error creating directories:', err);
    // Continue execution instead of crashing
}

// Configure storage for file uploads with better error handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const dest = file.fieldname === 'thumbnail' ? THUMBNAILS_DIR : PHOTOS_DIR;
            cb(null, dest);
        } catch (err) {
            console.error('Error setting destination:', err);
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        try {
            // Sanitize filename to prevent path traversal attacks
            const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
            cb(null, sanitizedName);
        } catch (err) {
            console.error('Error setting filename:', err);
            cb(err);
        }
    }
});

// Add upload size limits to prevent memory issues
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 2 // Max number of files per upload
    }
});

// Initialize Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' })); // Limit JSON body size

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        success: false,
        error: 'Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
    });
});

// API Key middleware
const checkApiKey = (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey || apiKey !== API_KEY) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        next();
    } catch (err) {
        next(err); // Pass to error handler
    }
};

// Memory usage monitoring
setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log('Memory usage:', {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    });

    // Optional: Force garbage collection if memory usage is too high
    if (memoryUsage.heapUsed > 200 * 1024 * 1024) { // 200MB threshold
        console.log('Attempting to free memory...');
        try {
            global.gc(); // Note: requires --expose-gc flag when starting Node
        } catch (e) {
            console.log('Garbage collection not available. Run with --expose-gc flag.');
        }
    }
}, 30000); // Check every 30 seconds

// Status endpoint
app.get('/api/status', (req, res) => {
    try {
        res.json({
            success: true,
            status: 'online',
            message: 'Photo API is operational',
            timestamp: Date.now(),
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 + ' MB'
        });
    } catch (err) {
        console.error('Error in status endpoint:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get all photos endpoint
app.get('/photos', async (req, res) => {
    try {
        const photoFiles = await fs.readdir(PHOTOS_DIR);

        // Filter out any non-image files and frame images
        const imageRegex = /\.(jpg|jpeg|png|gif)$/i;
        const photos = photoFiles
            .filter(file => imageRegex.test(file) && !file.includes('wedding-frame'))
            .map(filename => {
                // Try to read metadata if available
                let metadata = {};
                try {
                    const metadataPath = path.join(DATA_DIR, `${filename}.json`);
                    if (fs.existsSync(metadataPath)) {
                        metadata = fs.readJsonSync(metadataPath);
                    }
                } catch (err) {
                    console.warn(`Error reading metadata for ${filename}:`, err.message);
                }

                return {
                    filename,
                    photoId: filename,
                    url: `/photos/${filename}`,
                    thumbnailUrl: `/thumbnails/thumb_${filename}`,
                    timestamp: metadata.timestamp || metadata.serverTimestamp || Date.now(),
                    ...metadata
                };
            })
            // Sort by timestamp, newest first
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json(photos);
    } catch (err) {
        console.error('Error fetching photos:', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve photos' });
    }
});

// Upload endpoint with improved error handling
app.post('/api/upload-photo', checkApiKey, (req, res) => {
    const uploadHandler = upload.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]);

    uploadHandler(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({
                success: false,
                error: err.message || 'Upload failed'
            });
        }

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

            await fs.writeJson(metadataPath, {
                ...metadata,
                photoId,
                serverTimestamp: Date.now()
            });

            // Generate thumbnail if not uploaded
            if (!req.files.thumbnail) {
                try {
                    const thumbnailPath = path.join(THUMBNAILS_DIR, `thumb_${photoFilename}`);
                    await sharp(photoPath)
                        .resize(300, 200, { fit: 'cover' })
                        .jpeg({ quality: 80 })
                        .toFile(thumbnailPath);
                    console.log(`Generated thumbnail: ${thumbnailPath}`);
                } catch (thumbErr) {
                    console.error('Error generating thumbnail:', thumbErr);
                    // Continue even if thumbnail generation fails
                }
            }

            // 🧠 Automatically Apply the Frame
            if (fs.existsSync(framePath)) {
                try {
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
                    console.log(`Applied frame to photo: ${outputPath}`);
                } catch (frameErr) {
                    console.error('Error applying frame:', frameErr);
                    // Continue even if framing fails
                }
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
});

// Serve static files
app.use('/photos', express.static(PHOTOS_DIR));
app.use('/thumbnails', express.static(THUMBNAILS_DIR));

// Create a simple HTML index page to handle photo requests
app.get('/photo/:photoId', (req, res) => {
    try {
        const photoId = req.params.photoId;
        // Check for different versions of the photo (original, print, etc.)
        const possibleFilenames = [
            photoId,
            `original_${photoId}`,
            `print_${photoId}`,
            `wedding_${photoId}`
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
        <p><a href="/">View All Photos</a></p>
      </body>
      </html>
    `);
    } catch (err) {
        console.error('Error serving photo page:', err);
        res.status(500).send('Error loading photo');
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Wedding Photo API is running');
});

// Error route - intentionally throw an error to test error handling
app.get('/api/test-error', (req, res, next) => {
    try {
        throw new Error('Test error route');
    } catch (err) {
        next(err);
    }
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: Date.now()
    });
});

// Start server with improved error handling
let server;
try {
    server = app.listen(PORT, () => {
        console.log(`Photo API server running on port ${PORT}`);
    });

    // Configure server timeouts
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 65000; // Slightly higher than client timeout
    server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout
} catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
}

// Handle termination gracefully
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    // Set a timeout to force exit if shutdown takes too long
    const forceExit = setTimeout(() => {
        console.error('Forced shutdown after timeout!');
        process.exit(1);
    }, 30000);

    // Close the server
    server.close(() => {
        console.log('HTTP server closed.');
        clearTimeout(forceExit);
        process.exit(0);
    });
};

// Handle different termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For Nodemon restarts

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Log but don't exit - improves stability
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log but don't exit - improves stability
});