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
const FRAMES_DIR = process.env.FRAMES_DIR || '/var/www/photo-view.slyrix.com/frames';
const PREVIEWS_DIR = process.env.PREVIEWS_DIR || '/var/www/photo-view.slyrix.com/previews';
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/var/www/photo-view.slyrix.com/downloads';


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
app.get('/api/photos', async (req, res) => {
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
app.get('/api/frames', async (req, res) => {
    try {
        // Define standard frames
        const standardFrames = [
            {
                id: 'standard',
                name: 'Standard',
                thumbnailUrl: '/frames/standard-thumbnail.png',
                frameUrl: '/frames/wedding-frame-standard.png'
            },
            {
                id: 'custom',
                name: 'Elegant Gold',
                thumbnailUrl: '/frames/custom-thumbnail.png',
                frameUrl: '/frames/wedding-frame-custom.png'
            },
            {
                id: 'insta',
                name: 'Instagram',
                thumbnailUrl: '/frames/insta-thumbnail.png',
                frameUrl: '/frames/wedding-frame-insta.png'
            },
            {
                id: 'none',
                name: 'No Frame',
                thumbnailUrl: null,
                frameUrl: null
            }
        ];

        // Check if there are custom frames in the FRAMES_DIR
        try {
            // Get all .png files in the frames directory
            const files = await fs.readdir(FRAMES_DIR);
            const frameFiles = files.filter(file => file.endsWith('.png') && !file.includes('thumbnail'));

            // Add any custom frames found (beyond the standard ones)
            const customFrames = frameFiles
                .filter(file => !['wedding-frame-standard.png', 'wedding-frame-custom.png', 'wedding-frame-insta.png'].includes(file))
                .map(file => {
                    const frameId = file.replace('.png', '').replace('wedding-frame-', '');
                    const thumbnailFile = `${frameId}-thumbnail.png`;

                    return {
                        id: frameId,
                        name: frameId.charAt(0).toUpperCase() + frameId.slice(1).replace(/-/g, ' '),
                        thumbnailUrl: files.includes(thumbnailFile) ? `/frames/${thumbnailFile}` : null,
                        frameUrl: `/frames/${file}`
                    };
                });

            // Combine standard and custom frames
            const allFrames = [...standardFrames, ...customFrames];

            res.json(allFrames);
        } catch (err) {
            console.warn('Error reading frames directory:', err.message);
            res.json(standardFrames);
        }
    } catch (err) {
        console.error('Error fetching frames:', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve frames' });
    }
});

// Preview a photo with a frame applied
app.post('/api/preview-frame', async (req, res) => {
    try {
        const { photoUrl, frameUrl, quality } = req.body;

        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                error: 'No photo URL provided'
            });
        }

        // If no frame selected, return the original photo
        if (!frameUrl) {
            return res.json({
                success: true,
                previewUrl: photoUrl
            });
        }

        // Extract photo filename from URL
        let photoFilename;
        try {
            const urlPath = new URL(photoUrl).pathname;
            photoFilename = path.basename(urlPath);
        } catch (e) {
            // If URL parsing fails, try direct path extraction
            photoFilename = path.basename(photoUrl.split('/').pop());
        }

        // Extract frame filename from URL
        let frameFilename;
        try {
            const urlPath = new URL(frameUrl).pathname;
            frameFilename = path.basename(urlPath);
        } catch (e) {
            // If URL parsing fails, try direct path extraction
            frameFilename = path.basename(frameUrl.split('/').pop());
        }

        // Generate a unique preview filename
        const previewFilename = `preview_${frameFilename}_${photoFilename}`;
        const previewPath = path.join(PREVIEWS_DIR, previewFilename);
        const previewUrl = `/previews/${previewFilename}`;

        // Check if preview already exists and is recent (< 1 hour old)
        let useExistingPreview = false;
        try {
            const previewStat = await fs.stat(previewPath);
            const previewAge = Date.now() - previewStat.mtimeMs;
            useExistingPreview = previewAge < 60 * 60 * 1000; // 1 hour in milliseconds
        } catch (err) {
            // Preview doesn't exist, will create it
        }

        // If preview doesn't exist or is old, generate it
        if (!useExistingPreview) {
            // Get paths to original files
            const originalPhotoPath = path.join(PHOTOS_DIR, photoFilename);
            const frameImagePath = path.join(FRAMES_DIR, frameFilename);

            // Check if files exist
            if (!await fs.pathExists(originalPhotoPath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Original photo not found'
                });
            }

            if (!await fs.pathExists(frameImagePath)) {
                return res.status(404).json({
                    success: false,
                    error: 'Frame not found'
                });
            }

            // Generate the preview
            try {
                // Read the original files
                const originalBuffer = await fs.readFile(originalPhotoPath);
                const frameBuffer = await fs.readFile(frameImagePath);

                // Get frame dimensions
                const frameMeta = await sharp(frameBuffer).metadata();
                const targetWidth = frameMeta.width;
                const targetHeight = frameMeta.height;

                // Calculate the scale factor based on quality (low/med/high)
                let scaleFactor = 0.85; // Default is 85%
                let outputQuality = 60; // Default is lower for previews

                if (quality === 'low') {
                    scaleFactor = 0.80;
                    outputQuality = 40;
                } else if (quality === 'high') {
                    scaleFactor = 0.90;
                    outputQuality = 75;
                }

                // Resize the original photo
                const resizedPhoto = await sharp(originalBuffer)
                    .resize({
                        width: Math.round(targetWidth * scaleFactor),
                        height: Math.round(targetHeight * scaleFactor),
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 0 }
                    })
                    .toBuffer();

                // Create canvas with white background
                const canvas = await sharp({
                    create: {
                        width: targetWidth,
                        height: targetHeight,
                        channels: 4,
                        background: { r: 255, g: 255, b: 255, alpha: 1 }
                    }
                }).png().toBuffer();

                // Apply the photo to the canvas
                const canvasWithPhoto = await sharp(canvas)
                    .composite([{
                        input: resizedPhoto,
                        left: Math.floor((targetWidth - Math.round(targetWidth * scaleFactor)) / 2),
                        top: Math.floor((targetHeight - Math.round(targetHeight * scaleFactor)) / 2)
                    }])
                    .toBuffer();

                // Apply the frame overlay
                const finalImage = await sharp(canvasWithPhoto)
                    .composite([{ input: frameBuffer, left: 0, top: 0 }])
                    .jpeg({ quality: outputQuality })
                    .toBuffer();

                // Save the preview
                await fs.writeFile(previewPath, finalImage);

            } catch (err) {
                console.error('Error generating preview:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Error generating preview',
                    message: err.message
                });
            }
        }

        // Return the preview URL
        // Use the hostname from the request to construct the full URL
        const host = req.headers.host;
        const protocol = req.secure ? 'https' : 'http';
        const fullPreviewUrl = `${protocol}://${host}${previewUrl}`;

        res.json({
            success: true,
            previewUrl: fullPreviewUrl
        });
    } catch (err) {
        console.error('Error in preview-frame endpoint:', err);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: err.message
        });
    }
});

// Download a photo with a frame applied
app.post('/api/download-framed-photo', async (req, res) => {
    try {
        const { photoUrl, frameUrl } = req.body;

        if (!photoUrl) {
            return res.status(400).json({
                success: false,
                error: 'No photo URL provided'
            });
        }

        // If no frame selected, redirect to the original photo
        if (!frameUrl) {
            // Extract the photo filename from URL
            let photoFilename;
            try {
                const urlPath = new URL(photoUrl).pathname;
                photoFilename = path.basename(urlPath);
            } catch (e) {
                // If URL parsing fails, try direct path extraction
                photoFilename = path.basename(photoUrl.split('/').pop());
            }

            res.redirect(`/photos/${photoFilename}`);
            return;
        }

        // Extract photo filename from URL
        let photoFilename;
        try {
            const urlPath = new URL(photoUrl).pathname;
            photoFilename = path.basename(urlPath);
        } catch (e) {
            // If URL parsing fails, try direct path extraction
            photoFilename = path.basename(photoUrl.split('/').pop());
        }

        // Extract frame filename from URL
        let frameFilename;
        try {
            const urlPath = new URL(frameUrl).pathname;
            frameFilename = path.basename(urlPath);
        } catch (e) {
            // If URL parsing fails, try direct path extraction
            frameFilename = path.basename(frameUrl.split('/').pop());
        }

        // Generate a unique download filename
        const downloadFilename = `framed_${frameFilename}_${photoFilename}`;
        const downloadPath = path.join(DOWNLOADS_DIR, downloadFilename);

        // Get paths to original files
        const originalPhotoPath = path.join(PHOTOS_DIR, photoFilename);
        const frameImagePath = path.join(FRAMES_DIR, frameFilename);

        // Check if files exist
        if (!await fs.pathExists(originalPhotoPath)) {
            return res.status(404).json({
                success: false,
                error: 'Original photo not found'
            });
        }

        if (!await fs.pathExists(frameImagePath)) {
            return res.status(404).json({
                success: false,
                error: 'Frame not found'
            });
        }

        // Generate the framed photo with highest quality
        try {
            // Read the original files
            const originalBuffer = await fs.readFile(originalPhotoPath);
            const frameBuffer = await fs.readFile(frameImagePath);

            // Get frame dimensions
            const frameMeta = await sharp(frameBuffer).metadata();
            const targetWidth = frameMeta.width;
            const targetHeight = frameMeta.height;

            // Resize the original photo - high quality for download
            const resizedPhoto = await sharp(originalBuffer)
                .resize({
                    width: Math.round(targetWidth * 0.92), // Higher fill ratio for downloads
                    height: Math.round(targetHeight * 0.92),
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .toBuffer();

            // Create canvas with white background
            const canvas = await sharp({
                create: {
                    width: targetWidth,
                    height: targetHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            }).png().toBuffer();

            // Apply the photo to the canvas
            const canvasWithPhoto = await sharp(canvas)
                .composite([{
                    input: resizedPhoto,
                    left: Math.floor((targetWidth - Math.round(targetWidth * 0.92)) / 2),
                    top: Math.floor((targetHeight - Math.round(targetHeight * 0.92)) / 2)
                }])
                .toBuffer();

            // Apply the frame overlay
            const finalImage = await sharp(canvasWithPhoto)
                .composite([{ input: frameBuffer, left: 0, top: 0 }])
                .jpeg({ quality: 95 }) // Highest quality for downloads
                .toBuffer();

            // Save the framed photo
            await fs.writeFile(downloadPath, finalImage);

            // Send the file as attachment
            res.setHeader('Content-Disposition', `attachment; filename="rushel-sivani-wedding-photo.jpg"`);
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Cache-Control', 'no-cache');
            res.send(finalImage);

        } catch (err) {
            console.error('Error generating framed photo for download:', err);
            res.status(500).json({
                success: false,
                error: 'Error generating framed photo',
                message: err.message
            });
        }
    } catch (err) {
        console.error('Error in download-framed-photo endpoint:', err);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: err.message
        });
    }
});

// Add these new static file directories
app.use('/frames', express.static(FRAMES_DIR));
app.use('/previews', express.static(PREVIEWS_DIR));
app.use('/downloads', express.static(DOWNLOADS_DIR));// Upload endpoint with improved error handling
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
// ======================================
// ANALYTICS ENDPOINTS - Add these to your server.js
// ======================================

// Analytics tracking endpoint
app.post('/api/analytics/:action', async (req, res) => {
    try {
        const { action } = req.params;
        const { photoId, frameId, platform, message, timestamp } = req.body;

        if (!photoId) {
            return res.status(400).json({ success: false, error: 'Missing photoId' });
        }

        const metadataPath = path.join(DATA_DIR, `${photoId}.json`);

        if (await fs.pathExists(metadataPath)) {
            const metadata = await fs.readJson(metadataPath);

            if (!metadata.analytics) {
                metadata.analytics = {
                    views: 0,
                    downloads: 0,
                    shares: 0,
                    framesApplied: [],
                    shareHistory: [],
                    viewHistory: []
                };
            }

            switch (action) {
                case 'view':
                    metadata.analytics.views++;
                    metadata.analytics.lastViewed = timestamp || Date.now();
                    break;

                case 'download':
                    metadata.analytics.downloads++;
                    metadata.analytics.lastDownload = timestamp || Date.now();
                    if (frameId) metadata.analytics.downloadedFrame = frameId;
                    break;

                case 'share':
                    metadata.analytics.shares++;
                    metadata.analytics.lastShare = timestamp || Date.now();
                    metadata.analytics.shareHistory.push({
                        platform: platform || 'unknown',
                        timestamp: timestamp || Date.now(),
                        message: message ? message.substring(0, 100) : '',
                        ip: req.ip
                    });
                    break;

                case 'frame-used':
                    if (frameId && !metadata.analytics.framesApplied.includes(frameId)) {
                        metadata.analytics.framesApplied.push(frameId);
                    }
                    metadata.analytics.lastFrameChange = timestamp || Date.now();
                    break;

                default:
                    return res.status(400).json({ success: false, error: 'Invalid action' });
            }

            await fs.writeJson(metadataPath, metadata);
            console.log(`Analytics tracked: ${action} for photo ${photoId}`);
        } else {
            console.warn(`Metadata file not found for photo ${photoId}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: 'Analytics update failed' });
    }
});

// Analytics summary for admin
app.get('/api/admin/analytics-summary', checkApiKey, async (req, res) => {
    try {
        const dataFiles = await fs.readdir(DATA_DIR);
        const jsonFiles = dataFiles.filter(file => file.endsWith('.json'));

        const summary = {
            totalPhotos: jsonFiles.length,
            totalViews: 0,
            totalDownloads: 0,
            totalShares: 0,
            popularFrames: {},
            recentActivity: []
        };

        for (const file of jsonFiles) {
            try {
                const metadata = await fs.readJson(path.join(DATA_DIR, file));
                const analytics = metadata.analytics || {};

                summary.totalViews += analytics.views || 0;
                summary.totalDownloads += analytics.downloads || 0;
                summary.totalShares += analytics.shares || 0;

                if (analytics.framesApplied) {
                    analytics.framesApplied.forEach(frame => {
                        summary.popularFrames[frame] = (summary.popularFrames[frame] || 0) + 1;
                    });
                }

                const lastActivity = Math.max(
                    analytics.lastViewed || 0,
                    analytics.lastDownload || 0,
                    analytics.lastShare || 0
                );

                if (lastActivity > 0) {
                    summary.recentActivity.push({
                        photoId: metadata.photoId || file.replace('.json', ''),
                        lastActivity,
                        views: analytics.views || 0,
                        downloads: analytics.downloads || 0,
                        shares: analytics.shares || 0
                    });
                }
            } catch (err) {
                console.warn(`Error processing ${file}:`, err.message);
            }
        }

        summary.recentActivity.sort((a, b) => b.lastActivity - a.lastActivity);
        summary.recentActivity = summary.recentActivity.slice(0, 10);

        console.log('Analytics summary generated:', summary);
        res.json(summary);
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate analytics summary' });
    }
});

app.get('/api/analytics/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        const metadataPath = path.join(DATA_DIR, `${photoId}.json`);

        if (await fs.pathExists(metadataPath)) {
            const metadata = await fs.readJson(metadataPath);
            res.json({
                success: true,
                analytics: metadata.analytics || {
                    views: 0,
                    downloads: 0,
                    shares: 0,
                    framesApplied: []
                }
            });
        } else {
            res.status(404).json({ success: false, error: 'Photo not found' });
        }
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
});

// Helper function to clean old analytics data (optional - run periodically)
const cleanOldAnalytics = async () => {
    try {
        const dataFiles = await fs.readdir(DATA_DIR);
        const jsonFiles = dataFiles.filter(file => file.endsWith('.json'));

        const cutoffDate = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago

        for (const file of jsonFiles) {
            try {
                const metadata = await fs.readJson(path.join(DATA_DIR, file));

                if (metadata.analytics) {
                    // Clean old view history (keep only last 100 views)
                    if (metadata.analytics.viewHistory && metadata.analytics.viewHistory.length > 100) {
                        metadata.analytics.viewHistory = metadata.analytics.viewHistory
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, 100);
                    }

                    // Clean old share history (keep only last 50 shares)
                    if (metadata.analytics.shareHistory && metadata.analytics.shareHistory.length > 50) {
                        metadata.analytics.shareHistory = metadata.analytics.shareHistory
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, 50);
                    }

                    // Save cleaned metadata
                    await fs.writeJson(path.join(DATA_DIR, file), metadata);
                }
            } catch (err) {
                console.warn(`Error cleaning analytics for ${file}:`, err.message);
            }
        }

        console.log('Analytics cleanup completed');
    } catch (error) {
        console.error('Analytics cleanup error:', error);
    }
};
setInterval(cleanOldAnalytics, 7 * 24 * 60 * 60 * 1000); // Every 7 days



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

module.exports = {
    cleanOldAnalytics
};