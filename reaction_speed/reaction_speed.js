const main = document.querySelector("main");
const bar = document.querySelector(".count");
const start = document.querySelector(".startBtn");
const speed = document.querySelector(".speed");
const strong = document.querySelector("strong");
const times = [];
let count = 0;
let randTime = 0;
let time = 0;
let isClick = false;
let interval = null;
let timeout = null;

// 버튼 클릭시 시작
start.addEventListener("click", () => {
    start.style.top = "-100px";
    main.style.opacity = 1;
    initGame();
    startGame();
});

// 클릭이벤트
speed.addEventListener("click", () => {
    if (!isClick) {
        start.style.top = "50%";
        initGame();
        speed.style.opacity = 0;
        return;
    }
    isClick = false;
    clearInterval(interval);
    speed.style.opacity = 0.5;
    times.push(new Date().getTime() - time);
    strong.innerHTML = "화면이 바뀌면<br>클릭";
    speed.style.backgroundImage = "none";
    speed.style.backgroundColor = "pink";
    count++;
    let persent = count * 20;
    bar.style.width = `${persent}%`;
    if (count === 5) {
        endGame();
        return;
    }
    startGame();
})

function initGame() {
    count = 0;
    isClick = false;
    clearInterval(interval);
    clearTimeout(timeout);
    bar.style.width = 0;
    speed.style.backgroundImage = "none";
    speed.style.backgroundColor = "pink";
    speed.style.opacity = 0.5;
}

// 게임 초기화
function startGame() {
    randTime = (Math.random() * 3 + 1) * 1000;
    timeout = setTimeout(() => {
        time = new Date().getTime();
        isClick = true;
        let randImgIdx = parseInt(Math.random() * 13 + 1);
        speed.style.opacity = 1;
        strong.innerHTML = "";
        speed.style.backgroundImage = `url(../img/${randImgIdx}.png)`
        speed.style.backgroundColor = "white";
        // 5초동안 안누르면 초기 화면으로
        interval = setInterval(() => {
            initGame();
            speed.style.opacity = 0;
            start.style.top = "50%";
        }, 5000);

    }, randTime)

}

function endGame() {
    let score = 0;
    for (let i = 0; i < times.length; i++) {
        score += times[i];
    }
    score = parseInt(score / times.length);

    initGame();
    strong.innerHTML = `${score} ms 초`;

}