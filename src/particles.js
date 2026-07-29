export function createParticles() {
    const canvas = document.createElement("canvas");

    canvas.id = "particles";

    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    const particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();

    window.addEventListener("resize", resize);

    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.3,
            dy: -Math.random() * 0.3 - 0.1,
            a: Math.random() * 0.6 + 0.2
        });
    }

    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const p of particles) {

            ctx.beginPath();

            ctx.fillStyle = `rgba(111,171,209,${p.a})`;

            ctx.shadowBlur = 15;
            ctx.shadowColor = "#6FABD1";

            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

            ctx.fill();

            p.x += p.dx;
            p.y += p.dy;

            if (p.y < -20)
                p.y = canvas.height + 20;

            if (p.x < -20)
                p.x = canvas.width + 20;

            if (p.x > canvas.width + 20)
                p.x = -20;
        }

        requestAnimationFrame(draw);
    }

    draw();
}
