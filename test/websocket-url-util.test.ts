
import {WebsocketUrlUtil} from '../src/socket/websocket-url-util';

/**
 * Tests StompFrames
 */
describe('WebsocketUrlUtil Test', () => {

    beforeAll(() => {
        // Config for all
    });

    it('fromWsUrlToAbsolute ws', () => {
        const url = WebsocketUrlUtil.fromWsUrlToAbsolute('ws://my.domain/ws');
        expect(url).toBe('ws://my.domain/ws');
    });

    it('fromWsUrlToAbsolute wss', () => {
        const url = WebsocketUrlUtil.fromWsUrlToAbsolute('wss://my.domain/ws');
        expect(url).toBe('wss://my.domain/ws');
    });

    it('fromWsUrlToAbsolute /ws', () => {
        const url = WebsocketUrlUtil.fromWsUrlToAbsolute('/ws');
        expect(url).toBe('wss:///ws');
    });

    it('fromWsUrlToAbsolute http', () => {
        expect(() => WebsocketUrlUtil.fromWsUrlToAbsolute('http://my.domain/ws'))
            .toThrowError('A websocket url must have the ws: or wss: protocol!');
    });



    it('fromSockJSToAbsolute /stomp', () => {
        const url = WebsocketUrlUtil.fromSockJSToAbsolute('/stomp');
        expect(url).toBe('wss:///stomp/websocket');
    });

    it('fromSockJSToAbsolute http://my.domain/sockjs', () => {
        const url = WebsocketUrlUtil.fromSockJSToAbsolute('http://my.domain/sockjs');
        expect(url).toBe('ws://my.domain/sockjs/websocket');
    });

    it('fromSockJSToAbsolute https://my.domain/sockjs', () => {
        const url = WebsocketUrlUtil.fromSockJSToAbsolute('https://my.domain/sockjs');
        expect(url).toBe('wss://my.domain/sockjs/websocket');
    });

    /* TODO Not yet supported
    it('fromSockJSToAbsolute https://my.domain:8443/sockjs', () => {
        const url = WebsocketUrlUtil.fromSockJSToAbsolute('https://my.domain/sockjs');
        expect(url).toBe('wss://my.domain:8443/sockjs/websocket');
    });*/
});
