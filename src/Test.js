//Testdatei für Kürteil
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { minimap } from './minimap.js'; 

let scene, camera, renderer, clock;
let keys = {};
let yaw = 0;
let wallBoxes = [];
let walls = [];
let pitch = 0;
let hemiLight, dirLight;
let drawMinimap;
let coins = [];
let collected = 0;
let totalCoins = 0;
let goalMarker;

const textureLoader = new THREE.TextureLoader();
const wallTexture = textureLoader.load('stone.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
const floorTexture = textureLoader.load('steinpflaster.jpg')
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(20, 20); // Kachelt die Textur 50x auf X- und Y-Achse

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
    return marker;
}
function createCoin(x, z) {
    const geometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const coin = new THREE.Mesh(geometry, material);
    coin.rotation.y = Math.PI / 2;
    coin.position.set(x, 1.5, z);
    coin.userData.isCoin = true;
    scene.add(coin);
    coins.push(coin);  // HIER coins hinzufügen!
    return coin;
}
function updateCoinCounter() {
    const counter = document.getElementById('coinCounter');
    if(counter) {
        counter.textContent = `Coins: ${collected} / ${totalCoins}`;
    }
}

function init() {
    hemiLight = new THREE.HemisphereLight();
    window.hemiLight = hemiLight;

    scene = new THREE.Scene();
    const skyTexture = textureLoader.load('night-sky.jpg'); // dein Himmelbild
    scene.background = skyTexture;

    camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3.5, 5); // nah am Boden

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

    totalCoins = coins.length;
    updateCoinCounter();

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
    console.log("PointerLockChanged:", document.pointerLockElement);
    if (document.pointerLockElement === document.body) {
        document.addEventListener('mousemove', onMouseMove, false);
    } else {
        document.removeEventListener('mousemove', onMouseMove, false);
    }
});

    goalMarker = createMarker(45, 45, 0xff0000);
    goalMarker.visible = false;


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

    // Initialize minimap
    drawMinimap = minimap(mazeMap, camera.position, {x:5, z:5}, {x:45, z:45});

    placeCoinsFromMap(mazeMap);
}

function animate() {
    requestAnimationFrame(animate);
    if (typeof window.isGamePaused === "function" && window.isGamePaused()) {
        renderer.render(scene, camera);
        return;
    }
    
    const time = clock.getElapsedTime();

    // Coins schweben lassen und einsammeln
    // Coins einsammeln und schweben lassen
for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    coin.position.y = 1.5 + Math.sin(time * 3 + i) * 0.5;

    const dist = camera.position.distanceTo(coin.position);
    if (dist < 2) {
        scene.remove(coin);
        coins.splice(i, 1);
        collected++;
        updateCoinCounter();
        console.log(`Coins: ${collected} / ${totalCoins}`);
    }
}

// Ziel aktivieren, wenn alle Coins gesammelt
if (collected === totalCoins && goalMarker) {
    goalMarker.visible = true;
    console.log("Alle Coins gesammelt. Ziel aktiviert!");
}

// Prüfen, ob Spieler am Ziel steht
if (goalMarker.visible) {
    const goalXZ = new THREE.Vector2(goalMarker.position.x, goalMarker.position.z);
    const camXZ = new THREE.Vector2(camera.position.x, camera.position.z);
    const distXZ = camXZ.distanceTo(goalXZ);

if (distXZ < 2) {
    showLevelCompleteScreen();
}

}

    for (let i = 0; i < walls.length; i++) {
    wallBoxes[i].setFromObject(walls[i]);
}

    const delta = clock.getDelta();
    const speed = 600;

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

    if (moveDir.length() > 0) {
    moveDir.normalize();

    const moveDistance = speed * delta;

    // Schritt 1: Versuche Bewegung auf X-Achse
    const nextPosX = camera.position.clone().add(new THREE.Vector3(moveDir.x * moveDistance, 0, 0));
    let playerBoxX = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(nextPosX.x, 9, camera.position.z),
        new THREE.Vector3(3, 3, 3)
    );
    let collisionX = false;
    for (const box of wallBoxes) {
        if (box.intersectsBox(playerBoxX)) {
            collisionX = true;
            break;
        }
    }

    if (!collisionX) {
        camera.position.x = nextPosX.x;
    }

    // Schritt 2: Versuche Bewegung auf Z-Achse
    const nextPosZ = camera.position.clone().add(new THREE.Vector3(0, 0, moveDir.z * moveDistance));
    let playerBoxZ = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(camera.position.x, 9, nextPosZ.z),
        new THREE.Vector3(3, 3, 3)
    );
    let collisionZ = false;
    for (const box of wallBoxes) {
        if (box.intersectsBox(playerBoxZ)) {
            collisionZ = true;
            break;
        }
    }

    if (!collisionZ) {
        camera.position.z = nextPosZ.z;
    }
}
 // Render minimap
    if (typeof drawMinimap === 'function') {
        drawMinimap();
    }

    renderer.render(scene, camera);

    if (collected === totalCoins && goalMarker) {
            goalMarker.visible = true;
            console.log("Alle Coins gesammelt. Ziel aktiviert!");
        }

}
function placeCoinsFromMap(map) {
    const size = 5;
    const possibleSpots = [];

    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            if (map[row][col] === 0) {
                possibleSpots.push({ x: col * size, z: row * size });
            }
        }
    }

    // Zufällig 3 Orte wählen
    for (let i = 0; i < 3; i++) {
        const index = Math.floor(Math.random() * possibleSpots.length);
        const spot = possibleSpots.splice(index, 1)[0];
        createCoin(spot.x, spot.z);
    }

    totalCoins = coins.length;
    updateCoinCounter();
}


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
    walls.push(wall);
    
    const box = new THREE.Box3().setFromObject(wall);
    wallBoxes.push(box);

    return wall;
}
function showLevelCompleteScreen() {
    const screen = document.getElementById('levelCompleteScreen');
    if (screen) {
        screen.style.display = 'block';
        document.exitPointerLock(); // Maus freigeben
        // Spiel pausieren, falls nötig
        window.isGamePaused = () => true;
    }
}

function goToMenu() {
    // Hier kannst du ggf. zur Startseite navigieren
    window.location.reload(); // Oder andere Seite laden
}

function nextLevel() {
    alert("Nächstes Level kommt bald!");
}
document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("mainMenuButton");
    if (menuButton) {
        menuButton.addEventListener("click", goToMenu);
    }
});


