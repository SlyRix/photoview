import axios from 'axios';

// Base URL for the server
const BASE_URL = '//photo-view.slyrix.com';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.message);
        // Check if the error has a response
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return Promise.reject(error);
    }
);

/**
 * Get a list of all photos
 * @returns {Promise} Promise that resolves to photo array
 */
export const getPhotos = async () => {
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await api.get('/photos');

            // Process photos to ensure they have full URLs
            return response.data.map(photo => ({
                ...photo,
                id: photo.filename || photo.photoId,
                url: `${BASE_URL}/photos/${photo.filename || photo.photoId}`,
                thumbnailUrl: photo.thumbnailUrl
                    ? `${BASE_URL}${photo.thumbnailUrl}`
                    : `${BASE_URL}/thumbnails/thumb_${photo.filename || photo.photoId}`
            }));
        } catch (error) {
            retries--;
            if (retries === 0) {
                console.error('Error fetching photos after multiple attempts:', error);
                return [];
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

/**
 * Get a specific photo by ID
 * @param {string} photoId - The photo ID or filename
 * @returns {Promise} Promise that resolves to photo object
 */
export const getPhoto = async (photoId) => {
    try {
        // First try the API endpoint if available
        try {
            const response = await api.get(`/photos/${photoId}`);

            if (response.data) {
                return {
                    ...response.data,
                    id: photoId,
                    url: `${BASE_URL}/photos/${photoId}`,
                    thumbnailUrl: response.data.thumbnailUrl
                        ? `${BASE_URL}${response.data.thumbnailUrl}`
                        : `${BASE_URL}/thumbnails/thumb_${photoId}`
                };
            }
        } catch (apiError) {
            console.log('API endpoint not available or returned error:', apiError);
            // Fall back to direct file access
        }

        // If API fails, construct a basic photo object
        return {
            id: photoId,
            filename: photoId,
            url: `${BASE_URL}/photos/${photoId}`,
            thumbnailUrl: `${BASE_URL}/thumbnails/thumb_${photoId}`,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error fetching photo:', error);
        throw new Error('Failed to load photo');
    }
};

/**
 * Check if the server is online
 * @returns {Promise<boolean>} Promise that resolves to server status
 */
export const checkServerStatus = async () => {
    try {
        const response = await api.get('/api/status');
        return response.data.status === 'online';
    } catch (error) {
        console.error('Server status check failed:', error);
        return false;
    }
};

export default {
    getPhotos,
    getPhoto,
    checkServerStatus
};