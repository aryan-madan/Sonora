import React, { useState } from 'react';
import { useAuth } from '../contexts/Auth';
import { PiGoogleLogo, PiSpinnerGap } from 'react-icons/pi';

export default function Login() {
    const { signInWithGoogle } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Sign in failed", error);
            setIsSigningIn(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-dark-background font-sans p-4">
            <div className="text-center">
                <img src="/icon.svg" alt="Sonora" className="h-20 w-auto mx-auto mb-4" />
                <h1 className="font-sans tracking-[-0.05em] font-semibold text-7xl md:text-8xl text-text-primary dark:text-dark-text-primary hidden sm:block">Sonora</h1>
                <p className="mt-2 text-lg md:text-xl text-text-secondary dark:text-dark-text-secondary">
                    Your music, beautifully organized.
                </p>
                <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="mt-12 inline-flex items-center justify-center gap-3 px-8 py-4 bg-text-primary dark:bg-dark-primary text-background dark:text-dark-background text-lg font-bold hover:bg-gray-700 dark:hover:bg-fuchsia-400 transition-colors rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSigningIn ? (
                        <>
                            <PiSpinnerGap className="animate-spin h-6 w-6" />
                            <span>Signing in...</span>
                        </>
                    ) : (
                        <>
                            <PiGoogleLogo className="h-6 w-6" />
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
