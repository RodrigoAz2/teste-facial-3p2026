const video = document.getElementById('video');
const blinkStatus = document.getElementById('blinkStatus');

function dist(a,b){ const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy); }
const LEFT = [33,160,158,133,153,144];
const RIGHT = [263,387,385,362,380,373];

function computeEAR(landmarks, idx){
  const p1 = landmarks[idx[0]];
  const p2 = landmarks[idx[1]];
  const p3 = landmarks[idx[2]];
  const p4 = landmarks[idx[3]];
  const p5 = landmarks[idx[4]];
  const p6 = landmarks[idx[5]];
  const vertical = dist(p2, p6) + dist(p3, p5);
  const horizontal = dist(p1, p4) * 2.0;
  return vertical / horizontal;
}

let leftClosed = false;
let rightClosed = false;
const THRESH = 0.20;
const MIN_INTERVAL = 300;
let lastTrigger = 0;

function onResults(results){
  if(!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0){
    blinkStatus.textContent = 'Rosto não detetado';
    return;
  }
  const lm = results.multiFaceLandmarks[0];
  const leftEAR = computeEAR(lm, LEFT);
  const rightEAR = computeEAR(lm, RIGHT);
  const now = Date.now();

  if(leftEAR < THRESH && !leftClosed){
    leftClosed = true;
    if(now - lastTrigger > MIN_INTERVAL){
      lastTrigger = now;
      blinkStatus.textContent = `Pestanejo esquerdo — EAR ${leftEAR.toFixed(2)}`;
      if(window.moveLeft) window.moveLeft();
    }
  } else if(leftEAR >= THRESH){
    leftClosed = false;
  }

  if(rightEAR < THRESH && !rightClosed){
    rightClosed = true;
    if(now - lastTrigger > MIN_INTERVAL){
      lastTrigger = now;
      blinkStatus.textContent = `Pestanejo direito — EAR ${rightEAR.toFixed(2)}`;
      if(window.moveRight) window.moveRight();
    }
  } else if(rightEAR >= THRESH){
    rightClosed = false;
  }

  if(leftEAR >= THRESH && rightEAR >= THRESH){
    blinkStatus.textContent = `EAR L:${leftEAR.toFixed(2)} R:${rightEAR.toFixed(2)}`;
  }
}

const faceMesh = new FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
faceMesh.setOptions({maxNumFaces:1, refineLandmarks:true, minDetectionConfidence:0.6, minTrackingConfidence:0.6});
faceMesh.onResults(onResults);

async function startCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});
    video.srcObject = stream;
    await video.play();
    blinkStatus.textContent = 'Câmera ligada — piscadelas ativadas';
    const camera = new Camera(video, {
      onFrame: async () => await faceMesh.send({image: video}),
      width: 640,
      height: 480
    });
    camera.start();
  } catch(error){
    blinkStatus.textContent = 'Sem câmera disponível — conecte uma webcam para jogar com pestanejos.';
    console.error(error);
  }
}

startCamera();

// Expor funções para o UI em game.html
window.skipCalibration = skipCalibration;
window.toggleInvert = toggleInvert;
window.INVERT_BLINK_SIDE = INVERT_BLINK_SIDE;
