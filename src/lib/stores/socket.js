// src/lib/stores/socket.js
import { writable } from 'svelte/store';
import { io } from 'socket.io-client';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

function createSocketStore() {
    const { subscribe, set } = writable(null);
    let socket = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 1000;

    function getToken() {
        if (!browser) return null;
        const token = localStorage.getItem('token');
        return token?.startsWith('Bearer ') ? token.split(' ')[1] : token;
    }

    function connect() {
        if (!browser || socket?.connected) return;

        const token = getToken();
        if (!token) {
            console.error('No valid token found');
            return;
        }

        socket = io(env.PUBLIC_WEBSOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            autoConnect: false,
            reconnection: false, // We'll handle reconnection manually
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        // Event listeners
        socket.on('connect', () => {
            console.log('Socket connected');
            reconnectAttempts = 0;
            set(socket);
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            set(null);
            attemptReconnect();
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
            handleAuthError(error);
        });

        socket.connect();
    }

    function attemptReconnect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        reconnectAttempts++;
        console.log(`Reconnecting attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
        
        setTimeout(() => {
            if (getToken()) connect();
        }, reconnectDelay * Math.min(reconnectAttempts, 3));
    }

    function handleAuthError(error) {
        if (error.message.includes('auth') || error.message.includes('token')) {
            console.error('Authentication failed, redirecting to login');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    function disconnect() {
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            socket = null;
            set(null);
        }
    }

    function reconnect(newToken) {
        if (!browser) return;
        localStorage.setItem('token', newToken);
        disconnect();
        connect();
    }

    function emit(event, data) {
        if (socket?.connected) {
            socket.emit(event, data);
            return true;
        }
        console.error('Socket not connected');
        return false;
    }

    // Initialize if in browser with valid token
    if (browser && getToken()) {
        connect();
    }

    return {
        subscribe,
        connect,
        disconnect,
        reconnect,
        emit,
        get connected() {
            return socket?.connected || false;
        }
    };
}

export const socketStore = createSocketStore();