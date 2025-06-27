//Testdatei für Kürteil
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { minimap } from './minimap.js'; 

let scene, camera, renderer, clock;
let keys = {};
let yaw = 0;
let wallBoxes = []; // Kollision
let pitch = 0;
let hemiLight, dirLight;
let drawMinimap;

const textureLoader = new THREE.TextureLoader();
const wallTexture = textureLoader.load('stone.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
const floorTexture = textureLoader.load('steinpflaster.jpg')
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(20, 20); // Kachelt die Textur 50x auf X- und Y-Achse

window.hemiLight = hemiLight;
window.dirLight = dirLight;


init();
animate();

function buildMazeFromMap(map) {
    const size = 5; // Abstand der Blöcke (Grid-Größe)
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 1) {
                const x = col * size;
                const z = row * size;
                createWall(x, z, size, 18, size); // Höhe 10
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
    const skyTexture = textureLoader.load('night-sky.jpg'); // dein Himmelbild
    scene.background = skyTexture;

    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5); // nah am Boden

    renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    window.hemiLight = hemiLight;

    dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);
    window.dirLight = dirLight;


    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ map: floorTexture})
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

    // Initialize minimap
    drawMinimap = minimap(mazeMap, camera.position, {x:5, z:5}, {x:50, z:45});
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

    camera.position.add(moveDir.multiplyScalar(speed * delta));

    // Render minimap
    if (typeof drawMinimap === 'function') {
        drawMinimap();
    }

        renderer.render(scene, camera);
    }

    animate();


function onMouseMove(event) {
    const sensitivity = 0.002;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); // kein Kopfüber
}
function createWall(x, z, width = 23, height = 25, depth = 5) {
    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(x, height / 2, z);
    scene.add(wall);
    
    const box = new THREE.Box3().setFromObject(wall);
    wallBoxes.push(box);

    return wall;
}
