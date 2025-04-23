import React from 'react';
import Icon from '@mdi/react';
import { mdiHeart } from '@mdi/js';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto py-6 text-center text-sm text-gray-600 bg-white border-t border-gray-100">
            <div className="container mx-auto">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <div className="h-px bg-wedding-gold/30 w-10"></div>
                    <Icon path={mdiHeart} size={0.8} className="text-wedding-love" />
                    <div className="h-px bg-wedding-gold/30 w-10"></div>
                </div>

                <p>
          <span className="text-base font-script text-wedding-love">
            Rushel & Sivani
          </span>
                    <span className="mx-2">•</span>
                    <span>{currentYear}</span>
                </p>

                <p className="mt-2 text-xs">
                    <span>Wedding memories shared with love</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;