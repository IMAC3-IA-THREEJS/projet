import * as THREE from 'three';
import poissonDiskSampling from 'poisson-disk-sampling';

import BiomeGenerator from './BiomeGenerator';

import TerrainMesh from '../Mesh/TerrainMesh';
import WaterMesh from '../Mesh/WaterMesh';

import World from './World';
import MathUtils from '@utils/Math.utils';

import { TERRAIN_MESH_PARAMS } from '@mesh/constants/terrainMesh.constants';
import { WATER_MESH_PARAMS } from './../Mesh/constants/waterMesh.constants';

class Chunk {
  readonly row: number;
  readonly col: number;

  terrain: THREE.Mesh;
  water: THREE.Mesh;

  generator: BiomeGenerator;

  constructor(generator: BiomeGenerator, row: number, col: number) {
    this.generator = generator;
    this.row = row;
    this.col = col;

    const terrainMesh = new TerrainMesh(generator, row, col);
    this.terrain = terrainMesh.generate();

    this.water = terrainMesh.needRenderWater() ? new WaterMesh(generator, this.row, this.col).generate() : null;
  }

  populate(scene: THREE.Scene) {
    const padding = 300; // object bounding box size / 2
    const pds = new poissonDiskSampling([TERRAIN_MESH_PARAMS.WIDTH - padding, TERRAIN_MESH_PARAMS.DEPTH - padding], padding * 2, padding * 2, 30, MathUtils.rng);
    const points = pds.fill();

    points.forEach((point: number[]) => {
      const x = padding + this.col * TERRAIN_MESH_PARAMS.WIDTH + point.shift();
      const z = padding + this.row * TERRAIN_MESH_PARAMS.DEPTH + point.shift();
      const y = this.generator.computeHeight(x, z);

      // select an organism based on the current biome
      const object = this.generator.pick(x, z);

      if (object) {
        object.visible = true;
        object.position.set(x, Math.max(y, World.WATER_LEVEL), z);
        scene.add(object);
      }
    });
  }
}
export default Chunk;
