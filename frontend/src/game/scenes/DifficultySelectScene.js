import Phaser from 'phaser';

const WIDTH = 1280; 
const HEIGHT = 720; 

export default class DifficultySelectScene extends Phaser.Scene {
    
    constructor() {
        super({ key: 'DifficultySelectScene' });
    }

    preload() {
        // 배경 이미지나 버튼에 필요한 에셋을 로드합니다 (필요한 경우)
    }

    create() {
        this.cameras.main.setBackgroundColor('#333333');

        // 타이틀
        this.add.text(WIDTH / 2, 100, '사자성어 카드 매칭 게임', { 
            fontSize: '48px', 
            color: '#fff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, 180, '난이도를 선택해 주세요', { 
            fontSize: '32px', 
            color: '#ccc'
        }).setOrigin(0.5);
        
        // --- 난이도 버튼 생성 ---
        
        const difficulties = [
            { level: 'Beginner', text: '초급 (EASY)', color: 0x4CAF50, description: '일상에서 자주 쓰는 사자성어' },
            { level: 'Intermediate', text: '중급 (MEDIUM)', color: 0xFF9800, description: '알면 유용한 사자성어' },
            { level: 'Expert', text: '고급 (HARD)', color: 0xF44336, description: '고사성어와 심화 사자성어' }
        ];

        const startY = HEIGHT / 2 - 50;
        const buttonGap = 150;

        difficulties.forEach((data, index) => {
            const y = startY + index * buttonGap;

            this.createButton(data.text, data.level, y, data.color, data.description);
        });

        // 참고: 메인 씬으로 돌아가기 버튼 (옵션)
        this.add.text(WIDTH / 2, HEIGHT - 50, '다른 게임 모드로 돌아가기', { 
            fontSize: '20px', 
            color: '#999' 
        }).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
              // this.scene.start('GameModeSelectScene'); // 다른 씬으로 전환 로직
              console.log("게임 모드 선택 화면으로 돌아가기");
          });
    }

    /**
     * 난이도 선택 버튼을 생성하고 클릭 이벤트를 연결하는 헬퍼 함수
     * @param {string} text 버튼에 표시될 텍스트
     * @param {string} difficulty 난이도 레벨 ('Beginner', 'Intermediate', 'Expert')
     * @param {number} y Y 좌표
     * @param {number} color 버튼 색상
     * @param {string} description 난이도 설명
     */
    createButton(text, difficulty, y, color, description) {
        const buttonWidth = 400;
        const buttonHeight = 80;
        const x = WIDTH / 2;

        // 버튼 배경
        const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, color, 1)
            .setStrokeStyle(4, 0xffffff)
            .setInteractive({ useHandCursor: true });
        
        // 버튼 텍스트
        this.add.text(x, y, text, { 
            fontSize: '36px', 
            color: '#fff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // 설명 텍스트
        this.add.text(x, y + 50, description, {
            fontSize: '18px',
            color: '#ccc'
        }).setOrigin(0.5);

        // 클릭 이벤트 연결
        button.on('pointerdown', () => {
            this.handleDifficultySelect(difficulty);
        });
        
        // 마우스 오버 시 효과
        button.on('pointerover', () => button.setFillStyle(color, 0.8));
        button.on('pointerout', () => button.setFillStyle(color, 1));
    }

    handleDifficultySelect(difficulty) {
        console.log(`난이도 선택: ${difficulty}`);
        
        // 1. FillBlankScene으로 전환합니다.
        // 2. 선택된 난이도 정보를 'difficulty'라는 키로 전달합니다.
        this.scene.start('FillBlankScene', { difficulty: difficulty });
    }
} 이 씬이 import Phaser from 'phaser';
import FillBlankScene from './FillBlankScen.js';
import CardMatchScene from './CardMatchScene.js';

/**
 * LearningModeScene - 학습 모드 선택 화면
 * * FR 3.0: 학습 모드 (선택 화면)
 * FR 3.2: 빈칸 맞추기 (FillBlankScene으로 연결)
 * FR 3.3: 카드 매칭 (CardMatchScene으로 연결)
 */
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
    // ✅ 게임 모드 선택 버튼 추가
    // ------------------------------------

    // 1. 빈칸 맞추기 버튼 (좌측)
    this.createModeButton(
      width / 2 - 160, 
      height / 2,
      '📝 빈칸 맞추기',
      'FillBlankScene' // 등록된 Scene 키
    );

    // 2. 카드 매칭 버튼 (우측)
    this.createModeButton(
      width / 2 + 160, 
      height / 2,
      '🃏 카드 매칭',
      'CardMatchScene' // 등록된 Scene 키
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
   * 학습 모드 선택 버튼을 생성하고 상호작용을 설정합니다.
   * @param {number} x 버튼 x 좌표
   * @param {number} y 버튼 y 좌표
   * @param {string} text 버튼 텍스트
   * @param {string} sceneKey 버튼 클릭 시 이동할 Scene의 키
   */
  createModeButton(x, y, text, sceneKey) {
    const button = this.add.text(x, y, text, {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#4a5591',
      padding: { x: 30, y: 15 },
      align: 'center'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start(sceneKey)) 
      .on('pointerover', () => {
        button.setBackgroundColor('#6b74b4');
        button.setScale(1.05); // 약간 커지는 효과
      })
      .on('pointerout', () => {
        button.setBackgroundColor('#4a5591');
        button.setScale(1.0);
      });
      
      return button;
  }
}