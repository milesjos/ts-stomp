
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import {LoggerFactory} from '@elderbyte/ts-logger';

/**
 * A adapter around a websocket providing rx observable api.
 */
export class WebsocketRx {

    /***************************************************************************
     *                                                                         *
     * Fields                                                                  *
     *                                                                         *
     **************************************************************************/

    private readonly logger = LoggerFactory.getLogger('WebsocketRx');

    private readonly socket: WebSocket;
    private readonly socketChannel: Observable<MessageEvent>;

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor(url: string) {
        this.socket = this.connect(url);
        this.socketChannel = this.createSocketObserver(this.socket);

    }

    /***************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /**
     * Send the given data over this socket.
     */
    public send(data: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data);
        } else {
            throw new Error('Can not send since there is no open web-socket connection!');
        }
    }

    /**
     * Close this socket
     */
    public close() {
        if (this.socket) {
            this.socket.close();
        }
    }

    /***************************************************************************
     *                                                                         *
     * Properties                                                              *
     *                                                                         *
     **************************************************************************/

    /**
     * Get an observable stream of incoming messages
     */
    public get messages(): Observable<MessageEvent> {
        return this.socketChannel;
    }

    /***************************************************************************
     *                                                                         *
     * Private methods                                                         *
     *                                                                         *
     **************************************************************************/

    private connect(url: string): WebSocket {
        return new WebSocket(url);
    }

    private createSocketObserver(ws: WebSocket): Subject<MessageEvent> {
        return Observable.create(
            (obs: Observer<MessageEvent>) => {
                ws.onmessage = obs.next.bind(obs);
                ws.onerror = obs.error.bind(obs);
                ws.onclose = obs.complete.bind(obs);
                return ws.close.bind(ws);
            }
        );
    }
}
