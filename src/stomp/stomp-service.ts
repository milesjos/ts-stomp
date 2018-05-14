

import {StompClient} from './stomp-client';
import {StompClientBuilder} from './stomp-client-builder';
import {LoggerFactory} from '@elderbyte/ts-logger';
import {Observable, ReplaySubject} from 'rxjs';


export interface StompConfiguration {

    /**
     * The websocket / sockJS endpoint
     */
    endpointUrl: string;

    /**
     * Use SockJS as transport handler. (default false)
     * If not used, standard browser websocket connection is used.
     */
    withSockJs?: boolean;
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

    private readonly logger = LoggerFactory.getLogger('StompService');

    private readonly _client: StompClient;
    private readonly _onConnectedSubject = new ReplaySubject<StompClient>(1);

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor(
        private configuration: StompConfiguration) {
        this._client = this.connectStomp();
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

    private connectStomp(): StompClient {

        const client = this.buildStompClient();

        client.errors.subscribe(m => {
            this.logger.warn('STOMP: Got ERROR!', m);
        }, err => {
            this.logger.error('Error while attempting to get ERROR!', err);
        });

        client.onConnect.subscribe(con => {
            this.logger.info('STOMP: Got connection. Ready for subscriptions.', con);
            this._onConnectedSubject.next(client);
        }, err => {
            this.logger.error('Error while attempting to connect!', err);
            this._onConnectedSubject.error(err);
        });

        this.logger.info('Attempting to connect to STOMP ...');
        client.connect();

        return client;
    }


    private buildStompClient(): StompClient {
       return StompClientBuilder.start(this.configuration.endpointUrl)
            .enableSockJS(this.configuration.withSockJs)
            .build();
    }

}
