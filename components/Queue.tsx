import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMusic } from '../contexts/Music';
import { PiX, PiDotsSixVertical, PiTrash } from 'react-icons/pi';
import { gsap } from 'gsap';

export default function Queue() {
    const { 
        currentSong, currentQueue, playSong, removeSongFromQueue, setQueue, clearQueue,
        isQueueVisible, hideQueue, isShowcaseVisible
    } = useMusic();
    
    const panelRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef<HTMLDivElement>(null);
    const listContainerRef = useRef<HTMLUListElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isLg, setIsLg] = useState(window.innerWidth >= 1024);
    const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

    const isOverlayMode = isMobile || (!isMobile && isShowcaseVisible);

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

            if (isQueueVisible) {
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
                        portalContainer.style.display = 'none';
                    }
                });
            }
        } else { // Desktop sidebar mode
            const panel = panelRef.current;
            if (!panel) return;
            gsap.to(panel, {
                width: isQueueVisible ? (isLg ? 400 : 340) : 0,
                borderLeftWidth: isQueueVisible ? 1 : 0,
                duration: 0.5,
                ease: 'power3.out',
            });
            gsap.to(innerContentRef.current, {
                opacity: isQueueVisible ? 1 : 0,
                duration: 0.3,
                delay: isQueueVisible ? 0.2 : 0,
            });
        }
    }, [isQueueVisible, isOverlayMode, isMobile, isLg]);
    
    const upNextQueue = currentQueue.filter(s => s.id !== currentSong?.id);

    const handleRemoveSong = (songId: string) => {
        const songElement = Array.from(listContainerRef.current!.children).find(
          (child) => (child as HTMLElement).dataset.songId === songId
        ) as HTMLElement | undefined;
    
        if (songElement) {
          gsap.to(songElement, {
            height: 0, opacity: 0, margin: 0, padding: 0, duration: 0.3, ease: 'power2.in',
            onComplete: () => removeSongFromQueue(songId),
          });
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, songId: string) => {
        setDraggedItemId(songId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => { (e.target as HTMLElement).classList.add('opacity-50') }, 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-gray-100', 'dark:bg-dark-border-color');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-dark-border-color');
    }

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropTargetId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-dark-border-color');
        if (!draggedItemId || draggedItemId === dropTargetId) return;

        const currentUpNext = currentQueue.filter(s => s.id !== currentSong?.id);

        const draggedIndex = currentUpNext.findIndex(s => s.id === draggedItemId);
        const dropIndex = currentUpNext.findIndex(s => s.id === dropTargetId);
        if (draggedIndex === -1 || dropIndex === -1) return;

        const newUpNext = [...currentUpNext];
        const [draggedItem] = newUpNext.splice(draggedIndex, 1);
        newUpNext.splice(dropIndex, 0, draggedItem);
        
        const newFullQueue = currentSong ? [currentSong, ...newUpNext] : newUpNext;
        setQueue(newFullQueue);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        setDraggedItemId(null);
        (e.target as HTMLElement).classList.remove('opacity-50');
    };
    
    const queueContent = (
        <div className="flex flex-col min-h-0 h-full w-full">
            <div className="p-4 md:px-6 md:py-6 flex items-center justify-between flex-shrink-0 border-b border-border-color dark:border-dark-border-color">
                <h2 className="font-heading text-4xl font-bold text-text-primary dark:text-dark-text-primary">In Queue</h2>
                <div className="flex items-center gap-2">
                    {upNextQueue.length > 0 && (
                        <button onClick={clearQueue} title="Clear upcoming" className="p-2 text-text-secondary dark:text-dark-text-secondary hover:text-red-500 dark:hover:text-red-500 transition-colors">
                            <PiTrash className="h-5 w-5"/>
                        </button>
                    )}
                     <button onClick={hideQueue} className="text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors p-1 md:hidden">
                        <PiX className="h-7 w-7" />
                    </button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto hide-scrollbar p-4 md:p-6 space-y-6">
                {currentSong && (
                    <div>
                        <h3 className="text-xs font-bold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2">Now Playing</h3>
                        <div className="flex items-center p-3 bg-gray-50 dark:bg-dark-background rounded-lg">
                            <img src={currentSong.albumArt} alt={currentSong.title} className="w-12 h-12 object-cover mr-4 rounded-md" />
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold text-text-primary dark:text-dark-text-primary truncate">{currentSong.title}</p>
                                <p className="text-text-secondary dark:text-dark-text-secondary text-sm truncate">{currentSong.artist}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {upNextQueue.length > 0 && (
                     <div>
                        {currentSong && <h3 className="text-xs font-bold text-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mb-2">Up Next</h3>}
                        <ul ref={listContainerRef} className="space-y-1">
                            {upNextQueue.map((song) => (
                                <li 
                                    key={song.id}
                                    data-song-id={song.id}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, song.id)}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, song.id)}
                                    onDragEnd={handleDragEnd}
                                    className="group flex items-center p-2 hover:bg-gray-50 dark:hover:bg-dark-border-color rounded-lg transition-colors"
                                >
                                    <PiDotsSixVertical className="w-5 h-5 text-text-secondary dark:text-dark-text-secondary mr-2 cursor-grab flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-10 h-10 mr-4 cursor-pointer flex-shrink-0" onClick={() => playSong(song, currentQueue)}>
                                        <img src={song.albumArt} alt={song.title} className="w-full h-full object-cover rounded-md" />
                                    </div>
                                    <div className="flex-grow cursor-pointer overflow-hidden" onClick={() => playSong(song, currentQueue)}>
                                        <p className="font-medium text-text-primary dark:text-dark-text-primary truncate">{song.title}</p>
                                        <p className="text-text-secondary dark:text-dark-text-secondary text-sm truncate">{song.artist}</p>
                                    </div>
                                    <button onClick={() => handleRemoveSong(song.id)} className="ml-2 p-1 text-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-500 transition-colors">
                                        <PiX className="h-[18px] w-[18px]" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {upNextQueue.length === 0 && !currentSong && (
                    <p className="text-text-secondary dark:text-dark-text-secondary text-center py-10 px-6">The queue is empty.</p>
                )}

                {upNextQueue.length === 0 && currentSong && (
                    <p className="text-text-secondary dark:text-dark-text-secondary text-center py-10 px-6">Nothing else in the queue.</p>
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
                <div ref={backdropRef} className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0" onClick={hideQueue}></div>
                <div ref={panelRef} className={isMobile ? panelMobileClasses : panelDesktopClasses} style={initialTransform}>
                    {queueContent}
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
                {queueContent}
            </div>
        </aside>
    );
}
