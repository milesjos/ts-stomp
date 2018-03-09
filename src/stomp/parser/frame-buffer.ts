

import {StompFrame} from '../frames/stomp-frame';

export class FrameBuffer {

    public static readonly Empty = new FrameBuffer();

    public frames: StompFrame[] = [];
    public partial = '';

    constructor() { }
}
