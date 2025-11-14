function loadTexture(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            resolve(img);
        };
    })
}

window.onload = async() => {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");
    const heroImg = await loadTexture('assets/Image/player.png')
    const enemyImg = await loadTexture('assets/Image/enemyShip.png')
    // 보조 비행기 추가.
    const sideHeroImg = await loadTexture('assets/Image/life.png')
    // 배경 이미지 추가.
    const starBgImg = await loadTexture('assets/Image/Background/starBackground.png')
    const pattern = ctx.createPattern(starBgImg, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    ctx.drawImage(heroImg, canvas.width/2 - 45, canvas.height - (canvas.height/4));
    // 플레이어 양 옆에 총 2개 추가
    ctx.drawImage(sideHeroImg, 400, canvas.height - (canvas.height/4) + 40);
    ctx.drawImage(sideHeroImg, 600, canvas.height - (canvas.height/4) + 40);

    createEnemies2(ctx, canvas, enemyImg);
};

function createEnemies(ctx, canvas, enemyImg) {
    const MONSTER_TOTAL = 5;
    const MONSTER_WIDTH = MONSTER_TOTAL * enemyImg.width;
    const START_X = (canvas.width - MONSTER_WIDTH) / 2;
    const STOP_X = START_X + MONSTER_WIDTH;
    for (let x = START_X; x < STOP_X; x += enemyImg.width) {
        for (let y = 0; y < enemyImg.height * 5; y += enemyImg.height) {
            ctx.drawImage(enemyImg, x, y);
        }
    }
}

// Enemies 피라미드 형태로 생성
function createEnemies2(ctx, canvas, enemyImg) {
    const rows = 5;
    const columns = 5;
    const startX = (canvas.width - (columns * enemyImg.width)) / 2;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns - row; col++) {
            const x = startX + (col + row * 0.5) * enemyImg.width;
            const y = row * enemyImg.height;
            ctx.drawImage(enemyImg, x, y);
        }
    }
}