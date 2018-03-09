
import {StompFrameDeserializer} from '../src/stomp/parser/stomp-frame-deserializer';
import {StompFrame} from '../src/stomp/frames';
import {StompFrameSerializer} from '../src/stomp/parser';
import {StompCommand} from '../src/stomp';
import {TextEncoding} from '../src/stomp/parser/text-encoding';

/**
 * Tests StompFrameDeserializer
 */
describe('StompFrameDeserializer Test', () => {

    beforeAll(() => {
        // Config for all
    });

    it('StompFrameDeserializer instantiable', () => {
        const deserializer = new StompFrameDeserializer();
        expect(deserializer).toBeInstanceOf(StompFrameDeserializer)
    });

    it('StompFrameDeserializer deserialize', () => {
        const deserializer = new StompFrameDeserializer();
        const serializer = new StompFrameSerializer();

        // Given a serialized stomp frame
        const headers = new Map<string, string>();
        const givenFrame = StompFrame.build(
            StompCommand.MESSAGE,
            headers,
            'hello world!');

        const message = serializer.serialize(givenFrame);

        // Deserialize it

        const frames = deserializer.deserializeMessage(message);
        expect(frames.frames.length).toBe(1);
        const frame = frames.frames[0];

        expect(frame).toBeInstanceOf(StompFrame);
        expect(frame.command).toBe(StompCommand.MESSAGE);
        expect(frame.body).toBe('hello world!');
    });

    it('StompFrameDeserializer deserialize special chars', () => {
        const deserializer = new StompFrameDeserializer();
        const serializer = new StompFrameSerializer();

        // Given a serialized stomp frame
        const headers = new Map<string, string>();
        const givenFrame = StompFrame.build(
            StompCommand.MESSAGE,
            headers,
            '{ "mykey": "my umläüts test!" }'
        );

        const message = serializer.serialize(givenFrame);

        const encoding = new TextEncoding();
        const binaryMessage = encoding.encodeUtf8(message);

        // Deserialize it

        const frames = deserializer.deserializeMessage(binaryMessage);
        expect(frames.frames.length).toBe(1);
        const frame = frames.frames[0];

        expect(frame).toBeInstanceOf(StompFrame);
        expect(frame.command).toBe(StompCommand.MESSAGE);
        expect(frame.body).toBe('{ "mykey": "my umläüts test!" }');

        const data = frame.bodyJson;
        expect(data.mykey).toBe('my umläüts test!');
    });


});
