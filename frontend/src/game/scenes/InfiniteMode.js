// scenes/InfiniteModeScene.js

import Phaser from 'phaser';
// 💡 [수정] removeGesture 경로를 상위 폴더를 참조하도록 수정합니다.
// (MainMenuScene.js의 import 경로를 따름)
import { removeGesture } from '../../gesture.js';

/**
 * InfiniteModeScene - 무한 모드
 * 끝없이 사자성어 문제를 풀고 기록을 갱신하는 모드입니다.
 */
export default class InfiniteModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InfiniteModeScene' });
  }

  init(data) {
    // 씬 전환 시 필요한 데이터 초기화
    this.userData = data.user || {};
    this.currentWave = 1; 
    this.score = 0;
  }

  preload() {
    // 무한 모드에 필요한 에셋을 로드합니다 (필요한 경우)
    // 예: this.load.image('infinite_boss', 'assets/images/bosses/dragon.png');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x1f2937); // 어두운 회색 배경
    
    // 💡 [필수] 화면이 비어 보이지 않도록 타이틀 추가
    this.add.text(width / 2, 100, '♾️ 무한 도전 모드', {
      fontSize: '60px',
      color: '#fcd34d', // 밝은 노란색
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 점수 및 웨이브 표시
    this.add.text(width / 2, 200, `현재 최고 기록 (WAVE): ${this.currentWave}`, {
        fontSize: '30px',
        color: '#d1d5db'
    }).setOrigin(0.5);

    this.add.text(width / 2, 250, `획득 점수: ${this.score}`, {
        fontSize: '30px',
        color: '#d1d5db'
    }).setOrigin(0.5);

    // **게임 임시 시작 버튼:** 실제 게임 로직이 연결될 자리
    this.add.text(width / 2, height / 2, 'START! 사자성어 무한 전투', {
        fontSize: '40px',
        color: '#ffffff',
        backgroundColor: '#ef4444',
        padding: { x: 30, y: 15 }
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.startNextWave, this);


    // **메인 메뉴로 돌아가기 버튼**
    this.createBackButton(width, height);
    
    // **제스처 초기화 로직 (필요 시 주석 해제)**
    // 무한 모드에서 제스처 사용 후, 씬을 나갈 때 제스처 UI를 제거해야 합니다.
    // 이는 'MainMenuScene.js'의 'onButtonClick'에서 이미 'initGesture'를 호출했기 때문에
    // 이 씬에서는 별도의 초기화 코드가 필요하지 않습니다.
  }
  
  createBackButton(width, height) {
    const backButton = this.add.text(width / 2, height - 100, '⬅️ 메인 화면으로 돌아가기', {
        fontSize: '30px',
        color: '#94a3b8'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goBackToMainMenu())
      .on('pointerover', () => backButton.setColor('#a5b4fc'))
      .on('pointerout', () => backButton.setColor('#94a3b8'));
  }
  
  startNextWave() {
      // **TODO: 여기에 사자성어 문제 출제 및 전투 로직을 구현합니다.**
      console.log('✅ 무한 모드 게임 로직 시작!');
  }

  goBackToMainMenu() {
    console.log('🚪 메인 화면으로 복귀');
    
    // 💡 [필수] 무한 모드(게임 씬)를 떠날 때 제스처 카메라 UI를 제거합니다.
    if (typeof removeGesture === 'function') {
      removeGesture();
    }
    
    this.scene.start('MainMenuScene', { user: this.userData });
  }

  update(time, delta) {
    // 게임 루프 로직
  }
}