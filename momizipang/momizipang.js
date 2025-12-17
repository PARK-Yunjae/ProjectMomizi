// ==========================================
// 1. 변수 선언 및 초기 설정
// ==========================================
const body = document.body;
const main = document.querySelector("main");
const text = document.querySelector(".text");
const board = document.querySelector(".board");
const startBtn = document.querySelector(".startBtn");
const bar = document.querySelector(".bar");

let blocks = 30;        // 목표 블럭 개수
let currentBlocks = 30; // 현재 남은 목표 개수
let level = 1;          // 게임 레벨
let size = 8;           // 맵 크기 (8x8)
let gemSize = 70;       // 보석 크기 (반응형으로 변함)
let gems = [];          // 사용될 보석 이미지 번호 배열
let maps = [];          // 2차원 맵 배열
let gameState = "pick"; // 게임 상태 (pick, switch, revert, remove, refill)
let movingItems = 0;    // 움직이는 아이템 수 (애니메이션 확인용)
let marker = null;      // 선택된 보석 표시용 마커
let time = 100;         // 남은 시간 (%)
let timerInterval = null;

// 선택 좌표
let selectedRow = -1;
let selectedCol = -1;
let targetRow = -1;
let targetCol = -1;

// 초기 사이즈 조절
handleResize();
window.addEventListener('resize', handleResize);

// ==========================================
// 2. 게임 실행 및 초기화
// ==========================================

// 게임 시작 버튼
startBtn.addEventListener("click", () => {
    main.style.opacity = 1;
    startBtn.style.top = "-1000px";
    initGame();
});

// 게임 초기화
function initGame() {
    // 변수 초기화
    selectedRow = -1; selectedCol = -1;
    targetRow = -1; targetCol = -1;
    movingItems = 0;
    gameState = "pick";
    
    // 레벨별 난이도 설정
    currentBlocks = level * 15;
    blocks = currentBlocks;
    time = 100;
    
    // 타이머 초기화
    clearInterval(timerInterval);
    
    // 보드 청소
    board.innerHTML = "";
    maps = [];
    gems = [];

    updateUI(); // UI 갱신
    createMapData();
    createGemElements();
    createMarker();
    
    startTimer();
}

// 타이머 로직
function startTimer() {
    bar.style.width = "100%";
    
    timerInterval = setInterval(() => {
        time--;
        bar.style.width = `${time}%`;

        // 타임오버 체크
        if (time <= 0) {
            endGame(false); // 패배
        }
    }, 1000); // 1초마다 감소 (필요시 속도 조절)
}

// 게임 종료 처리 (승리/패배)
function endGame(isWin) {
    clearInterval(timerInterval);
    main.style.opacity = 0.3;
    startBtn.style.top = "50%";
    
    if (isWin) {
        startBtn.innerHTML = `Level ${level} 클리어!<br>다음 레벨로`;
        updateRank(level); // 랭킹 저장
        level++;
    } else {
        startBtn.innerHTML = "게임 오버<br>다시 시작";
        level = 1; // 1레벨부터 다시
    }
}

// UI 업데이트 (점수 및 텍스트)
function updateUI() {
    // 음수가 되지 않도록 방지
    const displayBlocks = Math.max(0, currentBlocks);
    text.innerHTML = `남은 목표: ${displayBlocks}개`;
}

// 화면 리사이즈 대응
function handleResize() {
    const width = body.clientWidth;
    if (width < 400) {
        setBoardSize(320, 40);
    } else if (width < 480) {
        setBoardSize(400, 50);
    } else if (width < 560) {
        setBoardSize(480, 60);
    } else {
        // 기본 크기
        gemSize = 70;
        main.style.width = "";
        main.style.height = "";
        board.style.width = "";
        board.style.height = "";
    }
}

function setBoardSize(boxSize, gSize) {
    main.style.width = `${boxSize}px`;
    main.style.height = `${boxSize + 40}px`;
    board.style.width = `${boxSize}px`;
    board.style.height = `${boxSize}px`;
    gemSize = gSize;
}

// ==========================================
// 3. 맵 및 보석 생성 로직
// ==========================================

// 맵 데이터(2차원 배열) 생성
function createMapData() {
    for (let i = 0; i < size; i++) {
        maps[i] = new Array(size).fill(-1);
    }
}

// 사용할 보석 이미지 랜덤 선택
function selectGemTypes() {
    // 레벨이 오를수록 보석 종류가 다양해짐
    const count = Math.min(12, 3 + Math.floor(level / 2)); 
    while (gems.length < count) {
        let rNum = Math.floor(Math.random() * 12) + 1;
        if (!gems.includes(rNum)) gems.push(rNum);
    }
}

// 보석 DOM 생성 및 배치
function createGemElements() {
    selectGemTypes();

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // 초기 배치 시 3개 연속(매치)되지 않도록 배치
            do {
                let idx = Math.floor(Math.random() * gems.length);
                maps[i][j] = gems[idx];
            } while (isStreak(i, j));

            createSingleGem(i, j, maps[i][j]);
        }
    }
}

// 개별 보석 DIV 생성
function createSingleGem(row, col, imgIndex) {
    const div = document.createElement("div");
    div.classList.add("gem");
    div.id = `gem_${row}_${col}`;
    
    // 스타일 설정
    div.style.top = `${row * gemSize}px`;
    div.style.left = `${col * gemSize}px`;
    div.style.width = `${gemSize}px`;
    div.style.height = `${gemSize}px`;
    div.style.backgroundImage = `url(../img/${imgIndex}.png)`;
    div.style.backgroundSize = "cover";
    div.style.position = "absolute";
    div.style.border = "1px solid rgba(128,0,128,0.3)";
    div.style.boxSizing = "border-box";

    // 이벤트 리스너 연결
    addGemEvents(div);
    board.appendChild(div);
}

// 선택 마커 생성
function createMarker() {
    const div = document.createElement("div");
    div.id = "marker";
    div.style.width = `${gemSize}px`;
    div.style.height = `${gemSize}px`;
    div.style.position = "absolute";
    div.style.border = "4px solid red";
    div.style.boxSizing = "border-box";
    div.style.opacity = 0;
    div.style.pointerEvents = "none"; // 마커가 클릭 방해하지 않게
    div.style.zIndex = 10;
    board.appendChild(div);
    marker = div;
}

// ==========================================
// 4. 입력 처리 (클릭 & 터치)
// ==========================================

function addGemEvents(element) {
    // 클릭 이벤트
    element.addEventListener("click", e => handleInput(e.target));

    // 터치 이벤트 (스와이프)
    let touchStartX = 0;
    let touchStartY = 0;

    element.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: false });

    element.addEventListener("touchend", (e) => {
        if (gameState !== "pick") return;
        const diffX = e.changedTouches[0].screenX - touchStartX;
        const diffY = e.changedTouches[0].screenY - touchStartY;

        // 드래그 거리가 너무 짧으면 무시 (단순 터치 오인 방지)
        if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30) return;

        // 현재 보석의 위치 파악
        const r = parseInt(element.style.top) / gemSize;
        const c = parseInt(element.style.left) / gemSize;
        
        let nextR = r; 
        let nextC = c;

        // 가로/세로 중 더 많이 움직인 방향으로 결정
        if (Math.abs(diffX) > Math.abs(diffY)) {
            nextC += (diffX > 0) ? 1 : -1;
        } else {
            nextR += (diffY > 0) ? 1 : -1;
        }

        // 유효한 범위인지 확인 후 교체 시도
        if (nextR >= 0 && nextR < size && nextC >= 0 && nextC < size) {
            // 드래그 시작점 선택 처리
            handleSelect(r, c);
            // 드래그 끝점 교체 처리
            handleSelect(nextR, nextC);
        }
    }, { passive: false });
}

// 입력 공통 핸들러
function handleInput(target) {
    if (gameState !== "pick" || !target.classList.contains("gem")) return;

    const row = parseInt(target.style.top) / gemSize;
    const col = parseInt(target.style.left) / gemSize;
    
    handleSelect(row, col);
}

// 선택 로직
function handleSelect(row, col) {
    // 마커 이동
    marker.style.opacity = 1;
    marker.style.top = `${row * gemSize}px`;
    marker.style.left = `${col * gemSize}px`;

    if (selectedRow === -1) {
        // 첫 번째 선택
        selectedRow = row;
        selectedCol = col;
    } else {
        // 두 번째 선택
        targetRow = row;
        targetCol = col;

        // 인접한 칸인지 확인
        if ((Math.abs(selectedRow - targetRow) === 1 && selectedCol === targetCol) ||
            (Math.abs(selectedCol - targetCol) === 1 && selectedRow === targetRow)) {
            
            marker.style.opacity = 0;
            gameState = "switch";
            gemSwitch(); // 교체 애니메이션 시작
        } else {
            // 멀리 있는 칸을 찍으면 선택 변경
            selectedRow = row;
            selectedCol = col;
        }
    }
}

// ==========================================
// 5. 게임 로직 (교체, 매칭, 삭제, 채우기)
// ==========================================

// 보석 교체 애니메이션 (jQuery animate 사용)
function gemSwitch() {
    const yOffset = selectedRow - targetRow;
    const xOffset = selectedCol - targetCol;

    const gem1 = document.querySelector(`#gem_${selectedRow}_${selectedCol}`);
    const gem2 = document.querySelector(`#gem_${targetRow}_${targetCol}`);

    // 클래스 추가 (애니메이션 중복 방지용)
    $(gem1).addClass("switch");
    $(gem2).addClass("switch");

    movingItems = 2;

    // gem1 이동
    $(gem1).animate({
        top: `+=${-yOffset * gemSize}`,
        left: `+=${-xOffset * gemSize}`
    }, 200, function() {
        movingItems--;
        checkAnimationEnd();
    });

    // gem2 이동
    $(gem2).animate({
        top: `+=${yOffset * gemSize}`,
        left: `+=${xOffset * gemSize}`
    }, 200, function() {
        movingItems--;
        checkAnimationEnd();
    });

    // 데이터 교환
    // 1. 맵 데이터 값 교환
    const tempVal = maps[selectedRow][selectedCol];
    maps[selectedRow][selectedCol] = maps[targetRow][targetCol];
    maps[targetRow][targetCol] = tempVal;

    // 2. ID 교환 (중요: DOM요소의 ID를 실제 위치에 맞게 업데이트)
    gem1.id = "temp_id";
    gem2.id = `gem_${selectedRow}_${selectedCol}`;
    gem1.id = `gem_${targetRow}_${targetCol}`;
}

// 애니메이션 종료 체크 및 상태 분기
function checkAnimationEnd() {
    if (movingItems > 0) return;

    // 상태에 따른 분기
    switch (gameState) {
        case "switch":
        case "revert":
            // 매칭 여부 확인
            if (!isStreak(selectedRow, selectedCol) && !isStreak(targetRow, targetCol)) {
                // 매칭 안됨
                if (gameState !== "revert") {
                    gameState = "revert";
                    gemSwitch(); // 원위치 복귀
                } else {
                    // 복귀 완료 -> 다시 선택 모드
                    gameState = "pick";
                    selectedRow = -1;
                    targetRow = -1;
                }
            } else {
                // 매칭 성공 -> 삭제 모드
                gameState = "remove";
                // 매칭된 보석들 'remove' 클래스 추가
                markGemsToRemove();
                // 실제 삭제 실행
                removeMarkedGems();
            }
            break;

        case "remove":
            checkFalling(); // 빈자리 채우기
            break;

        case "refill":
            fillEmptySpots(); // 새 보석 생성
            break;
    }
}

// 매칭된 보석 마킹 (데이터상 -1 처리 X, 클래스만 추가)
function markGemsToRemove() {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (maps[i][j] === -1) continue; // 이미 지워진 것 패스

            // 가로 확인
            if (j < size - 2 && maps[i][j] === maps[i][j+1] && maps[i][j] === maps[i][j+2]) {
                let k = j;
                while (k < size && maps[i][k] === maps[i][j]) {
                    $(`#gem_${i}_${k}`).addClass("remove");
                    k++;
                }
            }
            // 세로 확인
            if (i < size - 2 && maps[i][j] === maps[i+1][j] && maps[i][j] === maps[i+2][j]) {
                let k = i;
                while (k < size && maps[k][j] === maps[i][j]) {
                    $(`#gem_${k}_${j}`).addClass("remove");
                    k++;
                }
            }
        }
    }
}

// 마킹된 보석 실제 삭제 (점수 계산 포함)
function removeMarkedGems() {
    const removeList = $(".remove");
    
    if (removeList.length > 0) {
        // 점수(남은 블럭) 차감 로직 - ★ 여기가 핵심 수정 부분 ★
        currentBlocks -= removeList.length;
        updateUI();

        // 승리 조건 체크 (즉시)
        if (currentBlocks <= 0) {
            endGame(true);
            return; // 게임 루프 중단
        }

        // 맵 데이터 -1로 변경
        removeList.each(function() {
            const idParts = this.id.split("_");
            const r = parseInt(idParts[1]);
            const c = parseInt(idParts[2]);
            maps[r][c] = -1;
        });

        // 삭제 애니메이션
        removeList.animate({ opacity: 0 }, 200, function() {
            $(this).remove(); // DOM 제거
            movingItems--; // 개수 체크용 (여기선 사용 안함, setTimeout으로 처리)
        });

        // 애니메이션 대기 후 다음 단계
        setTimeout(() => {
            checkFalling();
        }, 200);
        
    } else {
        // 더 이상 지울 게 없으면 턴 종료
        gameState = "pick";
        selectedRow = -1;
        targetRow = -1;
    }
}

// 빈 공간으로 위에 있는 보석 떨어뜨리기
function checkFalling() {
    let fellDown = 0;
    
    // 아래 행부터 위로 검사
    for (let j = 0; j < size; j++) {
        for (let i = size - 1; i > 0; i--) {
            // 현재 칸이 비어있고(-1), 윗칸에 보석이 있다면
            if (maps[i][j] === -1 && maps[i-1][j] >= 0) {
                // 데이터 이동
                maps[i][j] = maps[i-1][j];
                maps[i-1][j] = -1;

                // DOM 이동 (ID 변경 및 애니메이션)
                const gem = $(`#gem_${i-1}_${j}`);
                gem.attr("id", `gem_${i}_${j}`);
                gem.addClass("fall"); // 이동 중 표시
                
                fellDown++;
            }
        }
    }

    if (fellDown > 0) {
        // 애니메이션 수행
        const fallingGems = $(".fall");
        movingItems = fallingGems.length;
        
        fallingGems.animate({
            top: `+=${gemSize}`
        }, 150, function() {
            $(this).removeClass("fall");
            movingItems--;
            if (movingItems === 0) {
                // 다 떨어졌으면 다시 체크 (연쇄적으로 떨어질 수 있음)
                checkFalling();
            }
        });
    } else {
        // 더 이상 떨어질 게 없으면 새 보석 채우기
        gameState = "refill";
        fillEmptySpots();
    }
}

// 맨 윗줄 빈 곳 채우기
function fillEmptySpots() {
    let filled = 0;
    
    for (let j = 0; j < size; j++) {
        if (maps[0][j] === -1) {
            let idx = Math.floor(Math.random() * gems.length);
            maps[0][j] = gems[idx];
            
            // 화면 위쪽에서 생성되어 내려오도록
            const div = document.createElement("div");
            div.classList.add("gem", "new-gem");
            div.id = `gem_0_${j}`;
            div.style.top = `-${gemSize}px`; // 화면 밖 시작
            div.style.left = `${j * gemSize}px`;
            div.style.width = `${gemSize}px`;
            div.style.height = `${gemSize}px`;
            div.style.backgroundImage = `url(../img/${maps[0][j]}.png)`;
            div.style.backgroundSize = "cover";
            div.style.position = "absolute";
            div.style.border = "1px solid rgba(128,0,128,0.3)";
            div.style.boxSizing = "border-box";
            
            addGemEvents(div); // 이벤트 연결
            board.appendChild(div);
            
            filled++;
        }
    }

    if (filled > 0) {
        // 채워지는 애니메이션
        $(".new-gem").animate({
            top: "0px"
        }, 200, function() {
            $(this).removeClass("new-gem");
            // 다 채워졌으면 다시 매칭 확인 (연쇄 폭발)
            // animate 콜백은 요소마다 실행되므로 디바운싱 필요하지만, 
            // 간단하게 setTimeout으로 처리
        });
        
        setTimeout(() => {
            gameState = "switch"; // 매칭 체크 로직 태우기 위해
            markGemsToRemove();
            if ($(".remove").length > 0) {
                removeMarkedGems();
            } else {
                gameState = "pick";
                selectedRow = -1;
                targetRow = -1;
            }
        }, 250);
        
    } else {
        gameState = "pick";
        selectedRow = -1;
        targetRow = -1;
    }
}

// ==========================================
// 6. 유틸리티 함수
// ==========================================

// 특정 위치(row, col) 기준 매칭 여부 확인
function isStreak(row, col) {
    const val = maps[row][col];
    if (val === -1) return false;

    // 세로 3개 확인
    if (row >= 2 && maps[row-1][col] === val && maps[row-2][col] === val) return true;
    if (row < size-2 && maps[row+1][col] === val && maps[row+2][col] === val) return true;
    if (row > 0 && row < size-1 && maps[row-1][col] === val && maps[row+1][col] === val) return true;

    // 가로 3개 확인
    if (col >= 2 && maps[row][col-1] === val && maps[row][col-2] === val) return true;
    if (col < size-2 && maps[row][col+1] === val && maps[row][col+2] === val) return true;
    if (col > 0 && col < size-1 && maps[row][col-1] === val && maps[row][col+1] === val) return true;

    return false;
}

// 랭킹 저장 (로컬 스토리지)
function updateRank(clearedLevel) {
    try {
        const GAME_KEY = "momizi_pang_rank";
        let rankData = JSON.parse(localStorage.getItem(GAME_KEY)) || [];
        rankData.push({ score: clearedLevel, date: new Date().toLocaleDateString() });
        // 점수(레벨) 내림차순 정렬
        rankData.sort((a, b) => b.score - a.score);
        // 상위 5개만 저장
        localStorage.setItem(GAME_KEY, JSON.stringify(rankData.slice(0, 5)));
    } catch (e) {
        console.error("랭킹 저장 실패", e);
    }
}
