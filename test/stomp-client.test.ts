
import {StompClient} from '../src/stomp';
import {StompClientBuilder} from '../src/stomp/stomp-client-builder';

/**
 * Tests StompFrames
 */
describe('StompClientBuilder Test', () => {

  beforeAll(() => {
    // Config for all
  });

  it('StompClientBuilder builder', () => {

    const builder = StompClientBuilder.start('idontexist');
    expect(builder).toBeInstanceOf(StompClientBuilder);
  });

    it('StompClientBuilder builder', () => {

        const client = StompClientBuilder.start('ws://idontexist.is').build();
        expect(client).toBeInstanceOf(StompClient);
    });



});
