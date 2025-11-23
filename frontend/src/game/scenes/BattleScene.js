import Phaser from 'phaser';
import { apiClient } from '../../services/APIClient.js';
import { calculateAttackDamage, calculateDefenseDamage, getDamageDisplayInfo, getLionLevel, checkLionLevelUp } from '../../utils/damageCalculator.js';
import { GAME_CONSTANTS } from '../../utils/constants.js';
import { geminiService } from '../../services/GeminiService.js';
import { saveGameData, loadGameData, isGuestMode } from '../../utils/storageManager.js';

/**
 * BattleScene - 턴제 전투 씬 (핵심)
 *
 * FR 4.0: 게임 모드 (턴제 전투)
 * FR 4.2: 턴제 전투 진입
 * FR 4.3: 공격 턴 - 난이도 선택
 * FR 4.4: 공격 턴 - 문제 풀이
 * FR 4.5: 학습 성과 데이터 수신
 * FR 4.6: 데미지 연산
 * FR 4.7: 방어 턴 - 방어 문제
 * FR 4.8: 방어 턴 - 데미지 감소
 * FR 4.9: 전투 종료 (승리)
 * FR 4.10: 전투 종료 (패배)
 * FR 4.11: 단계 클리어 보상
 */
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    // 스테이지 정보
    this.stageData = data.stage;

    // 사자 레벨에 따른 능력치 계산
    this.lionLevel = getLionLevel(this.stageData.id);
    const baseMaxHP = GAME_CONSTANTS.BATTLE.PLAYER_MAX_HP;
    this.playerMaxHP = baseMaxHP + this.lionLevel.hpBonus;
    this.playerHP = this.playerMaxHP;

    // 사자 레벨별 크기 설정 (호랑이와 대등하게)
    const lionScales = {
      '견습 사자': 0.30,
      '전사 사자': 0.38,
      '대장군 사자': 0.50,
      '사자왕': 0.58
    };
    this.lionScale = lionScales[this.lionLevel.name] || 0.35;

    // 전투 상태
    this.bossHP = this.stageData.bossHp;
    this.bossMaxHP = this.stageData.bossHp;
    this.bossAttack = this.stageData.bossAttack;

    // 턴 상태
    this.turnPhase = 'SELECT_DIFFICULTY'; // SELECT_DIFFICULTY, PLAYER_ATTACK, BOSS_DEFEND
    this.currentDifficulty = null;
    this.currentQuiz = null;
    this.quizStartTime = 0;
    this.isProcessing = false;

    // 전투 통계
    this.correctCount = 0;      // 정답 개수
    this.wrongCount = 0;        // 오답 개수
    this.battleStartTime = 0;   // 전투 시작 시각(ms)

    console.log(`⚔️ 전투 시작:`, this.stageData);
    console.log(`🦁 사자 능력치 - 체력: ${this.playerHP}/${this.playerMaxHP}, 공격 보너스: +${this.lionLevel.attackBonus}%`);
  }

  preload() {
    // 보스 이미지 로드
    if (this.stageData && this.stageData.image) {
      this.load.image(`boss_${this.stageData.id}`, this.stageData.image);

      // 보스 공격/피격 이미지 로드 (a.png: 피격, b.png: 공격)
      // 예: /pictures/rabbit.png -> /pictures/rabbit/a.png
      const imagePath = this.stageData.image;
      const fileName = imagePath.substring(imagePath.lastIndexOf('/') + 1); // rabbit.png
      const animalName = fileName.replace('.png', ''); // rabbit
      const folderPath = imagePath.substring(0, imagePath.lastIndexOf('/')); // /pictures

      const bossAttackImage = `${folderPath}/${animalName}/b.png`; // 공격: b.png
      const bossHurtImage = `${folderPath}/${animalName}/a.png`;   // 피격: a.png

      this.load.image(`boss_${this.stageData.id}_attack`, bossAttackImage);
      this.load.image(`boss_${this.stageData.id}_hurt`, bossHurtImage);

      console.log(`👹 보스 이미지 로드: 기본(${imagePath}), 공격(${bossAttackImage}), 피격(${bossHurtImage})`);
    }

    // 사자 이미지 로드 (레벨별로 고유 키 사용)
    if (this.lionLevel && this.lionLevel.image) {
      const lionKey = `player_lion_${this.lionLevel.name}`;

      // 이미 로드되어 있지 않은 경우에만 로드
      if (!this.textures.exists(lionKey)) {
        this.load.image(lionKey, this.lionLevel.image);
        console.log(`🦁 사자 이미지 로드: ${this.lionLevel.name} - ${this.lionLevel.image} (키: ${lionKey})`);
      } else {
        console.log(`🦁 사자 이미지 캐시 사용: ${this.lionLevel.name} (키: ${lionKey})`);
      }

      // 현재 사용할 키 저장
      this.currentLionKey = lionKey;

      // 사자 공격/피격 이미지 로드 (a.png: 피격, b.png: 공격)
      const lionImagePath = this.lionLevel.image;
      const lionFileName = lionImagePath.substring(lionImagePath.lastIndexOf('/') + 1);
      const lionName = lionFileName.replace('.png', '');
      const lionFolderPath = lionImagePath.substring(0, lionImagePath.lastIndexOf('/'));

      const lionAttackImage = `${lionFolderPath}/${lionName}/b.png`; // 공격: b.png
      const lionHurtImage = `${lionFolderPath}/${lionName}/a.png`;   // 피격: a.png

      const lionAttackKey = `${lionKey}_attack`;
      const lionHurtKey = `${lionKey}_hurt`;

      if (!this.textures.exists(lionAttackKey)) {
        this.load.image(lionAttackKey, lionAttackImage);
      }
      if (!this.textures.exists(lionHurtKey)) {
        this.load.image(lionHurtKey, lionHurtImage);
      }

      console.log(`🦁 사자 액션 이미지 로드: 공격(${lionAttackImage}), 피격(${lionHurtImage})`);
    } else {
      console.error('❌ lionLevel이 설정되지 않았습니다!', this.lionLevel);
    }
  }

create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x1e293b);

    // UI 생성
    this.createBattleUI();
    this.createCharacters();
    this.createHPBars();
    this.createMessageBox();
    this.createDialogueBox();

    // 전투 시작 대사 출력
    this.showBattleStartDialogue();

    window.addEventListener("finger-count", (e) => {
      const count = e.detail.count;  // 1~4

      // 1. 난이도 선택 단계 처리
      if (this.turnPhase === 'SELECT_DIFFICULTY' && this.difficultyButtons) {
        // 손가락과 난이도 매칭: 1 → EASY(index 0), 2 → MEDIUM(index 1), 3 → HARD(index 2)
        const selectedIndex = count - 1;

        // 1, 2, 3 손가락만 난이도 선택에 사용 (버튼 개수 = 3)
        if (selectedIndex >= 0 && selectedIndex < this.difficultyButtons.length) {
          const difficulties = ['EASY', 'MEDIUM', 'HARD'];
          const selectedDifficultyKey = difficulties[selectedIndex];
          console.log(`☝️ 제스처 입력: 손가락 ${count}개 → 난이도 ${selectedDifficultyKey} 선택`);
          this.selectDifficulty(selectedDifficultyKey);
          // 난이도 선택 후에는 퀴즈 선택 로직을 실행하지 않기 위해 return
          return; 
        }
      }

      // 2. 퀴즈 보기 선택 단계 처리
      // 난이도 선택 단계가 아니면서, 퀴즈 버튼이 존재하고, 손가락 개수가 유효할 때 실행
      if (!this.quizButtons || count > this.quizButtons.length) return;

      // 손가락과 보기 번호 매칭: 1 → index 0, 2 → index 1 ...
      const selectedIndex = count - 1;

      // 공격 퀴즈일 때
      if (this.currentQuizType === "attack") {
        this.submitAnswer(selectedIndex);
      }

      // 방어 퀴즈일 때
      if (this.currentQuizType === "defense") {
        this.submitDefenseAnswer(selectedIndex);
      }
    });
  }

  // ======================
  // UI 생성
  // ======================

  createBattleUI() {
    const width = this.cameras.main.width;

    // 스테이지 정보
    this.add.text(width / 2, 30, `스테이지 ${this.stageData.id}: ${this.stageData.emoji} ${this.stageData.name}`, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 뒤로 가기 버튼
    const backBtn = this.add.text(20, 20, '← 포기', {
      fontSize: '18px',
      color: '#ef4444'
    }).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.confirmRetreat())
      .on('pointerover', () => backBtn.setColor('#fca5a5'))
      .on('pointerout', () => backBtn.setColor('#ef4444'));

    // 디버그 버튼 (개발 테스트용)
    this.createDebugButtons();
  }

  createDebugButtons() {
    const width = this.cameras.main.width;

    // 물리치기 버튼 (즉시 승리)
    const winBtn = this.add.text(width - 20, 20, '🏆 물리치기', {
      fontSize: '16px',
      color: '#10b981',
      backgroundColor: '#064e3b',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        console.log('🏆 디버그: 즉시 승리');
        this.bossHP = 0;
        this.updateBossHP();
        this.onVictory();
      })
      .on('pointerover', () => winBtn.setColor('#34d399'))
      .on('pointerout', () => winBtn.setColor('#10b981'));

    // 쓰러지기 버튼 (즉시 패배)
    const loseBtn = this.add.text(width - 20, 50, '💀 쓰러지기', {
      fontSize: '16px',
      color: '#ef4444',
      backgroundColor: '#7f1d1d',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        console.log('💀 디버그: 즉시 패배');
        this.playerHP = 0;
        this.updatePlayerHP();
        this.onDefeat();
      })
      .on('pointerover', () => loseBtn.setColor('#fca5a5'))
        .on('pointerout', () => loseBtn.setColor('#ef4444'));

      // 📊 최종 결과 버튼 (디버그용, 모든 전투 스킵하고 최종 결과창으로 이동)
      const finalBtn = this.add.text(width - 20, 80, '📊 최종 결과', {
          fontSize: '16px',
          color: '#e5e7eb',
          backgroundColor: '#1f2937',
          padding: { x: 10, y: 5 }
      }).setOrigin(1, 0)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
              console.log('📊 디버그: 최종 결과 화면으로 이동');
              this.scene.start('FinalResultScene');
          })
          .on('pointerover', () => finalBtn.setColor('#facc15'))
          .on('pointerout', () => finalBtn.setColor('#e5e7eb'));
  
  }

  createCharacters() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 플레이어 (사자) - 왼쪽 (이미지 스프라이트)
    this.playerSprite = this.add.image(250, height / 2, this.currentLionKey)
      .setOrigin(0.5)
      .setScale(this.lionScale); // 레벨별 크기

    this.playerNameText = this.add.text(250, height / 2 + 140, `${this.lionLevel.name}`, {
      fontSize: '24px',
      color: '#10b981',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 플레이어 등장 애니메이션
    this.playerSprite.setAlpha(0);
    this.playerSprite.setScale(0);
    this.tweens.add({
      targets: this.playerSprite,
      alpha: 1,
      scale: this.lionScale,
      duration: 800,
      ease: 'Back.easeOut'
    });

    // 보스 - 오른쪽 (이미지 스프라이트)
    this.bossSprite = this.add.image(width - 250, height / 2, `boss_${this.stageData.id}`)
      .setOrigin(0.5)
      .setScale(0.3); // 크기 조절 (이미지 크기에 따라 조정)

    this.add.text(width - 250, height / 2 + 140, `${this.stageData.name} 보스`, {
      fontSize: '24px',
      color: '#ef4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 보스 등장 애니메이션
    this.bossSprite.setAlpha(0);
    this.bossSprite.setScale(0);
    this.tweens.add({
      targets: this.bossSprite,
      alpha: 1,
      scale: 0.3,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startIdleAnimation();
      }
    });
  }

  createHPBars() {
    const width = this.cameras.main.width;

    // 플레이어 HP 바
    const playerHPBarX = 250;
    const playerHPBarY = 150;

    this.add.rectangle(playerHPBarX, playerHPBarY, 200, 30, 0x334155).setOrigin(0.5);
    this.playerHPBar = this.add.rectangle(playerHPBarX, playerHPBarY, 200, 30, 0x10b981).setOrigin(0.5);
    this.playerHPText = this.add.text(playerHPBarX, playerHPBarY, `${this.playerHP}/${this.playerMaxHP}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 보스 HP 바
    const bossHPBarX = width - 250;
    const bossHPBarY = 150;

    this.add.rectangle(bossHPBarX, bossHPBarY, 200, 30, 0x334155).setOrigin(0.5);
    this.bossHPBar = this.add.rectangle(bossHPBarX, bossHPBarY, 200, 30, 0xef4444).setOrigin(0.5);
    this.bossHPText = this.add.text(bossHPBarX, bossHPBarY, `${this.bossHP}/${this.bossMaxHP}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createMessageBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 메시지 박스 배경
    this.messageBox = this.add.rectangle(width / 2, height - 100, width - 40, 100, 0x1e293b, 0.95);
    this.messageBox.setStrokeStyle(2, 0x667eea);

    // 메시지 텍스트
    this.messageText = this.add.text(width / 2, height - 100, '', {
      fontSize: '22px',
      color: '#ffffff',
      wordWrap: { width: width - 80 },
      align: 'center'
    }).setOrigin(0.5);
  }

  createDialogueBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 대사 박스 배경 (화면 하단의 큰 영역)
    const boxHeight = 300;
    const boxY = height - 170;
    const boxWidth = width - 60;

    this.dialogueBox = this.add.rectangle(width / 2, boxY, boxWidth, boxHeight, 0x0f172a, 0.95);
    this.dialogueBox.setStrokeStyle(3, 0xfbbf24);
    this.dialogueBox.setVisible(false);

    // 대사 텍스트 (왼쪽 정렬, 충분한 공간)
    this.dialogueText = this.add.text(40, boxY - boxHeight / 2 + 20, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 80 },
      align: 'left',
      lineSpacing: 4
    }).setOrigin(0, 0);
    this.dialogueText.setVisible(false);

    // 화살표 버튼 (다음 대사로 진행) - 오른쪽 하단으로 이동
    this.dialogueArrow = this.add.text(width - 70, boxY + boxHeight / 2 - 30, '▼', {
      fontSize: '24px',
      color: '#fbbf24'
    }).setOrigin(0.5)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });

    // 안내 텍스트 (SPACE 키) - 오른쪽 하단으로 이동
    this.dialogueHint = this.add.text(width - 130, boxY + boxHeight / 2 - 30, 'SPACE', {
      fontSize: '14px',
      color: '#94a3b8'
    }).setOrigin(0, 0.5)
      .setVisible(false);

    // 대사 진행 중 플래그
    this.isShowingDialogue = false;
    this.waitingForDialogueInput = false;
  }

  // ======================
  // 대사 관리
  // ======================

  /**
   * 대사 표시 (타이핑 효과)
   * @param {string} text - 표시할 대사
   * @param {number} duration - 사용되지 않음 (하위 호환성 유지)
   * @param {boolean} force - 강제로 표시 (이전 대사 무시)
   */
async showDialogue(text, duration = 3000, force = false) {
    // 강제 모드가 아니고 이미 대사 표시 중이면 대기
    if (!force && this.isShowingDialogue) {
        console.log('⏳ 대사 표시 대기 중...');
        let waitTime = 0;
        while (this.isShowingDialogue && waitTime < 10000) {
            await this.delay(100);
            waitTime += 100;
        }
    }

    // 강제 모드면 기존 트윈 중단
    if (force && this.isShowingDialogue) {
        this.tweens.killTweensOf([this.dialogueBox, this.dialogueText, this.dialogueArrow, this.dialogueHint]);
    }

    this.isShowingDialogue = true;
    this.dialogueBox.setVisible(true);
    this.dialogueText.setVisible(true);
    this.dialogueBox.setAlpha(1);
    this.dialogueText.setAlpha(1);
    this.dialogueArrow.setVisible(false);
    this.dialogueHint.setVisible(false);

    // 타이핑 상태 초기화
    this.isTypingDialogue = true;
    this.currentDialogueText = this.dialogueText;
    this.fullDialogueText = text;

    // 스페이스바 입력 시 타이핑 중이라면 전체 텍스트 표시
    const spaceHandler = () => {
        if (this.isTypingDialogue) {
            this.showFullDialogue();
        }
    };
    this.input.keyboard.once('keydown-SPACE', spaceHandler);

    // 타이핑 효과
    this.dialogueText.setText('');
    const chars = text.split('');

    for (let i = 0; i < chars.length; i++) {
        if (!this.isTypingDialogue) {
            this.dialogueText.setText(text);
            break;
        }
        this.dialogueText.setText(this.dialogueText.text + chars[i]);
        await this.delay(20); // 글자 단위 딜레이
    }

    // 타이핑 완료
    this.isTypingDialogue = false;

    // 화살표와 안내 텍스트 표시
    this.dialogueArrow.setVisible(true);
    this.dialogueHint.setVisible(true);

    // 화살표 깜빡임 효과
    this.tweens.add({
        targets: this.dialogueArrow,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
    });

    // 사용자 입력 대기
    await this.waitForDialogueInput();

    // 화살표 트윈 정지
    this.tweens.killTweensOf(this.dialogueArrow);
    this.dialogueArrow.setAlpha(1);

    // 페이드아웃
    this.tweens.add({
        targets: [this.dialogueBox, this.dialogueText, this.dialogueArrow, this.dialogueHint],
        alpha: 0,
        duration: 300,
        onComplete: () => {
            this.dialogueBox.setVisible(false);
            this.dialogueText.setVisible(false);
            this.dialogueArrow.setVisible(false);
            this.dialogueHint.setVisible(false);
            this.dialogueBox.setAlpha(1);
            this.dialogueText.setAlpha(1);
            this.dialogueArrow.setAlpha(1);
            this.dialogueHint.setAlpha(1);
            this.isShowingDialogue = false;
        }
    });
}

/**
 * 타이핑 중 스페이스 입력 시 전체 텍스트 즉시 표시
 */
showFullDialogue() {
    this.isTypingDialogue = false;
    if (this.currentDialogueText) {
        this.currentDialogueText.setText(this.fullDialogueText);
    }
}


  /**
   * 대사 진행 입력 대기 (스페이스바 또는 화살표 클릭)
   */
  waitForDialogueInput() {
    return new Promise((resolve) => {
      this.waitingForDialogueInput = true;

      // 스페이스바 입력 핸들러
      const spaceHandler = (event) => {
        if (event.code === 'Space' && this.waitingForDialogueInput) {
          this.waitingForDialogueInput = false;
          this.input.keyboard.off('keydown', spaceHandler);
          this.dialogueArrow.off('pointerdown', clickHandler);
          console.log('⌨️ 스페이스바로 대사 진행');
          resolve();
        }
      };

      // 화살표 클릭 핸들러
      const clickHandler = () => {
        if (this.waitingForDialogueInput) {
          this.waitingForDialogueInput = false;
          this.input.keyboard.off('keydown', spaceHandler);
          this.dialogueArrow.off('pointerdown', clickHandler);
          console.log('🖱️ 화살표 클릭으로 대사 진행');
          resolve();
        }
      };

      // 이벤트 등록
      this.input.keyboard.on('keydown', spaceHandler);
      this.dialogueArrow.on('pointerdown', clickHandler);
    });
  }

  /**
   * 전투 시작 대사
   */
  async showBattleStartDialogue() {
      this.showMessage(`${this.stageData.name} 보스와의 전투를 시작합니다!`);


      // 🔒 히든 보스(??? / id 99)는 Gemini 대사 대신 항상 "..."
      if (this.stageData.id === 99 || this.stageData.name === '???') {
          await this.showDialogue('...', 3000, true);
          // 대사 끝나고 바로 플레이어 턴 시작
          this.time.delayedCall(500, () => this.startPlayerTurn());
          return;
      }

    try {
      const dialogue = await geminiService.getBattleStartDialogue(
        this.stageData.name,
        this.stageData.description,
        this.lionLevel.name,
        this.stageData.id
      );

      console.log('💬 전투 시작 대사:', dialogue);
      await this.showDialogue(dialogue, 4000);
    } catch (error) {
      console.error('❌ 대사 생성 실패:', error);
    }

    // 대사 종료 후 플레이어 턴 시작
    this.time.delayedCall(4500, () => this.startPlayerTurn());
  }

  /**
   * 플레이어 공격 대사
   */
  async showPlayerAttackDialogue(isCorrect) {
    try {
      const dialogue = await geminiService.getPlayerAttackDialogue(
        this.lionLevel.name,
        this.currentDifficulty,
        isCorrect
      );

      console.log('💬 플레이어 공격 대사:', dialogue);
      await this.showDialogue(dialogue, 2000);
    } catch (error) {
      console.error('❌ 대사 생성 실패:', error);
    }
  }

  /**
   * 보스 공격 대사
   */
  async showBossAttackDialogue() {

      if (this.stageData.id === 99 || this.stageData.name === '???') {
          await this.showDialogue('...', 2000, true);
          return;
      }


      try {
      const dialogue = await geminiService.getBossAttackDialogue(
        this.stageData.name,
        this.lionLevel.name
      );

      console.log('💬 보스 공격 대사:', dialogue);
      await this.showDialogue(dialogue, 2000);
    } catch (error) {
      console.error('❌ 대사 생성 실패:', error);
    }
  }

  /**
   * 승리 대사
   */
  async showVictoryDialogueText() {

      if (this.stageData.id === 99 || this.stageData.name === '???') {
          await this.showDialogue('...', 3000, true);
          return;
      }

      try {
      const dialogue = await geminiService.getVictoryDialogue(
        this.stageData.name,
        this.lionLevel.name,
        this.stageData.id
      );

      if (dialogue) {
        console.log('💬 승리 대사:', dialogue);
        await this.showDialogue(dialogue, 3000);
      } else {
        // Fallback 대사
        const fallback = `[${this.stageData.name}] "훌륭하구나... 네 승리다."\n[사자] "또 한 걸음 왕에 가까워졌다!"`;
        console.log('💬 승리 대사 (fallback):', fallback);
        await this.showDialogue(fallback, 3000);
      }
    } catch (error) {
      console.error('❌ 대사 생성 실패:', error);
      // 에러 발생 시에도 fallback 대사 표시
      const fallback = `[${this.stageData.name}] "훌륭하구나... 네 승리다."\n[사자] "또 한 걸음 왕에 가까워졌다!"`;
      await this.showDialogue(fallback, 3000);
    }
  }

  /**
   * 패배 대사
   */
  async showDefeatDialogueText() {

      // 🔒 히든 보스에게 패배했을 때도 보스는 "..."만
      if (this.stageData.id === 99 || this.stageData.name === '???') {
          await this.showDialogue('...', 3000, true);
          return;
      }

      try {
      const dialogue = await geminiService.getDefeatDialogue(
        this.stageData.name,
        this.lionLevel.name
      );

      console.log('💬 패배 대사:', dialogue);
      await this.showDialogue(dialogue, 3000);
    } catch (error) {
      console.error('❌ 대사 생성 실패:', error);
    }
  }

  /**
   * 레벨업 대사
   */
  async showLevelUpDialogueText(oldLevel, newLevel) {
    try {
      const dialogue = await geminiService.getLevelUpDialogue(
        oldLevel.name,
        newLevel.name
      );

      console.log('💬 레벨업 대사:', dialogue);
      await this.showDialogue(dialogue, 3000);
    } catch (error) {
      console.error('❌ 대사 생성 실패:', error);
    }
  }

  /**
   * 진화 알림 메시지 (크고 극적으로)
   */
  async showEvolutionAnnouncement(oldLevel, newLevel) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 진화 단계별 특별 메시지
    const evolutionMessages = {
      '전사 사자': {
        title: '🔥 진화의 시작 🔥',
        subtitle: '잃어버린 자력의 조각을 되찾다!',
        description: '견습 시절을 넘어 전사로 거듭나다'
      },
      '대장군 사자': {
        title: '⚡ 대장군의 각성 ⚡',
        subtitle: '전장을 호령하는 힘이 깨어나다!',
        description: '백전노장의 위엄, 왕의 자리가 보인다'
      },
      '사자왕': {
        title: '👑 왕의 귀환 👑',
        subtitle: '모든 자력을 되찾다!',
        description: '호랑이에게 빼앗긴 왕좌를 되찾을 시간'
      }
    };

    const message = evolutionMessages[newLevel.name];
    if (!message) return;

    // 배경 어둡게
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    // 타이틀 (큰 텍스트)
    const titleText = this.add.text(width / 2, height / 2 - 80, message.title, {
      fontSize: '56px',
      color: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setAlpha(0);

    // 부제목
    const subtitleText = this.add.text(width / 2, height / 2, message.subtitle, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    // 설명
    const descText = this.add.text(width / 2, height / 2 + 60, message.description, {
      fontSize: '24px',
      color: '#a5b4fc',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    // 진화 정보
    const evolutionInfo = this.add.text(width / 2, height / 2 + 120,
      `${oldLevel.name} → ${newLevel.name}`, {
      fontSize: '28px',
      color: '#10b981',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    // 페이드 인 애니메이션
    this.tweens.add({
      targets: titleText,
      alpha: 1,
      scale: { from: 0.5, to: 1 },
      duration: 800,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      y: height / 2 + 10,
      duration: 800,
      delay: 300,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: descText,
      alpha: 1,
      duration: 600,
      delay: 600
    });

    this.tweens.add({
      targets: evolutionInfo,
      alpha: 1,
      duration: 600,
      delay: 900
    });

    // 3초 대기
    await this.delay(3500);

    // 페이드 아웃
    this.tweens.add({
      targets: [overlay, titleText, subtitleText, descText, evolutionInfo],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        overlay.destroy();
        titleText.destroy();
        subtitleText.destroy();
        descText.destroy();
        evolutionInfo.destroy();
      }
    });

    await this.delay(500);
  }

  // ======================
  // 턴 관리
  // ======================

  startPlayerTurn() {
    if (this.isProcessing) return;

    // 전투 시작 시간 기록 (첫 플레이어 턴에서 한 번만)
    if (this.battleStartTime === 0) {
          this.battleStartTime = Date.now();
    }

    this.turnPhase = 'SELECT_DIFFICULTY';
    this.showMessage('공격 턴! 난이도를 선택하세요.');
    this.showDifficultySelector();
  }

  showDifficultySelector() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const y = height / 2;

    // FR 4.3: 난이도 선택지
    const difficulties = [
      { key: 'EASY', ...GAME_CONSTANTS.DIFFICULTY.EASY },
      { key: 'MEDIUM', ...GAME_CONSTANTS.DIFFICULTY.MEDIUM },
      { key: 'HARD', ...GAME_CONSTANTS.DIFFICULTY.HARD }
    ];

    this.difficultyButtons = [];

    difficulties.forEach((diff, index) => {
      const x = (width / 2) - 200 + (index * 200);

      // 버튼 배경
      const button = this.add.rectangle(x, y, 180, 120, diff.color)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectDifficulty(diff.key))
        .on('pointerover', () => button.setAlpha(0.8))
        .on('pointerout', () => button.setAlpha(1));

      button.setData('difficultyElement', true);

      // 난이도 텍스트
      const nameText = this.add.text(x, y - 30, diff.name, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      nameText.setData('difficultyElement', true);

      // 기본 데미지
      const damageText = this.add.text(x, y, `데미지: ${diff.baseDamage}`, {
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);

      damageText.setData('difficultyElement', true);

      // 제한 시간
      const timeText = this.add.text(x, y + 25, `시간: ${diff.timeLimit / 1000}초`, {
        fontSize: '16px',
        color: '#e5e7eb'
      }).setOrigin(0.5);

      timeText.setData('difficultyElement', true);

      this.difficultyButtons.push(button);
    });
  }

  selectDifficulty(difficulty) {
    if (this.isProcessing) return;

    console.log(`🎯 난이도 선택: ${difficulty}`);
    this.currentDifficulty = difficulty;

    // 난이도 버튼 제거
    this.clearDifficultyButtons();

    // 퀴즈 출제
    this.loadQuiz();
  }

  clearDifficultyButtons() {
    if (this.difficultyButtons) {
      this.difficultyButtons.forEach(btn => btn.destroy());
      this.difficultyButtons = [];
    }

    // 난이도 선택 관련 텍스트 제거 (안전하게 배열 복사 후 제거)
    const childrenToDestroy = [];
    this.children.list.forEach(child => {
      if (child.getData && child.getData('difficultyElement')) {
        childrenToDestroy.push(child);
      }
    });

    childrenToDestroy.forEach(child => {
      if (child && child.destroy) {
        child.destroy();
      }
    });
  }

  async loadQuiz() {
    this.isProcessing = true;
    this.showMessage('문제를 출제하는 중...');

    try {
      // FR 4.4: 사자성어 문제 출제 - API 호출
      const quizData = await apiClient.getBlankQuiz(this.currentDifficulty);

      // API 응답 형식을 화면 표시 형식으로 변환
      this.currentQuiz = {
        idiomId: quizData.idiomId,
        question: quizData.question,
        choices: quizData.choices,
        answer: quizData.answer,
        hanja: quizData.hanja,
        hangul: quizData.hangul
      };

      console.log('📚 새로운 문제:', this.currentQuiz);

      this.showQuiz();
    } catch (error) {
      console.log('📚 백엔드 미연결 - Mock 데이터 사용');
      // API 실패 시 임시 퀴즈 사용
      this.currentQuiz = this.generateMockQuiz();
      this.showQuiz();
    } finally {
      this.isProcessing = false;
    }
  }

  generateMockQuiz() {
    // API 실패 시 사용할 임시 퀴즈 (다양한 문제)
    const mockIdioms = [
      // 초급
      { idiomId: 1, question: '일석이조 (一石二鳥)', choices: ['돌 하나로 새 두 마리를 잡는다', '돌 하나가 새 두 마리만큼 무겁다', '새 두 마리가 돌 하나를 들다', '하나의 새가 두 개의 돌을 가지다'], answer: 0 },
      { idiomId: 2, question: '이심전심 (以心傳心)', choices: ['마음에서 마음으로 전한다', '두 개의 마음이 하나가 된다', '마음을 이어서 보낸다', '마음을 전달하는 것'], answer: 0 },
      { idiomId: 3, question: '사면초가 (四面楚歌)', choices: ['사방에서 적에게 포위되다', '네 면이 모두 노래하다', '사방의 모든 것', '초나라 노래'], answer: 0 },
      { idiomId: 4, question: '금상첨화 (錦上添花)', choices: ['비단 위에 꽃을 더하다', '금으로 꽃을 만들다', '꽃을 금으로 장식하다', '화려한 장식'], answer: 0 },
      { idiomId: 5, question: '호가호위 (狐假虎威)', choices: ['여우가 호랑이의 위세를 빌리다', '호랑이가 여우를 잡다', '여우와 호랑이가 싸우다', '가짜 호랑이'], answer: 0 },

      // 중급
      { idiomId: 6, question: '견물생심 (見物生心)', choices: ['물건을 보면 욕심이 생긴다', '개가 물건을 본다', '눈으로 보고 마음으로 생각한다', '물건을 보고 생각한다'], answer: 0 },
      { idiomId: 7, question: '각주구검 (刻舟求劍)', choices: ['배에 표시하고 검을 찾는다', '칼을 갈아서 찾는다', '배를 타고 검을 구한다', '검을 새기고 배를 탄다'], answer: 0 },
      { idiomId: 8, question: '감언이설 (甘言利說)', choices: ['달콤한 말과 이로운 설명', '감사하는 말씀', '입에 발린 말', '이득을 주는 말'], answer: 0 },
      { idiomId: 9, question: '구사일생 (九死一生)', choices: ['아홉 번 죽을 고비에서 한 번 살아나다', '구 명이 살고 한 명이 죽다', '아홉 번 싸워서 한 번 이기다', '구십 평생을 살다'], answer: 0 },
      { idiomId: 10, question: '권토중래 (捲土重來)', choices: ['흙먼지를 일으키며 다시 온다', '땅을 말아서 다시 온다', '권력이 다시 돌아온다', '흙으로 돌아온다'], answer: 0 },

      // 고급
      { idiomId: 11, question: '갑론을박 (甲論乙駁)', choices: ['서로 옳다고 주장하며 따지다', '갑과 을이 싸우다', '논쟁을 벌이다', '서로 이야기하다'], answer: 0 },
      { idiomId: 12, question: '과유불급 (過猶不及)', choices: ['지나친 것은 미치지 못한 것과 같다', '과거에 급하지 않다', '과일이 부족하다', '넘치도록 급하다'], answer: 0 },
      { idiomId: 13, question: '교토삼굴 (狡兔三窟)', choices: ['교활한 토끼는 굴이 세 개다', '토끼가 삼 번 굴을 판다', '세 마리 토끼를 잡다', '토끼가 교활하다'], answer: 0 },
      { idiomId: 14, question: '군계일학 (群鷄一鶴)', choices: ['닭 무리 속의 한 마리 학', '군대에 학이 한 마리', '많은 닭과 한 학', '계급의 일등'], answer: 0 },
      { idiomId: 15, question: '금의환향 (錦衣還鄕)', choices: ['비단옷을 입고 고향에 돌아온다', '금으로 돌아온다', '비단 옷을 입다', '고향에 금을 가져온다'], answer: 0 }
    ];

    return mockIdioms[Math.floor(Math.random() * mockIdioms.length)];
  }

  generateMockHanjaQuiz() {
    // API 실패 시 사용할 임시 한자 빈칸 퀴즈
    const mockHanjaQuizzes = [
      {
        idiomId: 1,
        question: '一_二鳥',
        fullHanja: '一石二鳥',
        hangul: '일석이조',
        blankPosition: 1,
        choices: ['石', '木', '水', '火'],
        answer: 0,
        meaning: '돌 하나로 새 두 마리를 잡는다'
      },
      {
        idiomId: 2,
        question: '以心_心',
        fullHanja: '以心傳心',
        hangul: '이심전심',
        blankPosition: 2,
        choices: ['傳', '轉', '全', '天'],
        answer: 0,
        meaning: '마음에서 마음으로 전한다'
      },
      {
        idiomId: 3,
        question: '四面_歌',
        fullHanja: '四面楚歌',
        hangul: '사면초가',
        blankPosition: 2,
        choices: ['楚', '草', '初', '處'],
        answer: 0,
        meaning: '사방에서 적에게 포위되다'
      }
    ];

    return mockHanjaQuizzes[Math.floor(Math.random() * mockHanjaQuizzes.length)];
  }

  showQuiz() {
      this.currentQuizType = "attack";   // ← 추가
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // FR 7.2: 제한 시간 시작
    this.quizStartTime = Date.now();
    const timeLimit = GAME_CONSTANTS.DIFFICULTY[this.currentDifficulty].timeLimit;

    this.showMessage(`문제: ${this.currentQuiz.question}\n⏱️ 제한 시간: ${timeLimit / 1000}초`);

    // 보기 버튼들
    this.quizButtons = [];
    const startY = 250;
    const gap = 60;

    this.currentQuiz.choices.forEach((choice, index) => {
      const y = startY + (index * gap);

      // 버튼 배경
      const button = this.add.rectangle(width / 2, y, 600, 50, 0x334155)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.submitAnswer(index))
        .on('pointerover', () => button.setFillStyle(0x475569))
        .on('pointerout', () => button.setFillStyle(0x334155));

      button.setStrokeStyle(2, 0x667eea);
      button.setData('quizElement', true);

      // 보기 텍스트
      const choiceText = this.add.text(width / 2 - 280, y, `${index + 1}. ${choice}`, {
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      choiceText.setData('quizElement', true);

      this.quizButtons.push(button);
    });

    // 타이머 표시
    this.quizTimer = this.add.text(width - 20, 80, '', {
      fontSize: '24px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    this.updateTimer();
  }

  updateTimer() {
    if (!this.quizStartTime) return;

    const elapsed = Date.now() - this.quizStartTime;
    const timeLimit = GAME_CONSTANTS.DIFFICULTY[this.currentDifficulty].timeLimit;
    const remaining = Math.max(0, timeLimit - elapsed);

    if (this.quizTimer) {
      this.quizTimer.setText(`⏱️ ${(remaining / 1000).toFixed(1)}초`);

      if (remaining <= 0) {
        // 시간 초과
        this.submitAnswer(-1); // 오답 처리
        return;
      }
    }

    // 100ms마다 업데이트
    this.time.delayedCall(100, () => this.updateTimer());
  }

  async submitAnswer(selectedIndex) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // 타이머 정지
    const responseTime = Date.now() - this.quizStartTime;

    // 정답 확인
    const isCorrect = selectedIndex === this.currentQuiz.answer;

    // 통계 업데이트
    if (isCorrect) {
        this.correctCount += 1;
    } else {
        this.wrongCount += 1;
    }

    console.log(`📝 답안 제출:`, { selectedIndex, isCorrect, responseTime });

    // UI 제거
    this.clearQuizUI();

    // FR 4.6: 데미지 연산
    let baseDamage = calculateAttackDamage(this.currentDifficulty, isCorrect, responseTime);

    // 사자 레벨에 따른 공격력 보너스 적용
    const attackBonus = this.lionLevel.attackBonus;
    let finalDamage = Math.floor(baseDamage * (1 + attackBonus / 100));

    // 사자왕 전용 추가 데미지 (고정값)
    if (this.lionLevel.damageBonus) {
      finalDamage += this.lionLevel.damageBonus;
      console.log(`⚔️ 데미지 계산: ${baseDamage} → ${finalDamage} (퍼센트 보너스 +${attackBonus}%, 고정 보너스 +${this.lionLevel.damageBonus})`);
    } else {
      console.log(`⚔️ 데미지 계산: ${baseDamage} → ${finalDamage} (보너스 +${attackBonus}%)`);
    }

    // FR 4.5: 학습 성과 데이터를 백엔드로 전송 (선택 사항)
    // await apiClient.attackBoss({ ... });

    // 공격 애니메이션 및 데미지 적용
    await this.performAttack(finalDamage, isCorrect);

    this.isProcessing = false;

    // 보스 HP 체크
    if (this.bossHP <= 0) {
      this.onVictory();
    } else {
      // 보스 턴
      this.startBossTurn();
    }
  }

  clearQuizUI() {
    // 버튼 제거
    if (this.quizButtons) {
      this.quizButtons.forEach(btn => btn.destroy());
      this.quizButtons = [];
    }

    // 타이머 제거
    if (this.quizTimer) {
      this.quizTimer.destroy();
      this.quizTimer = null;
    }

    // 퀴즈 관련 텍스트 제거 (안전하게 배열 복사 후 제거)
    const childrenToDestroy = [];
    this.children.list.forEach(child => {
      // quizElement 태그가 있는 모든 요소 제거
      if (child.getData && child.getData('quizElement')) {
        childrenToDestroy.push(child);
      }
    });

    childrenToDestroy.forEach(child => {
      if (child && child.destroy) {
        child.destroy();
      }
    });
  }

  async performAttack(damage, isCorrect) {
    // 결과 메시지
    const resultMsg = isCorrect ? '✅ 정답!' : '❌ 오답!';
    this.showMessage(`${resultMsg} ${damage} 데미지를 입혔습니다!`);

    // 공격 애니메이션
    await this.animateAttack();

    // 보스 HP 감소
    this.bossHP = Math.max(0, this.bossHP - damage);
    this.updateBossHP();

    // 데미지 텍스트 표시
    this.showDamageText(this.bossSprite.x, this.bossSprite.y - 80, damage);

    // 플레이어 공격 대사
    await this.showPlayerAttackDialogue(isCorrect);

    // 잠시 대기
    await this.delay(500);
  }

  async animateAttack() {
    return new Promise(resolve => {
      // 플레이어 공격 애니메이션
      this.playPlayerAttackAnimation(() => {
        // 보스 피격 애니메이션
        this.playHurtAnimation(this.bossSprite, resolve);
      });
    });
  }

  showDamageText(x, y, damage) {
    const info = getDamageDisplayInfo(damage);

    const damageText = this.add.text(x, y, info.text, {
      fontSize: `${info.size}px`,
      color: info.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 위로 떠오르면서 사라짐
    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy()
    });
  }

  async startBossTurn() {
    this.turnPhase = 'BOSS_DEFEND';
    this.showMessage(`${this.stageData.name} 보스의 공격! 방어 문제를 풀어야 합니다!`);

    // 보스 공격 대사
    await this.showBossAttackDialogue();

    await this.delay(1000);

    // FR 4.7: 방어 문제 출제
    this.loadDefenseQuiz();
  }

  async loadDefenseQuiz() {
    this.isProcessing = true;

    try {
      // 방어 문제는 스테이지에 따라 난이도가 다름 - 다양성 확보
      // 스테이지 1-4: 초급/중급 랜덤, 5-8: 초급/중급/고급 랜덤, 9-12: 중급/고급 랜덤
      let defenseDifficulty;
      const stageId = this.stageData.id;

      if (stageId <= 4) {
        defenseDifficulty = Math.random() < 0.7 ? 'EASY' : 'MEDIUM';
      } else if (stageId <= 8) {
        const rand = Math.random();
        if (rand < 0.4) defenseDifficulty = 'EASY';
        else if (rand < 0.8) defenseDifficulty = 'MEDIUM';
        else defenseDifficulty = 'HARD';
      } else {
        defenseDifficulty = Math.random() < 0.5 ? 'MEDIUM' : 'HARD';
      }

      // 한자 빈칸 채우기 퀴즈 사용
      const quizData = await apiClient.getHanjaBlankQuiz(defenseDifficulty);

      this.currentQuiz = {
        idiomId: quizData.idiomId,
        question: quizData.question,
        choices: quizData.choices,
        answer: quizData.answer,
        fullHanja: quizData.fullHanja,
        hangul: quizData.hangul,
        blankPosition: quizData.blankPosition,
        meaning: quizData.meaning
      };

      console.log(`🛡️ 방어 문제 (난이도: ${defenseDifficulty}, 한자 빈칸):`, this.currentQuiz);

      this.showDefenseQuiz();
    } catch (error) {
      console.log('🛡️ 백엔드 미연결 - Mock 한자 퀴즈 사용');
      // API 실패 시 임시 퀴즈 사용
      this.currentQuiz = this.generateMockHanjaQuiz();
      this.showDefenseQuiz();
    } finally {
      this.isProcessing = false;
    }
  }

  showDefenseQuiz() {
      this.currentQuizType = "defense";   // ← 추가
    this.quizStartTime = Date.now();
    const width = this.cameras.main.width;

    // 문제 문구
    this.showMessage(`🛡️ 방어 문제: 빈칸에 들어갈 알맞은 한자를 고르세요!`);

    // 한자 문제 큰 글씨로 표시 (중앙 상단)
    const questionText = this.add.text(width / 2, 200, this.currentQuiz.question, {
      fontSize: '48px',
      color: '#fbbf24',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    questionText.setData('quizElement', true);

    // 뜻 표시 (작은 글씨)
    if (this.currentQuiz.meaning) {
      const meaningText = this.add.text(width / 2, 260, this.currentQuiz.meaning, {
        fontSize: '18px',
        color: '#a5b4fc',
        align: 'center'
      }).setOrigin(0.5);
      meaningText.setData('quizElement', true);
    }

    // 보기 버튼들 (한자 선택)
    const startY = 320;
    const buttonWidth = 120;
    const buttonHeight = 120;
    const gap = 40;

    // 4개의 선택지를 2x2로 배치
    const positions = [
      { x: width / 2 - buttonWidth / 2 - gap / 2, y: startY },
      { x: width / 2 + buttonWidth / 2 + gap / 2, y: startY },
      { x: width / 2 - buttonWidth / 2 - gap / 2, y: startY + buttonHeight + gap },
      { x: width / 2 + buttonWidth / 2 + gap / 2, y: startY + buttonHeight + gap }
    ];

    this.quizButtons = [];

    this.currentQuiz.choices.forEach((choice, index) => {
      const pos = positions[index];

      const button = this.add.rectangle(pos.x, pos.y, buttonWidth, buttonHeight, 0x334155)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.submitDefenseAnswer(index))
        .on('pointerover', () => button.setFillStyle(0x475569))
        .on('pointerout', () => button.setFillStyle(0x334155));

      button.setStrokeStyle(3, 0x10b981);
      button.setData('quizElement', true);

      // 한자를 큰 글씨로 표시
      const choiceText = this.add.text(pos.x, pos.y, choice, {
        fontSize: '60px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      choiceText.setData('quizElement', true);

      this.quizButtons.push(button);
    });
  }

  async submitDefenseAnswer(selectedIndex) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const responseTime = Date.now() - this.quizStartTime;
    const defenseSuccess = selectedIndex === this.currentQuiz.answer;

    // 통계 업데이트 (방어도 정답/오답에 포함)
    if (defenseSuccess) {
        this.correctCount += 1;
    } else {
        this.wrongCount += 1;
    }

    console.log(`🛡️ 방어 답안:`, { selectedIndex, defenseSuccess, responseTime });

    this.clearQuizUI();

    // FR 4.8: 방어 데미지 계산
    const damageTaken = calculateDefenseDamage(this.bossAttack, defenseSuccess);

    // 방어 결과 메시지
    const resultMsg = defenseSuccess ? '✅ 방어 성공!' : '❌ 방어 실패!';
    this.showMessage(`${resultMsg} ${damageTaken} 데미지를 받았습니다.`);

    // 보스 공격 애니메이션
    await this.animateBossAttack();

    // 플레이어 HP 감소
    this.playerHP = Math.max(0, this.playerHP - damageTaken);
    this.updatePlayerHP();

    // 데미지 텍스트 표시
    this.showDamageText(this.playerSprite.x, this.playerSprite.y - 80, damageTaken);

    await this.delay(1500);

    this.isProcessing = false;

    // 플레이어 HP 체크
    if (this.playerHP <= 0) {
      this.onDefeat();
    } else {
      // 다시 플레이어 턴
      this.startPlayerTurn();
    }
  }

  async animateBossAttack() {
    return new Promise(resolve => {
      // 보스 공격 애니메이션
      this.playBossAttackAnimation(() => {
        // 플레이어 피격 애니메이션
        this.playHurtAnimation(this.playerSprite, resolve);
      });
    });
  }

  // ======================
  // HP 바 업데이트
  // ======================

updatePlayerHP() {
    const newWidth = 200 * (this.playerHP / this.playerMaxHP);
    this.tweens.add({
        targets: this.playerHPBar,
        width: newWidth,
        duration: 500
    });
    this.playerHPText.setText(`${this.playerHP}/${this.playerMaxHP}`);
}

updateBossHP() {
    const newWidth = 200 * (this.bossHP / this.bossMaxHP);
    this.tweens.add({
        targets: this.bossHPBar,
        width: newWidth,
        duration: 500
    });
    this.bossHPText.setText(`${this.bossHP}/${this.bossMaxHP}`);
}


  // ======================
  // 전투 종료
  // ======================

  async onVictory() {
    console.log('🎉 승리!');
    this.saveBattleResult(true);
    this.showMessage(`🎉 ${this.stageData.name} 보스를 물리쳤습니다!`);

    // 난이도 선택 버튼 및 퀴즈 UI 제거
    this.clearDifficultyButtons();
    this.clearQuizUI();

    // 스테이지 클리어 저장
    await this.saveStageProgress(this.stageData.id);

    // Idle 애니메이션 중지
    if (this.idleTween) {
      this.idleTween.stop();
    }

    // 보스 사망 애니메이션
    this.playDeathAnimation(this.bossSprite);

    // 플레이어 승리 애니메이션
    this.playVictoryAnimation(this.playerSprite);

    // 승리 대사
    await this.delay(1000);
    await this.showVictoryDialogueText();

    // 레벨업 체크
    const levelUpInfo = checkLionLevelUp(this.stageData.id);

    if (levelUpInfo) {
      // 다음 레벨 이미지 미리 로드
      const nextLevel = levelUpInfo.newLevel;
      const nextLionKey = `player_lion_${nextLevel.name}`;

      // 이미 로드되어 있지 않은 경우에만 로드
      if (!this.textures.exists(nextLionKey)) {
        this.load.image(nextLionKey, nextLevel.image);
        console.log(`🦁 진화 이미지 로드: ${nextLevel.name} - ${nextLevel.image} (키: ${nextLionKey})`);
      }

      this.load.once('complete', () => {
        // 승리 애니메이션 후 진화 애니메이션 재생
        this.time.delayedCall(2500, async () => {
          this.showMessage(`✨ ${nextLevel.description}`);

          // 진화 알림 메시지 (크고 극적으로)
          await this.showEvolutionAnnouncement(levelUpInfo.oldLevel, nextLevel);

          // 레벨업 대사
          await this.showLevelUpDialogueText(levelUpInfo.oldLevel, nextLevel);

          this.playLionEvolutionAnimation(nextLevel, nextLionKey, () => {
            // 이름 업데이트
            this.playerNameText.setText(nextLevel.name);

            // 진화 시 체력 증가 및 회복
            const oldMaxHP = this.playerMaxHP;
            const hpBonus = nextLevel.hpBonus - levelUpInfo.oldLevel.hpBonus;
            this.playerMaxHP += hpBonus;
            this.playerHP = Math.min(this.playerHP + hpBonus, this.playerMaxHP); // 보너스만큼 회복

            this.updatePlayerHP();

            // 진화 보상 메시지
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            const bonusText = this.add.text(width / 2, height / 2 + 100,
              `체력 +${hpBonus} | 공격력 +${nextLevel.attackBonus - levelUpInfo.oldLevel.attackBonus}%`, {
              fontSize: '20px',
              color: '#4ade80',
              fontStyle: 'bold'
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
              targets: bonusText,
              alpha: 1,
              duration: 500,
              onComplete: () => {
                this.time.delayedCall(1500, () => {
                  this.tweens.add({
                    targets: bonusText,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => bonusText.destroy()
                  });
                });
              }
            });

            console.log(`📈 진화 완료! 최대 HP: ${oldMaxHP} → ${this.playerMaxHP}, 공격 보너스: ${levelUpInfo.oldLevel.attackBonus}% → ${nextLevel.attackBonus}%`);

            // FR 4.11: 통계 표시
            this.time.delayedCall(2500, () => {
                this.showBattleResult(true);
            });
          });
        });
      });
      this.load.start();
    } else {
      // 레벨업 없으면 바로 스테이지 선택으로
      this.time.delayedCall(2500, () => {
          this.showBattleResult(true);
      });
    }
  }

    /**
  * 전투 결과창 표시
  * @param {boolean} isVictory - 승리 여부
  */
    showBattleResult(isVictory) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 전체 어두운 오버레이
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6)
            .setDepth(999)
            .setInteractive(); // 뒤 클릭 막기

        const panelWidth = width - 200;
        const panelHeight = 320;

        // 결과 패널
        const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x0f172a, 0.95)
            .setStrokeStyle(3, isVictory ? 0x4ade80 : 0xf97316)
            .setDepth(1000);

        const titleText = isVictory ? '전투 결과 - 승리!' : '전투 결과 - 패배';
        const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 40, titleText, {
            fontSize: '28px',
            color: '#e5e7eb',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(1001);

        // 걸린 시간 계산
        let elapsedSec = 0;
        if (this.battleStartTime) {
            const elapsedMs = Date.now() - this.battleStartTime;
            elapsedSec = (elapsedMs / 1000).toFixed(1);
        }

        const resultLines = [
            `정답 개수 : ${this.correctCount ?? 0}`,
            `오답 개수 : ${this.wrongCount ?? 0}`,
            `걸린 시간 : ${elapsedSec}초`,
            `남은 체력 : ${this.playerHP}/${this.playerMaxHP}`
        ];

        const resultText = this.add.text(
            width / 2 - panelWidth / 2 + 40,
            height / 2 - 40,
            resultLines.join('\n'),
            {
                fontSize: '20px',
                color: '#e5e7eb',
                lineSpacing: 8
            }
        ).setOrigin(0, 0).setDepth(1001);

        // 보스 선택 / 최종 결과로 이동 버튼
        const button = this.add.text(
            width / 2,
            height / 2 + panelHeight / 2 - 50,
            '보스 선택 화면으로',
            {
                fontSize: '22px',
                color: '#e5e7eb',
                fontStyle: 'bold'
            }
        )
            .setOrigin(0.5)
            .setDepth(1001)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setColor('#facc15'))
            .on('pointerout', () => button.setColor('#e5e7eb'))
            .on('pointerdown', () => {
                // 결과창 정리
                overlay.destroy();
                panel.destroy();
                title.destroy();
                resultText.destroy();
                button.destroy();

                // 🔍 마지막 스테이지인지 확인
                const stages = GAME_CONSTANTS.STAGES || [];
                let isFinalStage = false;

                if (stages.length > 0) {
                    const lastId = stages[stages.length - 1].id;
                    isFinalStage = this.stageData.id === lastId;
                }

                if (isFinalStage && isVictory) {
                    saveGameData('hiddenBossUnlocked', 'true');
                }

                // 마지막 스테이지면 최종 결과 화면으로, 아니면 기존대로 스테이지 선택
                if (isFinalStage) {
                    this.scene.start('FinalResultScene');
                } else {
                    this.scene.start('StageSelectScene');
                }
            });
    }


  async onDefeat() {
    console.log('💀 패배...');
    this.saveBattleResult(false);
    this.showMessage('💀 패배했습니다. 다시 도전하세요!');

    // 난이도 선택 버튼 및 퀴즈 UI 제거
    this.clearDifficultyButtons();
    this.clearQuizUI();

    // 플레이어 사망 애니메이션
    this.playDeathAnimation(this.playerSprite);

    // 보스 승리 애니메이션
    this.playVictoryAnimation(this.bossSprite);

    // 패배 대사
    await this.delay(1000);
    await this.showDefeatDialogueText();

    this.time.delayedCall(2500, () => {
        this.showBattleResult(false);
    });
  }

  confirmRetreat() {
    const confirm = window.confirm('전투를 포기하시겠습니까?');
    if (confirm) {
      this.scene.start('StageSelectScene');
    }
  }

  // ======================
  // 애니메이션
  // ======================

  /**
   * 대기 상태 애니메이션 - 위아래로 부드럽게 떠오르는 효과
   */
  startIdleAnimation() {
    if (this.idleTween) {
      this.idleTween.stop();
    }

    const originalY = this.bossSprite.y;

    this.idleTween = this.tweens.add({
      targets: this.bossSprite,
      y: originalY - 15,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  /**
   * 공격 애니메이션 - 앞으로 돌진하고 돌아옴
   * @param {Function} onComplete - 애니메이션 완료 후 콜백
   */
  playBossAttackAnimation(onComplete) {
    const originalX = this.bossSprite.x;
    const originalTexture = `boss_${this.stageData.id}`;
    const attackTexture = `boss_${this.stageData.id}_attack`;

    // Idle 애니메이션 중지
    if (this.idleTween) {
      this.idleTween.pause();
    }

    // 공격 이미지로 변경 (크기도 키움)
    if (this.textures.exists(attackTexture)) {
      this.bossSprite.setTexture(attackTexture);
      this.bossSprite.setScale(0.55); // 공격 시 훨씬 더 크게
    }

    // 공격 준비 (뒤로 살짝)
    this.tweens.add({
      targets: this.bossSprite,
      x: originalX + 30,
      scale: 0.6,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // 돌진!
        this.tweens.add({
          targets: this.bossSprite,
          x: originalX - 150,
          scale: 0.7,
          duration: 600,
          ease: 'Power2',
          onComplete: () => {
            // 흔들림 효과
            this.cameras.main.shake(200, 0.01);

            // 원위치
            this.tweens.add({
              targets: this.bossSprite,
              x: originalX,
              scale: 0.3,
              duration: 800,
              ease: 'Back.easeOut',
              onComplete: () => {
                // 원래 이미지로 복귀
                if (this.textures.exists(originalTexture)) {
                  this.bossSprite.setTexture(originalTexture);
                }

                if (this.idleTween) {
                  this.idleTween.resume();
                }
                if (onComplete) onComplete();
              }
            });
          }
        });
      }
    });
  }

  /**
   * 플레이어 공격 애니메이션
   * @param {Function} onComplete - 애니메이션 완료 후 콜백
   */
  playPlayerAttackAnimation(onComplete) {
    const originalX = this.playerSprite.x;
    const attackTexture = `${this.currentLionKey}_attack`;

    // 공격 이미지로 변경 (크기도 키움)
    if (this.textures.exists(attackTexture)) {
      this.playerSprite.setTexture(attackTexture);
      this.playerSprite.setScale(this.lionScale + 0.25); // 공격 시 훨씬 더 크게
    }

    // 돌진!
    this.tweens.add({
      targets: this.playerSprite,
      x: originalX + 100,
      scale: this.lionScale + 0.35,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // 원위치
        this.tweens.add({
          targets: this.playerSprite,
          x: originalX,
          scale: this.lionScale,
          duration: 600,
          ease: 'Back.easeOut',
          onComplete: () => {
            // 원래 이미지로 복귀
            if (this.textures.exists(this.currentLionKey)) {
              this.playerSprite.setTexture(this.currentLionKey);
            }
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  /**
   * 피격 애니메이션 - 뒤로 밀림 + 이미지 변경
   * @param {Phaser.GameObjects.Sprite} target - 피격 대상
   * @param {Function} onComplete - 애니메이션 완료 후 콜백
   */
  playHurtAnimation(target, onComplete) {
    const originalX = target.x;
    const isBoss = target === this.bossSprite;

    // 피격 이미지로 변경 (크기도 키움)
    let originalTexture = null;
    let originalScale = 0.3;

    if (isBoss) {
      originalTexture = `boss_${this.stageData.id}`;
      originalScale = 0.3;
      const hurtTexture = `boss_${this.stageData.id}_hurt`;
      if (this.textures.exists(hurtTexture)) {
        this.bossSprite.setTexture(hurtTexture);
        this.bossSprite.setScale(0.55); // 피격 시 훨씬 더 크게
      }
    } else {
      // 플레이어(사자)가 피격당하는 경우
      originalTexture = this.currentLionKey;
      originalScale = this.lionScale;
      const hurtTexture = `${this.currentLionKey}_hurt`;
      if (this.textures.exists(hurtTexture)) {
        this.playerSprite.setTexture(hurtTexture);
        this.playerSprite.setScale(this.lionScale + 0.25); // 피격 시 훨씬 더 크게
      }
    }

    // 뒤로 밀림 + 피격 이미지 유지 후 원위치
    this.tweens.add({
      targets: target,
      x: isBoss ? originalX + 30 : originalX - 30,
      duration: 200,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        // 약간의 지연 후 원래 이미지 및 크기로 복귀
        this.time.delayedCall(400, () => {
          if (originalTexture && this.textures.exists(originalTexture)) {
            target.setTexture(originalTexture);
            target.setScale(originalScale); // 원래 크기로 복구
          }
          if (onComplete) onComplete();
        });
      }
    });

    // 화면 흔들림
    this.cameras.main.shake(150, 0.005);
  }

  /**
   * 승리 애니메이션 - 점프
   * @param {Phaser.GameObjects.Sprite} target
   */
  playVictoryAnimation(target) {
    const originalY = target.y;

    this.tweens.add({
      targets: target,
      y: originalY - 50,
      duration: 300,
      ease: 'Power2',
      yoyo: true,
      repeat: 2
    });

    this.tweens.add({
      targets: target,
      angle: 360,
      duration: 600,
      ease: 'Power2'
    });
  }

  /**
   * 사망 애니메이션 - 회전하며 사라짐
   * @param {Phaser.GameObjects.Sprite} target
   * @param {Function} onComplete
   */
  playDeathAnimation(target, onComplete) {
    this.tweens.add({
      targets: target,
      alpha: 0,
      scaleX: target.scaleX ? target.scaleX * 0.5 : 0.5,
      scaleY: target.scaleY ? target.scaleY * 0.5 : 0.5,
      angle: -90,
      y: target.y + 100,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * 사자 진화 애니메이션
   * @param {object} newLevel - 새로운 레벨 정보
   * @param {string} newLionKey - 새 사자 이미지 텍스처 키
   * @param {Function} onComplete - 완료 콜백
   */
  playLionEvolutionAnimation(newLevel, newLionKey, onComplete) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 새로운 레벨의 크기 계산
    const lionScales = {
      '견습 사자': 0.30,
      '전사 사자': 0.38,
      '대장군 사자': 0.50,
      '사자왕': 0.58
    };
    const newLionScale = lionScales[newLevel.name] || 0.35;

    // 화면 중앙으로 이동
    this.tweens.add({
      targets: this.playerSprite,
      x: width / 2,
      y: height / 2,
      scale: this.lionScale + 0.1,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // 빛나는 효과
        this.tweens.add({
          targets: this.playerSprite,
          alpha: 0.3,
          scale: this.lionScale + 0.2,
          duration: 200,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            // 새로운 이미지로 교체 및 크기 업데이트
            this.playerSprite.setTexture(newLionKey);
            this.lionScale = newLionScale; // 새 레벨 크기로 업데이트
            console.log(`🦁 사자 이미지 교체: ${newLionKey}, 새 크기: ${this.lionScale}`);

            // 진화 완료 애니메이션
            this.tweens.add({
              targets: this.playerSprite,
              alpha: 1,
              scale: this.lionScale + 0.05,
              duration: 500,
              ease: 'Back.easeOut',
              onComplete: () => {
                // 원위치
                this.tweens.add({
                  targets: this.playerSprite,
                  x: 250,
                  y: height / 2,
                  scale: this.lionScale,
                  duration: 800,
                  ease: 'Power2',
                  onComplete: () => {
                    if (onComplete) onComplete();
                  }
                });
              }
            });
          }
        });
      }
    });

    // 진화 메시지 표시
    const evolutionText = this.add.text(width / 2, height / 2 - 200,
      `🌟 ${newLevel.name}으로 진화! 🌟`, {
      fontSize: '36px',
      color: '#fbbf24',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: evolutionText,
      alpha: 1,
      y: height / 2 - 220,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: evolutionText,
            alpha: 0,
            duration: 500,
            onComplete: () => evolutionText.destroy()
          });
        });
      }
    });
  }

  // ======================
  // 유틸리티
  // ======================

  showMessage(text) {
    if (this.messageText) {
      this.messageText.setText(text);
    }
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  /**
   * 스테이지 클리어 진행 상황 저장
   * 로그인 사용자: 서버 API 호출
   * 게스트: localStorage 사용
   */
  async saveStageProgress(clearedStageId) {
    console.log(`💾 스테이지 클리어 저장 시작 - 스테이지 ${clearedStageId}`);
    console.log(`🔍 게스트 모드: ${isGuestMode()}, 인증 여부: ${apiClient.isAuthenticated()}`);

    // 로그인한 사용자는 서버에 저장
    if (!isGuestMode() && apiClient.isAuthenticated()) {
      console.log(`🌐 서버에 스테이지 클리어 저장 중...`);
      try {
        const response = await apiClient.clearStage(clearedStageId);
        console.log(`✅ 스테이지 ${clearedStageId} 클리어 - 서버에 저장 완료`, response);
      } catch (error) {
        console.error('❌ 스테이지 클리어 저장 실패:', error);
        // 실패해도 로컬에 저장 (백업)
        const currentMax = loadGameData('maxClearedStage', '0');
        const currentMaxNum = parseInt(currentMax, 10);
        if (clearedStageId > currentMaxNum) {
          saveGameData('maxClearedStage', clearedStageId.toString());
        }
      }
    } else {
      // 게스트 모드는 localStorage에 저장
      const currentMax = loadGameData('maxClearedStage', '0');
      const currentMaxNum = parseInt(currentMax, 10);
      if (clearedStageId > currentMaxNum) {
        saveGameData('maxClearedStage', clearedStageId.toString());
        console.log(`✅ 스테이지 ${clearedStageId} 클리어 - 게스트 모드 localStorage에 저장`);
      }
    }
  }
    saveBattleResult(isVictory) {
        let elapsedSec = 0;

        if (this.battleStartTime) {
            const elapsedMs = Date.now() - this.battleStartTime;
            elapsedSec = Number((elapsedMs / 1000).toFixed(1));
        }

        // 기존 저장된 배열 읽기
        const raw = loadGameData('battleStats', '[]');
        let stats = [];

        try {
            const parsed = JSON.parse(raw);
            stats = Array.isArray(parsed) ? parsed : [];
        } catch {
            stats = [];
        }

        // 현재 스테이지 전투 결과 작성
        const stageResult = {
            stageId: this.stageData.id,
            stageName: this.stageData.name,
            isVictory,
            correct: this.correctCount,
            wrong: this.wrongCount,
            time: elapsedSec,
            endHp: this.playerHP,
            maxHp: this.playerMaxHP
        };

        // 저장
        stats.push(stageResult);
        saveGameData('battleStats', JSON.stringify(stats));
    }
}
