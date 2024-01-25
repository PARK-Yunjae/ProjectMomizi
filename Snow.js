export default class Snow {
    constructor(num, canvas) {
        this.img = new Image();
        this.img.src = `./img/${num}.png`;
        this.img.addEventListener("load", () => {
            this.ready = true;
        });
        this.ready = false;
        // x y t는 기울기?
        this.x = null;
        this.y = null;
        this.t = Math.random() * (Math.PI * 2);
        this.sz = 100 / (10 + (Math.random() * 100)) * 0.5;
        this.dx;
        this.dy;
        // 크기값 
        this.w = 30;
        this.h = 30;

        this.speed = null;
        this.reset(canvas);
    }

    // 초기화
    reset(canvas) {
        this.snowSize();
        this.y = -40;
        this.x = Math.floor(Math.random() * (canvas.width - this.h * 2)); // 400 캔버스 안에 들어와야되고 20-20 => 40 > 
        this.speed = Math.random() + 1;
    }

    // 눈크기 랜덤 ( 정사각형 )
    snowSize() {
        let num = 5 * parseInt(Math.random() * 5 + 3);
        this.w = num;
        this.h = num;
    }

    // 위치 갱신
    update(canvas) {
        if (!this.ready) return;
        // y는 일정하게
        this.y += this.speed;
        // x는 왔다갔다
        this.t += 0.01;
        this.t = this.t >= Math.PI * 2 ? 0 : this.t;
        this.x += Math.sin(this.t * 1) * (this.sz * .3);

        if (this.x > canvas.w + 20) this.x = -20;
        if (this.x < -20) this.x = canvas.w + 20;

        if (this.y >= canvas.height) {
            this.reset(canvas);
        }
    }

    render(ctx) {
        if (!this.ready) return;
        ctx.beginPath();
        ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
        ctx.globalAlpha = 0.7; // 이미지 투명도 0 ~ 1
    }
}