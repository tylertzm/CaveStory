// bg music https://pixabay.com/music/mystery-dark-ambient-cave-experience-224286/
// mario sound https://themushroomkingdom.net/media/smb/wav
window.addEventListener('DOMContentLoaded', () => {
    let music = document.getElementById('bgMusic');
    if (!music) {
        music = document.createElement('audio');
        music.id = 'bgMusic';
        music.src = 'cave.mp3';
        music.loop = true;
        music.volume = 0.5;
        music.style.display = 'none';
        document.body.appendChild(music);
    }
    // Try to play immediately (may be blocked by browser)
    music.play().catch(() => {});
    // Play on first user interaction if blocked
    const unlock = () => {
        music.play().catch(() => {});
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
});
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { minimap } from './minimap.js';

let scene, camera, renderer, clock;
let keys = {};
let yaw = 0;
let pitch = 0;
let wallBoxes = [];
let walls = [];
let hemiLight, dirLight;
let drawMinimap;
let coins = [];
let collected = 0;
let totalCoins = 0;
let goalMarker;
let currentLevel = 1;
let floor;

const textureLoader = new THREE.TextureLoader();
const wallTexture = textureLoader.load('stone.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
const floorTexture = textureLoader.load('steinpflaster.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(20, 20);

window.loadNextLevel = function () {
    currentLevel++;
    resetLevel();
    loadLevel(currentLevel);
};

function resetLevel() {
    for (let i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        if (
            !(obj instanceof THREE.HemisphereLight || obj instanceof THREE.DirectionalLight) &&
            !obj.userData.persistent
        ) {
            scene.remove(obj);
        }
    }
    coins = [];
    walls = [];
    wallBoxes = [];
    collected = 0;
    totalCoins = 0;
    updateCoinCounter();

    const oldMinimap = document.getElementById('minimapCanvas');
    if (oldMinimap) oldMinimap.remove();
}

function loadLevel(level) {
    const levels = {
        1: {
            map: [
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
            ],
            start: { x: 5, z: 5 },
            goal: { x: 45, z: 45 },
            coins: 3
        },
        2: {
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,1,0,0,0,1,0,0,0,0,1],
                [1,0,1,1,0,1,0,1,0,1,1,0,1],
                [1,0,0,0,0,1,0,0,0,0,1,0,1],
                [1,1,1,1,0,1,1,1,1,0,1,1,1],
                [1,0,0,1,0,0,0,0,1,0,0,0,1],
                [1,0,1,1,1,1,1,0,1,1,1,0,1],
                [1,0,0,0,0,0,1,0,0,0,1,0,1],
                [1,1,1,1,1,0,1,1,1,0,1,0,1],
                [1,0,0,0,1,0,0,0,1,0,0,0,1],
                [1,0,1,0,1,1,1,0,1,1,1,0,1],
                [1,0,1,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            start: { x: 5, z: 5 },
            goal: { x: 55, z: 55 },
            coins: 10
        }
    };

    const levelData = levels[level];
    if (!levelData) return;

    buildMazeFromMap(levelData.map);
    camera.position.set(levelData.start.x, 3.5, levelData.start.z);
    goalMarker = createMarker(levelData.goal.x, levelData.goal.z, 0xff0000);
    goalMarker.visible = false;
    createMarker(levelData.start.x, levelData.start.z, 0x00ff00);

    drawMinimap = minimap(levelData.map, camera.position, levelData.start, levelData.goal);
    placeCoinsFromMap(levelData.map, levelData.coins);
}

function init() {
    scene = new THREE.Scene();
    scene.background = textureLoader.load('night-sky.jpg');

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3.5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    window.hemiLight = hemiLight;
    window.dirLight = dirLight;

    floor = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 300),
        new THREE.MeshStandardMaterial({ map: floorTexture })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.userData.persistent = true;
    scene.add(floor);

    document.body.addEventListener('click', () => document.body.requestPointerLock());

    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            document.addEventListener('mousemove', onMouseMove, false);
        } else {
            document.removeEventListener('mousemove', onMouseMove, false);
        }
    });

    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    loadLevel(currentLevel);
}

function buildMazeFromMap(map) {
    const size = 5;
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 1) {
                const x = col * size;
                const z = row * size;
                createWall(x, z, size, 18, size);
            }
        }
    }
}

function createWall(x, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ map: wallTexture });
    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x, h / 2, z);
    scene.add(wall);
    walls.push(wall);
    wallBoxes.push(new THREE.Box3().setFromObject(wall));
}

function createMarker(x, z, color = 0x00ff00) {
    const geo = new THREE.CylinderGeometry(1, 1, 0.5, 16);
    const mat = new THREE.MeshStandardMaterial({ color });
    const marker = new THREE.Mesh(geo, mat);
    marker.position.set(x, 0.25, z);
    scene.add(marker);
    return marker;
}

function createCoin(x, z) {
    const geo = new THREE.TorusGeometry(1, 0.3, 16, 100);
    const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const coin = new THREE.Mesh(geo, mat);
    coin.rotation.y = Math.PI / 2;
    coin.position.set(x, 1.5, z);
    coin.userData.isCoin = true;
    scene.add(coin);
    coins.push(coin);
    return coin;
}

function placeCoinsFromMap(map, count) {
    const size = 5;
    const spots = [];
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 0) spots.push({ x: col * size, z: row * size });
        }
    }
    for (let i = 0; i < count && spots.length; i++) {
        const idx = Math.floor(Math.random() * spots.length);
        createCoin(spots.splice(idx, 1)[0].x, spots.splice(idx, 1)[0].z);
    }
    totalCoins = coins.length;
    updateCoinCounter();
}

function updateCoinCounter() {
    const counter = document.getElementById('coinCounter');
    if (counter) counter.textContent = `Coins: ${collected} / ${totalCoins}`;
}

function showLevelCompleteScreen() {
    const screen = document.getElementById("levelCompleteScreen");
    if (screen) screen.style.display = "block";
}

function onMouseMove(e) {
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

function animate() {
    requestAnimationFrame(animate);

    if (typeof window.isGamePaused === "function" && window.isGamePaused()) {
        renderer.render(scene, camera);
        return;
    }

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        const dist = camera.position.distanceTo(coin.position);
        if (dist < 25) coin.position.y = 1.5 + Math.sin(time * 3 + i) * 0.5;
        if (dist < 2) {
            scene.remove(coin);
            coins.splice(i, 1);
            const coinSound = new Audio('coin.wav');
            coinSound.volume = 0.7;
            coinSound.play().catch(() => {});
            collected++;
            updateCoinCounter();
            // Play coin sound
        }
    }

    if (collected === totalCoins && goalMarker) goalMarker.visible = true;

    if (goalMarker && goalMarker.visible) {
        const distXZ = new THREE.Vector2(camera.position.x, camera.position.z)
            .distanceTo(new THREE.Vector2(goalMarker.position.x, goalMarker.position.z));
        if (distXZ < 2) showLevelCompleteScreen();
    }

    const speed = 8; // optimierte Geschwindigkeit
    const direction = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
    ).normalize();

    camera.lookAt(camera.position.clone().add(direction));

    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
    const moveDir = new THREE.Vector3();
    if (keys['w']) moveDir.add(direction);
    if (keys['s']) moveDir.sub(direction);
    if (keys['a']) moveDir.sub(right);
    if (keys['d']) moveDir.add(right);
    moveDir.y = 0;

    if (moveDir.length() > 0) {
    moveDir.normalize();
    const moveDistance = speed * delta;

    const tryMove = (axis) => {
        const tempPos = camera.position.clone();
        tempPos[axis] += moveDir[axis] * moveDistance;
        const testBox = new THREE.Box3().setFromCenterAndSize(
            tempPos.clone().setY(9),
            new THREE.Vector3(3, 3, 3)
        );
        if (!wallBoxes.some(box => box.intersectsBox(testBox))) {
            camera.position[axis] = tempPos[axis];
        }
    };

    tryMove('x');
    tryMove('z');
}


    if (typeof drawMinimap === 'function') drawMinimap();
    renderer.render(scene, camera);
}

init();
animate();
