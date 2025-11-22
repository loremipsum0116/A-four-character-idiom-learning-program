import Phaser from 'phaser';

export default class LearningModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LearningModeScene' });
  }

  create() {

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 80, '📚 학습 모드 선택', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // ------------------------------------
    // ✅ 게임 모드 선택 버튼
    // ------------------------------------

    // 빈칸 맞추기
    this.createModeButton(
      width / 2 - 320, 
      height / 2,
      '📝 빈칸 맞추기',
      { targetScene: 'FillBlankScene' }
    );

    // 카드 매칭
    this.createModeButton(
      width / 2, 
      height / 2,
      '🃏 카드 매칭',
      { targetScene: 'CardMatchScene' }
    );

    // 사자성어 학습하기 
    this.createModeButton(
      width / 2 + 320, 
      height / 2,
      '사자성어 단어장',
      { targetScene: 'BookScene' }
    );


    // ------------------------------------
    // 뒤로 가기
    // ------------------------------------
    const backBtn = this.add.text(20, 20, '← 뒤로', {
      fontSize: '20px',
      color: '#94a3b8'
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenuScene'))
      .on('pointerover', () => backBtn.setColor('#ffffff'))
      .on('pointerout', () => backBtn.setColor('#94a3b8'));
    }

  /**
   * 학습 모드 선택 버튼 생성
   * @param {number} x 
   * @param {number} y 
   * @param {string} text 
   * @param {string} sceneKey 이동할 Scene의 key
   */
  createModeButton(x, y, text, data) {
  const button = this.add.text(x, y, text, {
    fontSize: '28px',
    color: '#ffffff',
    backgroundColor: '#4a5591',
    padding: { x: 30, y: 15 },
    align: 'center'
  })
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true })
  .on('pointerdown', () => {
      this.scene.start('DifficultySelectScene', data);
  })
  .on('pointerover', () => {
    button.setBackgroundColor('#6b74b4');
    button.setScale(1.05);
  })
  .on('pointerout', () => {
    button.setBackgroundColor('#4a5591');
    button.setScale(1.0);
  });

  return button;
}

}
