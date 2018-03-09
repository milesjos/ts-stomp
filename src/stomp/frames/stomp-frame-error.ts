


import {StompFrame} from './stomp-frame';
import {StompCommand} from '../stomp-command';

export class StompFrameError extends StompFrame {

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor(message: string | null, frame?: StompFrame) {
        super(
            StompCommand.ERROR,
            frame ? frame.body : null,
            frame ? frame.headers : undefined);

        if (message) {
            this.setHeader('message', message);
        }
    }

    /***************************************************************************
     *                                                                         *
     * Properties                                                              *
     *                                                                         *
     **************************************************************************/

    public get errorMessage(): string | null {
        return this.getHeader('message');
    }

    public get errorDetail(): string | null {
        return this.body;
    }
}
