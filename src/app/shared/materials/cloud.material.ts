import * as THREE from 'three';

export const CLOUD_MATERIAL: THREE.MeshLambertMaterial = new THREE.MeshLambertMaterial({
  wireframe: false,
  emissive: 0xffffff,
  emissiveIntensity: 0,
  reflectivity: 0,
  flatShading: true,
  color: 0xffffff,
  opacity: 0.95,
  transparent: true,
  side: THREE.FrontSide,
});