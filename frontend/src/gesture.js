import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let statusDiv = document.getElementById("status");
let ctx;

let handLandmarker;
let lastFingerCount = 0;

// 바로 초기화 시작 (index.html 제일 아래에서 불리니까 DOM은 이미 있음)
init().catch((e) => {
    console.error("Gesture 초기화 실패:", e);
    if (statusDiv) statusDiv.textContent = "Gesture init 실패";
});

async function init() {
    if (!video || !canvas) {
        console.error("video 또는 canvas 요소를 찾지 못했습니다.");
        return;
    }

    ctx = canvas.getContext("2d");

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

function fingerExtended(lm, idx) {
    const mcp = lm[idx],
        pip = lm[idx + 1],
        dip = lm[idx + 2],
        tip = lm[idx + 3];
    const v1 = vec(mcp, pip),
        v2 = vec(dip, tip);
    const ang = angle(v1, v2);
    // 각도가 작을수록 곧게 편 손가락 → 값이 1에 가까움
    return Math.max(0, Math.min(1, (90 - ang) / 80));
}

// 엄지는 이번 버전에서는 안 씀 (원하면 나중에 추가)
function thumbExtended(lm) {
    const v1 = vec(lm[1], lm[2]),
        v2 = vec(lm[3], lm[4]);
    const ang = angle(v1, v2);
    return Math.max(0, Math.min(1, (ang - 20) / 140));
}

// 검지/중지/약지/새끼 4개만 사용해서 0~4 개수 세기
function countFingers(lm) {
    const i = fingerExtended(lm, 5);   // index
    const m = fingerExtended(lm, 9);   // middle
    const r = fingerExtended(lm, 13);  // ring
    const p = fingerExtended(lm, 17);  // pinky

    const TH = 0.5; // 임계값 (필요하면 0.25~0.4 사이로 조절해봐)

    let count = 0;
    if (i > TH) count++;
    if (m > TH) count++;
    if (r > TH) count++;
    if (p > TH) count++;

    return count;
}

async function detectLoop() {
    const results = handLandmarker.detectForVideo(video, performance.now());
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results && results.landmarks && results.landmarks[0]) {
        const lm = results.landmarks[0];

        // 랜드마크 점 표시
        lm.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x * canvas.width, p.y * canvas.height, 6, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        });

        // 디버그: 필요하면 주석 풀고 값 확인 가능
        
        const t = thumbExtended(lm);
        const i = fingerExtended(lm, 5);
        const m = fingerExtended(lm, 9);
        const r = fingerExtended(lm, 13);
        const p = fingerExtended(lm, 17);
        console.log(
          "t,i,m,r,p =",
          t.toFixed(2),
          i.toFixed(2),
          m.toFixed(2),
          r.toFixed(2),
          p.toFixed(2)
        );
        

        const fingerCount = countFingers(lm);

        if (fingerCount !== lastFingerCount) {
            lastFingerCount = fingerCount;
            console.log("fingerCount:", fingerCount);

            // 화면에 손가락 개수 표시
            if (statusDiv) {
                statusDiv.textContent = "Finger: " + fingerCount;
            }

            // 1~4개일 때만 Phaser 게임으로 이벤트 발행
            if (fingerCount >= 1 && fingerCount <= 4) {
                window.dispatchEvent(
                    new CustomEvent("finger-count", { detail: { count: fingerCount } })
                );
            }
        }
    }

    requestAnimationFrame(detectLoop);
}
