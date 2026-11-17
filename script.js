const canvas = document.getElementById('spacetimeCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let screenScale = 1.75; 
let mouse = { x: 0, z: 1000, targetX: 0, targetZ: 1000, active: false };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // VISUAL FIX: Reverted to the original universal math that looked perfect on both PC and mobile
    screenScale = Math.min(1.85, width * 0.00091); 
}
window.addEventListener('resize', resize);

// ----------------------------------------------------
// GENERATE BASE PARTICLE TEXT
// ----------------------------------------------------
const textCanvas = document.createElement('canvas');
const tCtx = textCanvas.getContext('2d', { willReadFrequently: true });
textCanvas.width = 2000; 
textCanvas.height = 500;

tCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
tCtx.font = '900 220px "Mona Sans", sans-serif'; 
tCtx.fillStyle = '#ffffff';
tCtx.textAlign = 'center';
tCtx.textBaseline = 'middle';
tCtx.fillText('PRAJWAL O', textCanvas.width / 2, textCanvas.height / 2);

const imgData = tCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
let baseTextParticles = [];

const step = 4; 
for (let y = 0; y < textCanvas.height; y += step) {
    for (let x = 0; x < textCanvas.width; x += step) {
        let alpha = imgData[(y * textCanvas.width + x) * 4 + 3];
        if (alpha > 128) {
            baseTextParticles.push({ 
                baseX: (x - textCanvas.width / 2), 
                baseZ: (textCanvas.height / 2 - y)
            });
        }
    }
}

resize();

// ----------------------------------------------------
// INTERACTION (Mouse + Touch)
// ----------------------------------------------------
const header = document.querySelector('.spacetime-header');

header.addEventListener('mousemove', (e) => {
    mouse.active = true;
    const rect = header.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (width < 768) {
        // SENSITIVITY FIX: Slower reaction speed for mobile
        mouse.targetX = (x / width - 0.5) * 2200;
        mouse.targetZ = (1 - (y / height)) * 2000;
    } else {
        // Normal fast reaction speed for PC
        mouse.targetX = (x / width - 0.5) * 4500;
        mouse.targetZ = (1 - (y / height)) * 3500 - 200;
    }
});

header.addEventListener('touchmove', (e) => {
    mouse.active = true;
    const rect = header.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // SENSITIVITY FIX: Slower reaction speed for mobile touch
    mouse.targetX = (x / width - 0.5) * 2200;
    mouse.targetZ = (1 - (y / height)) * 2000;
}, { passive: true });

header.addEventListener('mouseleave', () => { mouse.active = false; });
header.addEventListener('touchend', () => { mouse.active = false; });

// ----------------------------------------------------
// 3D ENGINE
// ----------------------------------------------------
function project(x, y, z) {
    // CAMERA FIX: Removed the mobile-specific overrides that broke the view. 
    // This is the exact camera setup that looked great before.
    const fov = 750; 
    const camZ = -500; 
    const camY = -450; 
    const pitch = 0.65; 
    
    let cz = z - camZ;
    let cy = y - camY;
    
    let ry = cy * Math.cos(pitch) - cz * Math.sin(pitch);
    let rz = cy * Math.sin(pitch) + cz * Math.cos(pitch);
    
    if (rz < 1) rz = 1; 
    
    let scale = fov / rz;
    return {
        x: width / 2 + x * scale,
        y: height / 2 + ry * scale,
        scale: scale
    };
}

function animate() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    mouse.x += (mouse.targetX - mouse.x) * 0.1;
    mouse.z += (mouse.targetZ - mouse.z) * 0.1;

    const gridWidth = 18000; 
    const gridDepth = 14000;
    const cols = 100; 
    const rows = 80;
    const dx = gridWidth / cols;
    const dz = gridDepth / rows;
    const startX = -gridWidth / 2;
    const startZ = -1500; 
    
    const radius = 800; 
    const wellDepth = 90; 

    let points = [];
    
    for (let r = 0; r <= rows; r++) {
        let rowPoints = [];
        for (let c = 0; c <= cols; c++) {
            let px = startX + c * dx;
            let pz = startZ + r * dz;
            let py = 0; 

            if (mouse.active) {
                let dist = Math.sqrt(Math.pow(px - mouse.x, 2) + Math.pow(pz - mouse.z, 2));
                if (dist < radius) {
                    let force = Math.cos((dist / radius) * (Math.PI / 2));
                    py = (force * force) * wellDepth; 
                }
            }
            rowPoints.push({ x: px, y: py, z: pz });
        }
        points.push(rowPoints);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';

    for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
            let p = points[r][c];
            let pr = project(p.x, p.y, p.z);
            if (c === 0) ctx.moveTo(pr.x, pr.y);
            else ctx.lineTo(pr.x, pr.y);
        }
        ctx.stroke();
    }

    for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
            let p = points[r][c];
            let pr = project(p.x, p.y, p.z);
            if (r === 0) ctx.moveTo(pr.x, pr.y);
            else ctx.lineTo(pr.x, pr.y);
        }
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < baseTextParticles.length; i++) {
        let bp = baseTextParticles[i];
        
        let tpX = bp.baseX * screenScale;
        let tpZ = bp.baseZ * screenScale + 680;
        let py = 0;

        if (mouse.active) {
            let dist = Math.sqrt(Math.pow(tpX - mouse.x, 2) + Math.pow(tpZ - mouse.z, 2));
            if (dist < radius) {
                let force = Math.cos((dist / radius) * (Math.PI / 2));
                py = (force * force) * wellDepth;
            }
        }

        let pr = project(tpX, py, tpZ);
        if (pr.scale > 0) {
            let size = Math.max(0.65, 2.2 * pr.scale); 
            ctx.fillRect(pr.x, pr.y, size, size);
        }
    }

    if (mouse.active) {
        let corePr = project(mouse.x, wellDepth, mouse.z);
        if(corePr.scale > 0) {
            ctx.beginPath();
            ctx.arc(corePr.x, corePr.y, 4 * corePr.scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    requestAnimationFrame(animate);
}

animate();