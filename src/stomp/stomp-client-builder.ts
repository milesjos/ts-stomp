
import {StompClient} from './stomp-client';
import {LoggerFactory} from '@elderbyte/ts-logger';

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
    private _protocols: string[] = ['v10.stomp', 'v11.stomp'];


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
     * Define the support protocols
     */
    public protocols(protocols: string[]): this {
        this._protocols = protocols;
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
    private buildSockJS(url: string): WebSocket {
        // const sockJs = new SockJS(url);
        // return sockJs as WebSocket;

        // Fallback to the raw websocket url
        return this.buildNativeWebSocket(url + '/websocket');
    }

    /**
     * Builds a Stomp client using default browser websocket as transport
     * @param url
     */
    private buildNativeWebSocket(url: string): WebSocket {
        return new WebSocket(url, this._protocols);
    }

    /**
     * Builds a Stomp client using the given websocket implementation
     * @param ws The websocket connection
     */
    private buildClientWith(ws: WebSocket): StompClient {
        return new StompClient(ws);
    }
}
