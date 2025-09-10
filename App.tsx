

import React from 'react';
import { MusicProvider, useMusic } from './contexts/Music';
import { AuthProvider } from './contexts/Auth';
import Layout from './components/Layout';
import Command from './components/Command';
import ToastContainer from './components/Toast';
import YouTube from './components/YouTube';
import Showcase from './components/Showcase';

const AppInternal = () => {
    const { 
        isCommandMenuVisible, 
        hideCommandMenu,
    } = useMusic();

    return (
        <>
            <Layout />
            <Command isVisible={isCommandMenuVisible} onClose={hideCommandMenu} />
            <ToastContainer />
            <YouTube />
            <Showcase />
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <MusicProvider>
                <AppInternal />
            </MusicProvider>
        </AuthProvider>
    );
}