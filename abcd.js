/*nav*/
function inverseMousePosition(element, event) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const res = {
    x1: -(x - rect.width / 2) / 20, // top left
    y1: -(y - rect.height / 2) / 20,
    x2: -(x - rect.width / 2) / 20, // top right
    y2: (y - rect.height / 2) / 20,
    x3: (x - rect.width / 2) / 20, // bottom left
    y3: -(y - rect.height / 2) / 20,
    x4: (x - rect.width / 2) / 20, // bottom right
    y4: (y - rect.height / 2) / 20
  };

  const resKey =
    "x" + (x < rect.width / 2 ? 1 : 2) + (y < rect.height / 2 ? 1 : 3);
  const tilt = res;
  return tilt !== undefined ? tilt : 0; // default to 0 if undefined
}




function handleClick(event) {
  const nav = document.querySelector('.nav');
  const target = event.target.parentNode;
  const width = target.offsetWidth;
  const { left } = target.getBoundingClientRect();
  const offsetLeft = left - nav.getBoundingClientRect().left;
  
  [...nav.querySelectorAll('li')].map(link => link.classList.remove('active'))
  event.target.parentNode.classList.add('active');

  nav.style.setProperty('--after-bg-position', offsetLeft);
  nav.style.setProperty('--after-radial-bg-position', (left + width/2) - nav.getBoundingClientRect().left);
  nav.style.setProperty('--after-bg-width', width);
}

const nav = document.querySelector('.nav');


const links = nav.querySelectorAll('li a');
for (let i = 0; i < links.length; i++) {
  links[i].addEventListener('click', handleClick);
   links[i].addEventListener("mousemove", (event) => {
      const tilt = inverseMousePosition(event.target, event);

      nav.style.setProperty("--tilt-bg-y", tilt.x1 * 2); // tone down the movement a bit
      nav.style.setProperty("--tilt-bg-x", tilt.y1 * 2); // tone down the movement a bit
   });
}

['DOMContentLoaded', 'resize'].map(event => window.addEventListener(event, () => {
  
  const {width, left} = links[0].parentNode.getBoundingClientRect();
  for (let i = 0; i < links.length; i++) {
  links[i].parentNode.classList.remove('active')
}

  links[0].parentNode.classList.add('active');

  const offsetLeft = left - nav.getBoundingClientRect().left;

  nav.style.setProperty('--after-bg-position', offsetLeft);
  nav.style.setProperty('--after-radial-bg-position', 0);
  nav.style.setProperty('--after-bg-width', width);
}));

/* Spacetime Curve*/

const canvas = document.getElementById('spacetimeCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let mouse = { x: 0, z: 1000, targetX: 0, targetZ: 1000, active: false };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// GENERATE PARTICLE TEXT
const textCanvas = document.createElement('canvas');
const tCtx = textCanvas.getContext('2d', { willReadFrequently: true });
// Middle-ground canvas width
textCanvas.width = 2200; 
textCanvas.height = 500;

tCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
// The "Goldilocks" font size
tCtx.font = '900 200px "Mona Sans", sans-serif'; 
tCtx.fillStyle = '#ffffff';
tCtx.textAlign = 'center';
tCtx.textBaseline = 'middle';
tCtx.fillText('PRAJWAL O', textCanvas.width / 2, textCanvas.height / 2);

const imgData = tCtx.getImageData(0, 0, textCanvas.width, textCanvas.height).data;
let textParticles = [];

const step = 4; // Density of particles
for (let y = 0; y < textCanvas.height; y += step) {
    for (let x = 0; x < textCanvas.width; x += step) {
        let alpha = imgData[(y * textCanvas.width + x) * 4 + 3];
        if (alpha > 128) {
            
            // Perfect middle-ground multiplier for the width spread
            let px = (x - textCanvas.width / 2) * 1.85; 
            
            // Set the depth (Z) exactly at 600 - right between the last two attempts
            let pz = (textCanvas.height / 2 - y) * 1.85 + 600; 
            
            textParticles.push({ x: px, z: pz });
        }
    }
}

// INTERACTION
const header = document.querySelector('.spacetime-header');
header.addEventListener('mousemove', (e) => {
    mouse.active = true;
    
    // Calculates mouse position relative to the header, even if scrolled
    const rect = header.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouse.targetX = (x / width - 0.5) * 4500;
    mouse.targetZ = (1 - (y / height)) * 3500 - 200;
});

header.addEventListener('mouseleave', () => {
    mouse.active = false;
});

// 3D ENGINE
function project(x, y, z) {
    const fov = 750;
    const camZ = -500; 
    const camY = -450; 
    
    let cz = z - camZ;
    let cy = y - camY;
    
    const pitch = 0.35; 
    
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

    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.z += (mouse.targetZ - mouse.z) * 0.15;

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
    for (let i = 0; i < textParticles.length; i++) {
        let tp = textParticles[i];
        let py = 0;

        if (mouse.active) {
            let dist = Math.sqrt(Math.pow(tp.x - mouse.x, 2) + Math.pow(tp.z - mouse.z, 2));
            if (dist < radius) {
                let force = Math.cos((dist / radius) * (Math.PI / 2));
                py = (force * force) * wellDepth;
            }
        }

        let pr = project(tp.x, py, tp.z);
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