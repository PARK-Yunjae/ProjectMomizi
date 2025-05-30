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

let circleArr = [33, 48, 61, 69, 89, 114, 129, 156, 177, 220, 259]; // 이 값들이 각 이미지의 '지름'이라고 가정
let globalResponsiveScale = 1; // 이전의 'scale' 변수 이름을 변경하여 혼동 방지
if(main.clientWidth < 450){
    globalResponsiveScale = main.clientWidth/450;
}
console.log(scale);

// 레벨별 과일
const CIRCLES = [{
    name: 0,
    radius: circleArr[0] / 2
}, {
    name: 1,
    radius: circleArr[1] / 2
}, {
    name: 2,
    radius: circleArr[2] / 2
}, {
    name: 3,
    radius: circleArr[3] / 2
}, {
    name: 4,
    radius: circleArr[4] / 2
}, {
    name: 5,
    radius: circleArr[5] / 2
}, {
    name: 6,
    radius: circleArr[6] / 2
}, {
    name: 7,
    radius: circleArr[7] / 2
}, {
    name: 8,
    radius: circleArr[8] / 2
}, {
    name: 9,
    radius: circleArr[9] / 2
}, {
    name: 10,
    radius: circleArr[10] / 2
}, ];

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
    },
});

const world = engine.world;

// 왼쪽벽 - 이름 줘서 반응형으로 크기 줄여보려고 했는데 실패
const leftWall = Bodies.rectangle(-40, main.clientHeight / 2, 100, main.clientHeight, {
    name: "leftWall",
    isStatic: true,
    render: {
        fillStyle: "orange"
    }
});

// 오른쪽 벽
const rightWall = Bodies.rectangle(main.clientWidth + 40, main.clientHeight / 2, 100, main.clientHeight, {
    name: "rightWall",
    isStatic: true,
    render: {
        fillStyle: "orange"
    }
});

// 바닥
const ground = Bodies.rectangle(main.clientWidth / 2, main.clientHeight + 40, main.clientWidth, 100, {
    name: "ground",
    isStatic: true,
    render: {
        fillStyle: "orange"
    }
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

function addBody(index, value, x) {
    let circle = CIRCLES[index]; // CIRCLES[index].radius 는 물리 객체의 반지름
    
    // 해당 과일의 목표 지름 (물리 객체의 지름)
    const bodyDiameter = circle.radius * 2; 
    
    // 해당 과일 이미지의 원본 크기 (circleArr[index]가 원본 이미지의 지름과 동일하다고 가정)
    // 만약 모든 이미지가 정사각형이고, circleArr[index]가 그 정사각형의 한 변 길이라면:
    const originalImageDimension = circleArr[index]; 

    // 만약 originalImageDimension이 0이거나 정의되지 않는 경우를 대비한 방어 코드
    if (!originalImageDimension || originalImageDimension === 0) {
        console.error("Error: Original image dimension is not valid for index", index);
        // 기본 스케일 또는 오류 처리
    }

    const body = Bodies.circle(x, 15, circle.radius, {
        index: index,
        isSleeping: value,
        render: {
            sprite: {
                texture: `../img/watermelon_Img/${circle.name}.png`,
                // 각 이미지의 xScale과 yScale을 (물리 객체 지름 / 이미지 원본 크기) * 전체 반응형 스케일로 설정
                xScale: (bodyDiameter / originalImageDimension) * globalResponsiveScale,
                yScale: (bodyDiameter / originalImageDimension) * globalResponsiveScale
            }
        },
        restitution: 0.7
    });
    currentBody = body;
    currentCircle = circle;
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

            const newCircle = CIRCLES[index + 1];
            scoreNum += (index + 1) * (index + 1);
            score.innerHTML = scoreNum;

            pop.play();
            const newBody = Bodies.circle(
                collision.collision.supports[0].x,
                collision.collision.supports[0].y,
                newCircle.radius, {
                    index: index + 1,
                    render: {
                        sprite: {
                            texture: `../img/watermelon_Img/${newCircle.name}.png`,
                            xScale: scale,
                            yScale: scale
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
