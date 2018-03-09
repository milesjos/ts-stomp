

import {StompClient} from './stomp-client';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {StompClientBuilder} from './stomp-client-builder';
import {LoggerFactory} from '@elderbyte/ts-logger';


export class StompConfiguration {

    /**
     * The websocket / sockJS endpoint
     */
    public endpointUrl: string;

    /**
     * Use SockJS as transport handler. (default false)
     * If not used, standard browser websocket connection is used.
     */
    public withSockJs?: boolean;
}


/**
 * The stomp service manages a single STOMP endpoint connection.
 */
export class StompService {

    /***************************************************************************
     *                                                                         *
     * Fields                                                                  *
     *                                                                         *
     **************************************************************************/

    private logger = LoggerFactory.getLogger('StompService');

    private _client: StompClient;
    private _onConnectedSubject = new ReplaySubject<StompClient>(1);

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor(
        private configuration: StompConfiguration) {
        this.connectStomp();
    }

    /***************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /**
     * Gets the new connected stomp client.
     * This is a good point to hook up your subscriptions.
     *
     */
    public get connectedClient(): Observable<StompClient> {
        return this._onConnectedSubject;
    }

    /***************************************************************************
     *                                                                         *
     * Private methods                                                         *
     *                                                                         *
     **************************************************************************/

    private connectStomp(): void {

        this._client = this.buildStompClient();

        this._client.errors.subscribe(m => {
            this.logger.warn('STOMP: Got ERROR!', m);
        }, err => {
            this.logger.error('Error while attempting to get ERROR!', err);
        });

        this._client.onConnect.subscribe(con => {
            this.logger.info('STOMP: Got connection. Ready for subscriptions.', con);
            this._onConnectedSubject.next(this._client);
        }, err => {
            this.logger.error('Error while attempting to connect!', err);
            this._onConnectedSubject.error(err);
        });

        this.logger.info('Attempting to connect to STOMP ...');
        this._client.connect();
    }


    private buildStompClient(): StompClient {
       return StompClientBuilder.start(this.configuration.endpointUrl)
            .enableSockJS(this.configuration.withSockJs)
            .build();
    }

}
