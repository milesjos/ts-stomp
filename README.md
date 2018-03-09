[![CI Status](https://travis-ci.org/ElderByte-/ts-stomp.svg?branch=master)](https://travis-ci.org/ElderByte-/ts-stomp)
[![npm version](https://badge.fury.io/js/%40elderbyte%2Fts-stomp.svg)](https://badge.fury.io/js/%40elderbyte%2Fts-stomp)

# TypeScript STOMP

Simple TypeScript STOMP over Websocket library.

## Features

* Supports native websocket transport
* Supports SockJS emulated websocket transport


## Consuming your library

To install this library, run:

```bash
$ npm install @elderbyte/ts-stomp --save
```

and then in your code:

Once your library is imported, you can use the `StompService` by importing it into your own services / components:

```typescript
export class MyStompUsage {
    
  private logger = LoggerFactory.getLogger('MyStompUsage');

  private stompService : StompService
    
  constructor(
    ) {
    
    this.stompService = new StompService({
      endpointUrl: '/stomp',
      withSockJs: true
    });
    
    const topic = '/topic/metadata/changed';

    // Subscribe to the STOMP topic ...

    this.stompService.connectedClient
      .subscribe(client => {
        const sub = client.subscribe(topic);
       
        // Subscription successful -> now we can listen to messages sent to this subscription

        sub.messages.subscribe(m => {
         
          // We got a message m, do something with it
          
          this.onMediaChanged(m.bodyJson);
          
          
        }, err => {
          this.logger.error('Got filtered STOMP topic error!', err);
        })
      }, err => {
        this.logger.error('STOMP: Failed to subscribe!', err);
      });
  }
}
```

  



## Development

To generate all `*.js`, `*.d.ts` and `*.metadata.json` files:

```bash
$ npm run build
```

To lint all `*.ts` files:

```bash
$ npm run lint
```

## License

MIT © [ElderByte AG](mailto:info@elderbyte.com)
