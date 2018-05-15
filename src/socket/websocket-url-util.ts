
export class WebsocketUrlUtil {

    public static fromSockJSToAbsolute(sockJsUrl: string): string {
        sockJsUrl = sockJsUrl.replace('https://', 'wss://');
        sockJsUrl = sockJsUrl.replace('http://', 'ws://');
        const baseWsUrl = sockJsUrl + '/websocket';
        return WebsocketUrlUtil.fromWsUrlToAbsolute(baseWsUrl);
    }

    public static fromWsUrlToAbsolute(wsUrl: string): string {
        // A native websocket url must start with ws:// or wss://

        if (wsUrl.startsWith('http://') || wsUrl.startsWith('https://')) {
            throw new Error('A websocket url must have the ws: or wss: protocol!');
        }

        // Ensure the url is absolute
        if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
            // The url is not absolute
            // var full = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
            const protocol = location.protocol === 'http:' ? 'ws:' : 'wss:';
            const absolutePath = wsUrl.startsWith('/') ? wsUrl : location.pathname + '/' + wsUrl;
            wsUrl = protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + absolutePath;
        }

        return wsUrl;
    }

}
