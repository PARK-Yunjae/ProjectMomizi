// 모바일 기기 감지 드래그 이벤트 재시도
const isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent)

const start = document.querySelector(".startBtn");
const body = document.body;
const main = document.querySelector("main");
let time = document.querySelector(".time");
const bar = document.querySelector(".bar");
const puzzle = document.querySelector(".puzzle");
let size = 512;

let level = 3;
let interval = null;
let timeNum = 100;
let isReady = false;
let arr = [];

const dragged = {
    el: null,
    class: null,
    index: null
};

let isMobileSelect = false;
resizing();

start.addEventListener("click", () => {
    start.style.top = "-1000px";
    initPuzzle();
    startPuzzle();
})

// 기본 가로세로 크기인 512 보다 작으면 줄이기
function resizing() {
    console.log(body.clientWidth);
    console.log(main.style.width);
    if (body.clientWidth <= 512) {
        main.style.width = `${body.clientWidth}px`;
        main.style.height = `${body.clientWidth + 40}px`;
        puzzle.style.width = `${body.clientWidth}px`;
        puzzle.style.height = `${body.clientWidth}px`;
        size = body.clientWidth;
        console.log(size);
    }
}

// 퍼즐 초기화
function initPuzzle() {
    puzzle.style.gridTemplateColumns = `repeat(${level}, 1fr)`
    main.style.opacity = 0;
    clearInterval(interval);
    puzzle.innerHTML = "";
    time.innerHTML = "";
    bar.style.width = "100%";
    arr = [];
    timeNum = 100;
}

// 퍼즐 시작
function startPuzzle() {
    main.style.opacity = 1;

    // 만들고
    let arr = createPuzzle();
    // 처음에 보여주고 
    arr.forEach(e => puzzle.appendChild(e));

    // 2초뒤에 섞으면서 게임 시작
    setTimeout(() => {
        puzzle.innerHTML = "";
        arr = shuffle(arr);
        arr.forEach(e => puzzle.appendChild(e));
        isReady = true;

        interval = setInterval(() => {
            time.innerHTML = timeNum--;
            bar.style.width = `${timeNum}%`;

            // 타임 아웃
            if (timeNum == 0) {
                start.style.top = "50%";
                start.innerHTML = `게임오버 <br>다시 시작`;
                initPuzzle();
            }
        }, 1000);
    }, 2000)

}

// 퍼즐 생성
function createPuzzle() {
    const rdNum = parseInt(Math.random() * 13 + 1);
    Array(level * level).fill().forEach((_, i) => {
        const div = document.createElement("div");
        div.style.backgroundImage = `url(../img/${rdNum}.png)`;
        div.style.backgroundPositionX = `-${(size / level) * (i % level)}px`;
        div.style.backgroundPositionY = `-${(size / level) * parseInt(i / level)}px`;
        div.setAttribute("data-index", i);
        div.setAttribute("draggable", "true");
        div.classList.add(`list${i}`);
        arr.push(div);
    })
    return arr;
}

// 섞기
function shuffle(arr) {
    let index = arr.length - 1;
    while (index > 0) {
        const randIdx = Math.floor(Math.random() * (index + 1));
        [arr[index], arr[randIdx]] = [arr[randIdx], arr[index]];
        index--;
    }
    return arr;
}

// 드래그 이벤트
puzzle.addEventListener("dragstart", e => {
    if (!isReady || isMobile) return;
    const obj = e.target;

    dragged.el = obj;
    dragged.class = obj.className;
    dragged.index = [...obj.parentNode.children].indexOf(obj);
})

puzzle.addEventListener('touchstart', e => {
    if (!isReady || !isMobile) return;

    if (!isMobileSelect) {
        isMobileSelect = true;
        const obj = e.target;

        dragged.el = obj;
        dragged.class = obj.className;
        dragged.index = [...obj.parentNode.children].indexOf(obj);
    } else {
        isMobileSelect = false;

        changePuzzle(e);

        checkIndex();
    }
});

puzzle.addEventListener("dragover", e => {
    if (!isReady || isMobile) return;

    e.preventDefault();
})

puzzle.addEventListener("drop", e => {
    if (!isReady || isMobile) return;

    changePuzzle(e);

    checkIndex();
})

function changePuzzle(e) {
    const obj = e.target;
    console.log(obj.className)
    console.log(dragged.class)
    if (obj.className !== dragged.class) {
        let originPlace;
        let isLast = false;

        if (dragged.el.nextSibling) {
            originPlace = dragged.el.nextSibling;
        } else {
            originPlace = dragged.el.previousSibling;
            isLast = false;
        }
        const droppedIdx = [...obj.parentNode.children].indexOf(obj);
        dragged.index > droppedIdx ? obj.before(dragged.el) : obj.after(dragged.el);
        isLast ? originPlace.after(obj) : originPlace.before(obj);
    }
}



// 퍼즐 같은 위치인지 체크 - 한줄 리턴 생략 가능하지만 너무 길어짐
function checkIndex() {
    const pzList = [...puzzle.children];
    const unMatchedList = pzList.filter((child, index) => {
        return Number(child.getAttribute("data-index")) !== index;
    })
    // 종료
    if (unMatchedList.length === 0) {
        setTimeout(() => {
            start.style.top = "50%";
            main.style.opacity = 0;
            isReady = false;
            start.innerHTML = `클리어<br>${100-timeNum}초<br>다음 스테이지`;
            level++;
        }, 1000);
    }
}