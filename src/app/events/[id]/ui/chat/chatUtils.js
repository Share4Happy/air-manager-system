'use client';
import { useState, useEffect, useRef } from 'react';

export function getInitials(name = '') {
    if (!name) return 'AIR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarBgColor(name = '') {
    const colors = [
        'bg-blue-600',
        'bg-indigo-600',
        'bg-emerald-600',
        'bg-amber-600',
        'bg-rose-600',
        'bg-teal-600',
        'bg-violet-600',
        'bg-sky-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function formatChatTime(dateInput) {
    if (!dateInput) return '';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '';
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        if (isToday) return timeStr;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Hôm qua ${timeStr}`;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month} ${timeStr}`;
    } catch (e) {
        return '';
    }
}

// Web Audio API chime generator for zero-dependency notification sounds
export function playChatChime(isUrgent = false) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;
        if (isUrgent) {
            // Urgent double beep
            [0, 0.18].forEach(offset => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now + offset);
                osc.frequency.exponentialRampToValueAtTime(440, now + offset + 0.12);
                gain.gain.setValueAtTime(0.3, now + offset);
                gain.gain.linearRampToValueAtTime(0.01, now + offset + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + offset);
                osc.stop(now + offset + 0.12);
            });
        } else {
            // Soft friendly chime
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        // Ignore audio play errors if browser policy blocks autoplay
    }
}

/**
 * Hook to animate count increments smoothly (count-up animation)
 */
export function useAnimatedCount(target, stepDelay = 80) {
    const [displayCount, setDisplayCount] = useState(target);
    const targetRef = useRef(target);
    targetRef.current = target;

    useEffect(() => {
        if (target === 0) {
            setDisplayCount(0);
            return;
        }

        if (displayCount === target) return;

        if (target > displayCount) {
            const diff = target - displayCount;
            // Finish animation in ~300-450ms max
            const delay = Math.max(30, Math.min(stepDelay, Math.floor(400 / diff)));
            const timer = setTimeout(() => {
                setDisplayCount(prev => (prev < targetRef.current ? prev + 1 : targetRef.current));
            }, delay);
            return () => clearTimeout(timer);
        } else {
            setDisplayCount(target);
        }
    }, [target, displayCount, stepDelay]);

    return displayCount;
}
