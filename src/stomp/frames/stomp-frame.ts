
import {StompCommand} from '../stomp-command';


export class StompFrame {

    /***************************************************************************
     *                                                                         *
     * Fields                                                                  *
     *                                                                         *
     **************************************************************************/

    private _command: StompCommand;
    private _body: string | null = null;
    private _headers: Map<string, string>;

    /***************************************************************************
     *                                                                         *
     * Static builder                                                          *
     *                                                                         *
     **************************************************************************/


    public static build(command: StompCommand, headers: Map<string, string>, body?: string): StompFrame {
        return new StompFrame(command, body ? body : null, headers);
    }

    /***************************************************************************
     *                                                                         *
     * Constructor                                                             *
     *                                                                         *
     **************************************************************************/

    constructor(
        command: StompCommand,
        body: string | null,
        headers?: Map<string, string>) {

        if (!command) { throw new Error('ArgumentNullException: "command"'); }

        this._command = command;
        this._body = body;

        if (headers) {
            this._headers = new Map(headers);
        } else {
            this._headers = new Map<string, string>();
        }
    }

    /***************************************************************************
     *                                                                         *
     * Public API                                                              *
     *                                                                         *
     **************************************************************************/

    /**
     * Gets the header value with the given key if available.
     * Otherwise, returns null.
     *
     * @param key
     */
    public getHeader(key: string): string | null {
        const value = this._headers.get(key);
        return value ? value : null;
    }

    /**
     *  Gets the header value with the given key if available.
     *  Otherwise, throws an exception.
     *
     * @param key
     */
    public getRequiredHeader(key: string): string {
        const header = this.getHeader(key);
        if (header) {
            return header;
        }
        throw new Error('The required header ' + key + ' was not present in the frame!');
    }

    public setHeader(key: string, value: string): void {
        this._headers.set(key, value);
    }

    public foreachHeader(callbackfn: (value: string, key: string) => void): void {
        this._headers.forEach(callbackfn);
    }

    /***************************************************************************
     *                                                                         *
     * Properties                                                              *
     *                                                                         *
     **************************************************************************/

    public get command(): StompCommand {
        return this._command;
    }

    public get body(): string | null {
        return this._body;
    }

    public get bodyJson(): any {
        if (this._body) {
            return JSON.parse(this._body);
        }
        return null;
    }

    public get headers(): Map<string, string> { return this._headers; }
}




