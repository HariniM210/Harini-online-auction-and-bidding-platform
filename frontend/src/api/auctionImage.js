import api from './axios';
export default function auctionImage(url,fallback){if(typeof url!=='string')return fallback;if(/^https?:\/\//i.test(url)||url.startsWith('/auction-images/'))return url;if(/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/.test(url))return api.defaults.baseURL.replace(/\/api$/,'')+url;return fallback;}
