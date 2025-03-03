const bubbles = document.querySelectorAll('.bubble');
let currentIndex = 0;
const starsCanvas = document.getElementById('stars');
const starsCtx = starsCanvas.getContext('2d');
let stars = [];
let touchStartY = 0;
let touchEndY = 0;
function resizeCanvas() {
  starsCanvas.width = window.innerWidth;
  starsCanvas.height = window.innerHeight;
}
function initializeBubbles() {
  bubbles.forEach(bubble => {
    bubble.classList.remove('top', 'middle', 'bottom');
  });
  const topIndex = (currentIndex - 1 + bubbles.length) % bubbles.length;
  const bottomIndex = (currentIndex + 1) % bubbles.length;
  bubbles[currentIndex].classList.add('middle');
  bubbles[topIndex].classList.add('top');
  bubbles[bottomIndex].classList.add('bottom');
}
function rotateBubbles(direction) {
  bubbles.forEach(bubble => bubble.classList.remove('top', 'middle', 'bottom'));
  if (direction === 'down') {
    currentIndex = (currentIndex + 1) % bubbles.length;
  } else {
    currentIndex = (currentIndex - 1 + bubbles.length) % bubbles.length;
  }
  const topIndex = (currentIndex - 1 + bubbles.length) % bubbles.length;
  const bottomIndex = (currentIndex + 1) % bubbles.length;
  bubbles[currentIndex].classList.add('middle');
  bubbles[topIndex].classList.add('top');
  bubbles[bottomIndex].classList.add('bottom');
}
function generateStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * starsCanvas.width,
      y: Math.random() * starsCanvas.height,
      size: Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.05
    });
  }
}
function drawStars() {
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  stars.forEach(star => {
    starsCtx.beginPath();
    starsCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    starsCtx.fillStyle = `rgba(255, 255, 255, ${Math.sin(star.twinkle) * 0.5 + 0.5})`;
    starsCtx.fill();
    star.twinkle += star.speed;
  });
  requestAnimationFrame(drawStars);
}
function handleTouchStart(event) {
  touchStartY = event.touches[0].clientY;
}
function handleTouchEnd(event) {
  touchEndY = event.changedTouches[0].clientY;
  const swipeDistance = touchStartY - touchEndY;
  if (Math.abs(swipeDistance) > 50) {
    if (swipeDistance > 0) {
      rotateBubbles('down');
    } else {
      rotateBubbles('up');
    }
  }
}
let scrollTimeout;
window.addEventListener('wheel', (event) => {
  if (scrollTimeout) return;
  rotateBubbles(event.deltaY > 0 ? 'down' : 'up');
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null;
  }, 500);
});
window.addEventListener('touchstart', handleTouchStart);
window.addEventListener('touchend', handleTouchEnd);
window.addEventListener('resize', () => {
  resizeCanvas();
  generateStars();
});
resizeCanvas();
generateStars();
drawStars();
initializeBubbles();