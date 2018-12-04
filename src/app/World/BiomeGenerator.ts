import * as THREE from 'three';
import simplexNoise from 'simplex-noise';

import World from './World';
import Terrain from './Terrain';
import Chunk from './Chunk';
import MathUtils from '@utils/Math.utils';
import Stack from '@shared/Stack';

import { IBiome } from '@shared/models/biome.model';
import { WATER_CONSTANTS } from '@shared/constants/water.constants';
import { BIOMES } from '@shared/constants/biome.constants';
import { ILowHigh } from '@shared/models/biomeWeightedObject.model';

/**
 * Biome composition :
 * - name
 * - color gradient
 * - simplex noise generator
 * - noise parameters
 */
class BiomeGenerator {
  static readonly MOISTURE_OCTAVES: number[] = [0.20, 0.5, 0.25, 0.0125, 0.005];
  static readonly MOISTURE_OCTAVES_SUM: number = BiomeGenerator.MOISTURE_OCTAVES.reduce((a, b) => a + b, 0);

  static readonly TERRAIN_OCTAVES: number[] = [1.0, 0.35, 0.25, 0.125, 0.0625, 0.005];
  static readonly TERRAIN_OCTAVES_SUM: number = BiomeGenerator.TERRAIN_OCTAVES.reduce((a, b) => a + b, 0);

  protected curvePow: number = MathUtils.randomInt(5, 9);

  protected simplexTerrain: simplexNoise;
  protected simplexMoisture: simplexNoise;

  constructor() {
    this.simplexTerrain = new simplexNoise(MathUtils.rng);
    this.simplexMoisture = new simplexNoise(MathUtils.rng);

    // auto load biomes models
    for (const b in BIOMES) {
      for (const o in BIOMES[b].organisms) {
        const name = BIOMES[b].organisms[o].name;

        BIOMES[b].organisms[o].object = World.LOADED_MODELS.get(name);
      }
    }
  }

  /**
   * Tries to position an object at the given coordinates
   * @param {number} x
   * @param {number} z
   * @return {THREE.Object3D|null}
   */
  pick(x: number, z: number): THREE.Object3D | null {
    const e = this.computeElevation(x, z);
    const m = this.computeMoisture(x, z);
    const y = BiomeGenerator.getHeightAtElevation(e);
    const biome = this.getBiome(e, m);

    let temp = 0;
    const rand = MathUtils.rng(); // random float bewteen 0 - 1 included (sum of weights must be = 1)

    for (let i = 0, n = biome.organisms.length; i < n; i++) {
      temp += biome.organisms[i].weight;

      if (rand <= temp) {
        const organism = biome.organisms[i];

        // test for scarcity and ground elevation criteria
        if (
          (organism.scarcity === 0 || MathUtils.rng() >= organism.scarcity) &&
          (organism.e === null || (e >= (<ILowHigh>organism.e).low && e <= (<ILowHigh>organism.e).high)) &&
          (organism.m === null || (m >= (<ILowHigh>organism.m).low && m <= (<ILowHigh>organism.m).high))
        ) {
          let object = null;

          // if object stack doesn't exist yet we create one
          if (!Chunk.CHUNK_OBJECT_STACK[organism.name]) {
            Chunk.CHUNK_OBJECT_STACK[organism.name] = new Stack<THREE.Object3D>();
          }

          // if the stack is empty, create a new object else pop an object from the stack
          if (Chunk.CHUNK_OBJECT_STACK[organism.name].empty) {
            object = organism.object.clone();
          } else {
            object = Chunk.CHUNK_OBJECT_STACK[organism.name].pop();
          }

          // reset transforms
          const f = MathUtils.randomFloat(organism.scale.min, organism.scale.max);

          object.rotation.y = MathUtils.randomFloat(0, Math.PI * 2);
          object.scale.set(f * 200, f * 200, f * 200);
          object.stack_ref = organism.name;

          return object;
        }
      }
    }

    return null;
  }

  getWaterColor(m: number): THREE.Color {
    if (m > 0.55) {
      return WATER_CONSTANTS.WATER_COLOR_B;
    }
    if (m > 0.45) {
      return WATER_CONSTANTS.WATER_COLOR_TR;
    }

    return WATER_CONSTANTS.WATER_COLOR_A;
  }

  /**
   * Return the biom corresponding to the given elevation and moisture
   * @param {number} e elevation value
   * @param {number} m moisture value
   * @return {IBiome} Biome informations
   */
  getBiome(e: number, m: number): IBiome {
    if (e < 0.0024) { return BIOMES.OCEAN; }
    if (e < 0.024) {
      if (e > 0.00575 && m > 0.5) {
        return BIOMES.SWAMP;
      }
      return BIOMES.BEACH;
    }

    // level 1
    if (e < 0.05) {
      if (m > 0.66) { return BIOMES.RAINFOREST; }
      if (m > 0.33) { return BIOMES.GRASSLAND; }

      return BIOMES.DESERT;
    }
    // level 2
    if (e < 0.10) {
      if (m > 0.66) { return BIOMES.RAINFOREST; }
      if (m > 0.335) { return BIOMES.FOREST; }
      if (m > 0.33) { return BIOMES.GRASSLAND; }

      return BIOMES.DESERT;
    }

    // level 3
    if (e < 0.45) {
      if (m > 0.66) { return BIOMES.RAINFOREST; }
      if (m > 0.33) { return BIOMES.TAIGA; }

      return BIOMES.DESERT;
    }

    // level 4
    if (e < 0.6) {
      if (m > 0.875) { return BIOMES.SNOW; }
      if (m > 0.66) { return BIOMES.MOUNTAIN; }
      if (m > 0.33) { return BIOMES.TUNDRA; }
      return BIOMES.MOUNTAIN;
    }

    return BIOMES.SNOW;
  }

  /**
   * Retrieve the biome at the given coordinates
   * @param {number} x coord component
   * @param {number} z coord component
   * @return {IBiome}
   */
  getBiomeAt(x: number, z: number): IBiome {
    return this.getBiome(
      this.computeElevation(x, z),
      this.computeMoisture(x, z)
    );
  }

  /**
   * Compute elevation
   * @param {number} x coord component
   * @param {number} z coord component
   * @return {number} elevation value
   */
  computeElevation(x: number, z: number): number {
    const nx = x / (Chunk.WIDTH * 48) - 0.5;
    const nz = z / (Chunk.DEPTH * 48) - 0.5;

    let e = 0;

    e += BiomeGenerator.TERRAIN_OCTAVES[0] * this.elevationNoise(nx, nz);
    e += BiomeGenerator.TERRAIN_OCTAVES[1] * this.elevationNoise(2 * nx, 2 * nz);
    e += BiomeGenerator.TERRAIN_OCTAVES[2] * this.elevationNoise(4 * nx, 4 * nz);
    e += BiomeGenerator.TERRAIN_OCTAVES[3] * this.elevationNoise(8 * nx, 8 * nz);
    e += BiomeGenerator.TERRAIN_OCTAVES[4] * this.elevationNoise(16 * nx, 16 * nz);
    e += BiomeGenerator.TERRAIN_OCTAVES[5] * this.elevationNoise(32 * nx, 32 * nz);

    e /= BiomeGenerator.TERRAIN_OCTAVES_SUM;
    e **= this.curvePow;

    return Math.round(e * 180) / 180;
  }

  /**
   * Compute moisture
   * @param {number} x coord component
   * @param {number} z coord component
   * @return {number} moisture value
   */
  computeMoisture(x: number, z: number): number {
    const nx = x / (Chunk.WIDTH * 360) - 0.5;
    const nz = z / (Chunk.DEPTH * 360) - 0.5;

    let m = 0;

    m += BiomeGenerator.MOISTURE_OCTAVES[0] * this.moisturenNoise(nx, nz);
    m += BiomeGenerator.MOISTURE_OCTAVES[1] * this.moisturenNoise(nx * 2, nz * 2);
    m += BiomeGenerator.MOISTURE_OCTAVES[2] * this.moisturenNoise(nx * 4, nz * 4);
    m += BiomeGenerator.MOISTURE_OCTAVES[3] * this.moisturenNoise(nx * 8, nz * 8);
    m += BiomeGenerator.MOISTURE_OCTAVES[4] * this.moisturenNoise(nx * 16, nz * 16);

    m /= BiomeGenerator.MOISTURE_OCTAVES_SUM;

    return m;
  }

  // make the range of the simplex noise [-1, 1] => [0, 1]
  private elevationNoise(nx: number, nz: number): number {
    return MathUtils.mapInterval(this.simplexTerrain.noise2D(nx, nz), -1, 1, 0, 1);
  }

  private moisturenNoise(nx: number, nz: number): number {
    return MathUtils.mapInterval(this.simplexMoisture.noise2D(nx, nz), -1, 1, 0, 1);
  }

  /**
   * Returns the world y position at the given coordinates
   * @param {number} x coord component
   * @param {number} z coord component
   * @return {number}
   */
  computeHeight(x: number, z: number) {
    return BiomeGenerator.getHeightAtElevation(this.computeElevation(x, z));
  }

  /**
   * Returns the elevation at the given y world coordinate
   * @param {number} y coord component
   * @return {number}
   */
  static getElevationFromHeight(y: number) {
    return y / ((Chunk.MAX_CHUNK_HEIGHT - Chunk.MIN_CHUNK_HEIGHT) + Chunk.MIN_CHUNK_HEIGHT);
  }

  /**
   * Returns the world coordinate at the given elevation
   * @param {number} e elevation
   * @return {number}
   */
  static getHeightAtElevation(e: number) {
    return e * ((Chunk.MAX_CHUNK_HEIGHT - Chunk.MIN_CHUNK_HEIGHT) + Chunk.MIN_CHUNK_HEIGHT);
  }

  /**
   * Returns the world coordinate at the given elevation
   * @param {number} e elevation
   * @return {number}
   */
  static getHeightAtElevationWithWater(e: number) {
    return Math.max(this.getHeightAtElevation(e), World.SEA_LEVEL);
  }
}

export default BiomeGenerator;