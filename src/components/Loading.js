import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiHeart } from '@mdi/js';

const Loading = ({ message = "Loading..." }) => {
    // Animation variants for the floating hearts
    const floatingHeartVariants = {
        animate: {
            y: [0, -20, 0],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Create multiple hearts with staggered animations
    const createHearts = () => {
        return [...Array(8)].map((_, i) => {
            // Calculate position in a circle around the center
            const angle = (i / 8) * Math.PI * 2; // Distribute around the circle
            const radius = 60 + Math.random() * 20; // Vary the distance slightly
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            // Randomize delay and duration slightly for natural feel
            const delay = i * 0.1 + Math.random() * 0.2;
            const duration = 1.5 + Math.random() * 1;

            return (
                <motion.div
                    key={i}
                    className="absolute text-wedding-love"
                    initial={{ x, y, opacity: 0, scale: 0.5 }}
                    animate={{
                        y: [y, y - 20, y],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration,
                        delay,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 0.5
                    }}
                    style={{ left: "50%", top: "50%", marginLeft: x, marginTop: y }}
                >
                    <Icon path={mdiHeart} size={0.8 + Math.random() * 0.4} />
                </motion.div>
            );
        });
    };

    return (
        <div className="flex flex-col items-center justify-center py-20">
            {/* Container for the floating hearts */}
            <div className="relative w-72 h-72">
                {/* Central pulsing heart - perfectly centered */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
                    <motion.div
                        className="text-wedding-love z-10"
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 0, 10, 10, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "loop"
                        }}
                    >
                        <Icon path={mdiHeart} size={3} />
                    </motion.div>
                </div>

                {/* Floating hearts around the center */}
                {createHearts()}
            </div>

            {/* Loading text with fade animation */}
            <motion.p
                className="mt-6 text-lg text-gray-600 font-display"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {message}
            </motion.p>
        </div>
    );
};

export default Loading;