// src/components/AdvancedImageSharing.js
// FIXED: Teilt jetzt immer das Foto, nie den Link

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import {
    mdiShare,
    mdiWhatsapp,
    mdiFacebook,
    mdiInstagram,
    mdiEmailOutline,
    mdiContentCopy,
    mdiCheckCircle,
    mdiClose,
    mdiDownload,
    mdiLoading,
    mdiImage
} from '@mdi/js';

const AdvancedImageSharing = ({ photo, activePreviewUrl, selectedFrame }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [personalMessage, setPersonalMessage] = useState('');
    const [shareSuccess, setShareSuccess] = useState(false);
    const [shareCount, setShareCount] = useState(0);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Analytics tracking für Shares
    const trackShare = async (platform, message = '', sharedImage = false) => {
        try {
            await fetch('/api/analytics/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoId: photo.id,
                    platform,
                    message: message.substring(0, 100),
                    sharedImage: sharedImage,
                    frameId: selectedFrame?.id,
                    timestamp: Date.now()
                })
            });

            setShareCount(prev => prev + 1);
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    };

    // FIXED: Robuste Foto-Blob-Erstellung
    const generateImageBlob = async () => {
        try {
            setIsGeneratingImage(true);

            // Wenn wir bereits einen data: URL haben, direkt verwenden
            if (activePreviewUrl && activePreviewUrl.startsWith('data:')) {
                const response = await fetch(activePreviewUrl);
                const blob = await response.blob();
                console.log('✅ Generated blob from data URL:', blob.size, 'bytes');
                return blob;
            }

            // Ansonsten Canvas-basierte Generierung
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const photoImg = await loadImage(activePreviewUrl || photo.url);
            console.log('✅ Photo loaded:', photoImg.width, 'x', photoImg.height);

            let frameImg = null;
            if (selectedFrame?.frameUrl) {
                frameImg = await loadImage(selectedFrame.frameUrl);
                console.log('✅ Frame loaded:', frameImg.width, 'x', frameImg.height);
            }

            // Canvas Größe setzen
            if (frameImg) {
                canvas.width = frameImg.width;
                canvas.height = frameImg.height;
            } else {
                canvas.width = photoImg.width;
                canvas.height = photoImg.height;
            }

            // Weißer Hintergrund
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (frameImg) {
                // Mit Frame
                const scaleFactor = 0.95;
                const photoWidth = canvas.width * scaleFactor;
                const photoHeight = canvas.height * scaleFactor;
                const x = (canvas.width - photoWidth) / 2;
                const y = (canvas.height - photoHeight) / 2;

                ctx.drawImage(photoImg, x, y, photoWidth, photoHeight);
                ctx.drawImage(frameImg, 0, 0);
            } else {
                // Ohne Frame
                ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);
            }

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    console.log('✅ Canvas blob generated:', blob.size, 'bytes');
                    resolve(blob);
                }, 'image/jpeg', 0.92);
            });

        } catch (error) {
            console.error('❌ Error generating image blob:', error);
            throw error;
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // Hilfsfunktion: Bild laden
    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    // FIXED: Hauptfunktion - teilt IMMER das Foto
    const handleSharePhoto = async () => {
        try {
            console.log('🚀 Starting photo share...');

            const imageBlob = await generateImageBlob();
            const imageFile = new File([imageBlob], `rushel-sivani-wedding-${selectedFrame?.id || 'photo'}.jpg`, {
                type: 'image/jpeg'
            });

            console.log('📱 Generated file:', imageFile.name, imageFile.size, 'bytes');

            // Versuche Native Sharing mit Foto
            if (navigator.share) {
                const shareData = {
                    title: 'Rushel & Sivani Wedding Photo 💕',
                    text: personalMessage || 'Check out our beautiful wedding photo! 💕',
                    files: [imageFile]
                };

                console.log('🔍 Checking if we can share files...');

                // Prüfen ob File-Sharing unterstützt wird
                if (navigator.canShare && navigator.canShare(shareData)) {
                    console.log('✅ Native file sharing supported!');
                    await navigator.share(shareData);

                    await trackShare('native-image', personalMessage, true);
                    setShareSuccess(true);
                    setTimeout(() => setShareSuccess(false), 3000);
                    return; // Erfolgreich geteilt!
                } else {
                    console.log('⚠️ File sharing not supported, trying alternatives...');
                }
            }

            // Fallback: Foto direkt downloaden + Share-Modal öffnen
            console.log('📥 Falling back to download + manual share...');

            // Foto downloaden
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rushel-sivani-wedding-${selectedFrame?.id || 'photo'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Share Modal öffnen
            setShowShareModal(true);

            await trackShare('download-share', personalMessage, true);

            // User informieren
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                alert('📸 Foto wurde gespeichert!\n\nÖffnet die Fotos-App und teilt das Bild von dort aus.');
            } else if (/Android/i.test(navigator.userAgent)) {
                alert('📸 Foto wurde heruntergeladen!\n\nÖffnet die Galerie und teilt das Bild von dort aus.');
            } else {
                alert('📸 Foto wurde heruntergeladen!\n\nDas Foto kann jetzt geteilt werden.');
            }

        } catch (error) {
            console.error('❌ Photo share failed:', error);

            // Letzter Fallback: Share Modal öffnen
            setShowShareModal(true);
            alert('📱 Bitte wählt eine Share-Option aus dem Menü.');
        }
    };

    // WhatsApp - IMMER mit Foto
    const shareImageToWhatsApp = async () => {
        try {
            console.log('📱 Sharing to WhatsApp...');

            const imageBlob = await generateImageBlob();
            const imageFile = new File([imageBlob], 'wedding-photo.jpg', { type: 'image/jpeg' });

            // Versuche Native Share API
            if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                const shareData = {
                    title: 'Wedding Photo',
                    text: personalMessage || 'Schaut euch unser Foto von Rushel & Sivanis Hochzeit an! 💕',
                    files: [imageFile]
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    await trackShare('whatsapp-native', personalMessage, true);
                    setShowShareModal(false);
                    return;
                }
            }

            // Fallback: Download + WhatsApp öffnen
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-photo.jpg';
            link.click();
            URL.revokeObjectURL(url);

            // WhatsApp öffnen
            setTimeout(() => {
                const message = personalMessage || 'Schaut euch unser Foto von Rushel & Sivanis Hochzeit an! 💕';
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + '\n\n📸 Foto wurde heruntergeladen!')}`;
                window.open(whatsappUrl, '_blank');
            }, 1000);

            await trackShare('whatsapp-download', personalMessage, true);
            alert('📸 Foto wurde heruntergeladen!\nWhatsApp öffnet sich - fügt das Foto aus eurer Galerie hinzu.');

        } catch (error) {
            console.error('WhatsApp share failed:', error);
            alert('❌ Fehler beim Teilen. Bitte versucht es erneut.');
        }

        setShowShareModal(false);
    };

    // Alle anderen Share-Funktionen - IMMER mit Foto
    const shareImageToInstagram = async () => {
        try {
            const imageBlob = await generateImageBlob();
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-instagram.jpg';
            link.click();
            URL.revokeObjectURL(url);

            await trackShare('instagram-image', personalMessage, true);

            setTimeout(() => {
                if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    window.location.href = 'instagram://camera';
                } else {
                    window.open('https://www.instagram.com/', '_blank');
                }
            }, 1000);

            alert('📸 Foto wurde heruntergeladen!\nInstagram öffnet sich - wählt das Foto aus eurer Galerie aus.');

        } catch (error) {
            console.error('Instagram share failed:', error);
            window.open('https://www.instagram.com/', '_blank');
        }
        setShowShareModal(false);
    };

    const shareImageToFacebook = async () => {
        try {
            const imageBlob = await generateImageBlob();
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-facebook.jpg';
            link.click();
            URL.revokeObjectURL(url);

            await trackShare('facebook-image', personalMessage, true);

            setTimeout(() => {
                window.open('https://www.facebook.com/', '_blank');
            }, 1000);

            alert('📸 Foto wurde heruntergeladen!\nFacebook öffnet sich - fügt das Foto zu eurem Post hinzu.');

        } catch (error) {
            console.error('Facebook share failed:', error);
            window.open('https://www.facebook.com/', '_blank');
        }
        setShowShareModal(false);
    };

    const shareImageToEmail = async () => {
        try {
            const imageBlob = await generateImageBlob();
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-photo.jpg';
            link.click();
            URL.revokeObjectURL(url);

            await trackShare('email-image', personalMessage, true);

            setTimeout(() => {
                const subject = 'Hochzeitsfoto von Rushel & Sivani';
                const body = `${personalMessage || 'Schaut euch unser wunderschönes Foto von der Hochzeit an!'}\n\nDas Foto wurde heruntergeladen und kann als Anhang hinzugefügt werden.`;
                const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = emailUrl;
            }, 1000);

        } catch (error) {
            console.error('Email share failed:', error);
        }
        setShowShareModal(false);
    };

    return (
        <>
            {/* FIXED: Haupt-Share-Button - teilt immer Foto */}
            <button
                onClick={handleSharePhoto}
                disabled={isGeneratingImage}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
            >
                <AnimatePresence mode="wait">
                    {isGeneratingImage ? (
                        <motion.div key="loading" className="mr-2">
                            <Icon path={mdiLoading} size={1} className="animate-spin" />
                        </motion.div>
                    ) : shareSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mr-2"
                        >
                            <Icon path={mdiCheckCircle} size={1} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="share"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mr-2"
                        >
                            <Icon path={mdiImage} size={1} />
                        </motion.div>
                    )}
                </AnimatePresence>
                <span>
                    {isGeneratingImage
                        ? 'Bereite Foto vor...'
                        : shareSuccess
                            ? 'Foto geteilt! 🎉'
                            : `Foto teilen${shareCount > 0 ? ` (${shareCount})` : ''}`
                    }
                </span>
            </button>

            {/* Share Modal - Rest bleibt gleich */}
            <AnimatePresence>
                {showShareModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowShareModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Foto teilen</h3>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <Icon path={mdiClose} size={1} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    📸 <strong>Das Foto wurde heruntergeladen!</strong><br/>
                                    Wählt jetzt eine App zum Teilen:
                                </p>
                            </div>

                            {/* Personal Message Input */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Persönliche Nachricht (optional)
                                </label>
                                <textarea
                                    value={personalMessage}
                                    onChange={(e) => setPersonalMessage(e.target.value)}
                                    placeholder="z.B. Was für ein wunderschöner Tag! 💕"
                                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                    rows="3"
                                    maxLength="150"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {personalMessage.length}/150 Zeichen
                                </p>
                            </div>

                            {/* Share Options */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={shareImageToWhatsApp}
                                    disabled={isGeneratingImage}
                                    className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
                                        <Icon path={mdiWhatsapp} size={1.3} />
                                    </div>
                                    <span className="text-sm font-medium">WhatsApp</span>
                                    <span className="text-xs text-gray-500">Foto teilen</span>
                                </button>

                                <button
                                    onClick={shareImageToInstagram}
                                    disabled={isGeneratingImage}
                                    className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white mb-2">
                                        <Icon path={mdiInstagram} size={1.3} />
                                    </div>
                                    <span className="text-sm font-medium">Instagram</span>
                                    <span className="text-xs text-gray-500">Foto teilen</span>
                                </button>

                                <button
                                    onClick={shareImageToFacebook}
                                    disabled={isGeneratingImage}
                                    className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mb-2">
                                        <Icon path={mdiFacebook} size={1.3} />
                                    </div>
                                    <span className="text-sm font-medium">Facebook</span>
                                    <span className="text-xs text-gray-500">Foto teilen</span>
                                </button>

                                <button
                                    onClick={shareImageToEmail}
                                    disabled={isGeneratingImage}
                                    className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white mb-2">
                                        <Icon path={mdiEmailOutline} size={1.3} />
                                    </div>
                                    <span className="text-sm font-medium">E-Mail</span>
                                    <span className="text-xs text-gray-500">Foto teilen</span>
                                </button>
                            </div>

                            {/* Loading Indicator */}
                            {isGeneratingImage && (
                                <div className="mt-4 flex items-center justify-center text-pink-600">
                                    <Icon path={mdiLoading} size={1} className="animate-spin mr-2" />
                                    <span className="text-sm">Bereite Foto vor...</span>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdvancedImageSharing;