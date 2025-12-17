class Cards {
    constructor() {
        this.board = document.querySelector(".board"); // 클래스 선택자로 변경
        this.start = document.querySelector(".startCard");
        this.timer = document.querySelector("#timer");
        this.stage = document.querySelector(".stage");
        this.time = 100;
        this.level = 1;
        this.isFlip = false; // 카드 뒤집기 가능 여부
        this.timerInterval = null;
        this.cardDeck = [];
        this.BOARD_SIZE = 4;

        // 게임 시작 버튼
        this.start.addEventListener("click", () => {
            this.start.style.top = "-1000px";
            this.startGame();
        });

        // 이벤트 위임 (카드 클릭)
        this.board.addEventListener("click", e => {
            if (!this.isFlip) return;

            // 클릭한 요소가 카드 내부라면 카드 요소 찾기
            const cardEl = e.target.closest(".card");
            if (cardEl && !cardEl.classList.contains("flipped")) {
                const clickCardId = parseInt(cardEl.dataset.id);
                // 이미 열린 카드가 아니면 오픈
                if (!this.cardDeck[clickCardId].isOpen) {
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

    initGame() {
        this.isFlip = false;
        this.time = 100;
        this.cardDeck = [];
        clearInterval(this.timerInterval);
    }

    initScreen() {
        this.board.innerHTML = "";
        this.stage.innerHTML = `Stage ${this.level}`;
        this.timer.innerHTML = this.time;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.time--;
            this.timer.innerHTML = this.time;

            if (this.time <= 0) {
                clearInterval(this.timerInterval);
                this.endGame(false); // 시간 초과 패배
            }
        }, 1000);
    }

    makeCardDeck() {
        const pairCount = this.BOARD_SIZE / 2;
        let randNumArr = [];

        while (randNumArr.length < pairCount) {
            let rNum = Math.floor(Math.random() * 13) + 1;
            if (!randNumArr.includes(rNum)) {
                randNumArr.push(rNum);
            }
        }
        // 쌍 만들기 및 셔플
        randNumArr = [...randNumArr, ...randNumArr];
        randNumArr.sort(() => Math.random() - 0.5);

        this.cardDeck = randNumArr.map(num => ({
            card: num,
            isOpen: false,
            isMatch: false
        }));
    }

    settingCardDeck() {
        // [최적화] DocumentFragment 사용하여 리플로우 최소화
        const fragment = document.createDocumentFragment();

        this.cardDeck.forEach((item, i) => {
            const card = document.createElement("div");
            card.className = "card";
            card.dataset.id = i;
            card.dataset.card = item.card;
            
            // 반응형 크기 설정
            let sizeClass = "";
            if (this.level === 1) sizeClass = "col-2";      // 4개 (2x2)
            else if (this.level === 2) sizeClass = "col-4"; // 12개 (4x3) - CSS 제어 권장
            else if (this.level === 3) sizeClass = "col-4"; // 16개 (4x4)
            else sizeClass = "col-6";                       // 24개 (6x4)

            // JS에서 스타일 직접 주입 (기존 로직 유지)
            if (this.level == 1) { card.style.width = "50%"; card.style.height = "50%"; }
            else if (this.level == 2) { card.style.width = "25%"; card.style.height = "33.3%"; }
            else if (this.level == 3) { card.style.width = "25%"; card.style.height = "25%"; }
            else if (this.level == 4) { card.style.width = "16.66%"; card.style.height = "25%"; }

            card.innerHTML = `
                <div class="card_back"></div>
                <div class="card_front" style="background-image: url(../img/${item.card}.png)"></div>
            `;
            fragment.appendChild(card);
        });

        this.board.appendChild(fragment);
        this.cardsEl = document.querySelectorAll(".card"); // DOM 요소 캐싱
    }

    showCardDeck() {
        let cnt = 0;
        let showInterval = setInterval(() => {
            if (cnt >= this.BOARD_SIZE) {
                clearInterval(showInterval);
                setTimeout(() => this.hideCardDeck(), 2000);
                return;
            }
            // CSS 클래스로 제어 (transform 직접 조작보다 깔끔함)
            this.cardsEl[cnt].classList.add("flipped");
            cnt++;
        }, 100);
    }

    hideCardDeck() {
        this.cardsEl.forEach(card => card.classList.remove("flipped"));
        setTimeout(() => {
            this.isFlip = true;
            this.startTimer();
        }, 500);
    }

    openCard(id) {
        // 화면 뒤집기
        this.cardsEl[id].classList.add("flipped");
        // 데이터 업데이트
        this.cardDeck[id].isOpen = true;

        // 열린 카드 찾기
        const openCards = this.cardDeck
            .map((c, i) => ({ ...c, index: i }))
            .filter(c => c.isOpen && !c.isMatch);

        if (openCards.length === 2) {
            this.isFlip = false; // 추가 클릭 방지
            this.checkMatch(openCards);
        }
    }

    checkMatch(openCards) {
        const [first, second] = openCards;

        if (first.card === second.card) {
            // 정답
            this.cardDeck[first.index].isMatch = true;
            this.cardDeck[second.index].isMatch = true;
            this.isFlip = true;
            
            // 클리어 체크
            if (this.cardDeck.every(c => c.isMatch)) {
                this.endGame(true);
            }
        } else {
            // 오답 -> 다시 닫기
            this.cardDeck[first.index].isOpen = false;
            this.cardDeck[second.index].isOpen = false;
            
            setTimeout(() => {
                this.cardsEl[first.index].classList.remove("flipped");
                this.cardsEl[second.index].classList.remove("flipped");
                this.isFlip = true;
            }, 800);
        }
    }

    endGame(isClear) {
        clearInterval(this.timerInterval);
        setTimeout(() => {
            this.board.innerHTML = "";
            this.start.style.top = "50%";
            this.start.style.display = "block"; // 숨겨졌을 수 있으므로

            if (isClear) {
                this.start.innerHTML = `Stage ${this.level} 클리어!<br>${100 - this.time}초 소요<br>다음 단계로`;
                
                // 레벨업 로직
                if (this.level === 1) this.BOARD_SIZE = 12;
                else if (this.level === 2) this.BOARD_SIZE = 16;
                else if (this.level === 3) this.BOARD_SIZE = 24;
                else {
                    this.start.innerHTML = "축하합니다!<br>모든 스테이지 클리어!<br>홈으로";
                    this.start.onclick = () => location.href = "../index.html";
                    return;
                }
                this.level++;
            } else {
                this.start.innerHTML = "게임 오버<br>다시 도전";
            }
        }, 500);
    }
}

// CSS에 .card.flipped .card_back { transform: rotateY(180deg); } 등을 추가하면 더 깔끔합니다.
// 여기서는 JS로 transform을 제어하던 기존 방식 호환을 위해 classList.add('flipped')를 썼지만,
// CSS 파일에 .flipped 관련 스타일이 없다면 기존처럼 직접 style.transform을 줘야 합니다.
// 편의를 위해 JS에서 직접 style을 주는 헬퍼를 추가하거나 CSS를 수정하는 것이 좋습니다.
// (위 코드는 CSS 수정 없이 동작하도록 하려면 showCardDeck 부분의 classList 대신 style 조작을 복구해야 함)

const cardGame = new Cards();
