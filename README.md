<div align="center">
  <img src="public/icon.svg" alt="Sonora Logo" width="100"/>
  <h1>Sonora Music</h1>
  <p>
    <strong>A beautifully crafted, minimalist music application concept designed for a seamless and aesthetically pleasing listening experience.</strong>
  </p>
  <p>Discover, organize, and enjoy music with a focus on a clean user interface and smooth animations.</p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB"/>
    <img alt="TypeScript" src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white"/>
    <img alt="TailwindCSS" src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
    <img alt="Firebase" src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase"/>
    <img alt="Vercel" src="https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white"/>
  </p>
</div>

---

<!-- Optional: Add a screenshot or GIF of the application here -->
<!-- <p align="center">
  <img src="path/to/your/screenshot.png" alt="Sonora Application Screenshot" width="800"/>
</p> -->

## ✨ Core Features

*   **Sleek, Minimalist UI**: A clean and intuitive interface that puts your music front and center.
*   **Light & Dark Modes**: Automatically adapts to your system preference or toggle manually.
*   **Direct YouTube Playback**: Search and play any song directly from YouTube using the Iframe Player API.
*   **Personal Cloud Library**: Your music library, playlists, and liked songs are securely saved to your account using Firebase Authentication and Firestore.
*   **Playlist Management**: Create custom playlists to organize your favorite tracks.
*   **Real-time Lyrics**: View synchronized or plain text lyrics for the currently playing song, fetched from `lrclib.net`.
*   **Command Palette**: A powerful command menu (`⌘+K` / `Ctrl+K`) to quickly search your library or add new songs from YouTube.
*   **Interactive Queue**: Easily manage what's playing next with drag-and-drop reordering.
*   **Immersive Player**: A full-screen "Showcase" mode with lyrics and beautiful artwork blurring.
*   **Lyrics Card Export**: Select your favorite lines from a song and generate a beautiful, shareable image card.
*   **Google Authentication**: Secure and easy sign-in with your Google account.
*   **Fully Responsive**: Enjoy a seamless experience on both desktop and mobile devices.

## 🛠️ Tech Stack

*   **Framework**: [React](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: [GSAP (GreenSock Animation Platform)](https://gsap.com/)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **Serverless Functions**: Vercel Functions for API endpoints (YouTube search, lyrics fetching).
*   **YouTube Integration**: `play-dl` (for search) & YouTube Iframe Player API (for playback).
*   **State Management**: React Context API
*   **Icons**: [React Icons](https://react-icons.github.io/react-icons/) (Phosphor)

---

## 🚀 Getting Started

Follow these instructions to set up and run the project locally on your machine.

#### 1. Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/) package manager

#### 2. Clone the Repository

```bash
git clone https://github.com/your-username/sonora.git
cd sonora
```

#### 3. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### 4. Firebase Project Setup

You need a Firebase project to handle authentication and the database.

1.  **Create a Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Create a Web App**: Inside your project, create a new Web Application. Firebase will provide you with a `firebaseConfig` object.
3.  **Update Firebase Config**: Copy the keys from the `firebaseConfig` object provided by Firebase and paste them into the `lib/firebase.ts` file, replacing the placeholder values.

    ```ts
    // In lib/firebase.ts
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID",
      measurementId: "YOUR_MEASUREMENT_ID" // Optional
    };
    ```

4.  **Enable Authentication**: In the Firebase Console, go to **Authentication** -> **Sign-in method** tab and enable the **Google** provider.
5.  **Create Firestore Database**: Go to the **Firestore Database** section and create a new database. Start in **production mode**.
6.  **Set Firestore Security Rules**: In Firestore, go to the **Rules** tab and paste the contents of `rules.txt` from this repository. This ensures users can only access their own data.

#### 5. Run the Development Server

You can start the development server.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application should now be running locally, typically at `http://localhost:5173`.

---

### 📂 Project Structure

```
/
├── api/                # Serverless Functions (API wrappers)
│   ├── lyrics.ts       # Fetches lyrics from lrclib.net
│   └── search.ts       # Searches YouTube
├── components/         # Reusable React components
├── contexts/           # Global state management (Auth, Music)
├── lib/                # Helper libraries
│   ├── db.ts           # Firestore database interaction functions
│   └── firebase.ts     # Firebase configuration and initialization
├── services/           # External API service clients
├── types/              # TypeScript type definitions
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

---

### ☁️ Deployment

The recommended way to deploy Sonora is with [Vercel](https://vercel.com/), which provides seamless integration with serverless functions.

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Sign up for a Vercel account and connect it to your Git provider.
3.  Import your project repository into Vercel.
4.  **Important**: Vercel builds the project from scratch. You should **not** commit your Firebase API keys directly. Instead, configure them as **Environment Variables** in the Vercel project settings. You will need to modify `lib/firebase.ts` to read from `process.env`.
5.  Click "Deploy". Vercel will automatically build and deploy your application and the serverless functions.

---

### 🙏 Acknowledgements

*   **[YouTube](https://www.youtube.com/)** for the music streaming and search capabilities.
*   **[lrclib.net](https://lrclib.net/)** for providing an excellent API for song lyrics.
*   **[GSAP](https://gsap.com/)** for the incredible animation library that brings the UI to life.
*   **[Fontshare](https://www.fontshare.com/)** for the beautiful "New Title" font.
