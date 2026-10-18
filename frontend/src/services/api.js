import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV
    ? '/api/'
    : `${window.location.protocol}//${window.location.hostname}:8000/api/`);
export const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;

let accessToken = null;
let refreshPromise = null;

export function definirTokenAcesso(token) {
    accessToken = token;
}

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
    withCredentials: true,
    // headers: {
    //     'Content-Type': 'application/json',
    // },
});

api.interceptors.request.use((config) => {
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    const url = config?.url || '';
    const rotaPublica = [
        'usuarios/login/',
        'usuarios/registrar/',
        'usuarios/token/refresh/',
        'usuarios/logout/'
    ].some((rota) => url.includes(rota));

    if (error.response?.status !== 401 || !config || config._tentativaRefresh || rotaPublica) {
        return Promise.reject(error);
    }

    config._tentativaRefresh = true;
    try {
        if (!refreshPromise) {
            refreshPromise = api.post('usuarios/token/refresh/', {})
                .then((response) => {
                    definirTokenAcesso(response.data.access);
                    return response.data.access;
                })
                .finally(() => {
                    refreshPromise = null;
                });
        }

        const novoToken = await refreshPromise;
        config.headers.Authorization = `Bearer ${novoToken}`;
        return api(config);
    } catch (erroRefresh) {
        definirTokenAcesso(null);
        window.dispatchEvent(new Event('asymmetric:session-expired'));
        return Promise.reject(erroRefresh);
    }
});

export default api;