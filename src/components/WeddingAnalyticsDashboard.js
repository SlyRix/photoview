// src/components/WeddingAnalyticsDashboard.js
// Angepasst für Einbettung in Gallery

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import {
    mdiChartLine,
    mdiEye,
    mdiDownload,
    mdiShare,
    mdiImageFrame,
    mdiRefresh,
    mdiTrendingUp,
    mdiHeart,
    mdiLoading,
    mdiAlert,
    mdiImageMultiple,
    mdiClockOutline,
    mdiWhatsapp,
    mdiFacebook,
    mdiInstagram,
    mdiEmailOutline,
    mdiContentCopy
} from '@mdi/js';

const WeddingAnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch analytics data
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/analytics-summary', {
                headers: {
                    'x-api-key': 'xP9dR7tK2mB5vZ3q' // In production, this should come from secure storage
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setAnalytics(data);
            setLastUpdate(new Date());
            setError(null);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and auto-refresh
    useEffect(() => {
        fetchAnalytics();

        if (autoRefresh) {
            const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    // Calculate engagement rate
    const engagementRate = useMemo(() => {
        if (!analytics || analytics.totalViews === 0) return 0;
        return ((analytics.totalDownloads + analytics.totalShares) / analytics.totalViews * 100).toFixed(1);
    }, [analytics]);

    if (loading && !analytics) {
        return (
            <div className="text-center py-12">
                <Icon path={mdiLoading} size={3} className="animate-spin text-wedding-love mx-auto mb-4" />
                <p className="text-gray-600">Lade Analytics-Daten...</p>
            </div>
        );
    }

    if (error && !analytics) {
        return (
            <div className="text-center py-12">
                <Icon path={mdiAlert} size={3} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Fehler beim Laden</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={fetchAnalytics}
                    className="bg-wedding-love text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                >
                    Erneut versuchen
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-display mb-2">
                    📊 Photo Booth Analytics
                </h2>
                <div className="flex justify-center items-center mb-4">
                    <div className="h-px bg-wedding-gold/30 w-16"></div>
                    <Icon path={mdiChartLine} size={1} className="mx-3 text-wedding-love" />
                    <div className="h-px bg-wedding-gold/30 w-16"></div>
                </div>
                <p className="text-gray-600">
                    Live-Statistiken eurer Hochzeits-Fotobooth
                </p>

                {/* Control Buttons */}
                <div className="flex items-center justify-center space-x-4 mt-6">
                    <div className="flex items-center text-sm text-gray-500">
                        <Icon path={mdiClockOutline} size={0.8} className="mr-2" />
                        {lastUpdate ? `${lastUpdate.toLocaleTimeString()}` : 'Nie aktualisiert'}
                    </div>

                    <button
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="flex items-center bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                    >
                        <Icon
                            path={mdiRefresh}
                            size={0.7}
                            className={`mr-2 ${loading ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </button>

                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            autoRefresh
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}
                    >
                        Auto {autoRefresh ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Photos */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-md p-4"
                >
                    <div className="text-center">
                        <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-3">
                            <Icon path={mdiImageMultiple} size={1.2} className="text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.totalPhotos || 0}</p>
                        <p className="text-sm text-gray-600">Fotos</p>
                    </div>
                </motion.div>

                {/* Total Views */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-lg shadow-md p-4"
                >
                    <div className="text-center">
                        <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-3">
                            <Icon path={mdiEye} size={1.2} className="text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.totalViews || 0}</p>
                        <p className="text-sm text-gray-600">Aufrufe</p>
                    </div>
                </motion.div>

                {/* Total Downloads */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-md p-4"
                >
                    <div className="text-center">
                        <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-3">
                            <Icon path={mdiDownload} size={1.2} className="text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.totalDownloads || 0}</p>
                        <p className="text-sm text-gray-600">Downloads</p>
                    </div>
                </motion.div>

                {/* Total Shares */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-lg shadow-md p-4"
                >
                    <div className="text-center">
                        <div className="bg-pink-100 p-3 rounded-lg w-fit mx-auto mb-3">
                            <Icon path={mdiShare} size={1.2} className="text-pink-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.totalShares || 0}</p>
                        <p className="text-sm text-gray-600">Shares</p>
                    </div>
                </motion.div>
            </div>

            {/* Engagement & Popular Frames */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engagement Rate */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Engagement Rate</h3>
                        <Icon path={mdiTrendingUp} size={1.2} className="text-wedding-love" />
                    </div>

                    <div className="text-center">
                        <div className="text-3xl font-bold text-wedding-love mb-2">
                            {engagementRate}%
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            (Downloads + Shares) / Views
                        </p>

                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-pink-400 to-purple-500 h-full transition-all duration-1000"
                                style={{ width: `${Math.min(engagementRate, 100)}%` }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Popular Frames */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Beliebte Rahmen</h3>
                        <Icon path={mdiImageFrame} size={1.2} className="text-wedding-love" />
                    </div>

                    {analytics?.popularFrames && Object.keys(analytics.popularFrames).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(analytics.popularFrames)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([frame, count], index) => (
                                    <div key={frame} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-3 h-3 rounded-full mr-3 ${
                                                index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' :
                                                        index === 2 ? 'bg-orange-400' :
                                                            'bg-gray-300'
                                            }`} />
                                            <span className="font-medium capitalize">
                                                {frame === 'standard' ? 'Standard' :
                                                    frame === 'custom' ? 'Elegant Gold' :
                                                        frame === 'insta' ? 'Instagram' :
                                                            frame}
                                            </span>
                                        </div>
                                        <span className="text-gray-600 font-semibold">{count}x</span>
                                    </div>
                                ))
                            }
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-4">
                            <Icon path={mdiImageFrame} size={2} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Noch keine Rahmen verwendet</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow-md p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</h3>
                    <Icon path={mdiClockOutline} size={1.2} className="text-wedding-love" />
                </div>

                {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">Foto ID</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">👁️</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">⬇️</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">📤</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-700 text-sm">Zeit</th>
                            </tr>
                            </thead>
                            <tbody>
                            {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                                <motion.tr
                                    key={activity.photoId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + index * 0.05 }}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                    <td className="py-2 px-3">
                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                {activity.photoId.length > 15
                                                    ? `${activity.photoId.substring(0, 15)}...`
                                                    : activity.photoId}
                                            </span>
                                    </td>
                                    <td className="py-2 px-3 text-sm text-green-600 font-semibold">
                                        {activity.views}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-purple-600 font-semibold">
                                        {activity.downloads}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-pink-600 font-semibold">
                                        {activity.shares}
                                    </td>
                                    <td className="py-2 px-3 text-xs text-gray-500">
                                        {new Date(activity.lastActivity).toLocaleTimeString('de-DE')}
                                    </td>
                                </motion.tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">
                        <Icon path={mdiClockOutline} size={2} className="mx-auto mb-3 opacity-50" />
                        <h4 className="font-medium mb-1">Noch keine Aktivitäten</h4>
                        <p className="text-sm">Sobald Gäste Fotos ansehen, erscheinen hier die Statistiken.</p>
                    </div>
                )}
            </motion.div>

            {/* Summary Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-wedding-love to-purple-600 rounded-lg text-white p-6 text-center"
            >
                <div className="flex items-center justify-center mb-4">
                    <Icon path={mdiHeart} size={1.5} className="mr-3" />
                    <h3 className="text-xl font-bold">Rushel & Sivani's Hochzeit</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
                        <div className="text-white/80 text-sm">Foto-Aufrufe</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{(analytics?.totalDownloads || 0) + (analytics?.totalShares || 0)}</div>
                        <div className="text-white/80 text-sm">Interaktionen</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{engagementRate}%</div>
                        <div className="text-white/80 text-sm">Engagement</div>
                    </div>
                </div>

                <div className="mt-4 text-center text-white/80 text-sm">
                    <p>💕 Eure Gäste lieben die Foto-Booth! 📸</p>
                </div>
            </motion.div>
        </div>
    );
};

export default WeddingAnalyticsDashboard;