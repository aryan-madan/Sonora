import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useMusic } from '../contexts/Music';
import { PiSkipBackFill, PiSkipForwardFill, PiShuffle, PiRepeat, PiRepeatOnce, PiQueue, PiMicrophone, PiPlayFill, PiPauseFill, PiHeartFill, PiHeart } from 'react-icons/pi';
import { gsap } from 'gsap';

// formats time from ms to M:SS, pretty simple stuff
const formatTime = (ms: number) => {
    if (isNaN(ms) || ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

// this is for parsing the .lrc file format, it's a bit of a mess lol
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

const LyricsDisplay: React.FC<{ lyrics: string; currentTime: number }> = ({ lyrics, currentTime }) => {
    const parsedLyrics = useMemo(() => parseLRC(lyrics), [lyrics]);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    const currentLineIndex = useMemo(() => {
        if (parsedLyrics.length === 0) return -1;
        return parsedLyrics.findIndex((line, index) => {
            const nextLine = parsedLyrics[index + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });
    }, [parsedLyrics, currentTime]);
    
    useEffect(() => {
        if (lyricsContainerRef.current && currentLineIndex > -1) {
            const activeLine = lyricsContainerRef.current.children[0]?.children[currentLineIndex] as HTMLElement;
            if (activeLine) {
                const container = lyricsContainerRef.current;
                const scrollPosition = activeLine.offsetTop - (container.offsetHeight / 2) + (activeLine.offsetHeight / 2);
                
                container.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentLineIndex]);

    if (!lyrics || lyrics === "No lyrics found." || lyrics === "Error fetching lyrics.") {
        return <div className="flex items-center justify-center h-full"><p className="text-center text-gray-400">{lyrics || "No lyrics available."}</p></div>;
    }
    
    if (parsedLyrics.length === 0) {
        return (
            <div 
                className="overflow-y-auto hide-scrollbar h-full w-full text-center text-xl md:text-4xl text-gray-400 leading-relaxed [mask-image:linear-gradient(to_bottom,transparent_0,black_15%,black_85%,transparent_100%)]"
            >
                <p className="whitespace-pre-wrap py-[30vh] px-4">
                    {lyrics}
                </p>
            </div>
        );
    }

    return (
        <div 
            ref={lyricsContainerRef} 
            className="text-center text-xl md:text-4xl font-semibold overflow-y-auto hide-scrollbar h-full [mask-image:linear-gradient(to_bottom,transparent_0,black_15%,black_85%,transparent_100%)]"
        >
            <div className="py-[30vh]">
                {parsedLyrics.map((line, index) => (
                    <p
                        key={index}
                        className={`transition-all duration-500 ease-in-out py-2 md:py-3 px-4 ${
                            index === currentLineIndex 
                                ? 'text-white font-bold scale-105 opacity-100' 
                                : 'text-gray-500 scale-100 opacity-60'
                        }`}
                    >
                        {line.text || '♪'}
                    </p>
                ))}
            </div>
        </div>
    );
};


export default function Showcase() {
    const { 
        isShowcaseVisible, hideShowcase, currentSong, isPlaying, togglePlay, playNext, playPrev, 
        progress, seek, isShuffle, toggleShuffle, repeatMode, toggleRepeatMode, showQueue, updateSongLyrics,
        likedSongs, likeSong
    } = useMusic();

    const containerRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ y: number; time: number } | null>(null);

    const [lyricsVisible, setLyricsVisible] = useState(false);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    
    const handleHide = () => {
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
            },
        });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isShowcaseVisible) {
                handleHide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isShowcaseVisible]);

    useEffect(() => {
        // if we can see the showcase, and the song doesn't have lyrics yet, fetch them
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
            // reset lyrics view when we hide this thing
            setLyricsVisible(false);
        }
    }, [isShowcaseVisible]);
    
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !currentSong || progress.duration === 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percentage = clickX / width;
        const newTime = progress.duration * percentage;
        seek(newTime);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        dragStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
    };
    
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;
        const deltaY = e.touches[0].clientY - dragStartRef.current.y;
        if (deltaY > 0) { // Only allow dragging down
            gsap.set(containerRef.current, { y: `${deltaY}px` });
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragStartRef.current) return;
        
        const deltaY = e.changedTouches[0].clientY - dragStartRef.current.y;
        const deltaTime = Date.now() - dragStartRef.current.time;
        const velocity = deltaY / deltaTime;

        if (deltaY > window.innerHeight * 0.4 || velocity > 0.6) {
            handleHide();
        } else {
            gsap.to(containerRef.current, { y: '0%', duration: 0.3, ease: 'power3.out' });
        }
        dragStartRef.current = null;
    };
    
    if (!isShowcaseVisible || !currentSong) {
        return null;
    }

    const progressPercentage = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
    const isLiked = likedSongs.some(s => s.id === currentSong.id);
    const activeColor = 'text-white';
    const inactiveColor = 'text-gray-400';
    const hoverColor = 'hover:text-white';

    return (
        <>
            <div 
                ref={backdropRef} 
                className="fixed inset-0 bg-black/60 z-40" 
                style={{ display: 'none', opacity: 0 }}
                onClick={handleHide}
            ></div>
            <div 
                ref={containerRef} 
                className="fixed inset-x-0 bottom-0 h-full md:h-screen z-50 flex flex-col items-center touch-none bg-black"
                style={{ display: 'none', transform: 'translateY(100%)' }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/20 rounded-full cursor-grab md:hidden"></div>
                
                <img 
                    src={currentSong.albumArt} 
                    alt="" 
                    className="absolute -z-10 inset-0 w-full h-full object-cover filter blur-3xl scale-125 opacity-20"
                />
                
                {/* a little spacer for the iphone notch and status bar haha */}
                <div className="w-full h-20 flex-shrink-0"></div>
                
                <div className="flex-grow flex flex-col items-center justify-center w-full py-4 overflow-hidden">
                    {lyricsVisible ? (
                        <div className="w-full h-full">
                            {isLoadingLyrics 
                                ? <div className="flex items-center justify-center h-full"><p className={inactiveColor}>Loading lyrics...</p></div>
                                : <LyricsDisplay lyrics={currentSong.lyrics || ''} currentTime={progress.currentTime} />
                            }
                        </div>
                    ) : (
                        <img 
                            src={currentSong.albumArt} 
                            alt={`${currentSong.title} by ${currentSong.artist}`}
                            className="w-auto h-auto max-w-[80vw] max-h-[50vh] shadow-2xl object-contain"
                        />
                    )}
                </div>

                <div className="w-full max-w-lg p-6 pt-0 flex-shrink-0">
                    <div className="text-center mb-6">
                        <h2 className="font-heading text-5xl font-bold text-white">{currentSong.title}</h2>
                        <p className="text-lg mt-1 text-gray-400">{currentSong.artist}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-xs w-10 text-center text-gray-400">{formatTime(progress.currentTime)}</span>
                        <div ref={progressBarRef} onClick={handleProgressClick} className="w-full h-1.5 cursor-pointer group bg-white/20 rounded-full">
                            <div className="h-full relative bg-white rounded-full" style={{ width: `${progressPercentage}%` }}>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white"></div>
                            </div>
                        </div>
                        <span className="text-xs w-10 text-center text-gray-400">{formatTime(progress.duration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-5 mt-4">
                        <button onClick={toggleShuffle} className={`transition-colors ${isShuffle ? activeColor : `${inactiveColor} ${hoverColor}`}`} title="Shuffle">
                            <PiShuffle className="h-6 w-6" />
                        </button>
                        <button onClick={playPrev} className={`${inactiveColor} ${hoverColor} transition-colors disabled:opacity-50`} disabled={!currentSong}>
                            <PiSkipBackFill className="h-8 w-8" />
                        </button>
                        <button onClick={togglePlay} className="w-16 h-16 flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 bg-white text-black hover:scale-105" disabled={!currentSong}>
                            {isPlaying ? <PiPauseFill className="h-9 w-9" /> : <PiPlayFill className="h-9 w-9" />}
                        </button>
                        <button onClick={playNext} className={`${inactiveColor} ${hoverColor} transition-colors disabled:opacity-50`} disabled={!currentSong}>
                            <PiSkipForwardFill className="h-8 w-8" />
                        </button>
                        <button onClick={toggleRepeatMode} className={`transition-colors ${repeatMode !== 'none' ? activeColor : `${inactiveColor} ${hoverColor}`}`} title="Repeat">
                            {repeatMode === 'one' ? <PiRepeatOnce className="h-6 w-6" /> : <PiRepeat className="h-6 w-6" />}
                        </button>
                    </div>
                    
                    <div className="w-full flex justify-between items-center mt-4">
                        <button onClick={() => setLyricsVisible(v => !v)} className={`p-2 transition-colors ${inactiveColor} ${hoverColor}`} title="Toggle lyrics">
                            <PiMicrophone className={`h-6 w-6 transition-colors ${lyricsVisible ? activeColor : ''}`} />
                        </button>
                        <button onClick={showQueue} className={`p-2 transition-colors ${inactiveColor} ${hoverColor}`} title="Show queue">
                            <PiQueue className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}