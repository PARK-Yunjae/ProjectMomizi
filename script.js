// === [PART 1] 헤더 & 메뉴 로직 ===
const trigger = document.querySelector('.menu-trigger');
const mobileMenu = document.querySelector('.mobile-menu');

// 햄버거 버튼 클릭 시 메뉴 토글
trigger.addEventListener('click', () => {
    trigger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});


// === [PART 2] 수박게임 엔진 로직 ===
const { Engine, Render, Runner, Bodies, World, Body, Events, Composite } = Matter;

// 과일 설정 (반지름 비율)
const FRUITS_BASE = [
    { name: 0, radiusRatio: 0.07 },
    { name: 1, radiusRatio: 0.10 },
    { name: 2, radiusRatio: 0.13 },
    { name: 3, radiusRatio: 0.16 },
    { name: 4, radiusRatio: 0.20 },
    { name: 5, radiusRatio: 0.24 },
    { name: 6, radiusRatio: 0.28 },
    { name: 7, radiusRatio: 0.32 },
    { name: 8, radiusRatio: 0.38 },
    { name: 9, radiusRatio: 0.44 }, // 수박
    { name: 10, radiusRatio: 0.50 }
];

// DOM & 상수
const main = document.querySelector("#game-area");
const uiLayer = document.querySelector("#ui-layer");
const scoreEl = document.querySelector("#score");
const startBtn = document.querySelector("#start-btn");
const rankDisplay = document.querySelector("#rank-display");
// const popSound = new Audio("pop.wav"); // pop.wav가 같은 폴더에 있어야 함
const IMG_PATH = "img/watermelon_Img/"; // 이미지 경로 주의!

// [신규] 파일 없이 소리 내는 함수 (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPopSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 소리 설정 ("뽁" 느낌)
    oscillator.type = 'sine'; // 부드러운 사인파
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 시작 높이 (800Hz)
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1); // 0.1초 만에 뚝 떨어짐

    // 볼륨 설정 (짧게 치고 빠지기)
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1); // 0.1초 뒤 정지
}

// 게임 변수
let isGameOver = true;
let isReady = false;
let score = 0;
let currentBody = null;
let currentFruitIndex = 0;
let disableAction = false;

// 1. 이미지 프리로딩
FRUITS_BASE.forEach(fruit => {
    const img = new Image();
    img.src = `${IMG_PATH}${fruit.name}.png`;
});

// 2. 물리 엔진 초기화
const engine = Engine.create();
const world = engine.world;
const render = Render.create({
    element: main,
    engine: engine,
    options: {
        wireframes: false, background: 'transparent',
        width: main.clientWidth, height: main.clientHeight,
        pixelRatio: window.devicePixelRatio || 1
    }
});
const runner = Runner.create({ isFixed: true, delta: 1000/60 });

// 3. 무한의 벽 (모바일 뚫림 방지)
const WALL_THICK = 100;
const WALL_LEN = 10000;
const leftWall = Bodies.rectangle(0, 0, WALL_THICK, WALL_LEN, { isStatic: true, render: { fillStyle: "#ffcc80" } });
const rightWall = Bodies.rectangle(0, 0, WALL_THICK, WALL_LEN, { isStatic: true, render: { fillStyle: "#ffcc80" } });
const ground = Bodies.rectangle(0, 0, WALL_LEN, WALL_THICK, { isStatic: true, render: { fillStyle: "#ffcc80" } });

// 게임 시작
function startGame() {
    isGameOver = false; isReady = true; score = 0; scoreEl.innerText = 0;
    Composite.clear(world, false);
    handleResize(); // 벽 위치 잡기
    World.add(world, [leftWall, rightWall, ground]);
    uiLayer.classList.add("hidden");
    createNewFruit();
    Render.run(render);
    Runner.run(runner, engine);
}

// 과일 생성
function createNewFruit() {
    if(isGameOver) return;
    currentFruitIndex = Math.floor(Math.random() * 5);
    const fruit = FRUITS_BASE[currentFruitIndex];
    const r = main.clientWidth * fruit.radiusRatio / 2;

    currentBody = Bodies.circle(main.clientWidth/2, 50, r, {
        isSleeping: true,
        render: { sprite: { texture: `${IMG_PATH}${fruit.name}.png`, xScale: 1, yScale: 1 } },
        restitution: 0.2
    });
    // 스케일 보정
    const img = new Image();
    img.src = `${IMG_PATH}${fruit.name}.png`;
    img.onload = () => {
        if(currentBody) {
            const scale = (r * 2) / img.width;
            currentBody.render.sprite.xScale = scale;
            currentBody.render.sprite.yScale = scale;
        }
    }
    World.add(world, currentBody);
}

// 조작 이벤트 (통합)
function handleInput(x) {
    if(isGameOver || disableAction || !currentBody) return;
    const r = currentBody.circleRadius;
    const limitX = main.clientWidth;
    // 벽 안쪽으로 가두기
    if(x < r + WALL_THICK/2) x = r + WALL_THICK/2;
    if(x > limitX - r - WALL_THICK/2) x = limitX - r - WALL_THICK/2;
    Body.setPosition(currentBody, { x: x, y: currentBody.position.y });
}
function handleDrop() {
    if(isGameOver || disableAction || !currentBody) return;
    disableAction = true;
    currentBody.isSleeping = false;
    currentBody = null;
    setTimeout(() => { disableAction = false; createNewFruit(); }, 500);
}

// 이벤트 리스너
main.addEventListener("mousemove", e => handleInput(e.offsetX));
main.addEventListener("touchmove", e => {
    e.preventDefault();
    handleInput(e.touches[0].clientX - main.getBoundingClientRect().left);
}, { passive: false });
main.addEventListener("mouseup", handleDrop);
main.addEventListener("touchend", handleDrop);

// 충돌 & 합치기
Events.on(engine, "collisionStart", e => {
    e.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        if(bodyA.render.sprite.texture === bodyB.render.sprite.texture && bodyA.label !== "merge") {
            bodyA.label = "merge"; bodyB.label = "merge";
            World.remove(world, [bodyA, bodyB]);
            
            score += 10; scoreEl.innerText = score;
            playPopSound();

            const pathParts = bodyA.render.sprite.texture.split("/");
            const idx = parseInt(pathParts[pathParts.length-1].split(".")[0]);
            
            if(idx < FRUITS_BASE.length - 1) {
                const nextFruit = FRUITS_BASE[idx+1];
                const r = main.clientWidth * nextFruit.radiusRatio / 2;
                const newBody = Bodies.circle(
                    (bodyA.position.x+bodyB.position.x)/2,
                    (bodyA.position.y+bodyB.position.y)/2,
                    r,
                    { render: { sprite: { texture: `${IMG_PATH}${nextFruit.name}.png`, xScale:1, yScale:1 } }, restitution:0.2 }
                );
                const img = new Image();
                img.src = `${IMG_PATH}${nextFruit.name}.png`;
                img.onload = () => {
                    const scale = (r * 2) / img.width;
                    newBody.render.sprite.xScale = scale;
                    newBody.render.sprite.yScale = scale;
                }
                World.add(world, newBody);
            }
        }
    });
});

// 게임오버 체크 (간단버전: 과일이 너무 높이 쌓이면)
setInterval(() => {
    if(isGameOver || !isReady) return;
    Composite.allBodies(world).forEach(b => {
        if(!b.isStatic && !b.isSleeping && b.position.y < 40 && b.velocity.y < 0.1) {
            gameOver();
        }
    });
}, 1000);

function gameOver() {
    isGameOver = true; isReady = false;
    Runner.stop(runner);
    saveRank(score);
    uiLayer.classList.remove("hidden");
    startBtn.innerText = "RESTART";
}


// 리사이즈 & 랭킹
function handleResize() {
    const w = main.clientWidth; const h = main.clientHeight;
    render.canvas.width = w; render.canvas.height = h;
    Body.setPosition(leftWall, { x: -WALL_THICK/2, y: h/2 });
    Body.setPosition(rightWall, { x: w + WALL_THICK/2, y: h/2 });
    Body.setPosition(ground, { x: w/2, y: h + WALL_THICK/2 });
}
window.addEventListener("resize", () => { handleResize(); });

function saveRank(sc) {
    const KEY = "momizi_rank_final";
    let r = JSON.parse(localStorage.getItem(KEY)) || [];
    if(sc > 0) {
        r.push({s:sc, d:new Date().toLocaleDateString()});
        r.sort((a,b)=>b.s - a.s);
        localStorage.setItem(KEY, JSON.stringify(r.slice(0,5)));
    }
    let h = "<h3>🏆 명예의 전당 🏆</h3>";
    r.forEach((v,i)=> h += `<div class="rank-item ${i==0?'rank-1':''}">${i+1}위 : ${v.s}점</div>`);
    rankDisplay.innerHTML = h || "기록이 없습니다.";
}

startBtn.addEventListener("click", startGame);
saveRank(0); // 랭킹 로드
handleResize();
