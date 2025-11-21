import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let video, canvas, ctx, statusDiv;
let handLandmarker;
let lastFingerCount = -1;

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

/* ----------------------------
  벡터 / 각도 계산 (동일)
-----------------------------*/
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

/* -----------------------------------
  손가락 펴짐 정도 계산 (0~1)
-----------------------------------*/
function fingerExtended(lm, idx) {
  const mcp = lm[idx],
    pip = lm[idx + 1],
    dip = lm[idx + 2],
    tip = lm[idx + 3];
  const v1 = vec(mcp, pip),
    v2 = vec(dip, tip);
  const ang = angle(v1, v2);
  return Math.max(0, Math.min(1, (90 - ang) / 80));
}

function thumbExtended(lm) {
  const v1 = vec(lm[1], lm[2]),
    v2 = vec(lm[3], lm[4]);
  const ang = angle(v1, v2);
  return Math.max(0, Math.min(1, (ang - 20) / 140));
}

/* -----------------------------------
  손가락 개수 계산 (0~4)
-----------------------------------*/
function countFingers(lm) {
  const i = fingerExtended(lm, 5);   // index
  const m = fingerExtended(lm, 9);   // middle
  const r = fingerExtended(lm, 13);  // ring
  const p = fingerExtended(lm, 17);  // pinky

  const TH = 0.5; // 임계값

  let count = 0;
  if (i > TH) count++;
  if (m > TH) count++;
  if (r > TH) count++;
  if (p > TH) count++;

  return count;
}

/* -----------------------------------
  메인 Detection 루프
-----------------------------------*/
function detectLoop() {
  if (!handLandmarker) return;

  const results = handLandmarker.detectForVideo(video, performance.now());
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results && results.landmarks && results.landmarks[0]) {
    const lm = results.landmarks[0];

    // 랜드마크 그리기
    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    // 계산된 손가락 개수
    const fingerCount = countFingers(lm);

    if (fingerCount !== lastFingerCount) {
      lastFingerCount = fingerCount;

      statusDiv.textContent = "Finger: " + fingerCount;
      console.log("Finger Count =", fingerCount);

      // Phaser 게임으로 이벤트 전송 (1~4만)
      if (fingerCount >= 1 && fingerCount <= 4) {
        window.dispatchEvent(
          new CustomEvent("finger-count", { detail: { count: fingerCount } })
        );
      }
    }
  }

  requestAnimationFrame(detectLoop);
}

/* -----------------------------------
  제거 함수 (동일)
-----------------------------------*/
export function removeGesture() {
  const elementsToRemove = [video, canvas, statusDiv];

  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach((t) => t.stop());
    video.srcObject = null;
  }

  elementsToRemove.forEach((el) => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });

  video = null;
  canvas = null;
  statusDiv = null;

  console.log("✋ 제스처 카메라 비활성화 및 제거 완료.");
}
