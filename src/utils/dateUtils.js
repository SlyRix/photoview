// src/utils/dateUtils.js - FIXED version to properly extract timestamps from filenames

/**
 * Extract timestamp from a photo filename
 * Format: original_wedding_2025-05-02T12-10-12-389Z.jpg
 *
 * @param {string} filename - The photo filename
 * @returns {number|null} - Timestamp in milliseconds or null if not found
 */
export const extractTimestampFromFilename = (filename) => {
    if (!filename) return null;

    console.log('Extracting timestamp from:', filename); // Debug logging

    try {
        // Match ISO timestamp pattern in the filename (YYYY-MM-DDTHH-MM-SS-mmmZ)
        const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);

        if (match && match[1]) {
            const timestampStr = match[1]; // "2025-05-02T12-10-12-389Z"
            console.log('Found timestamp string:', timestampStr); // Debug logging

            // Convert format from YYYY-MM-DDTHH-MM-SS-mmmZ to YYYY-MM-DDTHH:MM:SS.mmmZ
            const isoFormat = timestampStr.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
            console.log('Converted to ISO format:', isoFormat); // Debug logging

            // Create Date object and check if valid
            const date = new Date(isoFormat);
            if (!isNaN(date.getTime())) {
                console.log('Extracted timestamp:', date.toISOString(), '(milliseconds:', date.getTime(), ')'); // Debug logging
                return date.getTime(); // Return as milliseconds
            } else {
                console.warn('Failed to create valid date from:', isoFormat);
            }
        } else {
            console.warn('No timestamp pattern found in filename:', filename);
        }

        return null;
    } catch (err) {
        console.error('Error extracting timestamp from filename:', err);
        return null;
    }
};

/**
 * Format a timestamp into a human-readable date string
 * @param {number|string} timestamp - The timestamp to format (milliseconds or ISO string)
 * @param {string} format - The format to use: 'short', 'medium', or 'long'
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp, format = 'medium') => {
    if (!timestamp) return 'Unknown date';

    console.log('Formatting timestamp:', timestamp, 'of type:', typeof timestamp); // Debug logging

    try {
        // Handle multiple timestamp formats
        let date;

        // If timestamp is a number in milliseconds (from metadata.timestamp)
        if (typeof timestamp === 'number') {
            date = new Date(timestamp);
            console.log('Parsed numeric timestamp to:', date.toISOString()); // Debug
        }
        // If timestamp is an ISO string or needs extraction from filename
        else if (typeof timestamp === 'string') {
            // First, check if this is a filename that contains a timestamp
            if (timestamp.includes('_202')) { // This pattern suggests it might be a filename
                const extractedTime = extractTimestampFromFilename(timestamp);
                if (extractedTime) {
                    date = new Date(extractedTime);
                    console.log('Extracted date from filename:', date.toISOString()); // Debug
                } else {
                    // Try direct parsing as a fallback
                    date = new Date(timestamp);
                }
            } else {
                // Try direct parsing first
                date = new Date(timestamp);
            }

            // If that fails, try extracting from filename format as a last resort
            if (isNaN(date.getTime())) {
                console.warn('Failed to parse date string directly, trying filename extraction');
                const extractedTime = extractTimestampFromFilename(timestamp);
                if (extractedTime) {
                    date = new Date(extractedTime);
                    console.log('Extracted date as fallback:', date.toISOString()); // Debug
                }
            }
        } else {
            console.warn('Unsupported timestamp type:', typeof timestamp);
            return 'Unknown date';
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Final date object is invalid');
            return 'Unknown date';
        }

        console.log('Final date object for formatting:', date.toISOString()); // Debug

        // Format options based on requested format
        let options;
        switch (format) {
            case 'short':
                options = {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                };
                break;
            case 'long':
                options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                };
                break;
            case 'time':
                options = {
                    hour: '2-digit',
                    minute: '2-digit'
                };
                break;
            case 'medium':
            default:
                options = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                break;
        }

        const formattedDate = date.toLocaleDateString(undefined, options);
        console.log('Formatted date:', formattedDate); // Debug
        return formattedDate;
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'Unknown date';
    }
};

/**
 * Check if a timestamp is within a specified time range from now
 * @param {number|string} timestamp - The timestamp to check (milliseconds or ISO string)
 * @param {number} minutes - Number of minutes to consider as recent
 * @returns {boolean} - True if the timestamp is within the specified range
 */
export const isRecentlyTaken = (timestamp, minutes = 10) => {
    if (!timestamp) return false;

    try {
        // Handle timestamp as number (milliseconds) or string
        let photoTime;

        if (typeof timestamp === 'number') {
            photoTime = timestamp;
        } else if (typeof timestamp === 'string') {
            // First, check if this might be a filename
            if (timestamp.includes('_202')) {
                const extractedTime = extractTimestampFromFilename(timestamp);
                if (extractedTime) {
                    photoTime = extractedTime;
                }
            }

            // If not extracted from filename, try direct parsing
            if (!photoTime) {
                const date = new Date(timestamp);

                if (!isNaN(date.getTime())) {
                    photoTime = date.getTime();
                } else {
                    // Last resort, try extracting from filename
                    photoTime = extractTimestampFromFilename(timestamp);
                }
            }
        }

        // If we couldn't extract a valid time, return false
        if (!photoTime || isNaN(photoTime)) return false;

        const cutoffTime = Date.now() - (minutes * 60 * 1000);
        return photoTime > cutoffTime;
    } catch (e) {
        console.warn('Error checking recent photo:', e);
        return false;
    }
};

/**
 * Get the best available timestamp from a photo object
 * @param {Object} photo - The photo object
 * @returns {number|null} - Best timestamp in milliseconds or null if not found
 */
export const getBestPhotoTimestamp = (photo) => {
    if (!photo) return null;

    // Priority 1: Try to extract from filename
    if (photo.filename) {
        const filenameTimestamp = extractTimestampFromFilename(photo.filename);
        if (filenameTimestamp) {
            console.log('Using timestamp from filename:', new Date(filenameTimestamp).toISOString());
            return filenameTimestamp;
        }
    }

    // Priority 2: Try the timestamp property (from metadata)
    if (photo.timestamp) {
        const timestamp = typeof photo.timestamp === 'number'
            ? photo.timestamp
            : new Date(photo.timestamp).getTime();
        console.log('Using timestamp from metadata:', new Date(timestamp).toISOString());
        return timestamp;
    }

    // Priority 3: Try serverTimestamp
    if (photo.serverTimestamp) {
        const timestamp = typeof photo.serverTimestamp === 'number'
            ? photo.serverTimestamp
            : new Date(photo.serverTimestamp).getTime();
        console.log('Using server timestamp:', new Date(timestamp).toISOString());
        return timestamp;
    }

    // Last resort: current time
    console.log('No timestamp found, using current time');
    return Date.now();
};

export default {
    extractTimestampFromFilename,
    formatDate,
    isRecentlyTaken,
    getBestPhotoTimestamp
};
