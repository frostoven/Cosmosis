import CosmosisPlugin from '../../types/CosmosisPlugin';
import { MeshCodes } from './interfaces/MeshCodes';

class NodeOps {
  switchLights(node: any, userData: any = {}, powerOutput) {
    // console.log(`Switching lights [`, node, `]. visible=${powerOutput!==0}, intensity=${powerOutput}`);
    if (userData.typeId === MeshCodes.areaLight || userData.typeId === MeshCodes.spotlight) {
      node.visible = powerOutput !== 0;
      node.intensity = powerOutput * 5;
    }
    else if (userData.typeId === MeshCodes.fakeLight) {
      for (let i = 0, len = node.length; i < len; i++) {
        const light = node[i];
        light.material.emissiveIntensity = powerOutput;
      }
    }
  }
}

const nodeOpsPlugin = new CosmosisPlugin('nodeOps', NodeOps);

export {
  NodeOps,
  nodeOpsPlugin,
}
