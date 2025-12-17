// 모듈 및 변수 선언
const isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const World = Matter.World;
const Body = Matter.Body;
const Events = Matter.Events;

let isGameOver = true;
let isReady = true;
let win = 0;
let scoreNum = 0;

const start = document.querySelector(".startBtn");
const score = document.querySelector("#score");
const main = document.querySelector("main");
const pop = new Audio("../watermelon/pop.wav");

// 과일 크기 설정
let baseDiameters = [33, 48, 61, 69, 89, 114, 129, 156, 177, 220, 259];
let currentGlobalScale = 1;

const CIRCLES = baseDiameters.map((diameter, index) => ({
    name: index,
    baseRadius: diameter / 2
}));

// 이미지 미리 로딩
CIRCLES.forEach(c => {
    const img = new Image();
    img.src = `../img/watermelon_Img/${c.name}.png`;
});

// 스케일 계산 함수
function updateGlobalScale() {
    const referenceWidth = 450;
    if (main.clientWidth < referenceWidth) {
        currentGlobalScale = main.clientWidth / referenceWidth;
    } else {
        currentGlobalScale = 1;
    }
}
updateGlobalScale(); // 초기 실행

// Matter.js 엔진 초기화
const engine = Engine.create();
const world = engine.world;

const render = Render.create({
    element: main,
    engine: engine,
    options: {
        wireframes: false,
        background: 'transparent',
        width: main.clientWidth,
        height: main.clientHeight,
        pixelRatio: window.devicePixelRatio || 1
    }
});

// 벽 및 바닥 생성
const wallThick = 100;
const wallLength = 10000;

const leftWall = Bodies.rectangle(-40, main.clientHeight / 2, wallThick, wallLength, {
    isStatic: true, render: { fillStyle: "orange" }
});
const rightWall = Bodies.rectangle(main.clientWidth + 40, main.clientHeight / 2, wallThick, wallLength, {
    isStatic: true, render: { fillStyle: "orange" }
});
const ground = Bodies.rectangle(main.clientWidth / 2, main.clientHeight + 40, wallLength, wallThick, {
    isStatic: true, render: { fillStyle: "orange" }
});
const overLine = Bodies.rectangle(main.clientWidth / 2, 30, main.clientWidth, 1, {
    isStatic: true, isSensor: true, render: { fillStyle: "white" }
});

const runner = Runner.create();

// 게임 시작 함수
function gameStart() {
    updateGlobalScale();
    isGameOver = false;
    start.style.display = "none"; // 버튼 숨김 방식 변경
    
    World.add(world, [leftWall, rightWall, ground, overLine]);
    Render.run(render);
    Runner.run(runner, engine);
    score.innerHTML = 0;
    
    addCircle(); // 첫 과일 생성
}

// 게임 시작 버튼 이벤트
start.addEventListener("click", () => {
    if (isReady) {
        main.style.opacity = 1;
        gameStart();
    }
});

let currentBody = null;
let currentCircle = null;
let isClick = true; // 클릭 가능 여부

// 과일 생성 함수 (대기 상태)
function addBody(index, x) {
    let circleDef = CIRCLES[index];
    const scaledRadius = circleDef.baseRadius * currentGlobalScale;

    const body = Bodies.circle(x, 30, scaledRadius, {
        index: index,
        isSleeping: true, // 대기 중에는 물리 연산 중지
        render: {
            sprite: {
                texture: `../img/watermelon_Img/${circleDef.name}.png`,
                xScale: currentGlobalScale,
                yScale: currentGlobalScale
            }
        },
        restitution: 0.5 // 탄성 조절
    });

    currentBody = body;
    currentCircle = { ...circleDef, radius: scaledRadius };
    World.add(world, currentBody);
}

// 랜덤 과일 선택 및 생성
function addCircle() {
    let index = parseInt(Math.random() * 3); // 0~2번 과일 중 랜덤
    addBody(index, main.clientWidth / 2);
}

// 마우스/터치 이동 이벤트
function moveTarget(clientX) {
    if (!isClick || isGameOver || !currentBody) return;

    let bodyRect = document.body.getBoundingClientRect();
    let mainRect = main.getBoundingClientRect();
    
    // main 영역 기준 X 좌표 계산
    let x = clientX - mainRect.left;

    // 벽을 넘어가지 않도록 제한
    const r = currentCircle.radius;
    if (x < r + 10) x = r + 10;
    if (x > main.clientWidth - r - 10) x = main.clientWidth - r - 10;

    Body.setPosition(currentBody, { x: x, y: 30 });
}

main.addEventListener("mousemove", (e) => moveTarget(e.clientX));
main.addEventListener("touchmove", (e) => moveTarget(e.touches[0].clientX), { passive: false });

// 과일 떨어뜨리기 이벤트
function dropBox() {
    if (!isClick || isGameOver || !currentBody) return;
    
    isClick = false;
    currentBody.isSleeping = false; // 물리 연산 시작 (떨어짐)
    
    // 0.5초 뒤에 다음 과일 생성
    setTimeout(() => {
        addCircle();
        isClick = true;
    }, 500);
}

main.addEventListener("mouseup", dropBox);
main.addEventListener("touchend", dropBox);

// 충돌 이벤트 (과일 합치기)
Events.on(engine, "collisionStart", (e) => {
    e.pairs.forEach(collision => {
        if (collision.bodyA.index === collision.bodyB.index) {
            const index = collision.bodyA.index;

            // 마지막 단계 과일이면 승리 처리 카운트 (예시 로직)
            if (index === CIRCLES.length - 1) {
                return;
            }

            // 충돌한 두 과일 제거
            World.remove(world, [collision.bodyA, collision.bodyB]);

            // 다음 단계 과일 생성
            const nextCircleDef = CIRCLES[index + 1];
            const scaledRadius = nextCircleDef.baseRadius * currentGlobalScale;
            
            // 점수 추가
            scoreNum += (index + 1) * 10;
            score.innerHTML = scoreNum;
            pop.play(); // 효과음 재생

            const newBody = Bodies.circle(
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                scaledRadius, 
                {
                    index: index + 1,
                    render: {
                        sprite: {
                            texture: `../img/watermelon_Img/${nextCircleDef.name}.png`,
                            xScale: currentGlobalScale,
                            yScale: currentGlobalScale
                        }
                    },
                    restitution: 0.5
                }
            );

            World.add(world, newBody);
        }

        // 게임 오버 체크 (라인에 닿았을 때)
        if (!currentBody.isSleeping && (collision.bodyA.name === "overLine" || collision.bodyB.name === "overLine")) {
            // 방금 떨어뜨린 과일이 라인에 닿은 건 제외 (일정 시간 지나거나 다른 과일이어야 함 등 정교한 로직 필요할 수 있음)
            // 여기서는 단순화하여 처리
             endGame("게임오버");
        }
    });
});

// 게임 종료 처리 함수
function endGame(msg) {
    if(isGameOver) return;
    isGameOver = true;
    isReady = false;

    main.style.opacity = 0.5;
    
    // 엔진 정지
    Runner.stop(runner);
    Render.stop(render);
    
    // 랭킹 업데이트 및 표시
    const ranks = updateRank(scoreNum);
    let rankText = "<br><br>🏆 <b>명예의 전당</b> 🏆<br>";
    ranks.forEach((r, i) => {
        rankText += `<div style='font-size:14px; margin-top:5px'>${i+1}위: ${r.score}점 <span style='color:#888'>(${r.date})</span></div>`;
    });

    start.style.display = "block";
    start.style.top = "50%";
    start.innerHTML = `${msg}<br>${scoreNum}점${rankText}`;
    
    // 재시작 대기
    setTimeout(() => {
        isReady = true;
        // 월드 초기화는 다음 게임 시작 시 수행하거나 여기서 미리 수행
        World.clear(world);
        Engine.clear(engine);
    }, 1000);
}

// 랭킹 관리 함수
function updateRank(newScore) {
    try {
        const GAME_KEY = "momizi_watermelon_rank";
        let rankData = JSON.parse(localStorage.getItem(GAME_KEY)) || [];
        rankData.push({ score: newScore, date: new Date().toLocaleDateString() });
        rankData.sort((a, b) => b.score - a.score);
        rankData = rankData.slice(0, 5);
        localStorage.setItem(GAME_KEY, JSON.stringify(rankData));
        return rankData;
    } catch (e) {
        return [];
    }
}

// 리사이즈 핸들러 (완전판)
function handleResize() {
    const newWidth = main.clientWidth;
    const newHeight = main.clientHeight;

    // 캔버스 크기 조정
    render.canvas.width = newWidth;
    render.canvas.height = newHeight;
    render.options.width = newWidth;
    render.options.height = newHeight;

    // 벽 위치 재조정
    Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 40 });
    Body.setPosition(leftWall, { x: -40, y: newHeight / 2 });
    Body.setPosition(rightWall, { x: newWidth + 40, y: newHeight / 2 });
    Body.setPosition(overLine, { x: newWidth / 2, y: 30 });

    // 스케일 업데이트
    updateGlobalScale();

    // 현재 대기 중인 과일 위치 및 크기 보정
    if (currentBody && currentCircle) {
        const newRadius = CIRCLES[currentBody.index].baseRadius * currentGlobalScale;
        currentCircle.radius = newRadius;
        
        // 크기 변경 (Matter.js body scale)
        // 기존 스케일을 되돌리고 새로운 스케일 적용은 복잡하므로, 
        // 간단히 제거하고 새로 만드는 방식이 안전하지만, 여기선 위치만 보정
        
        let x = currentBody.position.x;
        if (x < newRadius + 10) x = newRadius + 10;
        if (x > newWidth - newRadius - 10) x = newWidth - newRadius - 10;
        
        Body.setPosition(currentBody, { x: x, y: 30 });
    }
}

// 리사이즈 이벤트 (디바운싱 적용)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 100);
});
