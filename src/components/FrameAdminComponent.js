import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiUpload, mdiCheckCircle, mdiAlertCircle } from '@mdi/js';

const FrameAdminComponent = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if it's a PNG file
            if (!file.type.includes('png')) {
                setMessage({
                    type: 'error',
                    text: 'Please select a PNG file with transparency for best results'
                });
                return;
            }

            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setMessage(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setMessage({
                type: 'error',
                text: 'Please select a frame file to upload'
            });
            return;
        }

        setLoading(true);

        // Create form data for file upload
        const formData = new FormData();
        formData.append('overlay', selectedFile);
        formData.append('type', 'standard');
        formData.append('name', 'wedding-frame.png');

        try {
            // Send to server endpoint
            const response = await axios.post('/api/admin/overlays', formData);

            if (response.data.success) {
                setMessage({
                    type: 'success',
                    text: 'Frame uploaded successfully! All photos will now use this frame.'
                });

                // Clear form
                setSelectedFile(null);
                setPreviewUrl('');
            } else {
                throw new Error(response.data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error uploading frame:', error);
            setMessage({
                type: 'error',
                text: `Upload failed: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-christian-text">Upload Wedding Frame</h2>

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Frame Image (PNG with transparent center)
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Icon path={mdiUpload} size={2} className="mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">PNG with transparency (max 10MB)</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/png"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                </div>

                {/* Preview */}
                {previewUrl && (
                    <div className="mb-6">
                        <p className="block text-sm font-medium text-gray-700 mb-2">Frame Preview</p>
                        <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                            <img
                                src={previewUrl}
                                alt="Frame preview"
                                className="max-h-64 mx-auto"
                            />
                            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10"></div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 text-center">
                            The transparent area in the middle will show your photos
                        </p>
                    </div>
                )}

                {/* Message */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 mb-6 rounded-md flex items-start ${
                            message.type === 'success'
                                ? 'bg-green-50 text-green-800'
                                : 'bg-red-50 text-red-800'
                        }`}
                    >
                        <Icon
                            path={message.type === 'success' ? mdiCheckCircle : mdiAlertCircle}
                            size={1}
                            className="mr-3 flex-shrink-0 mt-0.5"
                        />
                        <div>
                            <p className="font-medium">{message.text}</p>
                            {message.type === 'success' && (
                                <p className="mt-1 text-sm text-green-700">
                                    Guests will now see this frame with their photos
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading || !selectedFile}
                    className={`w-full py-3 px-4 btn btn-primary btn-christian rounded-md ${
                        loading || !selectedFile ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading Frame...
                        </span>
                    ) : (
                        'Upload Frame'
                    )}
                </button>
            </form>

            <div className="mt-8 text-sm text-gray-600">
                <h3 className="font-semibold mb-2">Frame Requirements:</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li>PNG format with transparent center where photos will appear</li>
                    <li>Wedding-themed decorative border around the edges</li>
                    <li>Dimensions should be at least 2400×1700 pixels for best quality</li>
                    <li>File size under 10MB for faster loading</li>
                </ul>
            </div>
        </div>
    );
};

export default FrameAdminComponent;