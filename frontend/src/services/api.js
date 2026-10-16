import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
    ? '/api/'
    : `${window.location.protocol}//${window.location.hostname}:8000/api/`);
export const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;

export function getMediaUrl(urlImagem) {
    if (!urlImagem) return '';

    const urlResolvida = new URL(urlImagem, apiOrigin);
    const backendLocal = ['localhost', '127.0.0.1'].includes(urlResolvida.hostname);

    if (backendLocal) {
        const origemProxy = import.meta.env.DEV ? window.location.origin : apiOrigin;
        return new URL(`${urlResolvida.pathname}${urlResolvida.search}`, origemProxy).href;
    }

    return urlResolvida.href;
}

const api = axios.create({
    baseURL: apiBaseUrl,
    // headers: {
    //     'Content-Type': 'application/json',
    // },
});

export default api;