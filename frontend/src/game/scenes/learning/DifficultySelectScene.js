import Phaser from 'phaser';
import { gestureRecognition } from '../../../services/GestureRecognition.js';

export default class DifficultySelectScene extends Phaser.Scene {
    _gestureListener = null;
    _gestureUsed = false;
    
    // --- [ADDED] 제스처 지연 확인 상태 변수 ---
    _gestureConfirmTimer = null; 
    _pendingFingerCount = -1;
    // 제스처가 안정적으로 유지되어야 하는 시간 (밀리초)
    _gestureConfirmationDelay = 250; 
    // ------------------------------------------

    constructor() {
        super({ key: 'DifficultySelectScene' });
    }

    init(data) {
        this.targetScene = data.targetScene;
        this._gestureUsed = false; // 씬 시작 시 초기화
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 배경
        this.add.rectangle(width / 2, height / 2, width, height, 0x1e293b);

        // 타이틀
        this.add.text(width / 2, 100, '난이도 선택', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 난이도 버튼
        this.difficultyButtons = {};
        this.difficultyButtons.EASY = this.createDifficultyButton(width / 2, height / 2 - 80, '1. 초급', '#10b981', 'EASY');
        this.difficultyButtons.MEDIUM = this.createDifficultyButton(width / 2, height / 2, '2. 중급', '#3b82f6', 'MEDIUM');
        this.difficultyButtons.HARD = this.createDifficultyButton(width / 2, height / 2 + 80, '3. 고급', '#ef4444', 'HARD');

        // 뒤로가기 버튼
        const backBtn = this.add.text(20, 20, '← 뒤로', { fontSize: '22px', color: '#94a3b8' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this._gestureUsed = false;
                this.resetGestureRecognition();
                // [NOTE] 'LearningModeScene'이 존재한다고 가정
                this.scene.start('LearningModeScene'); 
            })
            .on('pointerover', () => backBtn.setColor('#ffffff'))
            .on('pointerout', () => backBtn.setColor('#94a3b8'));

        // 제스처 초기화
        this.initGestureRecognition();
    }

    // --- 제스처 인식 ---
    initGestureRecognition() {
        // 이벤트 리스너 먼저 등록
        this._gestureListener = (e) => {
            // 이미 사용되었거나 씬이 비활성화되면 리턴
            if (this._gestureUsed) {
                // 선택 완료 시 타이머 정리 (안전장치)
                this.clearConfirmationTimer();
                return;
            }

            const fingerCount = Number(e?.detail?.count);
            // 1, 2, 3 외의 값은 무시 (4, 5개는 선택지가 없음)
            if (![1, 2, 3].includes(fingerCount)) {
                // 유효하지 않은 제스처가 들어오면 대기 중인 타이머 취소
                this.clearConfirmationTimer();
                return;
            }

            // ⭐ [MODIFIED] 지연 확인 로직 시작
            if (this._pendingFingerCount === fingerCount) return;

            // 기존 타이머 취소 (새로운 제스처가 들어왔거나 흔들림)
            this.clearConfirmationTimer();

            // 새로운 인덱스와 타이머 설정
            this._pendingFingerCount = fingerCount;
            this.highlightPendingChoice(fingerCount); // 대기 중인 버튼 시각적 피드백 제공 가능 (선택 사항)

            this._gestureConfirmTimer = this.time.delayedCall(this._gestureConfirmationDelay, () => {
                // 250ms 후에도 제스처가 유지되면 최종 선택
                this.handleGestureChoice(this._pendingFingerCount);
                this._pendingFingerCount = -1;
            }, [], this);
            // ⭐ [MODIFIED] 지연 확인 로직 끝
        };
        window.addEventListener('finger-count', this._gestureListener);

        // GestureRecognition 초기화 & 시작
        gestureRecognition.initialize()
            .then(() => gestureRecognition.start())
            .catch(console.error);
    }

    // ⭐ [ADDED] 타이머 정리 함수
    clearConfirmationTimer() {
        if (this._gestureConfirmTimer) {
            this._gestureConfirmTimer.remove(false);
            this._gestureConfirmTimer = null;
        }
        this._pendingFingerCount = -1;
        this.resetButtonHighlights(); // 하이라이트 초기화
    }

    resetGestureRecognition() {
        this.clearConfirmationTimer(); // 제스처 리스너 제거 전 타이머 정리
        if (this._gestureListener) {
            window.removeEventListener('finger-count', this._gestureListener);
            this._gestureListener = null;
        }
        gestureRecognition.stop();
    }

    handleGestureChoice(fingerCount) {
        // 이 시점에서는 _gestureUsed가 false이고, 타이머가 만료되어 안정적인 제스처임이 확인됨
        const difficultyMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' };
        const difficulty = difficultyMap[fingerCount];
        
        if (!difficulty) return;
        
        console.log('Selected difficulty via gesture:', difficulty);
        this.selectDifficulty(difficulty);
    }

    selectDifficulty(difficulty) {
        if (this._gestureUsed) return;
        this._gestureUsed = true;
        this.resetButtonHighlights(); // 혹시 남아있는 대기 하이라이트 정리

        const button = this.difficultyButtons[difficulty];
        if (!button) return;

        this.tweens.add({
            targets: button,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                this.resetGestureRecognition();
                this.scene.start(this.targetScene, { difficulty });
            }
        });
    }


    createDifficultyButton(x, y, label, color, difficultyValue) {
        const rect = this.add.rectangle(x, y, 280, 60, Phaser.Display.Color.HexStringToColor(color).color, 1)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, { fontSize: '28px', color: '#ffffff', fontStyle: 'bold' })
            .setOrigin(0.5);

        rect.difficultyValue = difficultyValue; // 버튼에 난이도 값 저장

        rect.on('pointerover', () => rect.setScale(1.07));
        rect.on('pointerout', () => rect.setScale(1));
        rect.on('pointerdown', () => this.selectDifficulty(difficultyValue));

        return rect;
    }
    
    // ⭐ [ADDED] 대기 중인 선택 시각화 (선택 사항: 사용자 경험 개선)
    highlightPendingChoice(fingerCount) {
        this.resetButtonHighlights();
        const difficultyMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' };
        const difficulty = difficultyMap[fingerCount];
        const button = this.difficultyButtons[difficulty];
        
        if (button) {
            button.setStrokeStyle(4, 0xfacc15, 1); // 노란색 테두리
        }
    }
    
    // ⭐ [ADDED] 하이라이트 초기화
    resetButtonHighlights() {
         Object.values(this.difficultyButtons).forEach(button => {
            button.setStrokeStyle(0);
         });
    }

    shutdown() {
        this.resetGestureRecognition();
    }
}