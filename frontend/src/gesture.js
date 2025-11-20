// gesture.js (경로 수정 버전)
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let video, canvas, ctx, statusDiv;
let handLandmarker;
let lastGesture = "None";

window.addEventListener("DOMContentLoaded", async () => {
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  statusDiv = document.getElementById("status");
  ctx = canvas.getContext("2d");

  try {
    await init();
  } catch (e) {
    console.error("Gesture 초기화 실패:", e);
    statusDiv.textContent = "Gesture init 실패";
  }
});

async function init() {
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
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  await new Promise((r) => (video.onloadedmetadata = r));
}

function vec(a, b) { return { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }; }
function norm(v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
function angle(a, b) { return (Math.acos(dot(a, b) / (norm(a) * norm(b))) * 180) / Math.PI; }

function fingerExtended(lm, idx) {
  const mcp = lm[idx], pip = lm[idx+1], dip = lm[idx+2], tip = lm[idx+3];
  const v1 = vec(mcp, pip), v2 = vec(dip, tip);
  const ang = angle(v1, v2);
  return Math.max(0, Math.min(1, (90 - ang) / 80));
}

function thumbExtended(lm) {
  const v1 = vec(lm[1], lm[2]), v2 = vec(lm[3], lm[4]);
  const ang = angle(v1, v2);
  return Math.max(0, Math.min(1, (ang - 20) / 140));
}

function recognize(lm) {
  const t = thumbExtended(lm);
  const i = fingerExtended(lm, 5);
  const m = fingerExtended(lm, 9);
  const r = fingerExtended(lm, 13);
  const p = fingerExtended(lm, 17);
  const avg = (i + m + r + p) / 4;

  if (avg > 0.6 && t > 0.5) return "OpenPalm";
  if (avg < 0.3 && t < 0.5) return "Fist";
  if (t > 0.7 && avg < 0.4) return "ThumbsUp";
  if (i > 0.7 && m > 0.7 && r < 0.4 && p < 0.4) return "Victory";
  if (i > 0.7 && m < 0.4 && r < 0.4 && p < 0.4) return "Pointing";
  return "None";
}

async function detectLoop() {
  const results = handLandmarker.detectForVideo(video, performance.now());
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results && results.landmarks && results.landmarks[0]) {
    const lm = results.landmarks[0];
    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });
    const gesture = recognize(lm);
    if (gesture !== lastGesture) {
      statusDiv.textContent = "Gesture: " + gesture;
      console.log("인식된 제스처:", gesture);
      lastGesture = gesture;
    }
  }

  requestAnimationFrame(detectLoop);
}
