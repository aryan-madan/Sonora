
# Sonora Music

A minimalist music application concept designed for a seamless and aesthetically pleasing listening experience.  
Discover, organize, and enjoy music with a focus on a clean user interface and smooth animations.

## 🚀 Core Features

- **Minimalist UI** with Light & Dark Modes  
- **YouTube Playback**: Play any song directly from YouTube (Iframe Player API)  
- **Personal Cloud Library**: Auth & Firestore for storing library, playlists, liked songs  
- **Playlist Management**  
- **Real-time Lyrics** (from lrclib.net)  
- **Command Palette** (`⌘+K` / `Ctrl+K`) for quick search and song adding  
- **Interactive Queue** with drag-and-drop reordering  
- **Immersive Player** with Showcase mode (artwork blur, lyrics)  
- **Lyrics Card Export** to share favorite lyrics  
- **Google Authentication**  
- Fully Responsive (desktop & mobile)

## 🛠️ Tech Stack

- React  
- TypeScript  
- Tailwind CSS  
- GSAP for animations  
- Firebase (Authentication & Firestore)  
- Vercel Functions for API endpoints (search, lyrics)  
- YouTube Iframe Player API + play-dl for search  
- React Context API (state management)

## ✅ Work Attribution

- **Frontend & UI Design** – Done by me  
- **Lyrics Display System** – Developed by me  
- **Firebase Integration (Auth & Firestore Setup)** – Assisted by AI  
- **YouTube Search API (Serverless Function)** – AI helped write the search function  
- **Lyrics Fetching API (Serverless Function)** – Collaboratively built (me + AI)

## ⚡ Getting Started

1. Install Node.js (v18+) and your preferred package manager (npm/yarn/pnpm)  
2. Clone the repo:  
    ```bash
    git clone https://github.com/your-username/sonora.git  
    cd sonora  
    ```  
3. Install dependencies:  
    ```bash
    npm install  
    ```  
4. Configure Firebase:  
    - Create a project on [Firebase Console](https://console.firebase.google.com)  
    - Enable Google Authentication & Firestore  
    - Add Firebase config to `lib/firebase.ts` (or use environment variables)  
5. Run dev server:  
    ```bash
    npm run dev  
    ```  
    App runs at `http://localhost:5173`

## ☁️ Deployment

Use Vercel for deployment:  
- Push code to GitHub/GitLab  
- Set Firebase config in Vercel environment variables  
- Vercel handles build + deployment automatically

## 🙏 Acknowledgements

- [YouTube](https://www.youtube.com) – Playback & search  
- [lrclib.net](https://lrclib.net) – Lyrics API  
- [GSAP](https://gsap.com) – Animations  
- [Fontshare](https://www.fontshare.com/) – "New Title" font
