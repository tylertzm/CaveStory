//Testdatei für Kürteil
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
let scene, camera, renderer, clock;
let keys = {};
let yaw = 0;
let wallBoxes = []; // Kollision
let pitch = 0;

init();
animate();

function buildMazeFromMap(map) {
    const size = 5; // Abstand der Blöcke (Grid-Größe)
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 1) {
                const x = col * size;
                const z = row * size;
                createWall(x, z, size, 10, size); // Höhe 10
            }
        }
    }
}
function createMarker(x, z, color = 0x00ff00) {
    const markerGeo = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    const markerMat = new THREE.MeshStandardMaterial({ color });
    const marker = new THREE.Mesh(markerGeo, markerMat);
    marker.position.set(x, 0.25, z); // leicht über dem Boden
    scene.add(marker);
}


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5); // nah am Boden

    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight =  new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({color: 0x333333})
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    document.body.addEventListener('click', () => {
        document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            document.addEventListener('mousemove', onMouseMove, false);
        } else {
            document.removeEventListener('mousemove', onMouseMove, false);
        }
    });

    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    // Maze-Map aufbauen
    const mazeMap = [
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,1,0,1,0,1],
        [1,1,1,1,1,0,1,0,1,0,1],
        [1,0,0,0,1,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1],
    ];
    buildMazeFromMap(mazeMap);
    // Start- und Zielmarker 
createMarker(5, 5, 0x00ff00); // Start (grün)
createMarker(50, 45, 0xff0000); // Ziel (rot)

}



function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const speed = 23;

    // Blickrichtung berechnen
    const direction = new THREE.Vector3();
    direction.x = Math.sin(yaw) * Math.cos(pitch);
    direction.y = Math.sin(pitch);
    direction.z = Math.cos(yaw) * Math.cos(pitch);
    direction.normalize();

    camera.lookAt(camera.position.clone().add(direction));

    // Bewegung
    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    const moveDir = new THREE.Vector3();

    if (keys['w']) moveDir.add(direction);
    if (keys['s']) moveDir.sub(direction);
    if (keys['a']) moveDir.sub(right);
    if (keys['d']) moveDir.add(right);

    moveDir.y = 0; // nicht fliegen
    moveDir.normalize();

    // --- Collision Detection ---
    if (moveDir.length() > 0) {
        const moveStep = moveDir.clone().multiplyScalar(speed * delta);
        const newPos = camera.position.clone().add(moveStep);
        // Player bounding box (as a small box around camera)
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(newPos.x, newPos.y, newPos.z),
            new THREE.Vector3(3, 10, 3) // Adjust size as needed
        );
        let collision = false;
        for (const wallBox of wallBoxes) {
            if (playerBox.intersectsBox(wallBox)) {
                collision = true;
                break;
            }
        }
        if (!collision) {
            camera.position.copy(newPos);
        }
        // else: don't move if collision
    }
    // --- End Collision Detection ---

    renderer.render(scene, camera);
}

function onMouseMove(event) {
    const sensitivity = 0.002;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); // kein Kopfüber
}
function createWall(x, z, width = 23, height = 25, depth = 5) {
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, height / 2, z);
    scene.add(wall);
    const box = new THREE.Box3().setFromObject(wall);
    wallBoxes.push(box);

    return wall;
}

