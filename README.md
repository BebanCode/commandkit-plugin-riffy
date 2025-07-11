# CommandKit Plugin Riffy

This is a CommandKit plugin that integrates the Riffy lavalink client, allowing you to manage audio playback in Discord using commandkit's event system. It provides a seamless way to handle audio playback.

## Installation

```bash
npm install commandkit-plugin-riffy
```

## Usage

In your `commandkit.config.ts` file, register the plugin like this:

```ts
import { defineConfig } from 'commandkit';
import { riffyPlugin } from 'commandkit-plugin-riffy';

export default defineConfig({
  plugins: [riffyPlugin({
    riffyNodes: [
      {
        host: 'localhost',
        port: 2333,
        password: 'your_password',
        // Add other node options as needed
      }
    ],
    riffyOptions: {
      // Optional Riffy options
      defaultSearchPlatform: "ytsearch"
      multipleTrackHistory: 1,
      // Add other options as needed
    },
    eventNamespace: 'riffy', // Optional: Custom event namespace
  })],
});
```

Your bot will now be able to use Riffy for audio playback and handle related events.

## Options

The plugin accepts the following options:

- `riffyNodes`: An array of Lavalink node objects for Riffy to connect to. This is required.
- `riffyOptions`: Optional additional options to pass to the Riffy constructor. These will be merged with the plugin's defaults.
  - `restVersion`: The version of the Lavalink REST API to use.
  - `reconnectTries`: The number of times to attempt reconnecting to the Lavalink node.
  - `reconnectTimeout`: The delay in milliseconds between reconnect attempts.
  - `defaultSearchPlatform`: The default search platform to use when searching for tracks.
  - `multipleTrackHistory`: The number of previously played tracks to keep in history. Defaults to `1`.
  - `bypassChecks`: An object to bypass certain checks (e.g., `nodeFetchInfo`).
- `eventNamespace`: The CommandKit event namespace for all Riffy events. Defaults to `'riffy'`.

## Events

The plugin emits the following events:

- `trackStart`: Emitted when a track starts playing.
- `trackEnd`: Emitted when a track ends.
- `trackError`: Emitted when there is an error while playing a track.
- `queueEnd`: Emitted when the queue ends.
- `playerUpdate`: Emitted when the player state is updated.

## Example

This is how your code structure should look like:
> [!NOTE]
> The folder namespace must be inside an () for example (riffy)


```
src/
  └── app/
      └── events/
          └── (riffy)/
              ├── nodeConnect/
              │   ├── logging.js
              │   └── reconnect.js
              └── <eventName>/
                  └── handler.js
```

Here’s a simple example of how to listen for events:
`/src/app/events/(riffy)/nodeError/log.js`
```js
export default async function nodeError(client) {
  console.log(`[${node.name}] Node encountered an error: ${error}`);
};
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Acknowledgments

- [Riffy](https://riffy.js.org) lavalink client.
- [CommandKit](https://commandkit.dev) discord.js meta-framework.