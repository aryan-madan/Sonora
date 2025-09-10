import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { gsap } from 'gsap';
import { useMusic } from '../contexts/Music';
import { ToastMessage } from '../types';

const Toast: React.FC<{ message: ToastMessage, onRemove: () => void }> = ({ message, onRemove }) => {
    const toastRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        gsap.fromTo(toastRef.current, { x: '100%', opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
        const timer = setTimeout(() => {
            gsap.to(toastRef.current, {
                opacity: 0,
                x: '100%',
                duration: 0.3,
                ease: 'power2.in',
                onComplete: onRemove
            });
        }, 2700);

        return () => clearTimeout(timer);
    }, [onRemove]);

    const borderColor = message.type === 'error' ? 'border-red-500' : 'border-primary';

    return (
        <div ref={toastRef} className={`p-4 shadow-lg text-text-primary font-semibold bg-surface border-l-4 ${borderColor} rounded-md`}>
            {message.message}
        </div>
    );
};

const ToastContainer = () => {
    const { toasts, removeToast } = useMusic();
    const [portalElement, setPortalElement] = React.useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalElement(document.getElementById('toast-root'));
    }, []);

    if (!toasts || toasts.length === 0 || !portalElement) {
        return null;
    }

    return ReactDOM.createPortal(
        <div className="fixed top-5 right-5 z-50 space-y-2">
            {toasts.map((toast: ToastMessage) => (
                <Toast key={toast.id} message={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>,
        portalElement
    );
};

export default ToastContainer;