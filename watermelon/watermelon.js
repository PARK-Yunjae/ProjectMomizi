// 모듈 종류
const isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
let isGameOver = true;
let isMouseOver = false;
let isReady = true;
let win = 0;

const start = document.querySelector(".startBtn");
const score = document.querySelector("#score");
const pop = new Audio("../watermelon/pop.wav");

let scoreNum = 0;
let main = document.querySelector("main");

// 기존 circleArr은 기본 지름 배열로 사용 (예: 기준 너비 450px일 때의 지름)
let baseDiameters = [33, 48, 61, 69, 89, 114, 129, 156, 177, 220, 259];
let currentGlobalScale = 1; // 현재 전역 스케일 값 (초기엔 1)

if(main.clientWidth < 450){ // 모바일용 과일 사이즈 줄여보기
    currentGlobalScale  = main.clientWidth/450;
}

// CIRCLES 배열은 이제 동적으로 현재 스케일에 맞는 반지름을 제공하도록 하거나,
// Bodies를 생성할 때 직접 스케일링된 반지름을 사용합니다.
// 편의를 위해 CIRCLES 정의는 그대로 두되, 사용할 때 스케일을 곱해줍니다.
const CIRCLES = baseDiameters.map((diameter, index) => ({
    name: index,
    baseRadius: diameter / 2 // 기본 반지름 값
}));

// [1. 추가] 이미지 미리 로딩 (게임 도중 렉 방지)
CIRCLES.forEach(c => {
    const img = new Image();
    img.src = `../img/watermelon_Img/${c.name}.png`;
});

// main.clientWidth를 기준으로 currentGlobalScale을 업데이트하는 함수
function updateGlobalScale() {
    const referenceWidth = 450; // 기준 너비
    if (main.clientWidth < referenceWidth) {
        currentGlobalScale = main.clientWidth / referenceWidth;
    } else {
        currentGlobalScale = 1;
    }
    // console.log("Updated currentGlobalScale:", currentGlobalScale);
}

// 엔진 생성
const engine = Engine.create();

// 랜더 생성
const render = Render.create({
    name: "canvas",
    element: main,
    engine: engine,
    options: {
        wireframes: false,
        background: 'transparent',
        width: main.clientWidth,
        height: main.clientHeight,
        // pixelRatio를 'auto'로 설정하거나 window.devicePixelRatio 값을 직접 지정합니다.
        // 'auto'로 설정하면 Matter.js가 자동으로 브라우저의 DPR 값을 사용하려고 시도합니다.
        // 더 명확하게 하려면 window.devicePixelRatio를 직접 할당하는 것이 좋습니다.
        pixelRatio: window.devicePixelRatio || 1 // DPR 설정 추가!
    },
});

const world = engine.world;

// [2. 교체] 무한의 벽 (화면 리사이즈 시 틈새 방지)
const wallThick = 100;
const wallLength = 10000; // 아주 길게 설정

const leftWall = Bodies.rectangle(-40, main.clientHeight / 2, wallThick, wallLength, {
    name: "leftWall", isStatic: true, render: { fillStyle: "orange" }
});

const rightWall = Bodies.rectangle(main.clientWidth + 40, main.clientHeight / 2, wallThick, wallLength, {
    name: "rightWall", isStatic: true, render: { fillStyle: "orange" }
});

const ground = Bodies.rectangle(main.clientWidth / 2, main.clientHeight + 40, wallLength, wallThick, {
    name: "ground", isStatic: true, render: { fillStyle: "orange" }
});

// 게임오버 라인
const overLine = Bodies.rectangle(main.clientWidth / 2, 30, main.clientWidth, 1, {
    name: "overLine",
    isStatic: true,
    isSensor: true,
    render: {
        fillStyle: "white"
    }
});


// 월드에 추가
const runner = Runner.create();

function gameStart() {
    updateGlobalScale();
    isGameOver = false;
    start.style.top = "-1000px";
    Matter.World.add(world, [leftWall, rightWall, ground, overLine]);
    Render.run(render);
    Runner.run(runner, engine);
    score.innerHTML = 0;
}

// 실행
start.addEventListener("mouseup", (e) => {
    if (isReady) {
        main.style.opacity = 1;
        gameStart();
    }
})

let currentBody = null;
let currentCircle = null;

// 재활용 하려고 만든 박스 생성
function addBody(index, value, x) {
    let circleDef = CIRCLES[index];
    // 물리 객체의 반지름에도 currentGlobalScale 적용
    const scaledRadius = circleDef.baseRadius * currentGlobalScale;

    const body = Bodies.circle(x, 15, scaledRadius , {
        index: index,
        isSleeping: value,
        render: {
            sprite: {
                texture: `../img/watermelon_Img/${circleDef.name}.png`,
                // 스프라이트 스케일도 currentGlobalScale을 사용합니다.
                // 이렇게 하면 원본 이미지 크기를 기준으로 물리 객체 크기에 맞게 이미지가 스케일링됩니다.
                xScale: currentGlobalScale ,
                yScale: currentGlobalScale 
            }
        },
        restitution: 0.7
    });
    currentBody = body;
    currentCircle = { ...circleDef, radius: scaledRadius }; // 현재 사용되는 원의 실제 (스케일된) 반지름 업데이트
}

// 마우스 따라다니는 박스 생성
function addCicle() {
    let index = parseInt(Math.random() * 3);

    addBody(index, true, main.clientWidth / 2);

    Matter.World.add(world, currentBody);
}

addCicle();

let isClick = true;

// 무브 이벤트
function moveTarget(e) {
    let body = document.querySelector("body");

    let x = (body.offsetWidth / 2) - (main.clientWidth / 2);

    if (isClick) {
        if (e.clientX - x - currentCircle.radius - 11 > 0 && e.clientX - x + currentCircle.radius < main.clientWidth - 11)
            currentBody.position.x = e.clientX - x;
    }
}

// 마우스 따라다니기
main.addEventListener("mousemove", (e) => {
    if (isGameOver) return;

    moveTarget(e);

});

// 박스 추락 이벤트도 터치 마우스 구분 (실패)
function dropBox(e) {
    let index = currentBody.index;
    let body = document.querySelector("body");
    let x = e.clientX - ((body.offsetWidth / 2) - (main.clientWidth / 2));

    if (x < CIRCLES[index].radius) {
        x = CIRCLES[index].radius + 10;
    }

    if (x > main.clientWidth - CIRCLES[index].radius) {
        x = main.clientWidth - CIRCLES[index].radius - 10;
    }

    if (isClick) {
        Matter.World.remove(world, [currentBody]);
        addBody(index, false, x);
        Matter.World.add(world, currentBody);

        setTimeout(() => {
            addCicle();
            isClick = true;
        }, 500)
        isClick = false;
    }
}

// 떨어트리기 - 마우스
main.addEventListener("mouseup", (e) => {
    if (isGameOver) return;

    dropBox(e);
})

// 합치기 이벤트
Matter.Events.on(engine, "collisionStart", (e) => {
    e.pairs.forEach(collision => {
        if (collision.bodyA.index === collision.bodyB.index) {
            const index = collision.bodyA.index;

            if (index === CIRCLES.length - 1) {
                win++;
                return;
            }

            Matter.World.remove(world, [collision.bodyA, collision.bodyB]);

            const nextCircleDef = CIRCLES[index + 1];
            // 여기도 스케일된 반지름 사용
            const scaledRadiusForNew = nextCircleDef.baseRadius * currentGlobalScale;

            scoreNum += (index + 1) * (index + 1);
            score.innerHTML = scoreNum;

            pop.play();
            const newBody = Bodies.circle(
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                scaledRadiusForNew, {// scaledRadiusForNew 사용
                    index: index + 1,
                    render: {
                        sprite: {
                            texture: `../img/watermelon_Img/${nextCircleDef.name}.png`,
                            xScale: currentGlobalScale ,
                            yScale: currentGlobalScale
                        }
                    },
                }
            );

            Matter.World.add(world, newBody);
        }

        // 패배
        if (isClick && (collision.bodyA.name === "overLine" || collision.bodyB.name === "overLine")) {
            main.style.opacity = 0;
            Matter.World.clear(world);
            Engine.clear(engine);
            Render.stop(render);
            Runner.stop(runner);
            start.style.top = "50%";
            start.innerHTML = `게임오버<br>${score.innerHTML}점`;
            // [3. 추가] 랭킹 표시 (패배 시)
            const ranks = updateRank(scoreNum); // 랭킹 업데이트
            let rankText = "<br><br>🏆 <b>명예의 전당</b> 🏆<br>";
            ranks.forEach((r, i) => {
                rankText += `<div style='font-size:14px; margin-top:5px'>${i+1}위: ${r.score}점 <span style='color:#888'>(${r.date})</span></div>`;
            });
            start.innerHTML += rankText; // 기존 텍스트 뒤에 랭킹 추가
            scoreNum = 0;
            // 점수 확인 용
            isReady = false;
            isGameOver = false;
            setTimeout(() => {
                isReady = true;
            }, 1000);
        }
        // 승리
        if (win == 2) {
            main.style.opacity = 0;
            Matter.World.clear(world);
            Engine.clear(engine);
            Render.stop(render);
            Runner.stop(runner);
            start.style.top = "50%";
            start.innerHTML = `승리<br>${score.innerHTML}점`;
            // [3. 추가] 랭킹 표시 (승리 시) 
            const ranks = updateRank(scoreNum); // 랭킹 업데이트
            let rankText = "<br><br>🏆 <b>명예의 전당</b> 🏆<br>";
            ranks.forEach((r, i) => {
                rankText += `<div style='font-size:14px; margin-top:5px'>${i+1}위: ${r.score}점 <span style='color:#888'>(${r.date})</span></div>`;
            });
            start.innerHTML += rankText; // 기존 텍스트 뒤에 랭킹 추가
            scoreNum = 0;
            // 점수 확인 용
            isReady = false;
            isGameOver = false;
            setTimeout(() => {
                isReady = true;
            }, 1000);
        }
    });
})
// [최종 수정됨] 화면 리사이즈 시 벽 위치 + 과일 위치 동시 보정
function handleResize() {
    // 1. 게임 준비 중이거나 실행 중일 때만 반응
    if (isGameOver && !isReady) return;

    // 2. 새로운 화면 크기 측정
    const newWidth = main.clientWidth;
    const newHeight = main.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    // 3. 렌더러 및 캔버스 크기 동기화
    render.canvas.width = newWidth;
    render.canvas.height = newHeight;
    render.options.width = newWidth;
    render.options.height = newHeight;

    // 4. 벽/바닥 위치 재조정 (Matter.Body 사용)
    // 화면 중심이 바뀌었으므로 벽들도 이사해야 함
    if (ground) Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 40 });
    if (leftWall) Matter.Body.setPosition(leftWall, { x: -40, y: newHeight / 2 });
    if (rightWall) Matter.Body.setPosition(rightWall, { x: newWidth + 40, y: newHeight / 2 });
    if (overLine) Matter.Body.setPosition(overLine, { x: newWidth / 2, y: 30 });

    // 5. 전역 스케일 비율 재계산
    updateGlobalScale();

    // 6. [중요] 현재 잡고 있는 과일(Current Body) 위치 보정
    // 화면이 줄어들면, 잡고 있던 과일도 안쪽으로 밀어넣어야 함
    if (currentBody && currentCircle) {
        // 스케일 변화에 따른 반지름 재계산
        currentCircle.radius = CIRCLES[currentBody.index].baseRadius * currentGlobalScale;
        
        // 과일이 화면 밖으로 나갔는지 검사 (Clamping)
        let x = currentBody.position.x;
        const r = currentCircle.radius;

        if (x < r) x = r; // 왼쪽 벽 넘음 방지
        if (x > newWidth - r) x = newWidth - r; // 오른쪽 벽 넘음 방지

        // 보정된 위치 적용
        Matter.Body.setPosition(currentBody, { x: x, y: currentBody.position.y });
    }
}

window.addEventListener('resize', handleResize);

// [4. 추가] 랭킹 저장 함수 & 리사이즈 함수
function updateRank(newScore) {
    const GAME_KEY = "momizi_watermelon_rank"; 
    let rankData = JSON.parse(localStorage.getItem(GAME_KEY)) || [];
    rankData.push({ score: newScore, date: new Date().toLocaleDateString() });
    rankData.sort((a, b) => b.score - a.score);
    return rankData.slice(0, 5); // 상위 5등만 반환
}

// 화면 조절 대응 함수 (완전판)
function handleResize() {
    if (isGameOver && !isReady) return;
    const newWidth = main.clientWidth;
    const newHeight = main.clientHeight;

    render.canvas.width = newWidth;
    render.canvas.height = newHeight;
    render.options.width = newWidth;
    render.options.height = newHeight;

    // 벽 위치 이동 (크기는 10000이라 안 바꿔도 됨)
    if (ground) Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 40 });
    if (leftWall) Matter.Body.setPosition(leftWall, { x: -40, y: newHeight / 2 });
    if (rightWall) Matter.Body.setPosition(rightWall, { x: newWidth + 40, y: newHeight / 2 });
    if (overLine) Matter.Body.setPosition(overLine, { x: newWidth / 2, y: 30 });

    updateGlobalScale();

    // 잡고 있는 과일 위치 보정
    if (currentBody && currentCircle) {
        currentCircle.radius = CIRCLES[currentBody.index].baseRadius * currentGlobalScale;
        let x = currentBody.position.x;
        const r = currentCircle.radius;
        if (x < r) x = r;
        if (x > newWidth - r) x = newWidth - r;
        Matter.Body.setPosition(currentBody, { x: x, y: currentBody.position.y });
    }
}
// 기존 window.addEventListener('resize', handleResize); 는 지우거나 덮어씌우세요.
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(handleResize, 100);
});
