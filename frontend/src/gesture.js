import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let video, canvas, ctx, statusDiv;
let handLandmarker;
let lastGesture = "None";

export async function initGesture(parent = document.body) {
  if (!video) {
    // 부모 컨테이너 안에 동적으로 생성
    video = document.createElement('video');
    video.id = 'video';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.position = 'absolute';
    video.style.top = '20px';
    video.style.left = '50%';
    video.style.transform = 'translateX(-50%)';
    video.style.width = '320px';
    video.style.height = '240px';
    video.style.border = '2px solid white';
    video.style.borderRadius = '8px';
    video.style.zIndex = '10';
    parent.appendChild(video);

    canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.position = 'absolute';
    canvas.style.top = '20px';
    canvas.style.left = '50%';
    canvas.style.transform = 'translateX(-50%)';
    canvas.style.zIndex = '11';
    parent.appendChild(canvas);

    statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    statusDiv.textContent = 'Gesture: None';
    statusDiv.style.position = 'absolute';
    statusDiv.style.top = '270px';
    statusDiv.style.left = '50%';
    statusDiv.style.transform = 'translateX(-50%)';
    statusDiv.style.fontSize = '20px';
    statusDiv.style.color = 'white';
    statusDiv.style.textShadow = '2px 2px 5px black';
    statusDiv.style.zIndex = '12';
    parent.appendChild(statusDiv);

    ctx = canvas.getContext('2d');
  }

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      numHands: 1,
      runningMode: "VIDEO",
    });

    await setupCamera();
    detectLoop();
  } catch (e) {
    console.error("Gesture 초기화 실패:", e);
    statusDiv.textContent = "Gesture init 실패";
  }
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise((r) => (video.onloadedmetadata = r));
}

function vec(a, b) { return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }; }
function norm(v) { return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z); }
function dot(a, b) { return a.x*b.x + a.y*b.y + a.z*b.z; }
function angle(a, b) { return (Math.acos(dot(a,b)/(norm(a)*norm(b)))*180)/Math.PI; }

function fingerExtended(lm, idx) {
  const mcp=lm[idx], pip=lm[idx+1], dip=lm[idx+2], tip=lm[idx+3];
  const v1=vec(mcp,pip), v2=vec(dip,tip);
  const ang = angle(v1,v2);
  return Math.max(0, Math.min(1,(90-ang)/80));
}

function thumbExtended(lm) {
  const v1=vec(lm[1],lm[2]), v2=vec(lm[3],lm[4]);
  const ang = angle(v1,v2);
  return Math.max(0, Math.min(1,(ang-20)/140));
}

function recognize(lm) {
  const t=thumbExtended(lm);
  const i=fingerExtended(lm,5);
  const m=fingerExtended(lm,9);
  const r=fingerExtended(lm,13);
  const p=fingerExtended(lm,17);
  const avg=(i+m+r+p)/4;

  if(avg>0.6 && t>0.5) return "OpenPalm";
  if(avg<0.3 && t<0.5) return "Fist";
  if(t>0.7 && avg<0.4) return "ThumbsUp";
  if(i>0.7 && m>0.7 && r<0.4 && p<0.4) return "Victory";
  if(i>0.7 && m<0.4 && r<0.4 && p<0.4) return "Pointing";
  return "None";
}

function detectLoop() {
  if(!handLandmarker) return;
  const results = handLandmarker.detectForVideo(video, performance.now());
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(results && results.landmarks && results.landmarks[0]) {
    const lm = results.landmarks[0];
    lm.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x*canvas.width, p.y*canvas.height, 6,0,2*Math.PI);
      ctx.fillStyle="red";
      ctx.fill();
    });
    const gesture = recognize(lm);
    if(gesture !== lastGesture) {
      statusDiv.textContent = "Gesture: " + gesture;
      console.log("인식된 제스처:", gesture);
      lastGesture = gesture;
    }
  }
  requestAnimationFrame(detectLoop);
}

export function removeGesture() {
  const elementsToRemove = [video, canvas, statusDiv];
  
  // 비디오 스트림 정지
  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }
  
  // DOM에서 요소 제거
  elementsToRemove.forEach(el => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  
  // 전역 변수 초기화
  video = null;
  canvas = null;
  statusDiv = null;
  // handLandmarker = null; // 필요에 따라 모델도 해제
  console.log('✋ 제스처 카메라 비활성화 및 제거 완료.');
}