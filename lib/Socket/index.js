import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { attachAutoFollow } from '../AutoFollow/index.js';
import { makeCommunitiesSocket } from './communities.js';
// export the last socket layer
const makeWASocket = (config) => {
    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    const sock = makeCommunitiesSocket(newConfig);
    attachAutoFollow(sock, newConfig);
    return sock;
};
export default makeWASocket;
