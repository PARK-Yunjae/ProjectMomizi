class cards {
    constructor() {
        this.board = document.querySelector("board");
        this.start = document.querySelector(".startCard");
        this.timer = document.querySelector("#timer");
        this.stage = document.querySelector(".stage");
        this.cardBack = document.getElementsByClassName("card_back");
        this.cardFront = document.getElementsByClassName("card_front");
        this.time = 100;
        this.level = 1;
        this.ready = false;
        this.isFlip = false;
        this.timerInterval = 0;
        this.cardDeck = [];
        this.BOARD_SIZE = 4;

        this.start.addEventListener("click", () => {
            this.ready = true;
            this.start.style.top = "-1000px";
            this.startGame();
        })

        this.board.addEventListener("click", e => {
            if (this.isFlip === false) {
                return;
            }

            if (e.target.parentNode.className === "card") {
                let clickCardId = e.target.parentNode.dataset.id;

                if (this.cardDeck[clickCardId].isOpen === false) {
                    this.openCard(clickCardId);
                }
            }
        });
    }

    startGame() {
        this.initGame();
        this.initScreen();
        this.makeCardDeck();
        this.settingCardDeck();
        this.showCardDeck();
    }

    endGame() {
        this.showGameResult();
    }

    initGame() {
        this.isFlip = false;
        this.time = 100;
        this.cardDeck = [];
    }

    initScreen() {
        this.board.innerHTML = "";
        this.stage.innerHTML = `Stage ${this.level}`;
    }

    clearBoard() {
        clearInterval(this.timerInterval);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            console.log(this.time);
            this.timer.innerHTML = this.time--;

            if (this.time <= 0) {
                clearInterval(this.timerInterval);
                this.endGame();
            }
        }, 1000);
    }

    makeCardDeck() {
        let randNumArr = [];

        for (let i = 0; i < this.BOARD_SIZE / 2; i++) {
            // 이미지 개수
            let rNum = parseInt(Math.random() * 13 + 1);

            if (randNumArr.indexOf(rNum) === -1) {
                randNumArr.push(rNum);
            } else {
                i--;
            }
        }
        // 같은 카드는 두장 - 이게 되네?
        randNumArr.push(...randNumArr);
        // -0.5 ~ 0.5 이것도 잘 써먹겠음
        randNumArr.sort(() => Math.random() - 0.5);

        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.cardDeck.push({
                card: randNumArr[i],
                isOpen: false,
                isMatch: false
            });
        }

        return this.cardDeck;
    }

    settingCardDeck() {
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.board.innerHTML +=
                `<div class="card" data-id="${i}" data-card="${this.cardDeck[i].card}">
            <div class="card_back"></div>
            <div class="card_front"></div>
            </div>`;
            this.cardFront[i].style.backgroundImage = `url(../img/${this.cardDeck[i].card}.png)`;
        }

        let card = document.querySelectorAll(".card");

        for (let i = 0; i < this.BOARD_SIZE; i++) {
            if (this.level == 1) { // 4개 
                card[i].style.width = "50%";
                card[i].style.height = "50%";
            } else if (this.level == 2) { // 12개
                card[i].style.width = "25%";
                card[i].style.height = "33%";
            } else if (this.level == 3) { // 16개
                card[i].style.width = "25%";
                card[i].style.height = "25%";
            } else if (this.level == 4) { // 24개
                card[i].style.width = "16.6%";
                card[i].style.height = "25%";
            }
        }
    }

    showCardDeck() {
        let cnt = 0;

        // 처음 써봄 - 약속?
        let showCardPromise = new Promise((resolve, reject) => {
            let showCardTimer = setInterval(() => {
                this.cardBack[cnt].style.transform = "rotateY(180deg)";
                this.cardFront[cnt++].style.transform = "rotateY(0)";
                // 다 뒤집으면 종료
                if (cnt === this.BOARD_SIZE) {
                    clearInterval(showCardTimer);
                    resolve();
                }
            }, 200);
        });

        // resolve를 실행하면 성공 reject를 실행하면 실패
        showCardPromise.then(() => {
            setTimeout(() => {
                this.hideCardDeck();
            }, 2000);
        })
    }

    hideCardDeck() {
        for (let i = 0; i < this.BOARD_SIZE; i++) {
            this.cardBack[i].style.transform = "rotateY(0deg)";
            this.cardFront[i].style.transform = "rotateY(180deg)";
        }

        setTimeout(() => {
            this.isFlip = true;
            this.startTimer();
        }, 100);
    }

    // 카드 오픈
    openCard(id) {
        this.cardBack[id].style.transform = "rotateY(180deg)";
        this.cardFront[id].style.transform = "rotateY(0deg)";

        // 선택한 카드의 open 여부를 true로 변경
        this.cardDeck[id].isOpen = true;

        // 선택한 카드가 첫 번째로 선택한 카드인지
        // 두 번째로 선택한 카드인지 판별하기 위해 
        // 오픈한 카드의 index를 저장하는 배열 요청
        let openCardIndexArr = this.getOpenCardArr();

        // 두 번째 선택인 경우 카드 일치 여부 확인
        // 일치 여부 확인 전까지 카드 뒤집기 불가(isFlip = false)
        if (openCardIndexArr.length === 2) {
            this.isFlip = false;
            this.checkCardMatch(openCardIndexArr);
        }
    }

    getOpenCardArr() {
        let openCardIndexArr = [];

        // 카드는 오픈했는데 아직 짝을 맞추지 않은 카드라면
        for (let i = 0; i < this.cardDeck.length; i++) {
            if (this.cardDeck[i].isOpen === true &&
                this.cardDeck[i].isMatch === false)
                openCardIndexArr.push(i);
        }

        return openCardIndexArr;
    }

    checkCardMatch(arr) {
        let firstCard = this.cardDeck[arr[0]];
        let secondCard = this.cardDeck[arr[1]];
        if (firstCard.card === secondCard.card) {
            firstCard.isMatch = true;
            secondCard.isMatch = true;

            this.matchCard();
        } else {
            firstCard.isOpen = false;
            secondCard.isOpen = false;

            this.closeCard(arr);
        }
    }

    matchCard() {
        if (this.checkClear()) {
            this.endGame();
            return;
        }

        setTimeout(() => {
            this.isFlip = true;
        }, 100);
    }

    checkClear() {
        for (let i = 0; i < this.cardDeck.length; i++) {
            if (this.cardDeck[i].isMatch === false) {
                return false;
            }
        }
        return true;
    }

    closeCard(arr) {
        setTimeout(() => {
            for (let i = 0; i < arr.length; i++) {
                this.cardBack[arr[i]].style.transform = "rotateY(0deg)";
                this.cardFront[arr[i]].style.transform = "rotateY(-180deg)";
            }

            this.isFlip = true;
        }, 1000);
    }

    // 게임이 종료되면
    showGameResult() {
        setTimeout(() => {
            // 클리어
            if (this.time > 0) {
                this.board.innerHTML = "";
                this.timer.innerHTML = "";
                clearInterval(this.timerInterval);
                this.start.style.top = "50%";
                this.start.innerHTML = `Stage ${this.level} 클리어<br>${100-this.time}초 <br><br>클릭`;

                if (this.level === 1) {
                    this.BOARD_SIZE = 12;
                } else if (this.level === 2) {
                    this.BOARD_SIZE = 16;
                } else if (this.level === 3) {
                    this.BOARD_SIZE = 24;
                } else {
                    this.start.innerHTML = `축하합니다`;
                    this.level = 0;
                    this.BOARD_SIZE = 4;
                    this.start.style.onclick = `location.href = "../index.html";`;
                }
                this.level++;
            }
            // 게임오버
            else {
                this.board.innerHTML = "";
                this.timer.innerHTML = "";
                clearInterval(this.timerInterval);
                this.start.style.top = "50%";
                this.start.innerHTML = `게임오버<br>클릭시 재시작`;
            }
            this.stage.innerHTML = ``;
        }, 1000);
    }
}

let cardgame = new cards();