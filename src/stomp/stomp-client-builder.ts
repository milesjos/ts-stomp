
import {HeartBeatConfig, StompClient} from './stomp-client';
import {LoggerFactory} from '@elderbyte/ts-logger';
import {WebsocketUrlUtil} from '../socket/websocket-url-util';

/**
 * Provides the ability to build StompClients
 */
export class StompClientBuilder {


    /***************************************************************************
     *                                                                         *
     * Fields                                                                  *
     *                                                                         *
     **************************************************************************/

    private logger = LoggerFactory.getLogger('StompClientBuilder');

    private readonly _url: string;
    private _enableSockJS = false;
    private _protocols: string[] = ['v11.stomp', 'v12.stomp'];
    private _heartBeatConfig: HeartBeatConfig = {
        outgoing: 10000,
        incoming: 10000
    };


    /***************************************************************************
     *                                                                         *
     * Static                                                                  *
     *                                                                         *
     **************************************************************************/

    /**
     * Creates a new StompClientBuilder, using the given endpoint url.
     *
     * @param endpointUrl
     */
    public static start(endpointUrl: string): StompClientBuilder {
        return new StompClientBuilder(endpointUrl);
    }

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    private constructor(url: string) {
        this._url = url;
    }


    /***************************************************************************
     *                                                                         *
     * API                                                                     *
     *                                                                         *
     **************************************************************************/

    /**
     * Enable/Disable SockJS for the STOMP transport
     *
     *  @param enabled Enable or disable sock-js
     */
    public enableSockJS(enabled = true): this {
        this._enableSockJS = enabled;
        return this;
    }

    /**
     * Define the supported protocols
     */
    public protocols(protocols: string[]): this {
        this._protocols = protocols;
        return this;
    }

    /**
     * Set the heart-beat config
     */
    public heartBeat(config: HeartBeatConfig): this {
        this._heartBeatConfig = config;
        return this;
    }


    /**
     * Materializes the configuration into a stomp client.
     */
    public build(): StompClient {
        const socket = this.getSocket();
        return this.buildClientWith(socket);
    }


    /***************************************************************************
     *                                                                         *
     * Private methods                                                         *
     *                                                                         *
     **************************************************************************/

    private getSocket(): WebSocket {
        if (this._enableSockJS) {
            return this.buildSockJS(this._url);
        } else {
            return this.buildNativeWebSocket(this._url);
        }
    }

    /**
     * Builds a Stomp client using SockJs as transport
     *
     */
    private buildSockJS(sockJsUrl: string): WebSocket {
        // const sockJs = new SockJS(sockJsUrl);
        // return sockJs as WebSocket;

        const nativeUrl = WebsocketUrlUtil.fromSockJSToAbsolute(sockJsUrl);

        this.logger.debug('Transformed SockJS url to native websocket: ' + nativeUrl);

        // Fallback to the raw websocket url
        return this.buildNativeWebSocket(nativeUrl);
    }

    /**
     * Builds a Stomp client using default browser websocket as transport
     * @param url
     */
    private buildNativeWebSocket(url: string): WebSocket {
        const wsUrl = WebsocketUrlUtil.fromWsUrlToAbsolute(url);
        return new WebSocket(wsUrl, this._protocols);
    }

    /**
     * Builds a Stomp client using the given websocket implementation
     * @param ws The websocket connection
     */
    private buildClientWith(ws: WebSocket): StompClient {
        return new StompClient(ws, this._heartBeatConfig);
    }
}
