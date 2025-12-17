const body = document.body; // 바디
const main = document.querySelector("main"); // 게임판(시간 개수 보드)
const text = document.querySelector(".text"); // 블럭 깰 개수 표시
const board = document.querySelector(".board"); // 게임 맵
const start = document.querySelector(".startBtn"); // 시작 버튼
const bar = document.querySelector(".bar"); // 시간?

let blocks = 30; // 깰 블럭 개수
let level = 1; // 게임 레벨
let size = 8; // 맵 사이즈 
let gemSize = 70; // 보석 크기
let gems = []; // 레벨별 잼 종류 모아둔 배열
let maps = new Array(); // 2차원 잼 배열
let gameState = "pick";
let movingItems = 0;
let marker = null;
let time = 100;

let selectedRow = -1
let selectedCol = -1
let posX = -1;
let posY = -1;

let interval = null;
let isClear = true;

resizing();

// 게임 시작 버튼 이벤트
start.addEventListener("click", () => {
    main.style.opacity = 1;
    start.style.top = "-1000px";
    initBoard();
    startBoard();
    intevals();
})

// 타이머
function intevals() {
    // 2초간 클릭 금지
    interval = setInterval(() => {
        bar.style.width = `${time--}%`;
        text.innerHTML = `${blocks}개`;

        clearMaps();

        if (blocks <= 0 && isClear) {
            if (isClear) {
                isClear = false;
                main.style.opacity = 0;
                clearInterval(interval);
                start.style.top = "50%";
                start.innerHTML = "게임 클리어";
                level++;
            }
        }

        if (time == 0 && isClear) {
            main.style.opacity = 0;
            clearInterval(interval);
            start.style.top = "50%";
            start.innerHTML = "다시 시작";
        }

    }, 1000);
}

// 채워졌는지 확인 - 버그때문에 이것저것 시도중
function clearMaps() {
    isClear = true;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (maps[i][j] == -1) {
                isClear = false;
            }
        }
    }
}

// 게임 실행시 화면이 작으면 작은 사이즈에 맞춤
function resizing() {
    if (body.clientWidth < 560) {
        main.style.width = `480px`;
        main.style.height = `520px`;
        board.style.width = `480px`;
        board.style.height = `480px`;
        gemSize = 60;
    }
    if (body.clientWidth < 480) {
        main.style.width = `400px`;
        main.style.height = `440px`;
        board.style.width = `400px`;
        board.style.height = `400px`;
        gemSize = 50;
    }
    if (body.clientWidth < 400) {
        main.style.width = `320px`;
        main.style.height = `360px`;
        board.style.width = `320px`;
        board.style.height = `320px`;
        gemSize = 40;
    }
}

// 게임 초기화
function initBoard() {
    selectedRow = -1
    selectedCol = -1
    posX = -1;
    posY = -1;
    movingItems = 0;
    gameState = "pick";
    isClear = true;
    clearInterval(interval);
    board.innerHTML = "";
    gems = [];
    maps = new Array();
    text.innerHTML = "";
    blocks = level * 15;
    time = 100;
}

// 게임 시작
function startBoard() {
    main.style.opacity = 1;
    text.innerHTML = `${blocks}개`;
    creatMaps();
    createGems();
    createMarker();
}

// 마커 추가
function createMarker() {
    const div = document.createElement("div");
    board.appendChild(div);
    div.setAttribute("id", "marker");
    div.style.top = "0px";
    div.style.left = "0px";
    div.style.width = `${gemSize}px`;
    div.style.height = `${gemSize}px`;
    div.style.position = "absolute";
    div.style.border = "10px solid orange";
    div.style.opacity = 0;

    marker = document.querySelector("#marker");
}

// 맵 생성
function creatMaps() {
    for (let i = 0; i < size; i++) {
        maps[i] = new Array();
        for (let j = 0; j < size; j++) {
            maps[i][j] = -1;
        }
    }
}

// 이미지를 레벨별로 정해진 개수만큼 랜덤으로 선택
function selectGems() {
    for (let i = 0; i < 3 + (level / 3); i++) {
        // 이미지 개수
        let rNum = parseInt(Math.random() * 12 + 1);

        if (gems.indexOf(rNum) === -1) {
            gems.push(rNum);
        } else {
            i--;
        }
    }
}

// 잼 생성
function createGems() {
    selectGems();

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            do {
                let idx = Math.floor(Math.random() * gems.length);
                maps[i][j] = gems[idx];
            } while (isStreak(i, j));
            const div = document.createElement("div");
            board.appendChild(div);
            div.setAttribute("class", "gem");
            div.setAttribute("id", `gem_${i}_${j}`);
            div.style.top = `${i*gemSize}px`;
            div.style.left = `${j*gemSize}px`;
            div.style.width = `${gemSize}px`;
            div.style.height = `${gemSize}px`;
            div.style.position = "absolute";
            div.style.border = `1px solid purple`;
            div.style.backgroundImage = `url(../img/${maps[i][j]}.png)`;
            div.style.backgroundSize = "cover";

            div.addEventListener("click", e => {
                isClear = false;
                if (gameState == "pick" && e.target.matches(".gem")) {
                    posY = parseInt(e.target.style.top);
                    posX = parseInt(e.target.style.left);
                    marker.style.opacity = 1;
                    marker.style.top = `${posY}px`;
                    marker.style.left = `${posX}px`;
                    if (selectedRow == -1) {
                        selectedRow = posY / gemSize;
                        selectedCol = posX / gemSize;
                    } else {
                        posY = posY / gemSize;
                        posX = posX / gemSize;
                        if ((Math.abs(selectedRow - posY) == 1 && selectedCol == posX) ||
                            (Math.abs(selectedCol - posX) == 1 && selectedRow == posY)) {
                            marker.style.opacity = 0;
                            gameState = "switch";
                            gemSwitch(); // 교체하러
                        } else {
                            selectedRow = posY;
                            selectedCol = posX;
                        }
                    }
                }
            })
        }
    }
}

// 이동할 이벤트 체크
function checkMoving() {
    movingItems--;
    if (movingItems == 0) {
        switch (gameState) {
            case "revert":
            case "switch":
                if (!isStreak(selectedRow, selectedCol) && !isStreak(posY, posX)) {
                    if (gameState != "revert") {
                        gameState = "revert";
                        gemSwitch();
                    } else {
                        gameState = "pick";
                        selectedRow = -1;
                    }
                } else {
                    gameState = "remove";
                    if (isStreak(selectedRow, selectedCol)) {
                        removeGems(selectedRow, selectedCol);
                    }
                    if (isStreak(posY, posX)) {
                        removeGems(posY, posX);
                    }
                    gemFade();
                }
                break;
            case "remove":
                checkFalling();
                break;
            case "refill":
                placeNewGems();
                break;
        }
    }
}

// 빈자리 채울 잼 추가
function placeNewGems() {
    let gemsPlaced = 0;
    for (let i = 0; i < size; i++) {
        if (maps[0][i] == -1) {
            let idx = Math.floor(Math.random() * gems.length);
            maps[0][i] = gems[idx];

            const div = document.createElement("div");
            board.appendChild(div);
            div.setAttribute("class", "gem");
            div.setAttribute("id", `gem_0_${i}`);
            div.style.top = `0px`;
            div.style.left = `${i*gemSize}px`;
            div.style.width = `${gemSize}px`;
            div.style.height = `${gemSize}px`;
            div.style.position = "absolute";
            div.style.border = `1px solid purple`;
            div.style.backgroundImage = `url(../img/${maps[0][i]}.png)`;
            div.style.backgroundSize = "cover";

            gemsPlaced++;

            div.addEventListener("click", e => {
                isClear = false;
                if (gameState == "pick" && e.target.matches(".gem")) {
                    posY = parseInt(e.target.style.top);
                    posX = parseInt(e.target.style.left);
                    marker.style.opacity = 1;
                    marker.style.top = `${posY}px`;
                    marker.style.left = `${posX}px`;

                    if (selectedRow == -1) {
                        selectedRow = posY / gemSize;
                        selectedCol = posX / gemSize;
                    } else {
                        posY = posY / gemSize;
                        posX = posX / gemSize;
                        if ((Math.abs(selectedRow - posY) == 1 && selectedCol == posX) ||
                            (Math.abs(selectedCol - posX) == 1 && selectedRow == posY)) {
                            marker.style.opacity = 0;
                            gameState = "switch";
                            gemSwitch(); // 교체하러
                        } else {
                            selectedRow = posY;
                            selectedCol = posX;
                        }
                    }
                }
            })
        }
    }

    if (gemsPlaced) {
        blocks--;
        gameState = "remove";
        checkFalling();
    } else {
        let combo = 0
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (j < size - 2 && maps[i][j] == maps[i][j + 1] && maps[i][j] == maps[i][j + 2]) {
                    combo++;
                    removeGems(i, j);
                }
                if (i < size - 2 && maps[i][j] == maps[i + 1][j] && maps[i][j] == maps[i + 2][j]) {
                    combo++;
                    removeGems(i, j);
                }
            }
        }
        if (combo > 0) {
            gameState = "remove";
            gemFade();
        } else {
            gameState = "pick";
            selectedRow = -1;
        }
    }
}

// 떨어지는 잼 체크
function checkFalling() {
    let fellDown = 0;
    for (let j = 0; j < size; j++) {
        for (let i = size - 1; i > 0; i--) {
            if (maps[i][j] == -1 && maps[i - 1][j] >= 0) {
                $("#gem_" + (i - 1) + "_" + j).addClass("fall").attr("id", "gem_" + i + "_" + j);
                maps[i][j] = maps[i - 1][j];
                maps[i - 1][j] = -1;
                fellDown++;
            }
        }
    }
    $.each($(".fall"), function () {
        movingItems++;
        $(this).animate({
            top: `+=${gemSize}`
        }, {
            duration: 200,
            complete: function () {
                $(this).removeClass("fall");
                checkMoving();
            }
        });
    });
    if (fellDown == 0) {
        gameState = "refill";
        movingItems = 1;
        checkMoving();
    }
}

// [수정됨] CSS 애니메이션을 이용한 부드러운 삭제
function gemFade() {
    const removeTargets = document.querySelectorAll(".remove"); // jQuery 대신 바닐라 JS 사용
    let count = removeTargets.length;

    if (count === 0) {
        checkMoving();
        return;
    }

    removeTargets.forEach(el => {
        movingItems++;
        el.classList.add("remove-effect"); // CSS 애니메이션 실행

        // 0.3초(CSS 시간) 뒤에 실제로 제거
        setTimeout(() => {
            el.remove();
            checkMoving();
        }, 300);
    });
}

// 보석 위치 전환
function gemSwitch() {
    let yOffset = selectedRow - posY;
    let xOffset = selectedCol - posX;

    const gem1 = document.querySelector(`#gem_${selectedRow}_${selectedCol}`);
    gem1.classList.add("switch");
    gem1.setAttribute("dir", "-1");

    const gem2 = document.querySelector(`#gem_${posY}_${posX}`);
    gem2.classList.add("switch");
    gem2.setAttribute("dir", "1");

    $.each($(".switch"), function () {
        movingItems++;
        $(this).animate({
            left: "+=" + xOffset * gemSize * $(this).attr("dir"),
            top: "+=" + yOffset * gemSize * $(this).attr("dir")
        }, {
            duration: 200,
            complete: function () {
                checkMoving();
            }
        }).removeClass("switch")
    });

    const selectedGem = document.querySelector(`#gem_${selectedRow}_${selectedCol}`);
    selectedGem.setAttribute("id", "temp");
    const posGem = document.querySelector(`#gem_${posY}_${posX}`);
    posGem.setAttribute("id", `gem_${selectedRow}_${selectedCol}`);
    const tempGem = document.querySelector(`#temp`)
    tempGem.setAttribute("id", `gem_${posY}_${posX}`);

    let temp = maps[selectedRow][selectedCol];
    maps[selectedRow][selectedCol] = maps[posY][posX];
    maps[posY][posX] = temp;
}

// 보석 지우기
function removeGems(row, col) {
    let gemValue = maps[row][col];
    let tmp = row;
    $("#gem_" + row + "_" + col).addClass("remove");

    if (isVerticalStreak(row, col)) {
        while (tmp > 0 && maps[tmp - 1][col] == gemValue) {
            $("#gem_" + (tmp - 1) + "_" + col).addClass("remove");
            maps[tmp - 1][col] = -1;
            tmp--;
        }
        tmp = row;
        while (tmp < size - 1 && maps[tmp + 1][col] == gemValue) {
            $("#gem_" + (tmp + 1) + "_" + col).addClass("remove");
            maps[tmp + 1][col] = -1;
            tmp++;
        }
    }
    if (isHorizontalStreak(row, col)) {
        tmp = col;
        while (tmp > 0 && maps[row][tmp - 1] == gemValue) {
            $("#gem_" + row + "_" + (tmp - 1)).addClass("remove");
            maps[row][tmp - 1] = -1;
            tmp--;
        }
        tmp = col;
        while (tmp < size - 1 && maps[row][tmp + 1] == gemValue) {
            $("#gem_" + row + "_" + (tmp + 1)).addClass("remove");
            maps[row][tmp + 1] = -1;
            tmp++;
        }
    }
    maps[row][col] = -1;
}

// 세로 확인
function isVerticalStreak(row, col) {
    let gemValue = maps[row][col];
    let streak = 0;
    let tmp = row;
    while (tmp > 0 && maps[tmp - 1][col] == gemValue) {
        streak++;
        tmp--;
    }
    tmp = row;
    while (tmp < size - 1 && maps[tmp + 1][col] == gemValue) {
        streak++;
        tmp++;
    }
    return streak > 1
}

// 가로 확인
function isHorizontalStreak(row, col) {
    let gemValue = maps[row][col];
    let streak = 0;
    let tmp = col
    while (tmp > 0 && maps[row][tmp - 1] == gemValue) {
        streak++;
        tmp--;
    }
    tmp = col;
    while (tmp < size - 1 && maps[row][tmp + 1] == gemValue) {
        streak++;
        tmp++;
    }
    return streak > 1
}

// 확인할게 있나
function isStreak(row, col) {
    return isVerticalStreak(row, col) || isHorizontalStreak(row, col);
}
