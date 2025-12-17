const isMobile = /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);

const startBtn = document.querySelector(".startBtn");
const body = document.body;
const main = document.querySelector("main");
const timeDisplay = document.querySelector(".time");
const bar = document.querySelector(".bar");
const puzzleBoard = document.querySelector(".puzzle");

let level = 3;
let timerInterval = null;
let timeNum = 100;
let isGameReady = false;
let tiles = [];
let size = 512;

// 드래그 관련 변수
let draggedEl = null;
let isMobileSelect = false;

// 초기 사이즈 조절
handleResize();
window.addEventListener('resize', handleResize);

startBtn.addEventListener("click", () => {
    startBtn.style.top = "-1000px";
    initPuzzle();
    startPuzzle();
});

function handleResize() {
    // 반응형 크기 조절
    const screenWidth = body.clientWidth;
    if (screenWidth <= 512) {
        size = screenWidth - 20; // 여백 고려
        main.style.width = `${size}px`;
        main.style.height = `${size + 40}px`;
        puzzleBoard.style.width = `${size}px`;
        puzzleBoard.style.height = `${size}px`;
    } else {
        size = 512;
        main.style.width = "";
        main.style.height = "";
        puzzleBoard.style.width = "";
        puzzleBoard.style.height = "";
    }
}

function initPuzzle() {
    puzzleBoard.style.gridTemplateColumns = `repeat(${level}, 1fr)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${level}, 1fr)`;
    main.style.opacity = 0;
    
    clearInterval(timerInterval);
    puzzleBoard.innerHTML = "";
    timeDisplay.innerHTML = "";
    bar.style.width = "100%";
    
    tiles = [];
    timeNum = 100;
    isMobileSelect = false;
    draggedEl = null;
}

function startPuzzle() {
    main.style.opacity = 1;
    
    // 타일 생성 및 배치
    tiles = createTiles();
    tiles.forEach(tile => puzzleBoard.appendChild(tile));

    // 2초 후 셔플 및 시작
    setTimeout(() => {
        shuffleTiles();
        isGameReady = true;
        startTimer();
    }, 2000);
}

function createTiles() {
    const tempArr = [];
    const imgNum = Math.floor(Math.random() * 13) + 1;
    
    for (let i = 0; i < level * level; i++) {
        const div = document.createElement("div");
        div.className = "puzzle-piece";
        // 배경 이미지 위치 계산
        const x = (i % level) * (100 / (level - 1));
        const y = Math.floor(i / level) * (100 / (level - 1));
        
        div.style.backgroundImage = `url(../img/${imgNum}.png)`;
        div.style.backgroundSize = `${level * 100}%`;
        div.style.backgroundPosition = `${x}% ${y}%`;
        
        div.setAttribute("data-index", i); // 정답 위치
        div.setAttribute("draggable", "true");
        
        // 이벤트 리스너 등록 (드래그 & 터치)
        addEvents(div);
        tempArr.push(div);
    }
    return tempArr;
}

function shuffleTiles() {
    // DOM 요소 순서 섞기
    for (let i = puzzleBoard.children.length; i >= 0; i--) {
        puzzleBoard.appendChild(puzzleBoard.children[Math.random() * i | 0]);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeNum--;
        timeDisplay.innerHTML = timeNum;
        bar.style.width = `${timeNum}%`;

        if (timeNum <= 0) {
            clearInterval(timerInterval);
            endGame(false);
        }
    }, 1000);
}

// 이벤트 등록 함수
function addEvents(el) {
    // PC 드래그
    el.addEventListener("dragstart", e => {
        if (!isGameReady || isMobile) return;
        draggedEl = e.target;
    });

    el.addEventListener("dragover", e => e.preventDefault());

    el.addEventListener("drop", e => {
        if (!isGameReady || isMobile) return;
        e.preventDefault();
        swapTiles(draggedEl, e.target);
    });

    // 모바일 터치 (클릭 - 클릭 스왑 방식)
    el.addEventListener("click", e => { // touchstart 대신 click 사용 (호환성 UP)
        if (!isGameReady || !isMobile) return;
        
        const target = e.target;
        
        // 이미 선택된 게 없으면 선택
        if (!draggedEl) {
            draggedEl = target;
            target.style.opacity = "0.5"; // 선택 표시
        } else {
            // 같은거 누르면 취소
            if (draggedEl === target) {
                target.style.opacity = "1";
                draggedEl = null;
                return;
            }
            // 다른거 누르면 스왑
            swapTiles(draggedEl, target);
            draggedEl.style.opacity = "1";
            draggedEl = null;
        }
    });
}

// ★ 핵심: 두 요소의 위치를 맞바꾸는 함수
function swapTiles(node1, node2) {
    if (node1 === node2) return;

    // placeholder(빈 태그)를 이용한 안전한 스왑
    const temp = document.createTextNode('');
    node2.parentNode.insertBefore(temp, node2);
    node1.parentNode.insertBefore(node2, node1);
    temp.parentNode.insertBefore(node1, temp);
    temp.parentNode.removeChild(temp);

    checkClear();
}

function checkClear() {
    const currentTiles = [...puzzleBoard.children];
    // 모든 타일의 data-index가 현재 순서(index)와 일치하는지 확인
    const isClear = currentTiles.every((tile, index) => {
        return parseInt(tile.getAttribute("data-index")) === index;
    });

    if (isClear) {
        clearInterval(timerInterval);
        setTimeout(() => endGame(true), 500);
    }
}

function endGame(isClear) {
    isGameReady = false;
    main.style.opacity = 0.3;
    startBtn.style.top = "50%";
    
    if (isClear) {
        startBtn.innerHTML = `성공!<br>${100 - timeNum}초 기록<br>다음 단계`;
        level++;
    } else {
        startBtn.innerHTML = "실패<br>다시 도전";
    }
}
