
import {MessageSubscription} from '../src/stomp';
import {StompFrameMessage} from '../src/stomp/frames/stomp-frame-message';
import {Subject} from 'rxjs';

describe('MessageSubscription Test', () => {

    beforeAll(() => {
        // Config for all
    });

    it('MessageSubscription builder', () => {

        const mockObservable = new Subject<StompFrameMessage>();
        const sub = new MessageSubscription('mock-id', 'mock-dest', mockObservable);

        expect(sub).toBeInstanceOf(MessageSubscription);
        expect(sub.destination).toBe('mock-dest');
        expect(sub.subscriptionId).toBe('mock-id');
    });


});
