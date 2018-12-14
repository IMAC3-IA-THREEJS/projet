
import Terrain from '@world/Terrain';
import Biome from '@world/Biome';
import BiomeGenerator from '@world/BiomeGenerator';
import Chunk from '@world/Chunk';

import { IBiome } from '@shared/models/biome.model';
import { BIOMES } from '@shared/constants/biome.constants';
import MathUtils from '@shared/utils/Math.utils';

class DesertBiome extends Biome
{
  constructor(generator: BiomeGenerator) {
    super('DESERT', generator);
  }

  /**
   * Compute elevation
   * @param {number} x coord component
   * @param {number} z coord component
   * @return {number} elevation value
   */
  computeElevationAt(x: number, z: number): number {
    const nx = (x - Terrain.SIZE_X / 2) / (1024 * 128);
    const nz = (z - Terrain.SIZE_Z / 2) / (1024 * 128);

    let e = 0.225 * this.generator.noise2(0.75 * nx, 0.75 * nz);
    e += 0.2 * this.generator.noise3(1 * nx, 1 * nz);
    e += 0.075 * this.generator.ridgeNoise(1 * nx, 1 * nz);
    e += 0.0085 * this.generator.ridgeNoise(32 * nx, 32 * nz);
    e += 0.05 * this.generator.noise(4 * nx, 4 * nz);

    e ** 0.005;

    return e + 0.135;
  }

  computeMoistureAt(x: number, z: number): number {
    const value = super.computeMoistureAt(x, z);

    // bias towards low humidity because it's a desert
    return Math.max(value - 0.5, 0.0);
  }

  getParametersAt(e: number, m: number) : IBiome {
    if (e < Chunk.SEA_ELEVATION - 0.10 - MathUtils.randomFloat(0.01, 0.025)) {
      return BIOMES.OCEAN;
    }

    if (e > Chunk.SEA_ELEVATION + 0.1) {
      return BIOMES.DESERT;
    }

    return BIOMES.OASIS;
  }
}

export default DesertBiome;