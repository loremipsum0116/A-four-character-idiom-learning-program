/**
 * GestureRecognition - MediaPipe 제스처 인식 서비스
 *
 * 손동작을 인식하여 게임 조작으로 변환
 */

// TODO: MediaPipe 라이브러리 설치 후 주석 해제
// import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class GestureRecognition {
  constructor() {
    this.handLandmarker = null;
    this.video = null;
    this.isRunning = false;
    this.callbacks = {};
  }

  /**
   * 초기화
   */
  async initialize() {
    console.log('🤚 제스처 인식 초기화 시작...');

    try {
      // TODO: MediaPipe 초기화
      /*
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
      */

      // 웹캠 시작
      await this.startCamera();

      console.log('✅ 제스처 인식 초기화 완료');
    } catch (error) {
      console.error('❌ 제스처 인식 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 웹캠 시작
   */
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480
        }
      });

      // 비디오 엘리먼트 생성
      this.video = document.createElement('video');
      this.video.srcObject = stream;
      this.video.autoplay = true;

      // 웹캠 프리뷰 표시 (선택 사항)
      this.createPreview();

      console.log('📹 웹캠 시작됨');
    } catch (error) {
      console.error('❌ 웹캠 접근 실패:', error);
      throw error;
    }
  }

  /**
   * 웹캠 프리뷰 생성
   */
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
      transform: scaleX(-1); /* 거울 모드 */
    `;

    preview.appendChild(this.video);
    document.body.appendChild(preview);
  }

  /**
   * 제스처 감지 시작
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.detectGesture();
  }

  /**
   * 제스처 감지 중지
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * 제스처 감지 루프
   */
  async detectGesture() {
    if (!this.isRunning || !this.video) return;

    try {
      // TODO: MediaPipe로 손 감지
      /*
      const results = this.handLandmarker.detect(this.video);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const gestureType = this.recognizeGesture(landmarks);

        if (gestureType) {
          this.emit('detected', gestureType);
        }
      }
      */

      // 임시: 키보드로 테스트
      this.setupKeyboardTest();

    } catch (error) {
      console.error('제스처 감지 에러:', error);
    }

    // 다음 프레임
    requestAnimationFrame(() => this.detectGesture());
  }

  /**
   * 손 랜드마크로 제스처 인식
   *
   * @param {Array} landmarks - MediaPipe 손 랜드마크
   * @returns {string|null} - 제스처 타입
   */
  recognizeGesture(landmarks) {
    // 주먹 감지
    if (this.isFist(landmarks)) {
      return 'ATTACK';
    }

    // 손바닥 감지
    if (this.isPalm(landmarks)) {
      return 'DEFEND';
    }

    // 손가락 개수 감지
    const fingerCount = this.countFingers(landmarks);
    if (fingerCount === 1) return 'EASY';
    if (fingerCount === 2) return 'MEDIUM';
    if (fingerCount === 3) return 'HARD';

    return null;
  }

  /**
   * 주먹 감지
   */
  isFist(landmarks) {
    // 손가락 끝 포인트 인덱스
    const fingerTips = [8, 12, 16, 20]; // 검지, 중지, 약지, 소지
    const fingerBases = [5, 9, 13, 17];

    // 모든 손가락이 접혀있는지 확인
    return fingerTips.every((tip, i) =>
      landmarks[tip].y > landmarks[fingerBases[i]].y
    );
  }

  /**
   * 손바닥 감지
   */
  isPalm(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];

    // 모든 손가락이 펴져있는지 확인
    return fingerTips.every((tip, i) =>
      landmarks[tip].y < landmarks[fingerBases[i]].y
    );
  }

  /**
   * 펴진 손가락 개수 세기
   */
  countFingers(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];

    let count = 0;
    fingerTips.forEach((tip, i) => {
      if (landmarks[tip].y < landmarks[fingerBases[i]].y) {
        count++;
      }
    });

    // 엄지 추가 (다른 방향)
    if (landmarks[4].x < landmarks[3].x) {
      count++;
    }

    return count;
  }

  /**
   * 키보드 테스트 설정 (임시)
   */
  setupKeyboardTest() {
    if (this.keyboardListenerAdded) return;

    document.addEventListener('keydown', (e) => {
      const keyMap = {
        'a': 'ATTACK',
        'd': 'DEFEND',
        '1': 'EASY',
        '2': 'MEDIUM',
        '3': 'HARD'
      };

      const gesture = keyMap[e.key.toLowerCase()];
      if (gesture) {
        console.log(`⌨️ 키보드 테스트: ${gesture}`);
        this.emit('detected', gesture);
      }
    });

    this.keyboardListenerAdded = true;
    console.log('⌨️ 키보드 테스트 모드 활성화 (a: 공격, d: 방어, 1/2/3: 난이도)');
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  /**
   * 이벤트 발생
   */
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  /**
   * 정리
   */
  destroy() {
    this.stop();

    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    const preview = document.getElementById('webcam-preview');
    if (preview) {
      preview.remove();
    }
  }
}

// 싱글톤 인스턴스
export const gestureRecognition = new GestureRecognition();
