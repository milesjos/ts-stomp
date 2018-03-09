
import {StompFrame} from '../src/stomp/frames/stomp-frame';
import {StompCommand} from '../src/stomp';

/**
 * Tests StompFrames
 */
describe('StompFrame Test', () => {

  beforeAll(() => {
    // Config for all
  });

  it('StompFrame builder', () => {

    const headers = new Map<string, string>();
    headers.set('prop1', '1234');
    const frame = StompFrame.build(StompCommand.MESSAGE, headers, 'hello world');

    expect(frame).toBeInstanceOf(StompFrame);
    expect(frame.command).toBe(StompCommand.MESSAGE);
    expect(frame.getHeader('prop1')).toBe('1234');
    expect(frame.body).toBe('hello world');
  });

    it('StompFrame getRequiredHeader true', () => {

        const headers = new Map<string, string>();
        headers.set('prop1', '1234');
        const frame = StompFrame.build(StompCommand.MESSAGE, headers, 'hello world');

        expect(frame.getRequiredHeader('prop1')).toBe('1234');

    });

    it('StompFrame getRequiredHeader fail', () => {

        const headers = new Map<string, string>();
        headers.set('prop1', '1234');
        const frame = StompFrame.build(StompCommand.MESSAGE, headers, 'hello world');

        expect(() => frame.getRequiredHeader('idontexist')).toThrowError();
    });


});
