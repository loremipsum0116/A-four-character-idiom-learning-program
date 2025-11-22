import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let video, canvas, ctx, statusDiv;
let handLandmarker;
let pendingFingerCount = null;
let fingerTimer = null;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],        // 엄지
  [0, 5], [5, 6], [6, 7], [7, 8],        // 검지
  [0, 9], [9, 10], [10, 11], [11, 12],   // 중지
  [0, 13], [13, 14], [14, 15], [15, 16], // 약지
  [0, 17], [17, 18], [18, 19], [19, 20], // 새끼
];

export async function initGesture(parent = document.body) {
  if (!video) {
    video = document.createElement("video");
    video.id = "video";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.position = "absolute";
    video.style.top = "20px";
    video.style.left = "50%";
    video.style.transform = "translateX(-50%)";
    video.style.width = "320px";
    video.style.height = "240px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    video.style.borderRadius = "8px";
    video.style.zIndex = "9";
    parent.appendChild(video);

    canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.width = 320;
    canvas.height = 240;
    canvas.style.position = "absolute";
    canvas.style.top = "20px";
    canvas.style.left = "50%";
    canvas.style.transform = "translateX(-50%)";
    canvas.style.border = "2px solid white";
    canvas.style.borderRadius = "8px";
    canvas.style.zIndex = "11";
    parent.appendChild(canvas);

    statusDiv = document.createElement("div");
    statusDiv.id = "status";
    statusDiv.textContent = "Finger: 0";
    statusDiv.style.position = "absolute";
    statusDiv.style.top = "270px";
    statusDiv.style.left = "50%";
    statusDiv.style.transform = "translateX(-50%)";
    statusDiv.style.fontSize = "20px";
    statusDiv.style.color = "white";
    statusDiv.style.textShadow = "2px 2px 5px black";
    statusDiv.style.zIndex = "12";
    parent.appendChild(statusDiv);

    ctx = canvas.getContext("2d");
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

function vec(a, b) {
  return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
}
function norm(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
function angle(a, b) {
  return (Math.acos(dot(a, b) / (norm(a) * norm(b))) * 180) / Math.PI;
}

// 검지~새끼 손가락 펴짐 계산
function fingerExtended(lm, idx) {
  const mcp = lm[idx], pip = lm[idx + 1], dip = lm[idx + 2], tip = lm[idx + 3];
  const v1 = vec(mcp, pip), v2 = vec(dip, tip);
  const ang = angle(v1, v2);
  return Math.max(0, Math.min(1, (90 - ang) / 80));
}

// 엄지 펴짐 계산 (벡터 기반)
function thumbExtended(lm) {
  const mcp = lm[2]; // 엄지 MCP
  const tip = lm[4]; // 엄지 TIP

  // 손바닥 중심
  const palmCenter = {
    x: (lm[0].x + lm[5].x + lm[9].x + lm[13].x + lm[17].x) / 5,
    y: (lm[0].y + lm[5].y + lm[9].y + lm[13].y + lm[17].y) / 5,
    z: (lm[0].z + lm[5].z + lm[9].z + lm[13].z + lm[17].z) / 5,
  };

  const v_thumb = vec(mcp, tip);
  const v_palm = vec(mcp, palmCenter);

  const ang = angle(v_thumb, v_palm);

  // 엄지가 검지 MCP 쪽에 일정 거리 이하로 붙으면 접힘
  const distToIndex = norm(vec(tip, lm[5])); // TIP과 검지 MCP 거리
  const THRESHOLD_DIST = 0.12; // 조금만 붙어도 접힘 처리, 기존 0.05 → 0.12

  if (distToIndex < THRESHOLD_DIST) return 0; // 접힘
  return ang > 50 ? 1 : 0; // 각도가 크면 펴짐, 작으면 접힘
}


// 손가락 개수 계산
function countFingers(lm) {
  const TH = 0.5;

  const thumb = thumbExtended(lm);
  const i = fingerExtended(lm, 5) > TH ? 1 : 0;
  const m = fingerExtended(lm, 9) > TH ? 1 : 0;
  const r = fingerExtended(lm, 13) > TH ? 1 : 0;
  const p = fingerExtended(lm, 17) > TH ? 1 : 0;

  return thumb + i + m + r + p;
}

// 손뼈 라인 그리기
function drawHandSkeleton(lm) {
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 3;

  HAND_CONNECTIONS.forEach(([s, e]) => {
    ctx.beginPath();
    ctx.moveTo(lm[s].x * canvas.width, lm[s].y * canvas.height);
    ctx.lineTo(lm[e].x * canvas.width, lm[e].y * canvas.height);
    ctx.stroke();
  });
}

function detectLoop() {
  if (!handLandmarker) return;

  const results = handLandmarker.detectForVideo(video, performance.now());
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results && results.landmarks && results.landmarks[0]) {
    const lm = results.landmarks[0];

    drawHandSkeleton(lm);

    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    const fingerCount = countFingers(lm);

    if (pendingFingerCount !== fingerCount) {
      pendingFingerCount = fingerCount;

      if (fingerTimer) clearTimeout(fingerTimer);

      fingerTimer = setTimeout(() => {
        statusDiv.textContent = "Finger: " + pendingFingerCount;

        window.dispatchEvent(
          new CustomEvent("finger-count", {
            detail: { count: pendingFingerCount },
          })
        );

        fingerTimer = null;
      }, 1000);
    }
  }

  requestAnimationFrame(detectLoop);
}

export function removeGesture() {
  const items = [video, canvas, statusDiv];

  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }

  items.forEach((el) => el && el.parentNode && el.parentNode.removeChild(el));

  video = null;
  canvas = null;
  statusDiv = null;

  console.log("✋ 제스처 카메라 비활성화 완료");
}
