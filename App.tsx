import React from 'react';
import { MusicProvider, useMusic } from './contexts/Music';
import { AuthProvider, useAuth } from './contexts/Auth';
import Layout from './components/Layout';
import Command from './components/Command';
import Showcase from './components/Showcase';
import Login from './components/Login';
import { PiSpinnerGap } from 'react-icons/pi';

const AppInternal = () => {
    const { 
        isCommandMenuVisible, 
        hideCommandMenu,
    } = useMusic();

    return (
        <>
            <Layout />
            <Command isVisible={isCommandMenuVisible} onClose={hideCommandMenu} />
            <Showcase />
        </>
    );
}

const AppWithAuth = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-dark-background">
                <PiSpinnerGap className="animate-spin h-12 w-12 text-text-secondary dark:text-dark-text-secondary" />
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return (
        <MusicProvider>
            <AppInternal />
        </MusicProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppWithAuth />
        </AuthProvider>
    );
}