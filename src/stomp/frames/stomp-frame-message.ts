
import {StompFrame} from './stomp-frame';

export class StompFrameMessage extends StompFrame {

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor(frame: StompFrame) {
        super(frame.command, frame.body, frame.headers);
    }

    /***************************************************************************
     *                                                                         *
     * Properties                                                              *
     *                                                                         *
     **************************************************************************/

    public get messageId(): string {
        return this.getRequiredHeader('message-id');
    }

    public get destination(): string {
        return this.getRequiredHeader('destination');
    }

    public get subscriptionId(): string {
        return this.getRequiredHeader('subscription');
    }
}
