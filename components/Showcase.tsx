import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMusic } from '../contexts/Music';
import { 
    PiSkipBackFill, PiSkipForwardFill, PiShuffle, PiRepeat, PiRepeatOnce, 
    PiMicrophone, PiPlayFill, PiPauseFill, PiShareFat, PiX, PiDownloadSimple, PiHeartFill
} from 'react-icons/pi';
import { gsap } from 'gsap';

const formatTime = (ms: number) => {
    if (isNaN(ms) || ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const parseLRC = (lrc: string): { time: number; text: string }[] => {
    if (!lrc) return [];
    const lines = lrc.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
            const [, min, sec, ms, text] = match;
            const milliseconds = parseInt(ms.padEnd(3, '0'));
            const time = parseInt(min) * 60 * 1000 + parseInt(sec) * 1000 + milliseconds;
            result.push({ time, text: text.trim() });
        }
    }
    return result;
};

interface LyricsDisplayProps {
    lyrics: string;
    currentTime: number;
    seek: (time: number) => void;
    isExportMode: boolean;
    selectedLyrics: number[];
    onSelectLyric: (index: number) => void;
    onLongPress: () => void;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ lyrics, currentTime, seek, isExportMode, selectedLyrics, onSelectLyric, onLongPress }) => {
    const parsedLyrics = useMemo(() => parseLRC(lyrics), [lyrics]);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLParagraphElement>(null);
    const longPressTimer = useRef<number | null>(null);

    const handleTouchStart = useCallback(() => {
        if (isExportMode) return;
        longPressTimer.current = window.setTimeout(() => {
            onLongPress();
        }, 500); // 500ms for long press
    }, [isExportMode, onLongPress]);

    const clearLongPressTimer = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const currentLineIndex = useMemo(() => {
        if (parsedLyrics.length === 0 || isExportMode) return -1;
        return parsedLyrics.findIndex((line, index) => {
            const nextLine = parsedLyrics[index + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });
    }, [parsedLyrics, currentTime, isExportMode]);
    
    useEffect(() => {
        if (activeLineRef.current) {
            activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentLineIndex]);

    if (!lyrics || lyrics === "No lyrics found." || lyrics === "Error fetching lyrics.") {
        return <div className="flex items-center justify-center h-full"><p className="text-center text-gray-400">{lyrics || "No lyrics available."}</p></div>;
    }
    
    if (parsedLyrics.length === 0) {
        return (
            <div className="overflow-y-auto hide-scrollbar h-full w-full text-center text-2xl md:text-3xl text-gray-400 leading-relaxed [mask-image:linear-gradient(to_bottom,transparent_0,black_15%,black_85%,transparent_100%)]">
                <p className="whitespace-pre-wrap py-[30vh] px-4 font-['Inter']">{lyrics}</p>
            </div>
        );
    }

    return (
        <div ref={lyricsContainerRef} className="text-center md:text-left overflow-y-auto hide-scrollbar h-full w-full [mask-image:linear-gradient(to_bottom,transparent_0,black_15%,black_85%,transparent_100%)]">
            <div className="py-[30vh]">
                {parsedLyrics.map((line, index) => {
                    const isActive = index === currentLineIndex;
                    const isSelected = selectedLyrics.includes(index);
                    const canSelect = selectedLyrics.length < 4 || isSelected;

                    return (
                        <p
                            ref={isActive ? activeLineRef : null}
                            key={index}
                            onClick={() => {
                                if (isExportMode) {
                                    if(canSelect) onSelectLyric(index);
                                } else if (line.time !== undefined) {
                                    seek(line.time);
                                }
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={clearLongPressTimer}
                            onTouchMove={clearLongPressTimer}
                            className={`py-1 md:py-2 xl:py-3 px-4 font-['Inter'] text-3xl md:text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-relaxed md:leading-loose tracking-tight transition-all duration-300
                            ${isExportMode
                                ? `cursor-pointer rounded-lg ${isSelected ? 'text-white bg-white/20' : !canSelect ? 'text-white/20 cursor-not-allowed' : 'text-white/50 hover:text-white hover:bg-white/10'}`
                                : `cursor-pointer ${isActive ? 'text-white' : 'text-white/30'}`
                            }`}
                        >
                            {line.text || '♪'}
                        </p>
                    );
                })}
            </div>
        </div>
    );
};


export default function Showcase() {
    const { 
        isShowcaseVisible, hideShowcase, currentSong, isPlaying, togglePlay, playNext, playPrev, 
        progress, seek, isShuffle, toggleShuffle, repeatMode, toggleRepeatMode, updateSongLyrics,
        likeSong, likedSongs
    } = useMusic();

    const containerRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ y: number; time: number } | null>(null);

    const [lyricsVisible, setLyricsVisible] = useState(false);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isExportMode, setIsExportMode] = useState(false);
    const [selectedLyrics, setSelectedLyrics] = useState<number[]>([]);
    
    const isLiked = useMemo(() => currentSong ? likedSongs.some(s => s.id === currentSong.id) : false, [likedSongs, currentSong]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleHide = useCallback(() => {
        gsap.to(backdropRef.current, { 
            opacity: 0, 
            duration: 0.4, 
            onComplete: () => {
                if (backdropRef.current) backdropRef.current.style.display = 'none';
            }
        });
        gsap.to(containerRef.current, {
            y: '100%',
            duration: 0.4,
            ease: 'power3.in',
            onComplete: () => {
                if (containerRef.current) containerRef.current.style.display = 'none';
                hideShowcase();
                setIsExportMode(false);
                setSelectedLyrics([]);
            },
        });
    }, [hideShowcase]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isShowcaseVisible) {
                if (isExportMode) {
                    setIsExportMode(false);
                    setSelectedLyrics([]);
                } else {
                    handleHide();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isShowcaseVisible, isExportMode, handleHide]);

    useEffect(() => {
        if (isShowcaseVisible && currentSong && currentSong.lyrics === undefined && !isLoadingLyrics) {
            const fetchLyrics = async () => {
                setIsLoadingLyrics(true);
                try {
                    const res = await fetch(`/api/lyrics?trackName=${encodeURIComponent(currentSong.title)}&artistName=${encodeURIComponent(currentSong.artist)}`);
                    if (res.ok) {
                        const data = await res.json();
                        await updateSongLyrics(currentSong.id, data.lyrics || "No lyrics found.");
                    } else {
                         await updateSongLyrics(currentSong.id, "No lyrics found.");
                    }
                } catch (error) {
                    console.error("Failed to fetch lyrics", error);
                    await updateSongLyrics(currentSong.id, "Error fetching lyrics.");
                } finally {
                    setIsLoadingLyrics(false);
                }
            };
            fetchLyrics();
        }
    }, [isShowcaseVisible, currentSong, isLoadingLyrics, updateSongLyrics]);

    useEffect(() => {
        if (isShowcaseVisible) {
            gsap.set(backdropRef.current, { display: 'block' });
            gsap.to(backdropRef.current, { opacity: 1, duration: 0.5 });
            gsap.fromTo(containerRef.current, 
                { y: '100%', display: 'none' }, 
                { y: '0%', duration: 0.5, ease: 'power3.out', display: 'flex' }
            );
        } else {
            setLyricsVisible(false);
        }
    }, [isShowcaseVisible]);
    
    const parsedLyrics = useMemo(() => parseLRC(currentSong?.lyrics || ''), [currentSong?.lyrics]);

    const handleEnterExportMode = useCallback(() => {
        if (parsedLyrics.length > 0) {
            setIsExportMode(true);
        }
    }, [parsedLyrics]);

    if (!isShowcaseVisible || !currentSong) return null;

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!e.currentTarget || !currentSong || progress.duration === 0) return;
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        const newTime = progress.duration * percentage;
        seek(newTime);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.touch-auto, .lyrics-container')) return;
        dragStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    };
    
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;
        const deltaY = e.touches[0].clientY - dragStartRef.current.y;
        if (deltaY > 0) {
            gsap.set(containerRef.current, { y: `${deltaY}px` });
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;
        const deltaY = e.changedTouches[0].clientY - dragStartRef.current.y;
        const deltaTime = Date.now() - dragStartRef.current.time;
        const velocity = deltaY / deltaTime;
        if (deltaY > window.innerHeight * 0.4 || velocity > 0.6) handleHide();
        else gsap.to(containerRef.current, { y: '0%', duration: 0.3, ease: 'power3.out' });
        dragStartRef.current = null;
    };

    const handleSelectLyric = (index: number) => {
        setSelectedLyrics(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else if (prev.length < 4) {
                return [...prev, index];
            }
            return prev;
        });
    };

    const generateImage = async () => {
        if (!currentSong || selectedLyrics.length === 0) return;
    
        const canvas = document.createElement('canvas');
        const scale = 2;
        const width = 1080;
    
        await document.fonts.load('bold 120px "New Title"');
        await document.fonts.load('600 72px Inter');
        await document.fonts.load('36px Inter');
        await document.fonts.load('bold 48px Inter');
    
        const ctx = canvas.getContext('2d')!;
    
        const measureTextHeight = (text: string, font: string, maxWidth: number, lineHeight: number): { height: number; lines: string[] } => {
            ctx.font = font;
            const paragraphs = text.split('\n');
            const allLines: string[] = [];
    
            for (const p of paragraphs) {
                if (p.trim().length === 0) continue;
                const words = p.split(' ');
                let line = '';
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        allLines.push(line.trim());
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                allLines.push(line.trim());
            }
            return { height: allLines.length * lineHeight, lines: allLines };
        };
        
        const drawWrappedText = (lines: string[], x: number, y: number, lineHeight: number, font: string, color: string) => {
            ctx.font = font;
            ctx.fillStyle = color;
            ctx.textBaseline = 'top';
            let currentY = y;
            for (const line of lines) {
                ctx.fillText(line, x, currentY);
                currentY += lineHeight;
            }
        };
    
        const parsedLyricsData = parseLRC(currentSong.lyrics || "");
        const linesToExport = selectedLyrics.sort((a, b) => a - b).map(i => parsedLyricsData[i]?.text || "").filter(Boolean).join('\n');
    
        // --- MEASUREMENT PASS ---
        const padding = 80;
        const thumbSize = 140;
        const headerThumbMargin = 24;
        const headerLyricsMargin = 80;
        const lyricsFooterMargin = 120;
    
        const titleFont = 'bold 120px "New Title"';
        const titleLineHeight = 120 * 1.1;
        const titleMaxWidth = width - (padding * 2) - thumbSize - headerThumbMargin;
        const { height: titleHeight, lines: titleLines } = measureTextHeight(currentSong.title, titleFont, titleMaxWidth, titleLineHeight);
        
        const artistFont = '36px Inter';
        const artistLineHeight = 36 * 1.2;
        const { height: artistHeight, lines: artistLines } = measureTextHeight(currentSong.artist, artistFont, titleMaxWidth, artistLineHeight);
    
        const headerTextHeight = titleHeight + artistHeight;
        const headerHeight = Math.max(thumbSize, headerTextHeight);
    
        const lyricsFont = '600 72px Inter';
        const lyricsLineHeight = 72 * 1.3;
        const lyricsMaxWidth = width - (padding * 2);
        const { height: lyricsHeight, lines: lyricsLines } = measureTextHeight(linesToExport, lyricsFont, lyricsMaxWidth, lyricsLineHeight);
    
        const logoHeight = 60; // Increased
        const footerHeight = logoHeight;
    
        const height = padding + headerHeight + headerLyricsMargin + lyricsHeight + lyricsFooterMargin + footerHeight + padding;
    
        // --- RENDER PASS ---
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);
    
        const getDominantColor = (img: HTMLImageElement): string => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1; tempCanvas.height = 1;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = tempCtx.getImageData(0, 0, 1, 1).data;
            return `rgb(${r}, ${g}, ${b})`;
        };
    
        const drawRoundedImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.clip();

            const imgRatio = img.naturalWidth / img.naturalHeight;
            const destRatio = w / h;
            let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

            if (imgRatio > destRatio) { // Image is wider, crop sides
                sWidth = img.naturalHeight * destRatio;
                sx = (img.naturalWidth - sWidth) / 2;
            } else { // Image is taller, crop top/bottom
                sHeight = img.naturalWidth / destRatio;
                sy = (img.naturalHeight - sHeight) / 2;
            }
            
            ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
            ctx.restore();
        };
    
        const loadImage = (src: string, crossOrigin?: "anonymous" | "use-credentials" | ""): Promise<HTMLImageElement> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                if (crossOrigin) img.crossOrigin = crossOrigin;
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
                img.src = src;
            });
        };
    
        const svgString = `<svg width="109" height="95" viewBox="0 0 109 95" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M102.72 0H93.84L87.56 27.81L77.74 0H63.85L54.04 27.81L38.19 0H15.84L0 27.81V67.17L15.84 94.98H38.2L54.04 67.17L63.85 94.98H77.74L87.55 67.17L93.83 94.98H102.71L108.99 67.17V27.81L102.72 0Z" fill="white"/></svg>`;
    
        try {
            const albumArt = await loadImage(`https://img.youtube.com/vi/${currentSong.id}/maxresdefault.jpg`, "anonymous");
    
            const dominantColor = getDominantColor(albumArt);
            const [r, g, b] = dominantColor.match(/\d+/g)!.map(Number);
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
            gradient.addColorStop(1, `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const primaryTextColor = luminance > 0.6 ? '#111827' : '#FFFFFF';
            const secondaryTextColor = luminance > 0.6 ? '#6B7280' : '#E5E7EB';
    
            // Header
            drawRoundedImage(ctx, albumArt, padding, padding, thumbSize, thumbSize, 12);
            const titleX = padding + thumbSize + headerThumbMargin;
            drawWrappedText(titleLines, titleX, padding, titleLineHeight, titleFont, primaryTextColor);
            drawWrappedText(artistLines, titleX, padding + titleHeight, artistLineHeight, artistFont, secondaryTextColor);
            
            // Lyrics
            const lyricY = padding + headerHeight + headerLyricsMargin;
            drawWrappedText(lyricsLines, padding, lyricY, lyricsLineHeight, lyricsFont, primaryTextColor);
    
            // Footer
            const logoSvg = svgString.replace('fill="white"', `fill="${primaryTextColor}"`);
            const logo = await loadImage('data:image/svg+xml;base64,' + btoa(logoSvg));
            const logoWidth = (logoHeight / 95) * 109;
            const logoY = height - padding - logoHeight;
            ctx.drawImage(logo, padding, logoY, logoWidth, logoHeight);
            
            const sonoraFont = 'bold 48px Inter';
            ctx.font = sonoraFont;
            ctx.fillStyle = primaryTextColor;
            ctx.textBaseline = 'middle';
            ctx.fillText('Sonora', padding + logoWidth + 20, logoY + logoHeight / 2);
            
            const link = document.createElement('a');
            link.download = `sonora-lyrics-${currentSong.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
    
            setIsExportMode(false);
            setSelectedLyrics([]);
        } catch (error) {
            console.error("Failed to load images for canvas export.", error);
        }
    };
    
    const progressPercentage = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
    const activeColor = 'text-white';
    const inactiveColor = 'text-gray-400';
    const hoverColor = 'hover:text-white';

    const lyricsContent = (
        <div className="w-full h-full lyrics-container">
            {isLoadingLyrics 
                ? <div className="flex items-center justify-center h-full"><p className={inactiveColor}>Loading lyrics...</p></div>
                : <LyricsDisplay 
                    lyrics={currentSong.lyrics || ''} 
                    currentTime={progress.currentTime}
                    seek={seek}
                    isExportMode={isExportMode}
                    selectedLyrics={selectedLyrics}
                    onSelectLyric={handleSelectLyric}
                    onLongPress={handleEnterExportMode}
                />
            }
        </div>
    );

    return (
        <>
            <div ref={backdropRef} className="fixed inset-0 bg-black/60 z-[70]" style={{ display: 'none', opacity: 0 }} onClick={handleHide}></div>
            <div 
                ref={containerRef} 
                className="fixed inset-0 z-[80] flex flex-col items-center touch-none bg-black"
                style={{ display: 'none', transform: 'translateY(100%)' }}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/20 rounded-full cursor-grab md:hidden"></div>
                <img src={currentSong.albumArt} alt="" className="absolute -z-10 inset-0 w-full h-full object-cover filter blur-3xl scale-125 opacity-20"/>
                
                 <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                    {isExportMode && (
                        <>
                            <button
                                onClick={() => {
                                    setIsExportMode(false);
                                    setSelectedLyrics([]);
                                }}
                                className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                            >
                                <PiX />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={generateImage}
                                disabled={selectedLyrics.length === 0}
                                className="flex items-center gap-2 bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background font-bold px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-fuchsia-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PiDownloadSimple />
                                <span>Generate ({selectedLyrics.length}/4)</span>
                            </button>
                        </>
                    )}
                </div>
                
                <div className="w-full h-10 md:h-20 flex-shrink-0"></div>
                
                <div className="flex-grow w-full flex items-center justify-center overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center w-full h-full max-w-7xl md:gap-16 lg:gap-24 px-4 md:px-12">
                        {/* Left Column (Desktop) / Main View (Mobile) */}
                        <div className="flex flex-col items-center justify-center w-full h-full md:w-5/12 py-4">
                            <div className={`w-full h-full flex flex-col items-center justify-center ${isMobile && lyricsVisible ? 'hidden' : 'flex'}`}>
                                <div className="relative group w-auto h-auto max-w-[80vw] md:max-w-full max-h-[50vh] md:max-h-none md:h-auto md:aspect-square">
                                    <div className="w-full h-full shadow-2xl overflow-hidden rounded-md">
                                        <img src={currentSong.albumArt} alt={`${currentSong.title} by ${currentSong.artist}`} className="w-full h-full object-cover" />
                                    </div>
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex flex-col justify-between p-6 text-white rounded-md">
                                        <div className="flex justify-end">
                                            {parsedLyrics.length > 0 && !isExportMode && (
                                                <button 
                                                    onClick={(e) => handleAction(e, handleEnterExportMode)}
                                                    className="bg-white/10 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/20 transition-colors"
                                                    title="Share lyrics"
                                                >
                                                    <PiShareFat className="h-6 w-6" />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-center items-center">
                                            <button 
                                                onClick={(e) => handleAction(e, () => currentSong && likeSong(currentSong))}
                                                className="text-white/80 hover:scale-110 transition-all duration-300 group/heart"
                                                aria-label={isLiked ? "Unlike song" : "Like song"}
                                            >
                                                <PiHeartFill className={`h-20 w-20 transition-colors ${isLiked ? 'text-fuchsia-500' : 'text-white/50 group-hover/heart:text-white/80'}`} />
                                            </button>
                                        </div>

                                        <div className="w-full">
                                            <div className="flex items-center gap-2 w-full mb-2">
                                                <span className="text-xs w-10 text-center">{formatTime(progress.currentTime)}</span>
                                                <div onClick={handleProgressClick} className="w-full h-1.5 cursor-pointer bg-white/20 rounded-full">
                                                    <div className="h-full relative bg-white rounded-full" style={{ width: `${progressPercentage}%` }}>
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs w-10 text-center">-{formatTime(progress.duration - progress.currentTime)}</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-5">
                                                <button onClick={(e) => handleAction(e, toggleShuffle)} className={`transition-colors ${isShuffle ? 'text-white' : 'text-white/70 hover:text-white'}`} title="Shuffle"><PiShuffle className="h-5 w-5" /></button>
                                                <button onClick={(e) => handleAction(e, playPrev)} className="text-white/70 hover:text-white transition-colors disabled:opacity-50" disabled={!currentSong}><PiSkipBackFill className="h-7 w-7" /></button>
                                                <button onClick={(e) => handleAction(e, togglePlay)} className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 bg-white text-black hover:scale-105" disabled={!currentSong}>{isPlaying ? <PiPauseFill className="h-8 w-8" /> : <PiPlayFill className="h-8 w-8" />}</button>
                                                <button onClick={(e) => handleAction(e, playNext)} className="text-white/70 hover:text-white transition-colors disabled:opacity-50" disabled={!currentSong}><PiSkipForwardFill className="h-7 w-7" /></button>
                                                <button onClick={(e) => handleAction(e, toggleRepeatMode)} className={`transition-colors ${repeatMode !== 'none' ? 'text-white' : 'text-white/70 hover:text-white'}`} title="Repeat">{repeatMode === 'one' ? <PiRepeatOnce className="h-5 w-5" /> : <PiRepeat className="h-5 w-5" />}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block w-full max-w-sm mt-8">
                                    <div className="text-center mb-4">
                                        <h2 className="font-heading text-6xl font-bold text-white">{currentSong.title}</h2>
                                        <p className="text-base mt-1 text-gray-400">{currentSong.artist}</p>
                                    </div>
                                </div>
                            </div>
                            {isMobile && lyricsVisible && lyricsContent}
                        </div>

                        {/* Right Column (Desktop Lyrics) */}
                        {!isMobile && (
                            <div className="md:w-7/12 h-full flex items-center justify-center max-h-[75vh]">
                                {lyricsContent}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-lg p-6 pt-0 flex-shrink-0 md:h-20">
                    <div className="md:hidden">
                        <div className="text-center mb-6">
                            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">{currentSong.title}</h2>
                            <p className="text-base md:text-lg mt-1 text-gray-400">{currentSong.artist}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full">
                            <span className="text-xs w-10 text-center text-gray-400">{formatTime(progress.currentTime)}</span>
                            <div onClick={handleProgressClick} className="w-full h-1.5 cursor-pointer group bg-white/20 rounded-full">
                                <div className="h-full relative bg-white rounded-full" style={{ width: `${progressPercentage}%` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white"></div>
                                </div>
                            </div>
                            <span className="text-xs w-10 text-center text-gray-400">-{formatTime(progress.duration - progress.currentTime)}</span>
                        </div>

                        <div className="flex items-center justify-center gap-5 mt-4">
                            <button onClick={toggleShuffle} className={`transition-colors ${isShuffle ? activeColor : `${inactiveColor} ${hoverColor}`}`} title="Shuffle"><PiShuffle className="h-6 w-6" /></button>
                            <button onClick={playPrev} className={`${inactiveColor} ${hoverColor} transition-colors disabled:opacity-50`} disabled={!currentSong}><PiSkipBackFill className="h-8 w-8" /></button>
                            <button onClick={togglePlay} className="w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 bg-white text-black hover:scale-105" disabled={!currentSong}>{isPlaying ? <PiPauseFill className="h-9 w-9" /> : <PiPlayFill className="h-9 w-9" />}</button>
                            <button onClick={playNext} className={`${inactiveColor} ${hoverColor} transition-colors disabled:opacity-50`} disabled={!currentSong}><PiSkipForwardFill className="h-8 w-8" /></button>
                            <button onClick={toggleRepeatMode} className={`transition-colors ${repeatMode !== 'none' ? activeColor : `${inactiveColor} ${hoverColor}`}`} title="Repeat">{repeatMode === 'one' ? <PiRepeatOnce className="h-6 w-6" /> : <PiRepeat className="h-6 w-6" />}</button>
                        </div>
                    </div>
                    
                    <div className="w-full flex justify-between items-center mt-4">
                        <button onClick={() => setLyricsVisible(v => !v)} className={`p-2 transition-colors ${inactiveColor} ${hoverColor} md:hidden`} title="Toggle lyrics"><PiMicrophone className={`h-6 w-6 transition-colors ${lyricsVisible ? activeColor : ''}`} /></button>
                        <div className="hidden md:flex items-center gap-4">
                            {/* Desktop only bottom controls can go here if needed */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}