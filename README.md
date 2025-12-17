# 🍉 Project Momizi: Watermelon Challenge
> **물리 엔진 기반의 웹 브라우저 반응형 퍼즐 게임** > *"떨어뜨리고, 합치고, 수박을 만드세요!"*

![Generic badge](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg) ![Generic badge](https://img.shields.io/badge/Library-Matter.js-blue.svg) ![Generic badge](https://img.shields.io/badge/Style-Responsive-green.svg)

## 📖 프로젝트 소개 (Introduction)
과거 여러 미니게임을 모아둔 프로젝트에서 벗어나, **가장 기술적 난이도가 높았던 '수박게임'에 집중하여 최적화한 리마스터 버전**입니다.
별도의 설치 없이 웹 브라우저에서 바로 즐길 수 있으며, 모바일과 PC 환경 모두에 완벽하게 대응합니다.

### 🔗 [게임 플레이 링크 (Demo)](https://park-yunjae.github.io/ProjectMomizi/)
*(위 링크를 클릭하면 바로 게임을 시작할 수 있습니다.)*

---

## 🚀 주요 기능 및 기술적 특징 (Key Features)

### 1. ⚡ 물리 엔진 최적화 (Matter.js)
- **일정한 게임 속도:** `Runner.create({ isFixed: true })` 옵션을 사용하여, 고사양/저사양 기기 상관없이 동일한 물리 연산 속도를 보장합니다.
- **무한의 벽 (Infinite Walls):** 반응형 화면 크기 조절 시, 물리 객체가 벽을 뚫고 나가는 버그(Tunneling)를 방지하기 위해 `10000px` 길이의 가상 벽을 구현했습니다.

### 2. 📱 완벽한 반응형 & 모바일 지원
- **통합 입력 시스템:** 마우스(PC)와 터치(Mobile) 이벤트를 하나의 로직으로 통합하여 기기 구분 없는 매끄러운 조작감을 제공합니다.
- **모바일 햄버거 메뉴:** 화면이 좁은 모바일 환경에서는 상단 메뉴가 자동으로 햄버거 버튼으로 변환됩니다.

### 3. 🏆 서버 없는 랭킹 시스템 (Local Storage)
- 백엔드 서버 없이 브라우저의 `LocalStorage`를 활용하여 **데이터 영속성**을 구현했습니다.
- 게임 오버 시 상위 5개의 최고 기록을 자동으로 정렬하여 저장하고 보여줍니다.

### 4. 🔊 파일 없는 사운드 합성 (Web Audio API)
- 오디오 파일(`.wav`) 의존성을 제거하고, 브라우저 자체 `AudioContext`를 이용해 **즉석에서 효과음을 합성**합니다.
- 이로 인해 로딩 속도가 빨라지고 리소스 관리가 간편해졌습니다.

---

## 🛠 기술 스택 (Tech Stack)

| 구분 | 기술 | 설명 |
|:---:|:---:|:---|
| **Core** | <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black"/> | ES6+ 문법, 모듈 시스템(Module) 활용 |
| **Physics** | **Matter.js** | 2D 물리 엔진 라이브러리 |
| **Styling** | <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white"/> | Flexbox, 애니메이션, 반응형 미디어 쿼리 |
| **Markup** | <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white"/> | 시맨틱 태그 구조 |

---

## 📂 폴더 구조 (Directory Structure)
```bash
ProjectMomizi/
├── index.html        # 메인 실행 파일 (게임 + UI)
├── style.css         # 통합 스타일시트
├── script.js         # 게임 로직 및 UI 제어
├── matter.js         # 물리 엔진 라이브러리
└── img/              # 이미지 리소스 폴더
    ├── logo.png
    └── watermelon_Img/ (과일 스프라이트)
