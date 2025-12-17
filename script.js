// [설정] 물리 엔진 모듈
const { Engine, Render, Runner, Bodies, World, Body, Events, Composite } = Matter;

// [설정] 게임 상수
const FRUITS_BASE = [
    { name: 0, radiusRatio: 0.07 }, // 체리 (화면 너비의 7%)
    { name: 1, radiusRatio: 0.10 },
    { name: 2, radiusRatio: 0.13 },
    { name: 3, radiusRatio: 0.16 },
    { name: 4, radiusRatio: 0.20 },
    { name: 5, radiusRatio: 0.24 },
    { name: 6, radiusRatio: 0.28 },
    { name: 7, radiusRatio: 0.32 },
    { name: 8, radiusRatio: 0.38 },
    { name: 9, radiusRatio: 0.44 }, // 수박
    { name: 10, radiusRatio: 0.50 }  // 황금 수박 (선택 사항)
];

// DOM 요소
const main = document.querySelector("#game-area");
const uiLayer = document.querySelector("#ui-layer");
const scoreEl = document.querySelector("#score");
const startBtn = document.querySelector("#start-btn");
const rankDisplay = document.querySelector("#rank-display");
const popSound = new Audio("pop.wav"); // 같은 폴더에 pop.wav 위치

// 상태 변수
let isGameOver = true;
let isReady = false; // 조작 가능 여부
let score = 0;
let currentBody = null;
let currentFruitIndex = 0;
let disableAction = false; // 과일 떨어지는 중 클릭 방지

// 1. [최적화] 이미지 미리 로딩 (메모리 렉 방지)
FRUITS_BASE.forEach(fruit => {
    const img = new Image();
    img.src = `img/watermelon_Img/${fruit.name}.png`;
});

// 2. 엔진 초기화
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

// 3. [최적화] 러너 설정 (속도 일정하게 유지)
const runner = Runner.create({
    isFixed: true, // 프레임 속도 고정 (컴퓨터 성능 영향 최소화)
    delta: 1000 / 60 // 60FPS 기준 계산
});

// 4. [최적화] 무한의 벽 생성 (모바일 벽 뚫림 방지)
const WALL_THICKNESS = 100;
const WALL_LENGTH = 10000; // 엄청 긴 벽
const leftWall = Bodies.rectangle(0, 0, WALL_THICKNESS, WALL_LENGTH, { isStatic: true, render: { fillStyle: "#ffcc80" } });
const rightWall = Bodies.rectangle(0, 0, WALL_THICKNESS, WALL_LENGTH, { isStatic: true, render: { fillStyle: "#ffcc80" } });
const ground = Bodies.rectangle(0, 0, WALL_LENGTH, WALL_THICKNESS, { isStatic: true, render: { fillStyle: "#ffcc80" } });
const topSensor = Bodies.rectangle(0, 0, WALL_LENGTH, 10, { isStatic: true, isSensor: true, render: { visible: false } }); // 게임오버 라인

// 5. 게임 시작 함수
function startGame() {
    isGameOver = false;
    isReady = true;
    score = 0;
    scoreEl.innerText = 0;
    disableAction = false;
    
    // 기존 과일 제거
    Composite.clear(world, false);
    // 벽 & 바닥 재배치
    handleResize(); 
    World.add(world, [leftWall, rightWall, ground, topSensor]);
    
    // UI 숨김
    uiLayer.classList.add("hidden");
    
    // 첫 과일 생성
    createNewFruit();
    
    Render.run(render);
    Runner.run(runner, engine);
}

// 6. 과일 생성 (대기 상태)
function createNewFruit() {
    if (isGameOver) return;
    
    currentFruitIndex = Math.floor(Math.random() * 5); // 0~4번 과일 중 랜덤
    const fruitInfo = FRUITS_BASE[currentFruitIndex];
    const radius = main.clientWidth * fruitInfo.radiusRatio / 2;
    
    currentBody = Bodies.circle(main.clientWidth / 2, 50, radius, {
        isSleeping: true, // 떨어지기 전엔 멈춤 상태
        render: {
            sprite: {
                texture: `img/watermelon_Img/${fruitInfo.name}.png`,
                xScale: (radius * 2) / 200, // 이미지 원본 크기에 맞춰 조정 필요 (여기선 대략적 비율)
                yScale: (radius * 2) / 200
            }
        },
        restitution: 0.2 // 탄성 조절 (너무 통통 튀지 않게)
    });
    
    // 이미지 스케일 정밀 보정 (이미지 로드 후 사이즈에 맞춰 다시 계산하는게 좋으나 약식으로 처리)
    const img = new Image();
    img.src = `img/watermelon_Img/${fruitInfo.name}.png`;
    img.onload = () => {
        if(!currentBody) return;
        const scale = (radius * 2) / img.width;
        currentBody.render.sprite.xScale = scale;
        currentBody.render.sprite.yScale = scale;
    }

    World.add(world, currentBody);
}

// 7. 입력 이벤트 (PC/모바일 통합)
function handleInput(x) {
    if (isGameOver || disableAction || !currentBody) return;
    
    // 벽 넘어가지 않게 클램핑
    const radius = currentBody.circleRadius;
    if (x < radius + WALL_THICKNESS/2) x = radius + WALL_THICKNESS/2; // 벽 두께 고려
    if (x > main.clientWidth - radius - WALL_THICKNESS/2) x = main.clientWidth - radius - WALL_THICKNESS/2;
    
    Body.setPosition(currentBody, { x: x, y: currentBody.position.y });
}

function handleDrop() {
    if (isGameOver || disableAction || !currentBody) return;
    
    disableAction = true; // 딜레이 동안 조작 금지
    currentBody.isSleeping = false; // 깨워서 떨어뜨림
    currentBody = null; // 손에서 놓음

    // 0.5초 뒤 다음 과일 생성
    setTimeout(() => {
        disableAction = false;
        createNewFruit();
    }, 500);
}

// 이벤트 리스너 연결
main.addEventListener("mousemove", e => handleInput(e.offsetX));
main.addEventListener("touchmove", e => {
    e.preventDefault(); // 스크롤 방지
    const rect = main.getBoundingClientRect();
    handleInput(e.touches[0].clientX - rect.left);
}, { passive: false });

main.addEventListener("mouseup", handleDrop);
main.addEventListener("touchend", handleDrop);


// 8. 충돌 이벤트 (합치기 로직)
Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // 같은 과일끼리 충돌 시
        // sprite.texture 경로로 같은 과일인지 판별 (index 속성을 따로 줘도 됨)
        if (bodyA.render.sprite.texture === bodyB.render.sprite.texture && bodyA.label !== "processed") {
             // 이미 처리된 충돌인지 체크를 위해 label 사용 (동시 충돌 버그 방지)
            bodyA.label = "processed"; 
            bodyB.label = "processed";

            World.remove(world, [bodyA, bodyB]);
            
            // 점수 증가
            score += 10;
            scoreEl.innerText = score;
            popSound.play().catch(() => {}); // 소리 재생 오류 무시

            // 다음 단계 과일 찾기
            const currentSrc = bodyA.render.sprite.texture;
            // 예: img/watermelon_Img/0.png -> 숫자 추출
            const currIdx = parseInt(currentSrc.split("/").pop().split(".")[0]);
            
            if (currIdx < FRUITS_BASE.length - 1) {
                const nextFruit = FRUITS_BASE[currIdx + 1];
                const radius = main.clientWidth * nextFruit.radiusRatio / 2;
                
                const newBody = Bodies.circle(
                    (bodyA.position.x + bodyB.position.x) / 2,
                    (bodyA.position.y + bodyB.position.y) / 2,
                    radius,
                    {
                        render: {
                            sprite: {
                                texture: `img/watermelon_Img/${nextFruit.name}.png`,
                                xScale: 1, yScale: 1 // 생성 후 아래 onload에서 보정
                            }
                        },
                        restitution: 0.2
                    }
                );
                
                // 스케일 보정
                const img = new Image();
                img.src = `img/watermelon_Img/${nextFruit.name}.png`;
                img.onload = () => {
                    const scale = (radius * 2) / img.width;
                    newBody.render.sprite.xScale = scale;
                    newBody.render.sprite.yScale = scale;
                }

                World.add(world, newBody);
            }
        }
        
        // 게임오버 체크 (바닥이 아닌 위쪽 센서에 닿았을 때 & 떨어지는 중이 아닐 때)
        // 로직 단순화를 위해: 과일이 너무 높이 쌓이면 게임오버
        // 여기선 topSensor 사용 대신 간단하게 y좌표로 체크 가능
    });
});

// 게임오버 체크 루프 (1초마다)
setInterval(() => {
    if (isGameOver || !isReady) return;
    
    Composite.allBodies(world).forEach(body => {
        if (!body.isStatic && !body.isSleeping && body.position.y < 50 && body.velocity.y < 0.1) {
            // 과일이 화면 상단(y=50)보다 위에 있고, 멈춰있다면(쌓였다면)
            gameOver();
        }
    });
}, 1000);

function gameOver() {
    isGameOver = true;
    isReady = false;
    Runner.stop(runner);
    
    // 9. [기능] 랭킹 저장 및 표시
    saveAndShowRank(score);
    
    uiLayer.classList.remove("hidden");
    startBtn.innerText = "다시 하기";
}

// 10. [최적화] 화면 리사이즈 대응 (무한의 벽 위치 이동)
function handleResize() {
    const w = main.clientWidth;
    const h = main.clientHeight;
    
    render.canvas.width = w;
    render.canvas.height = h;
    
    // 벽 위치 재조정 (두께 절반만큼 바깥으로 밀기)
    Body.setPosition(leftWall, { x: -WALL_THICKNESS/2, y: h/2 });
    Body.setPosition(rightWall, { x: w + WALL_THICKNESS/2, y: h/2 });
    Body.setPosition(ground, { x: w/2, y: h + WALL_THICKNESS/2 });
    Body.setPosition(topSensor, { x: w/2, y: 0 }); // 상단 센서
}

window.addEventListener("resize", () => {
    handleResize();
    // 리사이즈 시 기존 과일들 크기 비율 재조정이 필요하지만, 
    // 물리 엔진상 복잡하므로 여기서는 위치만 잡습니다.
});

// 11. [기능] 랭킹 시스템 (LocalStorage)
function saveAndShowRank(newScore) {
    const KEY = "momizi_rank_v2";
    let ranks = JSON.parse(localStorage.getItem(KEY)) || [];
    
    // 점수 저장 (0점이 아니면)
    if (newScore > 0) {
        ranks.push({ score: newScore, date: new Date().toLocaleDateString() });
        ranks.sort((a, b) => b.score - a.score); // 내림차순
        ranks = ranks.slice(0, 5); // 5등까지
        localStorage.setItem(KEY, JSON.stringify(ranks));
    }
    
    // 랭킹 보여주기
    let html = "<h3>🏆 명예의 전당 🏆</h3>";
    ranks.forEach((r, i) => {
        html += `<div class="rank-item ${i===0?'rank-1':''}">${i+1}위 : ${r.score}점</div>`;
    });
    if(ranks.length === 0) html += "<div>아직 기록이 없습니다. 도전하세요!</div>";
    
    rankDisplay.innerHTML = html;
}

// 초기화
startBtn.addEventListener("click", startGame);
// 페이지 로드 시 랭킹만 먼저 보여줌
saveAndShowRank(0);
handleResize();
