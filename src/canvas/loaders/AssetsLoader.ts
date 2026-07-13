import { AnimatedSprite, Loader } from 'pixi.js';

export enum SpriteSheets {
  pacmanSpriteSheet = 'pacmanSpriteSheet',
  ghostSpriteSheet = 'ghostSpriteSheet',
}

export type Assets = SpriteSheets;

const assetsLocationsMap: Record<Assets, string> = {
  [SpriteSheets.ghostSpriteSheet]: '/assets/spritesheets/ghost.json',
  [SpriteSheets.pacmanSpriteSheet]: '/assets/spritesheets/pacman.json',
};

export class AssetsLoader {
  public static readonly loader = new Loader();

  public static async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      const assetsLocations = Object.values(assetsLocationsMap);

      for (const assetLocation of assetsLocations) {
        AssetsLoader.loader.add(assetLocation);
      }

      AssetsLoader.loader.onError.add((error, _loader, resource) => {
        console.error(`Failed to load asset: ${resource?.url}`, error);
      });

      AssetsLoader.loader.load((_loader, resources) => {
        const failedAssets = Object.values(resources).filter(
          (resource) => resource?.error,
        );

        if (failedAssets.length > 0) {
          reject(
            new Error(
              `Failed to load ${failedAssets.length} asset(s): ${failedAssets
                .map((r) => r?.url)
                .join(', ')}`,
            ),
          );
          return;
        }

        resolve();
      });
    });
  }

  public static getAnimatedSprite(
    spriteSheetKey: SpriteSheets,
  ): AnimatedSprite | undefined {
    const spriteSheetLocation = assetsLocationsMap[spriteSheetKey];
    const resource = AssetsLoader.loader.resources[spriteSheetLocation];

    if (!resource.spritesheet?.animations) {
      return;
    }

    const animation = Object.values(resource.spritesheet.animations)[0];

    const sprite = new AnimatedSprite(animation);

    return sprite;
  }
}
