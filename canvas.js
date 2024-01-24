import Snow from "./Snow.js";

class Canvas {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.className = "canvas";
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);
        this.snows = [];
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        this.createSnows();
        this.viewSnow();
        this.isSize = false;
    }

    resize() {
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        this.animate();
        // 모바일은 적게 뿌려줌 pc는 두배
        if (this.canvas.width > 768 && !this.isSize) {
            this.isSize = true;
            for (let i = 0; i < 26; i++) {
                this.snows.push(new Snow(i % 13 + 1, this.canvas));
            }
        } else if (this.canvas.width < 768 && this.isSize) {
            this.isSize = false;
            for (let i = 0; i < 26; i++) {
                this.snows.pop();
            }
        }
    }

    animate() {

    }

    createSnows() {
        for (let i = 0; i < 26; i++) {
            this.snows.push(new Snow(i % 13 + 1, this.canvas));
        }
    }

    viewSnow() {
        setInterval(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.snows.forEach(x => x.render(this.ctx));
            this.snows.forEach(x => x.update(this.canvas));
        }, 15);
    }

}

let canvas = new Canvas();