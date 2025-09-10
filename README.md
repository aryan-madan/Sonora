
<div align="center">
  <img src="public/icon.svg" alt="Sonora Logo" width="100"/>
  <h1>Sonora Music</h1>
  <p>
    <strong>A beautifully crafted, minimalist music application concept designed for a seamless and aesthetically pleasing listening experience.</strong>
  </p>
  <p>Discover, organize, and enjoy music with a focus on a clean user interface and smooth animations.</p>
</div>

---

### ✨ Core Features

*   **Sleek, Minimalist UI**: A clean and intuitive interface that puts your music front and center.
*   **Light & Dark Modes**: Automatically adapts to your system preference or toggle manually.
*   **YouTube-Powered Streaming**: Search and stream any song directly from YouTube via a privacy-respecting proxy.
*   **Personal Cloud Library**: Your music library, playlists, and liked songs are securely saved to your account using Firebase.
*   **Playlist Management**: Create custom playlists to organize your favorite tracks.
*   **Real-time Lyrics**: View synchronized or plain text lyrics for the currently playing song.
*   **Command Palette**: Navigate and search your library or YouTube with a powerful command menu (`⌘+K` / `Ctrl+K`).
*   **Interactive Queue**: Easily manage what's playing next with drag-and-drop functionality.
*   **Immersive Player**: A full-screen "Showcase" mode with lyrics and beautiful artwork blurring.
*   **Google Authentication**: Secure and easy sign-in with your Google account.
*   **Fully Responsive**: Enjoy a seamless experience on both desktop and mobile devices.

### 🛠️ Tech Stack

*   **Framework**: [React](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: [GSAP (GreenSock Animation Platform)](https://gsap.com/)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
*   **Serverless Functions**: Vercel Edge Functions (for API wrappers to services like Invidious for search and Lrclib for lyrics).
*   **State Management**: React Context API
*   **Icons**: [React Icons](https://react-icons.github.io/react-icons/) (Phosphor)

---

### 🚀 Getting Started

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

#### 4. Environment Variables

This project requires a Firebase project for the backend. The application is configured to read from a local file, but you will have to provide your own keys.

#### 5. Firebase Project Setup

You need a Firebase project to handle authentication and the database.

1.  **Create a Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Create a Web App**: Inside your project, create a new Web Application. Firebase will provide you with the configuration details (like `apiKey`, `authDomain`, etc.).
3.  **Enable Authentication**: In the "Authentication" section, go to the "Sign-in method" tab and enable the **Google** provider.
4.  **Create Firestore Database**: In the "Firestore Database" section, create a new database. Start in **production mode**.
5.  **Set Firestore Security Rules**: Go to the "Rules" tab in Firestore and paste the contents of `rules.txt`. This ensures users can only access their own data.

#### 6. Run the Development Server

You can start the development server. The application will prompt you for any required API keys.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application should now be running at `http://localhost:5173`.

---

### 🔎 YouTube Search via Invidious

To provide YouTube search functionality without requiring users to generate and manage a YouTube Data API key, Sonora uses a serverless function that queries a list of public [Invidious instances](https://invidious.io/). This approach offers several advantages:

*   **No API Key Needed**: Simplifies setup and avoids quota limitations.
*   **Enhanced Privacy**: Invidious acts as a proxy, protecting user privacy.
*   **Resilience**: The app cycles through multiple instances, ensuring the search feature remains available even if one instance goes down.

---

### 📂 Project Structure

```
/
├── api/                # Serverless Functions (API wrappers)
│   ├── lyrics.ts       # Fetches lyrics from lrclib.net
│   └── search.ts       # Searches YouTube via Invidious
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

### 🚀 Deployment

The recommended way to deploy Sonora is with [Vercel](https://vercel.com/), which provides seamless integration with serverless functions.

1.  Push your code to a Git repository (GitHub, GitLab, etc.).
2.  Sign up for a Vercel account and connect it to your Git provider.
3.  Import your project repository.
4.  Configure the Environment Variables in the Vercel project settings. You will need to add all the Firebase keys here.
5.  Click "Deploy". Vercel will automatically build and deploy your application and the serverless functions.

---

### 🙏 Acknowledgements

*   **[YouTube](https://www.youtube.com/)** & **[Invidious](https://invidious.io/)** for the music streaming and search.
*   **[lrclib.net](https://lrclib.net/)** for providing song lyrics.
*   **[GSAP](https://gsap.com/)** for the incredible animation library.
*   **[Fontshare](https://www.fontshare.com/)** for the beautiful "New Title" font.
