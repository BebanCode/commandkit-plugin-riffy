import { CommandKitPluginRuntime, RuntimePlugin, Logger } from 'commandkit';
import { Riffy, RiffyEventType, RiffyOptions, LavalinkNode } from 'riffy';

export interface RiffyPluginOptions {
  /** An array of Lavalink node objects for Riffy to connect to. */
  riffyNodes: LavalinkNode[];
  /**
   * Optional additional options to pass to the Riffy constructor.
   * These will be merged with the plugin's defaults.
   */
  riffyOptions?: Partial<RiffyOptions>;
  /**
   * The CommandKit event namespace for all Riffy events.
   * @default 'riffy'
   */
  eventNamespace?: string;
}

declare module 'discord.js' {
  interface Client {
    riffy?: Riffy; 
  }
}

/**
 * A CommandKit Runtime Plugin that fully manages the Riffy client lifecycle.
 */
class RiffyPlugin extends RuntimePlugin<RiffyPluginOptions> {
  public readonly name = 'RiffyPlugin';

  public async activate(ctx: CommandKitPluginRuntime): Promise<void> {
    Logger.info(`CommandKit ${this.name} has been activated!`);
    const client = ctx.commandkit.client;

    if (client.riffy) {
      Logger.warn(`${this.name}: Riffy already exists on "client.riffy". Plugin will not re-initialize.`);
      return;
    }

    const { riffyNodes, riffyOptions, eventNamespace } = this.options;

    if (!riffyNodes || riffyNodes.length === 0) {
      Logger.error(`${this.name}: "riffyNodes" array was not provided. The plugin cannot activate.`);
      return;
    }

    const defaultRiffyOptions: RiffyOptions = {
      restVersion: "v4",
      reconnectTries: 3,
      reconnectTimeout: 6000,
      defaultSearchPlatform: "ytsearch",
      multipleTrackHistory: 1,
      bypassChecks: {
        nodeFetchInfo: false
      },
      plugins: [],
      send: (payload) => {
				console.warn("Send function not implemented:", payload);
      }
    };

		const finalRiffyOptions: RiffyOptions = {
      ...defaultRiffyOptions,
      ...riffyOptions,
    };

    try {
      Logger.info(`${this.name}: Initializing Riffy instance...`);
      const riffyInstance = new Riffy(
        client,
        riffyNodes,
        {
          ...finalRiffyOptions,
          send: (payload) => {
            if (!payload || !payload.d || !payload.d.guild_id) return;

            const guild = client.guilds.cache.get(payload.d.guild_id);

            if (guild) {
              guild.shard.send(payload);
            } 
          }
        }
      );
      
      client.riffy = riffyInstance;
    } catch (error) {
      Logger.error(`${this.name}: Failed to create Riffy instance:`, error);
      return;
    }

    const initializeRiffy = () => {
      if (!client.user || client.riffy?.initiated) return;
      Logger.info(`${this.name} Client ready. Initializing Riffy...`);
      client.riffy?.init(client.user.id);
    };

    if (client.isReady()) initializeRiffy();
    else client.once('ready', () => initializeRiffy());

    const namespace = eventNamespace ?? 'riffy';
    const eventsToBridge = [
      RiffyEventType.NodeConnect, RiffyEventType.NodeDisconnect, RiffyEventType.NodeError, RiffyEventType.NodeReconnect, RiffyEventType.NodeCreate, RiffyEventType.NodeDestroy, 
      RiffyEventType.PlayerCreate, RiffyEventType.PlayerDisconnect, RiffyEventType.PlayerMove, RiffyEventType.PlayerUpdate, 
      RiffyEventType.TrackStart, RiffyEventType.TrackEnd, RiffyEventType.TrackError, RiffyEventType.TrackStuck, 
      RiffyEventType.QueueEnd,
      RiffyEventType.Debug
    ];
    Logger.info(`${this.name}: Bridging Riffy events to the "${namespace}" namespace.`);
    for (const event of eventsToBridge) {
      client.riffy.on(event, (...args: any[]) => {
        ctx.commandkit.events.to(namespace).emit(event, ...args);
      });
    }
  }

  public async deactivate(ctx: CommandKitPluginRuntime): Promise<void> {
    Logger.info(`${this.name} deactivated.`);
  }
}

/**
 * Factory function for the RiffyPlugin.
 * @param options - The options for the plugin, conforming to RiffyPluginOptions.
 * @returns An instance of RiffyPlugin.
 */
export function riffyPlugin(options: RiffyPluginOptions): RiffyPlugin {
  return new RiffyPlugin(options);
}
