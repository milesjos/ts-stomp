// Define constants for bytes used throughout the code


import {FrameBuffer} from './frame-buffer';
import {StompCommand} from '../stomp-command';
import {StompFrame} from '../frames/stomp-frame';
import {LoggerFactory} from '@elderbyte/ts-logger';
import {TextEncoding} from './text-encoding';

export const BYTE = {
    // LINEFEED byte (octet 10)
    LF: '\x0A',
    // NULL byte (octet 0)
    NULL: '\x00'
};

/**
 * Provides the ability to parse a message into frame(s)
 */
export class StompFrameDeserializer {

    /***************************************************************************
     *                                                                         *
     * Fields                                                                  *
     *                                                                         *
     **************************************************************************/

    private logger = LoggerFactory.getLogger('StompFrameDeserializer');
    private readonly decoder = new TextEncoding();

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

    public deserializeMessage(message: any): FrameBuffer {
        let data: string;

        if (message instanceof ArrayBuffer) {
            const arr = new Uint8Array(message);
            this.logger.debug('Got message, length: ', arr.length);
            data = this.decoder.decodeUtf8(arr);
        } else if (message instanceof Uint8Array) {
            this.logger.debug('Got message, length: ', message.length);
            data = this.decoder.decodeUtf8(message);
        } else if (typeof message === 'string') {
            // take data directly from WebSocket 'data' field
            data = message as string;
        } else {
            throw new Error('Not supported message type: ' + typeof message + '! Message: ' + message);
        }

        // If heart-beats are requested and no real frame is sent, EOL is expected
        if (data === BYTE.LF) {
            this.logger.debug('Got heart-beat!');
            return FrameBuffer.Empty;
        }

        return this.deserializeFrames(data);
    }

    /***************************************************************************
     *                                                                         *
     * Private methods                                                         *
     *                                                                         *
     **************************************************************************/


    private deserializeFrames(data: string): FrameBuffer {
        const frames = data.split(`${BYTE.NULL}${BYTE.LF}*`);

        const buffer = new FrameBuffer();

        for (let i = 0; i < frames.length - 1; i++) {
            buffer.frames.push(this.deserializeFrame(frames[i]));
        }

        const lastFrame = frames[frames.length - 1];
        if (lastFrame === BYTE.LF || lastFrame.search(`${BYTE.NULL}${BYTE.LF}*$`) !== -1) {
            buffer.frames.push(this.deserializeFrame(frames[frames.length - 1]));
        } else {
            buffer.partial = lastFrame;
        }
        return buffer;
    }

    private deserializeFrame(data: string): StompFrame {

        try {
            // search for 2 consecutive LF bytes to split command and headers from the body
            // let divider = data.search(`///${BYTE.LF}${BYTE.LF}///`);
            const divider = data.search('\n\r?\n\r?');
            const headerLines = data.substring(0, divider).split(BYTE.LF);

            // console.log('console', divider);
            // console.log("data chars", data.split(''));

            const commandStr = headerLines.shift();
            const headers = new Map<string, string>();


            for (const line of headerLines.reverse()) {
                const idx = line.indexOf(':');
                headers.set(this.trim(line.substring(0, idx)), this.trim(line.substring(idx + 1)));
            }

            // skip the 2 LF bytes that divides the headers from the body
            const start = divider + 2;

            const clenValue = headers.get('content-length');
            const clen = clenValue ? parseInt(clenValue, 10) : -1;

            const body = this.extractBodyAsString(data, start, clen);

            if (commandStr) {
                const command = this.parseCommand(commandStr);
                return new StompFrame(command, body, headers);
            } else {
                throw new Error('ArgumentNullException: commandStr was \'null\' which is not a valid command string!');
            }
        } catch (err) {
            // Failed to deserialize frame
            this.logger.warn('STOMP: Failed to parse frame:', data);
            throw err;
        }
    }

    private extractBodyAsString(data: string, start: number, len: number): string {
        let body = '';
        let chr: string;
        for (let i = start; i < data.length; i++) {
            chr = data.charAt(i);
            if (chr === BYTE.NULL) {
                break;
            }
            body += chr;
        }
        return body;
    }

    private parseCommand(commandStr: string): StompCommand {
        const command = StompCommand[commandStr as keyof typeof StompCommand];
        if (!command) {
            throw new Error(`Could not parse command '${commandStr}' into a STOMP command!`);
        }
        return command;
    }

    private trim(value: string): string {
        return value.replace(/^\s+|\s+$/g, '');
    }
}


