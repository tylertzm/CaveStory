
// NOCH NICHT VERWENDEN!
// HAHA




// This file defines a function to create a torch object in a Three.js scene.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createTorch(x, y, z) {
    const torchGroup = new THREE.Group();

    // Torch handle
    const handleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, 1, 0);
    torchGroup.add(handle);

    // Torch flame
    const flameGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700, // Gold color
        emissive: 0xFFA500, // Orange glow
        emissiveIntensity: 1,
        roughness: 0.5,
        metalness: 0.3
    });
    const flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(0, 2, 0);
    torchGroup.add(flame);

    // Position the torch
    torchGroup.position.set(x, y, z);

    return torchGroup;
}