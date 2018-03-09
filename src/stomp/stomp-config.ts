
export class StompConfig {
    public headers?: Map<string, string>;
    public login?: string;
    public passcode?: string;

    constructor() {
        this.headers = new Map<string, string>();
    }
}
