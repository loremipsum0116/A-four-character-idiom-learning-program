import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class GestureRecognition {
  constructor() {
    this.handLandmarker = null;
    this.video = null;
    this.isRunning = false;
    this.keyboardListenerAdded = false;
    this._gestureUsedInternal = false; // 이벤트 중복 방지용
  }

  async initialize() {
    console.log('🤚 제스처 인식 초기화 시작...');
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
        },
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      await this.startCamera();
      console.log('✅ 제스처 인식 초기화 완료');
    } catch (error) {
      console.error('❌ 제스처 인식 초기화 실패:', error);
      throw error;
    }
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });

      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;

      this.createPreview();
      console.log('📹 웹캠 시작됨');
    } catch (error) {
      console.error('❌ 웹캠 접근 실패:', error);
      throw error;
    }
  }

  createPreview() {
    const preview = document.createElement('div');
    preview.id = 'webcam-preview';
    preview.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 240px;
      height: 180px;
      border: 3px solid #667eea;
      border-radius: 8px;
      overflow: hidden;
      z-index: 1000;
      background: black;
    `;

    this.video.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    `;

    preview.appendChild(this.video);
    document.body.appendChild(preview);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.detectGesture();
  }

  stop() {
    this.isRunning = false;
  }

  async detectGesture() {
    if (!this.isRunning || !this.video) return;

    try {
        if (this.handLandmarker) {
            const results = await this.handLandmarker.detect(this.video);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                const gestureType = this.recognizeGesture(landmarks);

                // 항상 이벤트 디스패치
                if (gestureType) this.dispatchGestureEvent(gestureType);
            } else {
                this.dispatchGestureEvent('NONE'); // 손 없으면 0
            }
        }

        this.setupKeyboardTest();
    } catch (error) {
        console.error('제스처 감지 에러:', error);
    }

    requestAnimationFrame(() => this.detectGesture());
}

dispatchGestureEvent(gestureType) {
    let fingerCount = 0;
    if (gestureType === 'EASY') fingerCount = 1;
    else if (gestureType === 'MEDIUM') fingerCount = 2;
    else if (gestureType === 'HARD') fingerCount = 3;

    window.dispatchEvent(
        new CustomEvent('finger-count', { detail: { count: fingerCount } })
    );

    // 내부 플래그 제거 → 씬에서 직접 처리
}


  recognizeGesture(landmarks) {
    if (this.isFist(landmarks)) return 'ATTACK';
    if (this.isPalm(landmarks)) return 'DEFEND';

    const fingerCount = this.countFingers(landmarks);
    if (fingerCount === 1) return 'EASY';
    if (fingerCount === 2) return 'MEDIUM';
    if (fingerCount === 3) return 'HARD';

    return null;
  }

  isFist(landmarks) {
    const tips = [8, 12, 16, 20];
    const bases = [5, 9, 13, 17];
    return tips.every((tip, i) => landmarks[tip].y > landmarks[bases[i]].y);
  }

  isPalm(landmarks) {
    const tips = [8, 12, 16, 20];
    const bases = [5, 9, 13, 17];
    return tips.every((tip, i) => landmarks[tip].y < landmarks[bases[i]].y);
  }

  countFingers(landmarks) {
    const tips = [8, 12, 16, 20];
    const bases = [5, 9, 13, 17];
    let count = 0;

    tips.forEach((tip, i) => {
      if (landmarks[tip].y < landmarks[bases[i]].y) count++;
    });

    if (landmarks[4].x < landmarks[3].x) count++; // 엄지
    return count;
  }

  setupKeyboardTest() {
    if (this.keyboardListenerAdded) return;

    document.addEventListener('keydown', (e) => {
      const keyMap = { 'a': 'ATTACK', 'd': 'DEFEND', '1': 'EASY', '2': 'MEDIUM', '3': 'HARD' };
      const gesture = keyMap[e.key.toLowerCase()];
      if (gesture && !this._gestureUsedInternal) {
        console.log(`⌨️ 키보드 테스트: ${gesture}`);
        this.dispatchGestureEvent(gesture);
      }
    });

    this.keyboardListenerAdded = true;
    console.log('⌨️ 키보드 테스트 모드 활성화 (a: 공격, d: 방어, 1/2/3: 난이도)');
  }

  destroy() {
    this.stop();
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
    }
    const preview = document.getElementById('webcam-preview');
    if (preview) preview.remove();
  }
}

// 싱글톤
export const gestureRecognition = new GestureRecognition();
