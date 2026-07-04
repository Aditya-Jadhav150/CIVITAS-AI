const getApiUrl = () => {
    // During dev, import.meta.env.VITE_API_URL can be set, otherwise fallback
    return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
};

const getWsUrl = () => {
    return import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws';
};

export const API_BASE_URL = getApiUrl();
export const WS_BASE_URL = getWsUrl();
