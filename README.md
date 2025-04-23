# Photo View Deployment Instructions

This guide will help you deploy the Wedding Photo View application to your home server, replacing the basic photo view with a full-featured React application.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Nginx or Apache web server (for serving the application)
- Existing photo server structure with `/var/www/photo-view.slyrix.com/` directory

## Step 1: Clone and Build the React Application

1. First, create a new directory for the project and clone or copy the React application files:

```bash
mkdir -p ~/wedding-photo-view
cd ~/wedding-photo-view
# Copy all the React application files to this directory
```

2. Install dependencies and build the production version:

```bash
npm install
npm run build
```

3. This will create a `build` directory with optimized production files.

## Step 2: Update Server Configuration

1. Copy the updated `server.js` file to your photo server's root directory:

```bash
cp server.js /var/www/photo-view.slyrix.com/
```

2. Install server dependencies:

```bash
cd /var/www/photo-view.slyrix.com/
npm install express multer body-parser cors helmet morgan fs-extra
```

3. Copy the built React app to the server:

```bash
cp -r ~/wedding-photo-view/build /var/www/photo-view.slyrix.com/
```

## Step 3: Configure Directory Structure

Ensure your server has these directories (they will be created automatically if not present, but it's good to check):

```bash
mkdir -p /var/www/photo-view.slyrix.com/photos
mkdir -p /var/www/photo-view.slyrix.com/thumbnails
mkdir -p /var/www/photo-view.slyrix.com/data
```

Set appropriate permissions:

```bash
chmod -R 755 /var/www/photo-view.slyrix.com
```

## Step 4: Set Up Process Manager (PM2)

To keep your server running in the background:

1. Install PM2 globally if you haven't already:

```bash
npm install -g pm2
```

2. Start the server with PM2:

```bash
cd /var/www/photo-view.slyrix.com/
pm2 start server.js --name "photo-view"
```

3. Configure PM2 to start on system reboot:

```bash
pm2 startup
pm2 save
```

## Step 5: Configure Nginx Reverse Proxy (Optional but Recommended)

If you're using Nginx, you can set up a reverse proxy to handle requests:

1. Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/photo-view.conf
```

2. Add the following configuration:

```nginx
server {
    listen 80;
    server_name photo-view.slyrix.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Direct access to photo and thumbnail files for better performance
    location /photos/ {
        alias /var/www/photo-view.slyrix.com/photos/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    location /thumbnails/ {
        alias /var/www/photo-view.slyrix.com/thumbnails/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
}
```

3. Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/photo-view.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: SSL Configuration with Certbot (Recommended)

To secure your site with HTTPS:

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d photo-view.slyrix.com
```

Follow the prompts to complete the SSL setup.

## Step 7: Test the Application

Visit your website at `https://photo-view.slyrix.com` to make sure everything is working correctly.

## Updating the Application

When you want to update the application:

1. Build a new version of the React app:

```bash
cd ~/wedding-photo-view
# Make your changes
npm run build
```

2. Copy the new build to the server:

```bash
cp -r build/* /var/www/photo-view.slyrix.com/build/
```

3. Restart the server:

```bash
pm2 restart photo-view
```

## Connecting with the Photo Booth

To connect your photo booth with this photo view server:

1. In your photo booth application's server code, add a function to send photos to this server:

```javascript
const sendPhotoToViewServer = async (photoPath, thumbnailPath, metadata) => {
  try {
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(photoPath));
    
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      formData.append('thumbnail', fs.createReadStream(thumbnailPath));
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    const response = await axios.post('https://photo-view.slyrix.com/api/upload-photo', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': 'your-secret-api-key'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending photo to view server:', error);
    return { success: false, error: error.message };
  }
};
```

2. Call this function after capturing and processing a photo in your photo booth application:

```javascript
// After successfully capturing and saving a photo
const result = await sendPhotoToViewServer(
  savedPhotoPath,
  thumbnailPath,
  {
    timestamp: Date.now(),
    deviceName: 'Photo Booth 1',
    // Any other metadata you want to include
  }
);

if (result.success) {
  console.log(`Photo uploaded to view server: ${result.photoUrl}`);
}
```

## Troubleshooting

- **Photos not showing up**: Check file permissions in the photos and thumbnails directories
- **Server not starting**: Check for errors in the PM2 logs with `pm2 logs photo-view`
- **API key errors**: Make sure you're using the correct API key set in the server.js file