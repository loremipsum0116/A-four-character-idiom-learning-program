import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * GestureRecognition - MediaPipe 제스처 인식 서비스
 *
 * 손동작을 인식하여 게임 조작으로 변환
 */
export class GestureRecognition {
  constructor() {
    this.handLandmarker = null;
    this.video = null;
    this.isRunning = false;
    this.keyboardListenerAdded = false;
    this._gestureUsedInternal = false; // 한 이벤트 중복 방지
  }

  /**
   * 초기화
   */
  async initialize() {
    console.log('🤚 제스처 인식 초기화 시작...');
    try {
      // MediaPipe 초기화
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

      // 웹캠 시작
      await this.startCamera();
      console.log('✅ 제스처 인식 초기화 완료');
    } catch (error) {
      console.error('❌ 제스처 인식 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 웹캠 시작 (기존과 동일)
   */
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

  /**
   * 웹캠 프리뷰 생성 (기존과 동일)
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
      transform: scaleX(-1);
    `;

    preview.appendChild(this.video);
    document.body.appendChild(preview);
  }

  /**
   * 제스처 감지 시작 (기존과 동일)
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._gestureUsedInternal = false;
    this.detectGesture();
  }

  /**
   * 제스처 감지 중지 (기존과 동일)
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * [수정] 제스처 감지 루프
   */
  async detectGesture() {
    if (!this.isRunning || !this.video) return;

    try {
      if (this.handLandmarker) {
        const results = await this.handLandmarker.detect(this.video);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const gestureResult = this.recognizeGesture(landmarks); // 제스처 인식 결과 (문자열 또는 숫자)

          if (typeof gestureResult === 'string') {
            // 주먹/손바닥 제스처 (ATTACK/DEFEND)
            if (gestureResult === 'ATTACK' || gestureResult === 'DEFEND') {
              if (!this._gestureUsedInternal) {
                this._gestureUsedInternal = true;
                this.emit('detected', gestureResult);
              }
            }
          } 
          // [MODIFIED] 손가락 개수 (1~5) 처리
          else if (typeof gestureResult === 'number' && gestureResult >= 1 && gestureResult <= 5) {
            const count = gestureResult;
            // 씬(FillBlankScene)에서 선택지로 사용할 수 있도록 이벤트를 발생시킵니다.
            // 씬은 count 1, 2, 3, 4만 사용합니다.
            window.dispatchEvent(
              new CustomEvent('finger-count', { detail: { count: count } })
            );
          }
        }
      }

      this.setupKeyboardTest();
    } catch (error) {
      console.error('제스처 감지 에러:', error);
    }

    requestAnimationFrame(() => this.detectGesture());
  }

  /**
   * [수정] 손 랜드마크로 제스처 인식
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

    // [MODIFIED] 손가락 개수 감지 (1~5 숫자를 그대로 반환)
    const fingerCount = this.countFingers(landmarks);
    if (fingerCount >= 1) return fingerCount; // 1 이상의 숫자를 반환

    return null; // 인식된 제스처가 없음
  }

  /**
   * 주먹 감지 (ATTACK)
   * */
  isFist(landmarks) {
    // 손가락 끝 포인트 인덱스: 검지(8), 중지(12), 약지(16), 소지(20)
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17]; // 손가락 중간 관절

    // 모든 손가락 끝(tip)의 Y좌표가 그 손가락의 기저부(base) Y좌표보다 아래(Y값이 더 큼)에 있으면 주먹
    return fingerTips.every((tip, i) =>
      landmarks[tip].y > landmarks[fingerBases[i]].y
    );
  }

  /**
   * 손바닥 감지 (DEFEND)
   * */
  isPalm(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];

    // 모든 손가락 끝(tip)의 Y좌표가 그 손가락의 기저부(base) Y좌표보다 위(Y값이 더 작음)에 있으면 손바닥
    return fingerTips.every((tip, i) =>
      landmarks[tip].y < landmarks[fingerBases[i]].y
    );
  }

  /**
   * 펴진 손가락 개수 세기 (기존과 동일)
   */
  countFingers(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [5, 9, 13, 17];

    let count = 0;
    // 검지, 중지, 약지, 소지
    fingerTips.forEach((tip, i) => {
      // 끝이 기저부보다 위에 있으면 펴진 것으로 간주
      if (landmarks[tip].y < landmarks[fingerBases[i]].y) {
        count++;
      }
    });

    // 엄지 (엄지는 주로 X축으로 판단)
    // 엄지 끝(4)이 엄지 기저부(3)보다 왼쪽에 있으면 펴진 것으로 간주 (카메라를 바라볼 때)
    if (landmarks[4].x < landmarks[3].x) {
      count++;
    }

    return count; // 0~5
  }

  /**
   * [수정] 키보드 테스트 설정 - 4번 선택지 추가
   */
  setupKeyboardTest() {
    if (this.keyboardListenerAdded) return;

    document.addEventListener('keydown', (e) => {
      const keyMap = {
        'a': 'ATTACK',
        'd': 'DEFEND',
      };
      // [MODIFIED] 키보드 4를 손가락 개수 4에 매핑
      const fingerKeyMap = { '1': 1, '2': 2, '3': 3, '4': 4 };

      const gesture = keyMap[e.key.toLowerCase()];
      const fingerCount = fingerKeyMap[e.key];

      if (gesture && !this._gestureUsedInternal) {
        this._gestureUsedInternal = true;
        console.log(`⌨️ 키보드 테스트: ${gesture}`);
        this.emit('detected', gesture);
      } else if (fingerCount !== undefined) {
        // 손가락 개수 이벤트는 중복 방지 로직 적용하지 않음 (지속적인 감지용)
        console.log(`⌨️ 키보드 테스트: 손가락 ${fingerCount}개`);
        window.dispatchEvent(
          new CustomEvent('finger-count', { detail: { count: fingerCount } })
        );
      }
    });

    this.keyboardListenerAdded = true;
    console.log('⌨️ 키보드 테스트 모드 활성화 (a: 공격, d: 방어, 1/2/3/4: 선택)');
  }

  
  emit(event, data) {
    if (event === 'detected') {
      window.dispatchEvent(
        new CustomEvent(event, { detail: { gesture: data } })
      );
    }
  }

  resetGesture() {
    this._gestureUsedInternal = false;
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

export const gestureRecognition = new GestureRecognition();