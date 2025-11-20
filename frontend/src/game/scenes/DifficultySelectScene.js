import Phaser from 'phaser';

export default class DifficultySelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DifficultySelectScene' });
  }

  init(data) {
    this.targetScene = data.targetScene ;
    
    // 이 targetScene이 이제 'FillBlankScene' 또는 'CardMatchScene' 중 하나가 됩니다.
    console.log('DifficultySelectScene - Target Scene:', this.targetScene);
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

    // 난이도 버튼 생성
    this.createDifficultyButton(width / 2, height / 2 - 80, '초급', '#10b981', 'EASY');
    this.createDifficultyButton(width / 2, height / 2,       '중급', '#3b82f6', 'MEDIUM');
    this.createDifficultyButton(width / 2, height / 2 + 80, '고급', '#ef4444', 'HARD');

    // 뒤로 가기 버튼 (메인 메뉴로 이동)
    const backBtn = this.add.text(20, 20, '← 뒤로', {
      fontSize: '22px',
      color: '#94a3b8'
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('LearningModeScene'))
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#94a3b8'));
  }

  createDifficultyButton(x, y, label, color, difficultyValue) {
    const rect = this.add.rectangle(x, y, 280, 60, Phaser.Display.Color.HexStringToColor(color).color, 1)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(x, y, label, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover 효과
    rect.on('pointerover', () => { rect.scale = 1.07; txt.scale = 1.07; });
    rect.on('pointerout', () => { rect.scale = 1; txt.scale = 1; });

    // 버튼 클릭 시 targetScene으로 이동, 난이도 전달
    rect.on('pointerdown', () => {
      this.scene.start(this.targetScene, { difficulty: difficultyValue });
    });
  }
}
