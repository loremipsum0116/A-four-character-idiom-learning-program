import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class GestureRecognition {
  constructor() {
    this.handLandmarker = null;
    this.video = null;
    this.isRunning = false;
    this.callbacks = {};
    this.fingerBuffer = [];
    this._gestureUsed = false;
    this._isGameActive = true;
    this.handedness = 'RIGHT';
    this.MAX_BUFFER = 5;           // 버퍼 길이
    this.STABLE_THRESHOLD = 3;     // 연속 안정화 횟수
    this.keyboardListenerAdded = false;
  }

  async initialize() {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
        },
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      await this.startCamera();
      console.log('✅ 제스처 인식 초기화 완료');
    } catch (error) {
      console.error('❌ GestureRecognition 초기화 실패', error);
      throw error;
    }
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;
      this.createPreview();
      console.log('📹 웹캠 시작됨');
    } catch (error) {
      console.error('❌ 웹캠 접근 실패', error);
      throw error;
    }
  }

  createPreview() {
    const preview = document.createElement('div');
    preview.id = 'webcam-preview';
    preview.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      width: 240px; height: 180px;
      border: 3px solid #667eea; border-radius: 8px;
      overflow: hidden; z-index: 1000; background: black;
    `;
    this.video.style.cssText = `
      width: 100%; height: 100%;
      object-fit: cover; transform: scaleX(-1);
    `;
    preview.appendChild(this.video);
    document.body.appendChild(preview);
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.detectGesture();
    }
  }

  stop() {
    this.isRunning = false;
  }

  async detectGesture() {
    if (!this.isRunning || !this.video) return;

    try {
      const results = await this.handLandmarker.detectAsync(this.video);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];

        // --- 1. 주먹/손바닥 감지 (ATTACK/DEFEND) ---
        const gestureByShape = this.recognizeGestureByShape(landmarks);
        if (gestureByShape && !this._gestureUsed) {
          this._gestureUsed = true;
          this.emit('detected', gestureByShape);
        } else {
          // --- 2. 손가락 개수 기반 난이도 감지 (EASY/MEDIUM/HARD) ---
          const fingerCount = this.countFingers(landmarks);
          this.fingerBuffer.push(fingerCount);
          if (this.fingerBuffer.length > this.MAX_BUFFER) this.fingerBuffer.shift();

          const stableCount = this.getStableFingerCount();
          if (stableCount >= 1 && stableCount <= 3 && !this._gestureUsed) {
            this._gestureUsed = true;
            const difficultyMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' };
            this.emit('detected', difficultyMap[stableCount]);
          }
        }
      }
    } catch (error) {
      console.error('Gesture detect error', error);
    }

    // 키보드 테스트 모드
    this.setupKeyboardTest();

    requestAnimationFrame(() => this.detectGesture());
  }

  recognizeGestureByShape(landmarks) {
    if (this.isFist(landmarks)) return 'ATTACK';
    if (this.isPalm(landmarks)) return 'DEFEND';
    return null;
  }

  isFist(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];
    return fingerTips.every((tip, i) => landmarks[tip].y > landmarks[fingerBases[i]].y);
  }

  isPalm(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];
    return fingerTips.every((tip, i) => landmarks[tip].y < landmarks[fingerBases[i]].y);
  }

  countFingers(landmarks) {
    if (!landmarks) return 0;
    let count = 0;

    const tips = [8, 12, 16, 20];
    const mcp = [5, 9, 13, 17];

    for (let i = 0; i < tips.length; i++) {
      const tip = landmarks[tips[i]];
      const base = landmarks[mcp[i]];
      const pip = landmarks[mcp[i] + 1];
      const v1 = { x: tip.x - pip.x, y: tip.y - pip.y };
      const v2 = { x: pip.x - base.x, y: pip.y - base.y };
      const angle = Math.acos((v1.x*v2.x + v1.y*v2.y) / (Math.hypot(v1.x,v1.y)*Math.hypot(v2.x,v2.y))) * (180/Math.PI);
      if (angle > 150) count++;
    }

    // 엄지 정교화
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const wrist = landmarks[0];
    const vThumb = { x: thumbTip.x - wrist.x, y: thumbTip.y - wrist.y };
    const vIP = { x: thumbIP.x - wrist.x, y: thumbIP.y - wrist.y };
    const angleThumb = Math.acos((vThumb.x*vIP.x + vThumb.y*vIP.y) / (Math.hypot(vThumb.x,vThumb.y)*Math.hypot(vIP.x,vIP.y))) * (180/Math.PI);
    if (angleThumb > 150) count++;

    return Math.min(5, Math.max(0, count));
  }

  getStableFingerCount() {
    const freqMap = this.fingerBuffer.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});
    const mostCommon = parseInt(Object.keys(freqMap).reduce((a, b) => freqMap[a] > freqMap[b] ? a : b));
    return freqMap[mostCommon] >= this.STABLE_THRESHOLD ? mostCommon : 0;
  }

  setupKeyboardTest() {
    if (this.keyboardListenerAdded) return;

    document.addEventListener('keydown', (e) => {
      const keyMap = { 'a':'ATTACK', 'd':'DEFEND', '1':'EASY', '2':'MEDIUM', '3':'HARD' };
      const gesture = keyMap[e.key.toLowerCase()];
      if (gesture) this.emit('detected', gesture);
    });

    this.keyboardListenerAdded = true;
    console.log('⌨️ 키보드 테스트 모드 활성화');
  }

  on(event, cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
  }

  emit(event, data) {
    if (!this.callbacks[event]) return;
    this.callbacks[event].forEach(cb => cb(data));
  }

  destroy() {
    this.stop();
    this.callbacks = {};
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
    }
    const preview = document.getElementById('webcam-preview');
    if (preview) preview.remove();
  }
}

export const gestureRecognition = new GestureRecognition();
