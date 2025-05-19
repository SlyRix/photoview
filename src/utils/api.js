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
 * Parse and validate a timestamp
 * @param {string|number} timestamp - The timestamp to parse
 * @returns {string} - ISO string of the parsed date or fallback date
 */
const parseTimestamp = (timestamp) => {
    // Default date if we can't parse the timestamp (set to wedding date)
    const weddingDate = new Date('2023-05-27T12:00:00Z').toISOString();

    if (!timestamp) return weddingDate;

    try {
        // Try to parse the timestamp
        const date = new Date(timestamp);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid timestamp:', timestamp);
            return weddingDate;
        }

        // If date is in the future or too far in the past (before 2020), it's likely wrong
        const now = new Date();
        if (date > now || date < new Date('2020-01-01')) {
            console.warn('Timestamp out of reasonable range:', timestamp);
            return weddingDate;
        }

        return date.toISOString();
    } catch (e) {
        console.error('Error parsing timestamp:', e, timestamp);
        return weddingDate;
    }
};

/**
 * Get a list of all photos
 * @returns {Promise} Promise that resolves to photo array
 */
export const getPhotos = async () => {
    let retries = 3;
    while (retries > 0) {
        try {
            const response = await api.get('/photos');

            // Process photos to ensure they have full URLs and valid timestamps
            return response.data.map(photo => {
                // Determine the timestamp - prioritize the timestamp from metadata
                const timestamp = parseTimestamp(photo.timestamp || photo.serverTimestamp || photo.dateCreated);

                return {
                    ...photo,
                    id: photo.filename || photo.photoId,
                    url: `${BASE_URL}/photos/${photo.filename || photo.photoId}`,
                    thumbnailUrl: photo.thumbnailUrl
                        ? `${BASE_URL}${photo.thumbnailUrl}`
                        : `${BASE_URL}/thumbnails/thumb_${photo.filename || photo.photoId}`,
                    timestamp: timestamp // Use the properly parsed timestamp
                };
            });
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
                // Determine the timestamp - prioritize the timestamp from metadata
                const timestamp = parseTimestamp(
                    response.data.timestamp ||
                    response.data.serverTimestamp ||
                    response.data.dateCreated
                );

                return {
                    ...response.data,
                    id: photoId,
                    url: `${BASE_URL}/photos/${photoId}`,
                    thumbnailUrl: response.data.thumbnailUrl
                        ? `${BASE_URL}${response.data.thumbnailUrl}`
                        : `${BASE_URL}/thumbnails/thumb_${photoId}`,
                    timestamp: timestamp // Use the properly parsed timestamp
                };
            }
        } catch (apiError) {
            console.log('API endpoint not available or returned error:', apiError);
            // Fall back to direct file access
        }

        // If API fails, construct a basic photo object with wedding date as timestamp
        return {
            id: photoId,
            filename: photoId,
            url: `${BASE_URL}/photos/${photoId}`,
            thumbnailUrl: `${BASE_URL}/thumbnails/thumb_${photoId}`,
            timestamp: parseTimestamp() // Use wedding date as fallback
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
