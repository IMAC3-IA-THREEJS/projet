import Mesh from './Mesh';

import BiomeGenerator from '@world/BiomeGenerator';
import Chunk from '@world/Chunk';

import { MESH_TYPES } from '@shared/enums/mesh.enum';
import { IChunkParameters } from '@shared/models/chunkParams.model';

class CloudMesh extends Mesh {
  constructor(generator: BiomeGenerator, row: number, col: number) {
    super(generator, row, col, MESH_TYPES.CLOUD_MESH, <IChunkParameters>{
      nRows: 1,
      nCols: 1,
      cellSizeX: Chunk.WIDTH / 1,
      cellSizeZ: Chunk.WIDTH / 1,
      width: Chunk.WIDTH,
      height: Chunk.HEIGHT,
      depth: Chunk.DEPTH
    });
  }
}

export default CloudMesh;