import * as THREE from 'three';
import poissonDiskSampling from 'poisson-disk-sampling';

import Terrain from '@world/Terrain';
import Biome from '@world/Biome';
import BiomeGenerator from '@world/BiomeGenerator';
import Chunk from '@world/Chunk';
import MathUtils from '@shared/utils/Math.utils';

import { IBiome } from '@shared/models/biome.model';

import { SUB_BIOMES } from '@shared/constants/subBiomes.constants';
import { PROGRESSION_BIOME_STORAGE_KEYS } from '@achievements/constants/progressionBiomesStorageKeys.constants';
import { PROGRESSION_EXTRAS_STORAGE_KEYS } from '@achievements/constants/progressionExtrasStorageKeys.constants';

import Boids from '@boids/Boids';

class OceanBiome extends Biome {
  private spike: number;
  private depth: number;

  private boids: Boids[];

  private chest: THREE.Object3D;

  constructor(generator: BiomeGenerator) {
    super('OCEAN', generator);

    this.boids = [];

    this.spike = MathUtils.randomFloat(0.025, 0.125);
    this.depth = 1.425;

    this.waterDistortion = true;
    this.waterDistortionFreq = 3.0;
    this.waterDistortionAmp = 720.0;

    this.progressionSvc.increment(PROGRESSION_BIOME_STORAGE_KEYS.ocean_visited);
  }

  init(scene: THREE.Scene, terrain: Terrain) {
    const smin = 80000;
    const smax = 140000;
    const s = MathUtils.randomFloat(smin, smax);

    const pds = new poissonDiskSampling([Terrain.SIZE_X - s, Terrain.SIZE_Z - s], s, s, 30, MathUtils.rng);
    const points = pds.fill();

    const T1 = {
      model: 'fish1',
      config: {
        speed: 7500,
        neighbourRadius: 6000,
        alignmentWeighting: 0.0065,
        cohesionWeighting: 0.01,
        separationWeighting: 0.05,
        viewAngle: 8,
        underwater: true
      }
    };

    const T2 = {
      model: 'fish2',
      config: {
        speed: 7500,
        neighbourRadius: 10000,
        alignmentWeighting: 0.0065,
        cohesionWeighting: 0.01,
        separationWeighting: 0.35,
        viewAngle: 12,
        underwater: true
      }
    };

    points.forEach((point: number[]) => {
      const nbMax = (s * 18 / smax) || 0; // maximum nb based on boids size
      const nb = MathUtils.randomInt(1, nbMax);
      const type = nb > 3 ? T1 : T2;
      const px = s / 2 + point.shift();
      const pz = s / 2 + point.shift();

      const sy = MathUtils.randomFloat(Chunk.HEIGHT / 3.75, Chunk.HEIGHT / 3);
      const py = Chunk.SEA_LEVEL - sy / 2;

      // fishs
      const boids = new Boids(
        scene,
        new THREE.Vector3(s, sy, s),
        new THREE.Vector3(px, py, pz),
        type.model,
        nb,
      );

      boids.generate(type.config);

      this.boids.push(boids);
    });

    // chest
    this.chest = terrain.placeObject('chest');
  }

  update(delta: number) {
    this.boids.forEach(boids => boids.update(this.generator, delta));
  }

  handleClick(raycaster: THREE.Raycaster) {
    const intersections: THREE.Intersection[] = raycaster.intersectObjects([this.chest], true);

    if (intersections.length) {
      this.progressionSvc.increment(PROGRESSION_EXTRAS_STORAGE_KEYS.find_captain_treasure);
    }
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

    let e = 0.2 * this.generator.noise(1 * nx, 1 * nz);
    e += 0.0035 * this.generator.noise(8 * nx, 8 * nz);
    e += 0.015 * this.generator.noise(32 * nx, 32 * nz);
    e += 0.025 * this.generator.ridgeNoise2(8 * nx, 8 * nz);
    e += 0.25 * this.generator.noise(4 * nx, 4 * nz) * this.generator.noise3(nx, nz);

    e /= (0.25 + 0.0035 + 0.015 + 0.025 + 0.25) - this.spike;

    e **= 2.25;
    return e - this.depth;
  }

  computeMoistureAt(x: number, z: number): number {
    const nx = x / (1024 * 192);
    const nz = z / (1024 * 192);

    let e = 0.2 * this.generator.noise(1 * nx, 1 * nz);
    e += 0.25 * this.generator.noise(4 * nx, 4 * nz);
    e += 0.0035 * this.generator.noise2(8 * nx, 8 * nz);
    e += 0.05 * this.generator.noise3(16 * nx, 16 * nz);

    e /= 0.2 + 0.25 + 0.0035 + 0.05;

    return Math.round(e * 100) / 100;
  }

  computeWaterMoistureAt(x: number, z: number): number {
    const nx = x / (1024 * 192);
    const nz = z / (1024 * 192);

    return Math.round(this.generator.noise2(nx, nz) * 100) / 100;
  }

  getParametersAt(e: number, m: number): IBiome {
    if (m < 0.4) {
      return SUB_BIOMES.CORAL_REEF;
    }

    return SUB_BIOMES.OCEAN;
  }
}

export default OceanBiome;
