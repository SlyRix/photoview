// src/components/AdvancedImageSharing.js
// Erweiterte Share-Funktionen die das tatsächliche Bild teilen

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
    const canvasRef = useRef(null);

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
                    sharedImage: sharedImage, // Track ob Bild oder Link geteilt wurde
                    frameId: selectedFrame?.id,
                    timestamp: Date.now()
                })
            });

            setShareCount(prev => prev + 1);
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    };

    // Foto als Blob erstellen (für File-Sharing)
    const generateImageBlob = async () => {
        try {
            setIsGeneratingImage(true);

            // Wenn wir bereits eine Preview-URL haben, diese verwenden
            if (activePreviewUrl && activePreviewUrl.startsWith('data:')) {
                // Data URL zu Blob konvertieren
                const response = await fetch(activePreviewUrl);
                const blob = await response.blob();
                return blob;
            }

            // Andernfalls Canvas verwenden um Foto mit Frame zu erstellen
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Original Foto laden
            const photoImg = await loadImage(photo.url);

            // Frame laden (falls vorhanden)
            let frameImg = null;
            if (selectedFrame?.frameUrl) {
                frameImg = await loadImage(selectedFrame.frameUrl);
            }

            // Canvas-Größe setzen
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
                // Foto skaliert in Frame einzeichnen
                const scaleFactor = 0.95;
                const photoWidth = canvas.width * scaleFactor;
                const photoHeight = canvas.height * scaleFactor;
                const x = (canvas.width - photoWidth) / 2;
                const y = (canvas.height - photoHeight) / 2;

                ctx.drawImage(photoImg, x, y, photoWidth, photoHeight);
                ctx.drawImage(frameImg, 0, 0);
            } else {
                // Ohne Frame - nur das Foto
                ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);
            }

            // Canvas zu Blob konvertieren
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            });

        } catch (error) {
            console.error('Error generating image blob:', error);
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

    // Native Share API mit Bild
    const handleNativeImageShare = async () => {
        try {
            // Prüfen ob File-Sharing unterstützt wird
            if (navigator.share && navigator.canShare) {
                const imageBlob = await generateImageBlob();
                const imageFile = new File([imageBlob], `rushel-sivani-wedding-${selectedFrame?.id || 'photo'}.jpg`, {
                    type: 'image/jpeg'
                });

                const shareData = {
                    title: 'Unser Hochzeitsfoto - Rushel & Sivani',
                    text: personalMessage || 'Schaut euch unser wunderschönes Foto von der Hochzeit an! 💕',
                    files: [imageFile]
                };

                // Prüfen ob diese Share-Daten unterstützt werden
                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    await trackShare('native-image', personalMessage, true);
                    setShareSuccess(true);
                    setTimeout(() => setShareSuccess(false), 3000);
                    setShowShareModal(false);
                    return true;
                }
            }

            // Fallback: Nur Link teilen
            return await handleNativeLinkShare();
        } catch (error) {
            console.log('Native image share failed:', error);
            // Fallback zu Modal
            setShowShareModal(true);
            return false;
        }
    };

    // Native Share API nur mit Link
    const handleNativeLinkShare = async () => {
        const shareData = {
            title: 'Unser Hochzeitsfoto - Rushel & Sivani',
            text: personalMessage || 'Schaut euch unser wunderschönes Foto von der Hochzeit an! 💕',
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                await trackShare('native-link', personalMessage, false);
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
                return true;
            }
        } catch (error) {
            console.log('Native link share failed:', error);
        }

        setShowShareModal(true);
        return false;
    };

    // WhatsApp mit Bild (falls möglich)
    const shareImageToWhatsApp = async () => {
        try {
            // Für mobile Geräte - versuche das Bild zu teilen
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                const imageBlob = await generateImageBlob();
                const imageFile = new File([imageBlob], 'wedding-photo.jpg', { type: 'image/jpeg' });

                // Versuche Web Share API mit WhatsApp
                if (navigator.share && navigator.canShare) {
                    const shareData = {
                        title: 'Hochzeitsfoto',
                        text: personalMessage || 'Schaut euch unser Foto von Rushel & Sivanis Hochzeit an! 💕',
                        files: [imageFile]
                    };

                    if (navigator.canShare(shareData)) {
                        await navigator.share(shareData);
                        await trackShare('whatsapp-image', personalMessage, true);
                        setShowShareModal(false);
                        return;
                    }
                }

                // Fallback: Bild downloaden und WhatsApp öffnen
                const url = URL.createObjectURL(imageBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'rushel-sivani-wedding-photo.jpg';
                link.click();
                URL.revokeObjectURL(url);

                // Dann WhatsApp öffnen
                setTimeout(() => {
                    const message = `${personalMessage || 'Schaut euch unser Foto von Rushel & Sivanis Hochzeit an! 💕'}\n\nFoto wurde heruntergeladen 📱`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }, 1000);

                await trackShare('whatsapp-download', personalMessage, true);
            } else {
                // Desktop: Link teilen
                shareToWhatsAppLink();
            }
        } catch (error) {
            console.error('WhatsApp image share failed:', error);
            shareToWhatsAppLink(); // Fallback zu Link
        }

        setShowShareModal(false);
    };

    // WhatsApp Link teilen (Fallback)
    const shareToWhatsAppLink = async () => {
        const message = personalMessage || 'Schaut euch unser wunderschönes Foto von Rushel & Sivanis Hochzeit an! 💕';
        const fullMessage = `${message}\n\n${window.location.href}`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
        window.open(whatsappUrl, '_blank');

        await trackShare('whatsapp-link', personalMessage, false);
        setShowShareModal(false);
    };

    // Instagram mit Bild
    const shareImageToInstagram = async () => {
        try {
            // Bild downloaden für manuelles Teilen
            const imageBlob = await generateImageBlob();
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-instagram.jpg';
            link.click();
            URL.revokeObjectURL(url);

            // Instagram öffnen
            setTimeout(() => {
                if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    try {
                        window.location.href = 'instagram://camera';
                    } catch (error) {
                        window.open('https://www.instagram.com/', '_blank');
                    }
                } else {
                    window.open('https://www.instagram.com/', '_blank');
                }
            }, 1000);

            await trackShare('instagram-image', personalMessage, true);

            // Info-Message zeigen
            alert('📸 Foto wurde heruntergeladen!\n\nÖffnet jetzt Instagram und wählt das Foto aus eurer Galerie aus.');

        } catch (error) {
            console.error('Instagram image share failed:', error);
            window.open('https://www.instagram.com/', '_blank');
        }

        setShowShareModal(false);
    };

    // Facebook mit Bild-Download
    const shareImageToFacebook = async () => {
        try {
            // Bild downloaden
            const imageBlob = await generateImageBlob();
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-facebook.jpg';
            link.click();
            URL.revokeObjectURL(url);

            // Facebook öffnen
            setTimeout(() => {
                const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                window.open(facebookUrl, '_blank', 'width=600,height=400');
            }, 1000);

            await trackShare('facebook-image', personalMessage, true);

            alert('📸 Foto wurde heruntergeladen!\n\nÖffnet jetzt Facebook und fügt das Foto zu eurem Post hinzu.');

        } catch (error) {
            console.error('Facebook image share failed:', error);
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
            window.open(facebookUrl, '_blank', 'width=600,height=400');
        }

        setShowShareModal(false);
    };

    // Email mit Bild als Anhang (Download)
    const shareImageToEmail = async () => {
        try {
            // Bild downloaden
            const imageBlob = await generateImageBlob();
            const url = URL.createObjectURL(imageBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'rushel-sivani-wedding-photo.jpg';
            link.click();
            URL.revokeObjectURL(url);

            // Email öffnen
            setTimeout(() => {
                const subject = 'Hochzeitsfoto von Rushel & Sivani';
                const body = `${personalMessage || 'Schaut euch unser wunderschönes Foto von der Hochzeit an!'}\n\nDas Foto wurde heruntergeladen und kann als Anhang hinzugefügt werden.\n\nLink: ${window.location.href}`;

                const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = emailUrl;
            }, 1000);

            await trackShare('email-image', personalMessage, true);

        } catch (error) {
            console.error('Email image share failed:', error);
            // Fallback zu normalem Email
            const subject = 'Hochzeitsfoto von Rushel & Sivani';
            const body = `${personalMessage || 'Schaut euch unser wunderschönes Foto von der Hochzeit an!'}\n\n${window.location.href}`;
            const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = emailUrl;
        }

        setShowShareModal(false);
    };

    // Link kopieren
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert('📋 Link wurde kopiert!');
            await trackShare('copy-link', personalMessage, false);
        } catch (error) {
            console.error('Copy failed:', error);
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('📋 Link wurde kopiert!');
        }
    };

    return (
        <>
            {/* Main Share Button */}
            <button
                onClick={handleNativeImageShare}
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

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
                <button
                    onClick={shareImageToWhatsApp}
                    disabled={isGeneratingImage}
                    className="bg-green-500 text-white py-2 px-3 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50"
                    title="WhatsApp - Foto teilen"
                >
                    <Icon path={mdiWhatsapp} size={0.9} />
                </button>

                <button
                    onClick={shareImageToInstagram}
                    disabled={isGeneratingImage}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-3 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                    title="Instagram - Foto downloaden"
                >
                    <Icon path={mdiInstagram} size={0.9} />
                </button>

                <button
                    onClick={shareImageToFacebook}
                    disabled={isGeneratingImage}
                    className="bg-blue-600 text-white py-2 px-3 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                    title="Facebook - Foto downloaden"
                >
                    <Icon path={mdiFacebook} size={0.9} />
                </button>

                <button
                    onClick={copyLink}
                    className="bg-gray-500 text-white py-2 px-3 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
                    title="Link kopieren"
                >
                    <Icon path={mdiContentCopy} size={0.9} />
                </button>
            </div>

            {/* Share Modal */}
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
                                    📸 <strong>Tipp:</strong> Das Foto wird automatisch heruntergeladen und kann dann in der App geteilt werden!
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
                                    <span className="text-xs text-gray-500">Foto + Text</span>
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
                                    <span className="text-xs text-gray-500">Download</span>
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
                                    <span className="text-xs text-gray-500">Download</span>
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
                                    <span className="text-xs text-gray-500">Download</span>
                                </button>
                            </div>

                            {/* Copy Link */}
                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-600 mb-3">Oder Link kopieren:</p>
                                <div className="flex">
                                    <input
                                        type="text"
                                        readOnly
                                        value={window.location.href}
                                        className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-pink-500 bg-gray-50"
                                        onClick={(e) => e.target.select()}
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-r-md hover:bg-pink-600 transition-colors"
                                    >
                                        Kopieren
                                    </button>
                                </div>
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