import Phaser from 'phaser';
import { gestureRecognition } from '../../../services/GestureRecognition.js';

export default class DifficultySelectScene extends Phaser.Scene {
    _gestureListener = (e) => {
    if (this._gestureUsed) return;
    const fingerCount = e?.detail?.count || e; 
    this.handleGestureChoice(fingerCount); // 1~3 숫자를 difficultyMap으로 변환
};

    _gestureUsed = false;

    constructor() {
        super({ key: 'DifficultySelectScene' });
    }

    init(data) {
    this.targetScene = data.targetScene;
    console.log('DifficultySelectScene - Target Scene:', this.targetScene);
    this._gestureUsed = false; // 씬이 시작될 때 초기화
  }


    create() {
      
      this._gestureUsed = false;
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
        this.difficultyButtons.EASY = this.createDifficultyButton(width / 2, height / 2 - 80, '초급', '#10b981', 'EASY');
        this.difficultyButtons.MEDIUM = this.createDifficultyButton(width / 2, height / 2, '중급', '#3b82f6', 'MEDIUM');
        this.difficultyButtons.HARD = this.createDifficultyButton(width / 2, height / 2 + 80, '고급', '#ef4444', 'HARD');

        // 뒤로가기 버튼
        const backBtn = this.add.text(20, 20, '← 뒤로', { fontSize: '22px', color: '#94a3b8' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this._gestureUsed = false; // 뒤로 갈 때도 초기화
            this.resetGestureRecognition();
            this.scene.start('LearningModeScene');
        })
        .on('pointerover', () => backBtn.setColor('#ffffff'))
        .on('pointerout', () => backBtn.setColor('#94a3b8'));

        // 제스처 초기화
        this.initGestureRecognition();
    }

    // --- 제스처 인식 ---
    initGestureRecognition() {
        this.resetGestureRecognition();

        gestureRecognition.initialize()
            .then(() => {
                gestureRecognition.start();

                this._gestureListener = (e) => {
                    if (this._gestureUsed) return;

                    // e.detail.count 또는 e 로 손가락 개수 가져오기
                    const fingerCount = e?.detail?.count || e;
                    this.handleGestureChoice(fingerCount);
                };

                window.addEventListener('finger-count', this._gestureListener);
            })
            .catch(console.error);
    }

    resetGestureRecognition() {
        if (this._gestureListener) {
            window.removeEventListener('finger-count', this._gestureListener);
            this._gestureListener = null;
        }
        gestureRecognition.stop();
    }

    handleGestureChoice(fingerCount) {
    const difficultyMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' };
    const difficulty = difficultyMap[fingerCount];
    if (!difficulty) return;
    this.selectDifficulty(difficulty);
  }


    // 버튼 클릭과 제스처 선택 공용 함수
    selectDifficulty(difficulty) {
        if (this._gestureUsed) return;
        this._gestureUsed = true;

        const button = this.difficultyButtons[difficulty];
        if (!button) return;

        // 버튼 클릭 효과
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

        rect.on('pointerover', () => rect.setScale(1.07));
        rect.on('pointerout', () => rect.setScale(1));
        rect.on('pointerdown', () => this.selectDifficulty(difficultyValue));

        return rect;
    }

    shutdown() {
        this.resetGestureRecognition();
    }
}