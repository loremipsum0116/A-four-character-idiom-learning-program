import Phaser from 'phaser';
import { gestureRecognition } from '../../../services/GestureRecognition.js';

export default class DifficultySelectScene extends Phaser.Scene {
    _gestureListener = null;
    _gestureUsed = false;

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
        this.difficultyButtons.EASY = this.createDifficultyButton(width / 2, height / 2 - 80, '초급', '#10b981', 'EASY');
        this.difficultyButtons.MEDIUM = this.createDifficultyButton(width / 2, height / 2, '중급', '#3b82f6', 'MEDIUM');
        this.difficultyButtons.HARD = this.createDifficultyButton(width / 2, height / 2 + 80, '고급', '#ef4444', 'HARD');

        // 뒤로가기 버튼
        const backBtn = this.add.text(20, 20, '← 뒤로', { fontSize: '22px', color: '#94a3b8' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this._gestureUsed = false;
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
    // 이벤트 리스너 먼저 등록
    this._gestureListener = (e) => {
        if (this._gestureUsed) return;

        const fingerCount = Number(e?.detail?.count);
        if (![1,2,3].includes(fingerCount)) return;

        this.handleGestureChoice(fingerCount);
    };
    window.addEventListener('finger-count', this._gestureListener);

    // GestureRecognition 초기화 & 시작
    gestureRecognition.initialize()
        .then(() => gestureRecognition.start())
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
    const difficultyMap = {1:'EASY', 2:'MEDIUM', 3:'HARD'};
    const difficulty = difficultyMap[fingerCount];
    if (!difficulty) return;

    console.log('Selected difficulty via gesture:', difficulty);
    this.selectDifficulty(difficulty);
}

selectDifficulty(difficulty) {
    if (this._gestureUsed) return;
    this._gestureUsed = true;

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

        rect.on('pointerover', () => rect.setScale(1.07));
        rect.on('pointerout', () => rect.setScale(1));
        rect.on('pointerdown', () => this.selectDifficulty(difficultyValue));

        return rect;
    }

    shutdown() {
        this.resetGestureRecognition();
    }
}
