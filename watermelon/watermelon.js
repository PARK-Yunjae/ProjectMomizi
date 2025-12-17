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

// 기본 과일 크기 (PC 기준 지름)
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

// 물리 엔진 초기화
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
        pixelRatio: window.devicePixelRatio || 1 // 고해상도 대응
    }
});

// 벽 두께 (보이지 않게 처리하거나 얇게 보이게)
const wallThick = 50; 
const wallLength = 10000;

// 벽 생성 (초기 위치는 임시, handleResize에서 재설정됨)
const leftWall = Bodies.rectangle(0, 0, wallThick, wallLength, {
    isStatic: true, render: { fillStyle: "#FFD700" } // 노란색
});
const rightWall = Bodies.rectangle(0, 0, wallThick, wallLength, {
    isStatic: true, render: { fillStyle: "#FFD700" }
});
const ground = Bodies.rectangle(0, 0, wallLength, wallThick, {
    isStatic: true, render: { fillStyle: "#FFD700" }
});
const overLine = Bodies.rectangle(0, 0, 100, 1, {
    isStatic: true, isSensor: true, render: { fillStyle: "white" }
});

const runner = Runner.create();

// 스케일 및 벽 위치 업데이트 함수 (핵심!)
function updateGameLayout() {
    const width = main.clientWidth;
    const height = main.clientHeight;

    // 1. 스케일 계산 (450px 기준)
    const referenceWidth = 450;
    currentGlobalScale = Math.min(1, width / referenceWidth);

    // 2. 렌더러 크기 업데이트
    render.canvas.width = width * (window.devicePixelRatio || 1); // 실제 픽셀
    render.canvas.height = height * (window.devicePixelRatio || 1);
    render.options.width = width; // CSS 픽셀
    render.options.height = height;
    
    // [중요] 렌더링 범위(Bounds) 재설정 - 이게 없으면 벽이 잘림!
    render.bounds.max.x = width;
    render.bounds.max.y = height;

    // 3. 벽 위치 재배치 (화면 안쪽으로 살짝 들어오게 배치)
    // 왼쪽 벽: 중심이 -25px (두께 50의 절반) -> 화면에 0px부터 시작하게 하려면 x를 -25로
    // 하지만 "노란 벽이 보여야" 한다면 x를 0으로 설정하면 절반(25px)이 보임
    Body.setPosition(leftWall, { x: -wallThick/2 + 10, y: height / 2 }); 
    Body.setPosition(rightWall, { x: width + wallThick/2 - 10, y: height / 2 });
    Body.setPosition(ground, { x: width / 2, y: height + wallThick/2 - 10 });
    
    // 오버라인 위치
    Body.setPosition(overLine, { x: width / 2, y: 50 }); // 위에서 50px 아래
    Body.scale(overLine, width / 100, 1); // 라인 길이 맞춤
}

// 리사이즈 이벤트
window.addEventListener('resize', () => {
    updateGameLayout();
    // 대기 중인 과일 위치 보정
    if (currentBody && currentCircle) {
        let x = currentBody.position.x;
        const r = currentCircle.radius * currentGlobalScale; // 현재 스케일 적용된 반지름
        const width = main.clientWidth;
        
        // 화면 밖으로 나가지 않게
        if (x < r + 15) x = r + 15;
        if (x > width - r - 15) x = width - r - 15;
        
        Body.setPosition(currentBody, { x: x, y: 30 });
    }
});

function gameStart() {
    isGameOver = false;
    start.style.display = "none";
    score.innerHTML = 0;
    
    updateGameLayout(); // 시작 전 레이아웃 잡기
    
    World.add(world, [leftWall, rightWall, ground, overLine]);
    Render.run(render);
    Runner.run(runner, engine);
    
    addCircle();
}

// 시작 버튼
start.addEventListener("click", () => {
    if (isReady) {
        main.style.opacity = 1;
        gameStart();
    }
});

let currentBody = null;
let currentCircle = null;
let isClick = true;

function addCircle() {
    let index = parseInt(Math.random() * 3);
    let circleDef = CIRCLES[index];
    
    // 현재 스케일에 맞는 반지름 계산
    const scaledRadius = circleDef.baseRadius * currentGlobalScale;

    const body = Bodies.circle(main.clientWidth / 2, 30, scaledRadius, {
        index: index,
        isSleeping: true,
        render: {
            sprite: {
                texture: `../img/watermelon_Img/${circleDef.name}.png`,
                xScale: currentGlobalScale,
                yScale: currentGlobalScale
            }
        },
        restitution: 0.5
    });

    currentBody = body;
    currentCircle = circleDef; // 원본 데이터 저장
    World.add(world, currentBody);
}

// 입력 핸들러 (마우스/터치 통합)
function handleInputMove(clientX) {
    if (isGameOver || !isClick || !currentBody) return;

    const mainRect = main.getBoundingClientRect();
    let x = clientX - mainRect.left;
    const width = main.clientWidth;
    const r = currentCircle.baseRadius * currentGlobalScale; // 실시간 반지름 계산

    // 벽 안쪽으로 제한
    if (x < r + 15) x = r + 15;
    if (x > width - r - 15) x = width - r - 15;

    Body.setPosition(currentBody, { x: x, y: 30 });
}

function handleInputEnd() {
    if (isGameOver || !isClick || !currentBody) return;
    
    isClick = false;
    currentBody.isSleeping = false;
    
    setTimeout(() => {
        addCircle();
        isClick = true;
    }, 500);
}

// 이벤트 리스너 등록
main.addEventListener("mousemove", (e) => handleInputMove(e.clientX));
main.addEventListener("touchmove", (e) => {
    e.preventDefault(); // 스크롤 방지
    handleInputMove(e.touches[0].clientX);
}, { passive: false });

main.addEventListener("mouseup", handleInputEnd);
main.addEventListener("touchend", handleInputEnd);

// 충돌 이벤트 (합치기 로직)
Events.on(engine, "collisionStart", (e) => {
    e.pairs.forEach(collision => {
        if (collision.bodyA.index === collision.bodyB.index) {
            const index = collision.bodyA.index;
            if (index === CIRCLES.length - 1) return; // 수박이면 끝

            World.remove(world, [collision.bodyA, collision.bodyB]);

            const nextCircle = CIRCLES[index + 1];
            const scaledRadius = nextCircle.baseRadius * currentGlobalScale;

            scoreNum += (index + 1) * 10;
            score.innerHTML = scoreNum;
            pop.play();

            const newBody = Bodies.circle(
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                scaledRadius,
                {
                    index: index + 1,
                    render: {
                        sprite: {
                            texture: `../img/watermelon_Img/${nextCircle.name}.png`,
                            xScale: currentGlobalScale,
                            yScale: currentGlobalScale
                        }
                    },
                    restitution: 0.5
                }
            );
            World.add(world, newBody);
        }
        
        // 게임오버 체크
        if (!currentBody.isSleeping && (collision.bodyA.name === "overLine" || collision.bodyB.name === "overLine")) {
             // 여기에 게임오버 로직 추가 (endGame 함수 호출)
             // endGame(); 
        }
    });
});

// 초기 실행
updateGameLayout();
