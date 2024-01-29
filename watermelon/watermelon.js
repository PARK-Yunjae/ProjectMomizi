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


// 레벨별 과일
const CIRCLES = [{
    name: 0,
    radius: main.clientWidth / 100 * 3
}, {
    name: 1,
    radius: main.clientWidth / 100 * 5
}, {
    name: 2,
    radius: main.clientWidth / 100 * 7
}, {
    name: 3,
    radius: main.clientWidth / 100 * 9
}, {
    name: 4,
    radius: main.clientWidth / 100 * 11
}, {
    name: 5,
    radius: main.clientWidth / 100 * 13
}, {
    name: 6,
    radius: main.clientWidth / 100 * 15
}, {
    name: 7,
    radius: main.clientWidth / 100 * 17
}, {
    name: 8,
    radius: main.clientWidth / 100 * 19
}, {
    name: 9,
    radius: main.clientWidth / 100 * 21
}, {
    name: 10,
    radius: main.clientWidth / 100 * 23
}, ];

// 엔진 생성
const engine = Engine.create();

// 랜더 생성
const render = Render.create({
    name: "canvas2",
    element: main,
    engine: engine,
    options: {
        wireframes: false,
        background: 'transparent',
        width: main.clientWidth,
        height: main.clientHeight,
    }
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

// 재활용 하려고 만든 박스 생성
function addBody(index, value, x) {
    let circle = CIRCLES[index];
    const body = Bodies.circle(x, 15, circle.radius, {
        index: index,
        isSleeping: value,
        render: {
            sprite: {
                texture: `../img/watermelon_Img/${circle.name}.png`,
                xScale: circle.radius * 2 / 512,
                yScale: circle.radius * 2 / 512
            }
        },
        restitution: 0.5
    });
    currentBody = body;
    currentCircle = circle;
}

// 마우스 따라다니는 박스 생성
function addCicle() {
    let index = parseInt(Math.random() * 4);

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
            scoreNum += (index + 1) * 10;
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
                            xScale: newCircle.radius * 2 / 512,
                            yScale: newCircle.radius * 2 / 512
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