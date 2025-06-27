// Wurde importiert in Test.js

export function minimap(mazeMap, playerPosition, startPosition, endPosition) {
    const canvas = document.createElement('canvas');
    canvas.width = 200; // Minimap size
    canvas.height = 200;
    canvas.style.position = 'absolute';
    canvas.style.bottom = '20px';
    canvas.style.right = '20px';
    canvas.style.border = '2px solid white';
    canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    canvas.style.pointerEvents = 'none'; // Do not block mouse/keyboard
    canvas.style.zIndex = '100';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const cellSize = canvas.width / mazeMap[0].length; // Scale maze to fit canvas

    function drawMinimap() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw maze layout
        for (let row = 0; row < mazeMap.length; row++) {
            for (let col = 0; col < mazeMap[row].length; col++) {
                if (mazeMap[row][col] === 1) {
                    ctx.fillStyle = 'gray';
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                }
            }
        }

        // Draw start position
        const startX = startPosition.x / 5; // Scale start position to minimap
        const startZ = startPosition.z / 5;
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(startX * cellSize, startZ * cellSize, cellSize / 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw end position
        const endX = endPosition.x / 5; // Scale end position to minimap
        const endZ = endPosition.z / 5;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(endX * cellSize, endZ * cellSize, cellSize / 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw player position
        const playerX = playerPosition.x / 5; // Scale player position to minimap
        const playerZ = playerPosition.z / 5;
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(playerX * cellSize, playerZ * cellSize, cellSize / 4, 0, Math.PI * 2);
        ctx.fill();
    }
    return drawMinimap;
}