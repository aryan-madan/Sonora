
import React, { useEffect, useRef } from 'react';
import { useMusic } from '../contexts/Music';
import { MusicContextType } from '../contexts/Music';

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

interface MusicContextWithPlayer extends MusicContextType {
    setPlayer: (player: any) => void;
    setPlayerReady: (isReady: boolean) => void;
    onPlayerStateChange: (event: any) => void;
}

const YouTube: React.FC = () => {
    const { setPlayer, setPlayerReady, onPlayerStateChange } = useMusic() as MusicContextWithPlayer;
    const playerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadYouTubeAPI = () => {
            if (window.YT && window.YT.Player) {
                 window.onYouTubeIframeAPIReady();
            } else {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                if (firstScriptTag && firstScriptTag.parentNode) {
                   firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                }
            }
        };

        window.onYouTubeIframeAPIReady = () => {
            if (!playerRef.current) return;
            const player = new window.YT.Player(playerRef.current, {
                height: '0',
                width: '0',
                playerVars: {
                    'playsinline': 1,
                    'controls': 0, 
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange,
                    'onError': (event: any) => console.error('YouTube Player Error:', event.data),
                }
            });
        };

        const onPlayerReady = (event: any) => {
            setPlayer(event.target);
            setPlayerReady(true);
        };

        loadYouTubeAPI();

    }, [setPlayer, setPlayerReady, onPlayerStateChange]);

    return (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
            <div ref={playerRef}></div>
        </div>
    );
};

export default YouTube;