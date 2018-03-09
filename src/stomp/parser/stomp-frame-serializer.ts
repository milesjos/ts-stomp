// Define constants for bytes used throughout the code


import {StompCommand} from '../stomp-command';
import {StompFrame} from '../frames/stomp-frame';
import {BYTE} from './stomp-frame-deserializer';


/**
 * Provides the ability to serialize a stomp frame
 */
export class StompFrameSerializer {

    /***************************************************************************
     *                                                                         *
     * Static builder                                                          *
     *                                                                         *
     **************************************************************************/

    /**
     * Compute the size of a UTF-8 string by counting its number of bytes
     * (and not the number of characters composing the string)
     *
     * @returns number of bytes in the string
     */
    private static getUTF8Length(value: string | null): number {
        if (value) {
            const encoded = encodeURI(value);
            const match =  encoded.match(/%..|./g);
            return match ? match.length : 0;
        }
        return 0;
    }

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor() { }

    /***************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /**
     * Computes a textual representation of the frame.
     * Suitable to be sent to the server
     *
     * @returns A textual representation of the frame
     */
    public serialize(frame: StompFrame): string {
        const commandStr = StompCommand[frame.command];
        const lines: string[] = [commandStr];

        const skipContentLength = false;

        if (frame.body && !skipContentLength) {
            frame.setHeader('content-length', StompFrameSerializer.getUTF8Length(frame.body) + '');
        }
        frame.foreachHeader((value, key) => lines.push(`${key}:${value}`));

        const header = lines.join(BYTE.LF);

        let content = header + BYTE.LF + BYTE.LF;

        if (frame.body) {
            content += frame.body;
        }
        content += BYTE.NULL;

        return content;
    }

}
