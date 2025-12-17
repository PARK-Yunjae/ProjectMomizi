const nicknameInput = document.querySelector("#nickname"); // 입력창 선택
let currentNickname = "익명"; // 기본값

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
const WALL_THICK = 30;
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

// [수정] 과일 이동 범위 제한 (벽 안쪽으로)
function handleInput(x) {
    if(isGameOver || disableAction || !currentBody) return;
    
    const r = currentBody.circleRadius;
    const limitX = main.clientWidth;
    
    // 벽 두께(WALL_THICK) 만큼 더 안쪽으로 제한
    // 왼쪽 제한: 반지름 + 벽 두께
    if(x < r + WALL_THICK) x = r + WALL_THICK;
    
    // 오른쪽 제한: 전체너비 - 반지름 - 벽 두께
    if(x > limitX - r - WALL_THICK) x = limitX - r - WALL_THICK;
    
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


// [수정] 벽 위치를 화면 '안쪽'으로 배치
function handleResize() {
    const w = main.clientWidth;
    const h = main.clientHeight;
    // 1. 기기 픽셀 비율 가져오기 (없으면 1)
    const pixelRatio = window.devicePixelRatio || 1;
    
    // 2. 캔버스 물리적 크기 (고해상도 대응)
    render.canvas.width = w * pixelRatio;
    render.canvas.height = h * pixelRatio;
    
    // 3. 캔버스 CSS 스타일 크기 (화면 표시용)
    render.canvas.style.width = `${w}px`;
    render.canvas.style.height = `${h}px`;
    
    // 4. [중요] Context 스케일 복구 (이게 없으면 그림이 작게 나옴!)
    render.context.scale(pixelRatio, pixelRatio);

    // 5. Matter.js 옵션 동기화
    render.options.width = w;
    render.options.height = h;

    // 6. 벽 위치 재조정 (기존 로직 유지)
    Body.setPosition(leftWall, { x: WALL_THICK / 2, y: h / 2 });
    Body.setPosition(rightWall, { x: w - WALL_THICK / 2, y: h / 2 }); // 오른쪽 벽 위치 보정
    Body.setPosition(ground, { x: w / 2, y: h - WALL_THICK / 2 });
}

window.addEventListener("resize", () => { handleResize(); });

// [수정] 랭킹 시스템 (닉네임 포함)
function saveRank(sc) {
    const KEY = "momizi_rank_final";
    let r = JSON.parse(localStorage.getItem(KEY)) || [];

    // 0점 이상일 때만 저장 시도
    if (sc > 0) {
        // 이름, 점수, 날짜 함께 저장
        r.push({ name: currentNickname, s: sc, d: new Date().toLocaleDateString() });
        
        // 점수 내림차순 정렬
        r.sort((a, b) => b.s - a.s);
        
        // 상위 5등까지만 자르기
        r = r.slice(0, 5);
        
        localStorage.setItem(KEY, JSON.stringify(r));
    }

    // 랭킹 보여주기 HTML 생성
    let h = "<h3>🏆 명예의 전당 🏆</h3>";
    if (r.length === 0) {
        h += "<p>아직 기록이 없습니다.<br>첫 번째 주인공이 되어보세요!</p>";
    } else {
        r.forEach((v, i) => {
            // 1,2,3등은 메달 표시
            let medal = "";
            if (i === 0) medal = "🥇";
            else if (i === 1) medal = "🥈";
            else if (i === 2) medal = "🥉";
            else medal = `${i + 1}위`;

            h += `<div class="rank-item ${i === 0 ? 'rank-1' : ''}">
                    <span class="rank-medal">${medal}</span>
                    <span class="rank-name">${v.name}</span>
                    <span class="rank-score">${v.s}점</span>
                  </div>`;
        });
    }
    rankDisplay.innerHTML = h;
}

// [수정] 게임 시작 버튼 클릭 시 닉네임 체크
startBtn.addEventListener("click", () => {
    const name = nicknameInput.value.trim();
    
    if (!name) {
        alert("닉네임을 입력해주세요!");
        nicknameInput.focus();
        return;
    }
    
    currentNickname = name; // 닉네임 저장
    startGame();
});
saveRank(0); // 랭킹 로드
// [추가] 돔 로드 완료 후 한번 더 확실하게 리사이징
window.addEventListener('DOMContentLoaded', handleResize);
handleResize();
