import fs from 'fs';
import CosmosisPlugin from '../../types/CosmosisPlugin';

class Metadata {
  public gameVersion: string | null;
  public gameDataDirName: string | null;

  constructor() {
    this.gameVersion = null;
    this.gameDataDirName = null;
    fs.readFile('./package.json', (error, data) => {
      if (error) {
        console.error('[MetaData Plugin] Could not read package.json.');
      }
      try {
        // @ts-ignore TS2345 - lies.
        const packageJson = JSON.parse(data);
        this.gameVersion = packageJson.version;
        this.gameDataDirName = packageJson.gameDataDirName;
      }
      catch (error) {
        console.error('[MetaData Plugin]', error);
      }
    });
  }
}

const metadataPlugin = new CosmosisPlugin('metaData', Metadata);

export {
  metadataPlugin,
}
