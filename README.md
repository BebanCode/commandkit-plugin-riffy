# CommandKit Plugin: Riffy

[![npm version](https://img.shields.io/npm/v/commandkit-plugin-riffy.svg)](https://www.npmjs.com/package/commandkit-plugin-riffy)

This plugin for **CommandKit** seamlessly integrates the [Riffy](https://riffy.js.org) Lavalink client, enabling robust audio playback for your Discord bot using CommandKit's intuitive event system. It fully manages the Riffy client's lifecycle, from initialization to event handling.

## Features

*   **Seamless Integration**: Automatically initializes and manages the Riffy client.
*   **Event-Driven**: Leverages CommandKit's event system to handle all Riffy events.
*   **Easy Configuration**: Simple to set up within your `commandkit.config.ts`.
*   **Extensible**: Provides direct access to the Riffy instance via `client.riffy`.

## Installation

```bash
npm install commandkit-plugin-riffy
```

## Usage

To get started, register the plugin in your `commandkit.config.ts` file.

```ts
import { defineConfig } from 'commandkit';
import { riffyPlugin } from 'commandkit-plugin-riffy';

export default defineConfig({
  plugins: [
    riffyPlugin({
      riffyNodes: [
        {
          host: 'localhost',
          port: 2333,
          password: 'your_lavalink_password',
          secure: false,
        },
      ],
    }),
  ],
});
```

This setup initializes Riffy and makes it available throughout your CommandKit application.

## Configuration Options

The plugin can be customized with the following options:

| Option           | Type                                                              | Description                                                                                             | Required |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | :------: |
| `riffyNodes`     | `LavalinkNode[]`                                                  | An array of Lavalink node objects for Riffy to connect to.                                              |   Yes    |
| `riffyOptions`   | `Partial<RiffyOptions>`                                           | Optional settings to pass to the Riffy constructor, which will be merged with the plugin's defaults.    |    No    |
| `eventNamespace` | `string`                                                          | The CommandKit event namespace for all Riffy events. Defaults to `'riffy'`.                               |    No    |

## Handling Events

The plugin bridges Riffy events into CommandKit's event system under a specified namespace (defaulting to `riffy`).

To handle these events, create files inside the `events` directory, following the CommandKit event handling structure.

> **Note:** The folder for the event namespace must be enclosed in parentheses, for example: `(riffy)`.

### Project Structure

Your event handlers should be organized as follows:

```
src/
└── events/
    └── (riffy)/
        ├── nodeConnect/
        │   └── logger.js
        └── trackStart/
            └── now-playing.js
```

### Example: Handling Events

Here are a few examples of how you can listen to Riffy events:

#### Logging Node Connections

This handler will log a message whenever a Lavalink node connects.

**File:** `/src/events/(riffy)/nodeConnect/logging.js`

```javascript
export default function handleNodeConnect(node) {
  console.log(`[Riffy] Node "${node.name}" has connected.`);
}
```

#### Announcing Started Tracks

This handler sends a "Now Playing" message when a new track begins.

**File:** `/src/events/(riffy)/trackStart/nowPlaying.js`

```javascript
import { EmbedBuilder } from 'discord.js';

export default async function handleTrackStart(player, track) {
  const channel = player.textChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Now Playing')
    .setDescription(`[${track.title}](${track.uri})`)
    .setThumbnail(track.thumbnail)
    .addFields({ name: 'Author', value: track.author, inline: true })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}
```

### Available Events

The plugin emits the following events within the configured namespace:

*   `nodeConnect`
*   `nodeDisconnect`
*   `nodeError`
*   `nodeReconnect`
*   `nodeCreate`
*   `nodeDestroy`
*   `playerCreate`
*   `playerDisconnect`
*   `playerMove` 
*   `playerUpdate`
*   `trackStart`
*   `trackEnd`
*   `trackError`
*   `trackStuck`
*   `queueEnd`
*   `debug`

## Accessing the Riffy Client

The Riffy instance is attached to the Discord.js `Client` object and can be accessed anywhere via `client.riffy`.

### Example: Play Command

Here is a basic example of a `play` command that uses the `client.riffy` instance to search for and play a track.

**File:** `/src/commands/play.js`
```javascript
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Plays a song in your voice channel.')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('The name of the song or a URL.')
      .setRequired(true)
  );

export const chatInput = async (ctx) => {
  const { guild, member, channel } = ctx.interaction;
  const query = interaction.options.getString('query');

  // Check if the user is in a voice channel
  if (!member.voice.channel) {
    return interaction.reply({
      content: 'You must be in a voice channel to use this command.',
      ephemeral: true,
    });
  }

  let player = client.riffy.players.get(guild.id);

  if (!player) {
    player = client.riffy.createConnection({
      guildId: guild.id,
      voiceChannel: voiceChannel.id,
      textChannel: channel.id,
      deaf: true,
      defaultVolume: client.config.riffyOptions.defaultVolume || 50,
    });
  }

  await interaction.deferReply();

  // Resolve the query to get track(s)
  const resolve = await client.riffy.resolve({
    query: query,
    requester: interaction.user
  });

  const { loadType, tracks, playlistInfo } = resolve;

  // Add track(s) to the queue based on the load type
  if (loadType === 'PLAYLIST_LOADED') {
    for (const track of tracks) {
      player.queue.add(track);
    }
    await interaction.editReply(`Added **${tracks.length}** tracks from the playlist "${playlistInfo.name}" to the queue.`);
  } else if (loadType === 'SEARCH_RESULT' || loadType === 'TRACK_LOADED') {
    const track = tracks.shift();
    player.queue.add(track);
    await interaction.editReply(`Added **${track.info.title}** to the queue.`);
  } else {
    return interaction.editReply('I could not find any tracks for that query.');
  }

  // Start playing if the player is not already active
  if (!player.playing && !player.paused) {
    player.play();
  }
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request for any improvements or bug fixes.

## Acknowledgments

*   **[Riffy](https://riffy.js.org/)**: For the powerful Lavalink client.
*   **[CommandKit](https://commandkit.dev/)**: For the modern and feature-rich Discord.js framework.