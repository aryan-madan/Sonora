<p align="center">
  <img src="public/icon.svg" alt="Sonora Logo" width="100" />
</p>

# Sonora Music

A minimalist music app focused on a clean interface and smooth animations.  
Discover, organize, and enjoy music seamlessly.

## Core Features

- Minimalist UI with Light & Dark Modes  
- YouTube Playback (Iframe Player API)  
- Personal Cloud Library (Auth & Firestore)  
- Playlist Management  
- Real-time Lyrics (lrclib.net)  
- Command Palette (`⌘+K` / `Ctrl+K`) for quick search  
- Interactive Queue with drag-and-drop  
- Immersive Player (artwork blur, lyrics showcase)  
- Lyrics Card Export  
- Google Authentication  
- Fully Responsive (desktop & mobile)

## Tech Stack

- React, TypeScript, Tailwind CSS  
- GSAP for animations  
- Firebase (Auth & Firestore)  
- Vercel Functions for search & lyrics APIs  
- YouTube Iframe Player API + play-dl  
- React Context API for state management

## Work Attribution

- UI Design & Frontend – Me  
- Lyrics Display System – Me  
- Firebase Integration – Assisted by AI  
- YouTube Search API – AI helped write  
- Lyrics Fetching API – Built collaboratively

## Getting Started

1. Install Node.js (v18+) and package manager  
2. Clone the repo:  
    ```bash
    git clone https://github.com/your-username/sonora.git  
    cd sonora  
    ```  
3. Install dependencies:  
    ```bash
    npm install  
    ```  
4. Set up Firebase:  
    - Enable Google Auth & Firestore  
    - Add config to `lib/firebase.ts` or use env variables  
5. Start dev server:  
    ```bash
    npm run dev  
    ```  
    Runs at `http://localhost:5173`

## Deployment

Use Vercel:  
- Push code to GitHub/GitLab  
- Set Firebase config as environment variables  
- Vercel handles build and deploy

## Acknowledgements

- YouTube – Playback & Search  
- lrclib.net – Lyrics API  
- GSAP – Animations  
- Fontshare – "New Title" font
