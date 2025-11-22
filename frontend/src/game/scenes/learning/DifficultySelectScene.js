import Phaser from 'phaser';

export default class DifficultySelectScene extends Phaser.Scene {
    // BattleScene.js의 방식에 맞춰 전역 이벤트 리스너를 사용하므로
    // 기존 제스처 관련 필드와 서비스는 모두 제거합니다.
    // _gestureListener = null;
    // _gestureUsed = false;

    constructor() {
        super({ key: 'DifficultySelectScene' });
    }

    init(data) {
        this.targetScene = data.targetScene;
        this.isProcessing = false; // 선택 처리 중복 방지 플래그 추가
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
                this.scene.start('LearningModeScene');
            })
            .on('pointerover', () => backBtn.setColor('#ffffff'))
            .on('pointerout', () => backBtn.setColor('#94a3b8'));

        // BattleScene.js처럼 전역 이벤트 리스너 등록
        window.addEventListener("finger-count", this.handleFingerCountEvent);
    }

    // 전역 이벤트 리스너를 위한 바인딩 함수
    handleFingerCountEvent = (e) => {
        if (this.isProcessing) return;

        const count = e.detail.count; // 1~3

        // 난이도 매핑
        const difficultyMap = { 1: 'EASY', 2: 'MEDIUM', 3: 'HARD' };
        const difficulty = difficultyMap[count];

        if (difficulty) {
            console.log('Selected difficulty via finger-count:', difficulty);
            this.selectDifficulty(difficulty);
        }
    }

    selectDifficulty(difficulty) {
        if (this.isProcessing) return;
        this.isProcessing = true; // 선택 처리 시작

        const button = this.difficultyButtons[difficulty];
        if (!button) {
            this.isProcessing = false;
            return;
        }

        // 선택된 버튼 애니메이션
        this.tweens.add({
            targets: button,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            onComplete: () => {
                // 씬 이동
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

    // 씬이 종료될 때 이벤트 리스너 제거
    shutdown() {
        console.log('DifficultySelectScene shutdown. Removing finger-count listener.');
        window.removeEventListener('finger-count', this.handleFingerCountEvent);
    }
}