import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMusic } from '../contexts/Music';
import { PiX, PiPlayFill } from 'react-icons/pi';
import { gsap } from 'gsap';

export default function History() {
    const { 
        playbackHistory, playSong,
        isHistoryVisible, hideHistory
    } = useMusic();
    
    const panelRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef<HTMLDivElement>(null);
    const listContainerRef = useRef<HTMLUListElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLg, setIsLg] = useState(window.innerWidth >= 1024);
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

    const isOverlayMode = isMobile;

    useEffect(() => {
        setPortalElement(document.body);
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsLg(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isOverlayMode) {
            const panel = panelRef.current;
            const backdrop = backdropRef.current;
            if (!panel || !backdrop) return;
            const portalContainer = panel.closest<HTMLElement>('.fixed.inset-0');
            if (!portalContainer) return;

            if (isHistoryVisible) {
                portalContainer.style.display = 'block';
                gsap.to(backdrop, { opacity: 1, duration: 0.5, ease: 'power3.out' });
                if (isMobile) {
                    gsap.fromTo(panel, { y: '100%' }, { y: '0%', duration: 0.5, ease: 'power3.out' });
                } else {
                    gsap.fromTo(panel, { x: '100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' });
                }
            } else {
                gsap.to(backdrop, { opacity: 0, duration: 0.4, ease: 'power3.in' });
                const animationProps = isMobile ? { y: '100%' } : { x: '100%' };
                gsap.to(panel, { 
                    ...animationProps, 
                    duration: 0.4, 
                    ease: 'power3.in', 
                    onComplete: () => {
                        if (portalContainer) portalContainer.style.display = 'none';
                    }
                });
            }
        } else { // Desktop sidebar mode
            const panel = panelRef.current;
            if (!panel) return;
            gsap.to(panel, {
                width: isHistoryVisible ? (isLg ? 400 : 340) : 0,
                borderLeftWidth: isHistoryVisible ? 1 : 0,
                duration: 0.5,
                ease: 'power3.out',
            });
            gsap.to(innerContentRef.current, {
                opacity: isHistoryVisible ? 1 : 0,
                duration: 0.3,
                delay: isHistoryVisible ? 0.2 : 0,
            });
        }
    }, [isHistoryVisible, isOverlayMode, isMobile, isLg]);
    
    const historyContent = (
        <div className="flex flex-col min-h-0 h-full w-full">
            <div className="p-4 md:px-6 md:py-6 flex items-center justify-between flex-shrink-0 border-b border-border-color dark:border-dark-border-color">
                <h2 className="font-heading text-4xl font-bold text-text-primary dark:text-dark-text-primary">History</h2>
                <div className="flex items-center gap-2">
                     <button onClick={hideHistory} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-1 md:hidden">
                        <PiX className="h-7 w-7" />
                    </button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto hide-scrollbar p-4 md:p-6">
                {playbackHistory.length > 0 ? (
                    <ul ref={listContainerRef} className="space-y-1">
                        {playbackHistory.map((song, index) => (
                            <li 
                                key={`${song.id}-${index}`}
                                onClick={() => playSong(song, playbackHistory.slice(index + 1))}
                                className="group flex items-center p-2 hover:bg-gray-50 dark:hover:bg-dark-border-color rounded-lg transition-colors cursor-pointer"
                            >
                                <div className="w-10 h-10 mr-4 flex-shrink-0 rounded-md overflow-hidden relative">
                                    <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <PiPlayFill className="h-6 w-6 text-white"/>
                                    </div>
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-medium text-text-primary dark:text-dark-text-primary truncate">{song.title}</p>
                                    <p className="text-text-secondary dark:text-dark-text-secondary text-sm truncate">{song.artist}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-text-secondary dark:text-dark-text-secondary text-center py-10 px-6">Your playback history is empty.</p>
                )}
            </div>
        </div>
    );
    
    if (isOverlayMode) {
        if (!portalElement) return null;
        
        const panelMobileClasses = "absolute bottom-0 left-0 w-full bg-surface dark:bg-dark-surface rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col";
        const panelDesktopClasses = "absolute top-0 right-0 h-full w-[340px] lg:w-[400px] bg-surface dark:bg-dark-surface border-l border-border-color dark:border-dark-border-color flex flex-col";
        const initialTransform = isMobile ? { transform: 'translateY(100%)' } : { transform: 'translateX(100%)' };

        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[60]" style={{ display: 'none' }}>
                <div ref={backdropRef} className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0" onClick={hideHistory}></div>
                <div ref={panelRef} className={isMobile ? panelMobileClasses : panelDesktopClasses} style={initialTransform}>
                    {historyContent}
                </div>
            </div>,
            portalElement
        );
    }
    
    return (
         <aside
            ref={panelRef} 
            className="flex-shrink-0 w-0 border-l-0 border-border-color dark:border-dark-border-color overflow-hidden"
        >
            <div ref={innerContentRef} className="opacity-0 w-[340px] lg:w-[400px] h-full">
                {historyContent}
            </div>
        </aside>
    );
}
