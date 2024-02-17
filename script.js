const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let draggedElement = null;

// Event listeners for dragging element containers
document.querySelectorAll('.element-container').forEach(elementContainer => {
    elementContainer.addEventListener('dragstart', (event) => {
        draggedElement = event.target;
    });
});

canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
});

canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    if (draggedElement) {
        const rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        // Teleport the element back on screen if it's placed off-screen
        x = Math.max(0, Math.min(canvas.width, x));
        y = Math.max(0, Math.min(canvas.height, y));
        // Draw the dropped element on the canvas
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(draggedElement.textContent, x, y);
        // Reset dragged element
        draggedElement = null;
    }
});