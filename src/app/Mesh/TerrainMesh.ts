import Mesh from './Mesh';

import { MESH_TYPES } from '@shared/enums/mesh.enum';
import { WATER_CONSTANTS } from '@shared/constants/water.constants';
import { TERRAIN_MESH_PARAMS } from './constants/terrainMesh.constants';

import BiomeGenerator from '@world/BiomeGenerator';

class TerrainMesh extends Mesh {

  constructor(generator: BiomeGenerator, row: number, col: number) {
    super(generator, row, col, MESH_TYPES.TERRAIN_MESH, TERRAIN_MESH_PARAMS);
  }

  getLow(): number {
    return this.low;
  }

  needRenderWater(): boolean {
    return this.low <= WATER_CONSTANTS.SEA_LEVEL;
  }
}

export default TerrainMesh;
