/**
 * This codes based on https://github.com/aszechlicki/stomp-ts/tree/develop
 */

import {BYTE, StompFrameDeserializer} from './parser/stomp-frame-deserializer';
import {StompFrameSerializer} from './parser/stomp-frame-serializer';
import {StompFrame} from './frames/stomp-frame';
import {StompFrameMessage} from './frames/stomp-frame-message';
import {StompFrameError} from './frames/stomp-frame-error';
import {MessageSubscription} from './message-subscription';
import {StompCommand} from './stomp-command';
import {StompConfig} from './stomp-config';
import {LoggerFactory} from '@elderbyte/ts-logger';
import {Observable, Subject} from 'rxjs';


export class StompClient {

    public static readonly V1_0 = '1.0';

    /***************************************************************************
     *                                                                         *
     * Fields                                                                  *
     *                                                                         *
     **************************************************************************/

    private logger = LoggerFactory.getLogger('StompClient');

    private readonly frameSerializer: StompFrameSerializer;
    private readonly frameDeserializer: StompFrameDeserializer;

    private counter = 0;
    private connected = false;
    private heartbeat = {
        outgoing: 10000,
        incoming: 10000
    };
    private serverActivity = 0;
    private pinger: any;
    private ponger: any;

    private _connectSubject = new Subject<StompFrame>();
    private receiptSubject = new Subject<StompFrame>();
    private messageSubject = new Subject<StompFrameMessage>();
    private errorSubject = new Subject<StompFrameError>();


    /**
     * maximum *WebSocket* frame size sent by the client. If the STOMP frame
     * is bigger than this value, the STOMP frame will be sent using multiple
     * WebSocket frames (default is 16KiB)
     */
    private maxWebSocketFrameSize = 16 * 1024;
    private subscriptions = new Map<string, MessageSubscription>();


    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    /**
     * Creates a new STOMP Client using the given websocket
     */
    constructor(
        private ws: WebSocket) {

        this.ws.binaryType = 'arraybuffer';
        this.frameSerializer = new StompFrameSerializer();
        this.frameDeserializer = new StompFrameDeserializer();

        this.logger.debug('WebSocket state:', ws.readyState);
    }

    /***************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    public get receipts(): Observable<StompFrame> {
        return this.receiptSubject;
    }

    public get messages(): Observable<StompFrameMessage> {
        return this.messageSubject;
    }

    public get errors(): Observable<StompFrameError> {
        return this.errorSubject;
    }

    public get onConnect(): Observable<StompFrame> {
        return this._connectSubject;
    }


    public connect(config?: StompConfig): void {

        if (!config) { config = new StompConfig(); }

        if (!config.headers) {
            config.headers = new Map<string, string>();
        }
        if (config.login) {
            config.headers.set('login', config.login);
        }
        if (config.passcode) {
            config.headers.set('passcode', config.passcode);
        }

        this.logger.info('Opening WebSocket...');

        this.ws.onmessage = (evt: MessageEvent) => {
            const unmarshalledData = this.frameDeserializer.deserializeMessage(evt.data);
            this.serverActivity = Date.now();
            unmarshalledData.frames.forEach(
                f => this.handleFrame(f)
            );
        };

        this.ws.onclose = () => {
            const message = `WS: Lost connection to ${this.ws.url}`;
            this.logger.warn(message);
            this.cleanup();

            this.onError(new StompFrameError(message));
        };

        this.ws.onopen = () => {
            this.logger.info('WebSocket opened. Attempting to connect to STOMP now...');

            const headers = new Map<string, string>();
            headers.set('accept-version', '1.2');
            headers.set('host', 'localhost');
            // headers.set('accept-version', Stomp.supportedVersions);
            // headers.set('heart-beat', [this.heartbeat.outgoing, this.heartbeat.incoming].join(','));
            if (config && config.headers) {
              config.headers.forEach((v, k) => headers.set(k, v));
            }

            this.transmit(StompCommand.CONNECT, headers);
        };
    }

    /**
     * [DISCONNECT Frame](http://stomp.github.com/stomp-specification-1.1.html#DISCONNECT)
     * @param disconnectCallback
     * @param headers
     */
    public disconnect(disconnectCallback: () => {}, headers: Map<string, string>): void {
        this.transmit(StompCommand.DISCONNECT, headers);
        this.ws.onclose = null as any;
        this.ws.close();
        this.cleanup();
        disconnectCallback();
    }

    /**
     * [SEND Frame](http://stomp.github.com/stomp-specification-1.1.html#SEND)
     * @param destination
     * @param headers
     * @param body
     */
    public send(destination: string, body: string): void {
        const headers = new Map<string, string>();
        headers.set('destination', destination);
        this.transmit(StompCommand.SEND, headers, body);
    }

    /**
     * [SUBSCRIBE Frame](http://stomp.github.com/stomp-specification-1.1.html#SUBSCRIBE)
     * @param destination
     * @param callback
     * @param headers
     */
    public subscribe(destination: string, headers?: Map<string, string>): MessageSubscription {

        if (!headers) {
            headers = new Map<string, string>();
        }

        const headerId = headers.get('id');
        const subId = headerId ? headerId : `sub-${this.counter++}`;
        headers.set('id', subId);

        const sub = new MessageSubscription(subId, destination, this.messages);
        this.subscriptions.set(destination, sub);
        headers.set('destination', destination);
        headers.set('ack', 'auto');
        this.transmit(StompCommand.SUBSCRIBE, headers);

        return sub;
    }

    /**
     * [UNSUBSCRIBE Frame](http://stomp.github.com/stomp-specification-1.1.html#UNSUBSCRIBE)
     * @param sub
     */
    public unsubscribe(sub: MessageSubscription): void {
        const headers = new Map<string, string>();
        headers.set('id', sub.subscriptionId);
        this.subscriptions.delete(sub.subscriptionId);
        this.transmit(StompCommand.UNSUBSCRIBE, headers);
    }

    /**
     * [ABORT Frame](http://stomp.github.com/stomp-specification-1.1.html#ABORT)
     * @param transaction
     */
    public abort(transaction: string) {

        const headers = new Map<string, string>();
        headers.set('transaction', transaction);

        this.transmit(StompCommand.ABORT, headers);
    }

    /**
     * [BEGIN Frame](http://stomp.github.com/stomp-specification-1.1.html#BEGIN)
     * @param transaction
     */
    public begin(transaction?: string) {
        const txid = transaction || `tx-${this.counter++}`;

        const headers = new Map<string, string>();
        headers.set('transaction', txid);


        this.transmit(StompCommand.BEGIN, headers);
        return {
            id: txid,
            commit: () => {
                this.commit(txid);
            },
            abort: () => {
                this.abort(txid);
            }
        };
    }

    /**
     * [COMMIT Frame](http://stomp.github.com/stomp-specification-1.1.html#COMMIT)
     * @param transaction
     */
    public commit(transaction: string) {
        const headers = new Map<string, string>();
        headers.set('transaction', transaction);

        this.transmit(StompCommand.COMMIT, headers);
    }

    /**
     * [ACK Frame](http://stomp.github.com/stomp-specification-1.1.html#ACK)
     * @param id
     * @param transaction
     */
    public ack(id: string, transaction?: string) {
        const headers = new Map<string, string>();
        headers.set('id', id);
        if (transaction) {
            headers.set('transaction', transaction);
        }
        this.transmit(StompCommand.ACK, headers);
    }

    /**
     * [NACK Frame](http://stomp.github.com/stomp-specification-1.1.html#NACK)
     * @param id
     * @param transaction
     */
    public nack(id: string, transaction?: string) {
        const headers = new Map<string, string>();
        headers.set('id', id);
        if (transaction) {
            headers.set('transaction', transaction);
        }
        this.transmit(StompCommand.NACK, headers);
    }


    /***************************************************************************
     *                                                                         *
     * Private methods                                                         *
     *                                                                         *
     **************************************************************************/


    private cleanup() {
        this.connected = false;
        clearInterval(this.pinger);
        clearInterval(this.ponger);
    }

    private handleFrame(frame: StompFrame) {
        switch (frame.command) {
            // [CONNECTED Frame](http://stomp.github.com/stomp-specification-1.1.html#CONNECTED_Frame)
            case StompCommand.CONNECTED:
                this.logger.info(`WS: connected to server `, frame.getHeader('server'));
                this.connected = true;
                this.setupHeartbeat(frame);
                this._connectSubject.next(frame);
                break;
            // [MESSAGE Frame](http://stomp.github.com/stomp-specification-1.1.html#MESSAGE)
            case StompCommand.MESSAGE:
                this.messageSubject.next(new StompFrameMessage(frame));
                break;
            // [RECEIPT Frame](http://stomp.github.com/stomp-specification-1.1.html#RECEIPT)
            case StompCommand.RECEIPT:
                this.receiptSubject.next(frame);
                break;
            case StompCommand.ERROR:
                this.onError(new StompFrameError(null, frame));
                this.logger.warn('WS: error received: ', frame);
                break;
            default:
                throw new Error(`not supported STOMP command '${frame.command}'`);
        }
    }

    private onError(error: StompFrameError) {
        this.errorSubject.next(error);
    }

    private transmit(command: StompCommand, headers: Map<string, string>, body?: string): void {
        const frame = StompFrame.build(command, headers, body);
        let out = this.frameSerializer.serialize(frame);
        this.logger.debug('WS: Sending ', out);
        while (out.length > this.maxWebSocketFrameSize) {
            this.ws.send(out.substring(0, this.maxWebSocketFrameSize));
            out = out.substring(this.maxWebSocketFrameSize);
            this.logger.trace('WS: buffer remaining = ', out.length);
        }
        this.ws.send(out);
    }

    private setupHeartbeat(frame: StompFrame) {

        const version = frame.getHeader('version');

        if (!version || version === StompClient.V1_0) {
            return;
        }

        // heart-beat header received from the server looks like:
        // heart-beat: sx, sy
        const heartBeatHeader = frame.getHeader('heart-beat');

        if (heartBeatHeader) {
            const heartBeat = heartBeatHeader.split(',').map(parseInt);
            const serverIncoming = heartBeat[0];
            const serverOutgoing = heartBeat[1];

            if (this.heartbeat.outgoing > 0 && serverOutgoing > 0) {
                const ttl = Math.max(this.heartbeat.outgoing, serverOutgoing);
                this.logger.info(`WS: Check PING every ${ttl}ms`);

                this.pinger = setInterval(() => {
                    this.sendHeartBeat();
                }, ttl);
            }

            if (this.heartbeat.incoming > 0 && serverIncoming > 0) {
                const ttl = Math.max(this.heartbeat.incoming, serverIncoming);
                this.logger.info(`WS: Check PONG every ${ttl}ms`);
                this.ponger = setInterval(() => {
                    const delta = Date.now() - this.serverActivity;
                    if (delta > ttl * 2) {
                        this.logger.warn(`WS: Did not receive server activity for the last ${delta}ms`);
                        this.ws.close();
                    }
                }, ttl);
            }
        }
    }

    private sendHeartBeat(): void {
        this.ws.send(BYTE.LF);
        this.logger.debug('WS: Sending PING');
    }
}
