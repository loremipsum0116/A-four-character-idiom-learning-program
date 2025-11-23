// scenes/InfiniteModeScene.js

import Phaser from 'phaser';
import { removeGesture } from '../../gesture.js';

// ⚔️ 사자성어 퀴즈 출제 및 데미지 계산에 필요한 유틸리티 및 API 클라이언트 임포트
import { apiClient } from '../../services/APIClient.js'; 
import { calculateAttackDamage, getLionLevel } from '../../utils/damageCalculator.js';
import { GAME_CONSTANTS } from '../../utils/constants.js'; 

/**
 * InfiniteModeScene - 무한 모드 (사자성어 퀴즈 버전)
 * 난이도 선택 없이 문제를 풀고, 틀리면 목숨이 깎이는 모드입니다.
 */
export default class InfiniteModeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InfiniteModeScene' });
    this.initialBossStageId = 1; 
  }

  init(data) {
    this.userData = data.user || {};
    this.score = 0;

    // 🎯 [핵심] 플레이어 목숨 3개
    this.playerLives = 3;
    this.maxLives = 3;
    
    this.availableDifficulties = Object.keys(GAME_CONSTANTS.DIFFICULTY);
    this.currentDifficulty = 'RANDOM'; 

    // 전투 상태 및 통계
    this.turnPhase = 'LOADING_QUIZ'; // LOADING_QUIZ, PLAYER_ATTACK
    this.currentQuiz = null;
    this.quizStartTime = 0;
    this.isProcessing = false;
    this.correctCount = 0;          // 정답 횟수 (점수 계산용)
    this.stageAttemptCount = 0;     // 🎯 [추가] 문제 출제 시마다 증가하는 스테이지 번호
    this.wrongCount = 0;
    
    // 보스 (무한 체력)
    this.stageData = {
        id: this.initialBossStageId,
        name: "무한의 짐승",
        emoji: "👹",
        bossHp: 9999999, 
        bossMaxHP: 9999999,
        bossAttack: 0,
        description: "끝없이 도전하는 사자성어 짐승",
        image: '../../../public/pictures/arcade-boxing-punch-machine-coin-operated.png' 
    };
    
    this.lionLevel = getLionLevel(this.initialBossStageId);
    this.currentLionKey = `player_lion_${this.lionLevel.name}`; 

    console.log(`♾️ 무한 도전 모드 시작 - 목숨: ${this.playerLives}`);
  }

  preload() {
    this.load.image(`boss_${this.stageData.id}`, this.stageData.image); 
    this.load.image(this.currentLionKey, '../../../public/pictures/lion-king.png');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x1e293b); 

    this.add.text(width / 2, 30, '♾️ 무한 도전 모드', {
      fontSize: '28px',
      color: '#fcd34d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.createCharacters();
    this.createLifeAndBossUI();
    this.createStageUI(); // 스테이지 UI 생성
    this.createMessageBox();
    this.createBackButton(width, height); 

    this.startNextWave(); // 첫 스테이지 시작 (바로 퀴즈 로드)

    // 💡 [핵심] 제스처 이벤트 리스너 추가 및 바인딩
    window.addEventListener("finger-count", this.handleGestureInput.bind(this));
  }
  
  // ======================
  // 🎯 턴 / 퀴즈 로직 (무한 반복)
  // ======================

  startNextWave() {
    if (this.isProcessing || this.playerLives <= 0) return;
    
    this.turnPhase = 'LOADING_QUIZ';
    // 🎯 [수정] 스테이지 UI로 표시되므로, 메시지는 간결하게 유지
    this.showMessage('문제를 로드합니다...'); 
    
    this.loadQuiz();
  }

  /**
   * 퀴즈 로드 로직
   */
  async loadQuiz() {
    this.isProcessing = true;
    this.clearQuizUI(); 
    this.showMessage('문제를 출제하는 중...');

    // 🎯 [핵심 수정] 문제 출제 전에 스테이지 번호를 증가시키고 UI 업데이트
    this.updateStageDisplay();

    // 난이도를 무작위로 선택합니다.
    const randomIndex = Math.floor(Math.random() * this.availableDifficulties.length);
    const difficultyKey = this.availableDifficulties[randomIndex];
    this.currentDifficulty = difficultyKey;

    try {
        const cacheBuster = Date.now();
        console.log(`🔎 API 요청 - 난이도: ${difficultyKey}, CacheBuster: ${cacheBuster}`);
        
        const quizData = await apiClient.getBlankQuiz(difficultyKey, { cacheBuster }); 

        console.log(`✅ API 응답 성공 - 난이도: ${difficultyKey}, 퀴즈 ID: ${quizData.idiomId}`);

        this.currentQuiz = {
            idiomId: quizData.idiomId,
            question: quizData.question,
            choices: quizData.choices,
            answer: quizData.answer,
            hanja: quizData.hanja,
            hangul: quizData.hangul
        };

        this.turnPhase = 'PLAYER_ATTACK';
        this.showQuiz();
    } catch (error) {
        console.error('❌ 퀴즈 로드 실패 (API Error)! Mock 퀴즈를 사용합니다.', error);
        
        const fallbackRandomIndex = Math.floor(Math.random() * this.availableDifficulties.length);
        this.currentDifficulty = this.availableDifficulties[fallbackRandomIndex]; 
        
        this.currentQuiz = this.generateMockQuiz();
        this.turnPhase = 'PLAYER_ATTACK';
        this.showQuiz();
    } finally {
        this.isProcessing = false; 
    }
  }

  generateMockQuiz() {
      const mockQuizzes = [
          { question: '빈칸에 들어갈 글자는? [一 擧 兩 ㅁ]', choices: ['得', '失', '難', '鳥'], answer: 0, hanja: '一擧兩得', hangul: '일거양득' },
          { question: '빈칸에 들어갈 글자는? [苦 盡 甘 ㅁ]', choices: ['來', '辛', '味', '樂'], answer: 0, hanja: '苦盡甘來', hangul: '고진감래' },
          { question: '빈칸에 들어갈 글자는? [自 繩 自 ㅁ]', choices: ['縛', '解', '得', '繩'], answer: 0, hanja: '自繩自縛', hangul: '자승자박' },
          { question: '빈칸에 들어갈 글자는? [漁 夫 之 ㅁ]', choices: ['利', '事', '人', '生'], answer: 0, hanja: '漁夫之利', hangul: '어부지리' },
          { question: '빈칸에 들어갈 글자는? [塞 翁 之 ㅁ]', choices: ['馬', '路', '道', '家'], answer: 0, hanja: '塞翁之馬', hangul: '새옹지마' }
      ];
      const randomIndex = Math.floor(Math.random() * mockQuizzes.length);
      console.log(`📚 Mock Quiz #${randomIndex + 1} 출제 (난이도: ${this.currentDifficulty}): ${mockQuizzes[randomIndex].question}`);
      return mockQuizzes[randomIndex];
  }
  
  showQuiz() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const timeLimit = GAME_CONSTANTS.DIFFICULTY[this.currentDifficulty]?.timeLimit || 15000; 
    
    // 🎯 [수정] 스테이지 정보 제거, 난이도 및 제한 시간만 표시
    this.showMessage(`[${this.currentDifficulty}] 문제: ${this.currentQuiz.question}\n⏱️ 제한 시간: ${timeLimit / 1000}초. (1~4 손가락)`);
    
    this.quizButtons = []; 
    const choicesY = height / 2;
    const choices = this.currentQuiz.choices;
    
    // 💡 [수정] 보기 UI 크기 조정
    const BUTTON_WIDTH = 300;
    const BUTTON_HEIGHT = 60;
    const HORIZONTAL_OFFSET = 320; 
    const VERTICAL_SPACING = 75; 

    choices.forEach((choice, index) => {
        const x = (width / 2) - (HORIZONTAL_OFFSET / 2) + (index % 2) * HORIZONTAL_OFFSET; 
        const y = choicesY - (VERTICAL_SPACING / 2) + Math.floor(index / 2) * VERTICAL_SPACING;

        const button = this.add.rectangle(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, 0x475569)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.submitAnswer(index))
            .setData('quizElement', true);
        
        this.add.text(x, y, `${index + 1}. ${choice}`, { fontSize: '18px', color: '#ffffff' }) 
            .setOrigin(0.5)
            .setData('quizElement', true);
        this.quizButtons.push(button);
    });
    
    this.quizStartTime = Date.now();
    this.quizTimer = this.time.delayedCall(timeLimit, () => this.handleTimeOut(), [], this);
  }

  /**
   * 제스처 입력 처리 (퀴즈 정답 선택만)
   */
  handleGestureInput(e) {
      if (this.isProcessing || this.playerLives <= 0) return;
      const count = e.detail.count; // 1~4

      if (this.turnPhase === 'PLAYER_ATTACK' && count >= 1 && count <= 4) {
          const selectedIndex = count - 1; 
          
          if (!this.currentQuiz || selectedIndex >= this.currentQuiz.choices.length) {
              console.log(`☝️ 제스처 입력: 손가락 ${count}개. 유효하지 않은 보기 번호입니다.`);
              return;
          }

          console.log(`☝️ 제스처 입력: 손가락 ${count}개 → 보기 ${count}번 선택`);
          this.submitAnswer(selectedIndex);
          return;
      }
  }
  
  handleTimeOut() {
    if (this.turnPhase !== 'PLAYER_ATTACK' || this.isProcessing) return;
    console.log('⏱️ 시간 초과! 오답 처리합니다.');
    this.submitAnswer(-1); 
  }
  
  /**
   * 🎯 [핵심] 퀴즈 제출 및 목숨 관리 로직
   */
  async submitAnswer(selectedIndex) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.clearQuizUI();
    if (this.quizTimer) {
        this.quizTimer.remove(false); 
        this.quizTimer = null;
    }

    const isCorrect = selectedIndex === this.currentQuiz.answer;
    const timeTaken = Date.now() - this.quizStartTime;
    const originalNextWaveDelay = 1500; 

    if (isCorrect) {
      this.correctCount++; // 정답 횟수 증가 (스테이지 번호 아님)
      
      // 1. 기본 데미지(점수) 계산 
      let baseDamage = calculateAttackDamage(this.lionLevel, this.currentDifficulty, timeTaken); 
      
      // 💡 난이도별 점수 배율을 적용합니다.
      const difficultyMultipliers = {
          'EASY': 0.8,  // 초급 (80%)
          'MEDIUM': 1.0, // 중급 (100%)
          'HARD': 1.5,   // 고급 (150%)
      };

      const multiplier = difficultyMultipliers[this.currentDifficulty] || 1.0;
      let damage = Math.round(baseDamage * multiplier);

      if (damage <= 0 || isNaN(damage)) {
          console.warn(`⚠️ 최종 데미지(${damage})가 0 이하로 계산됨. 최소 100점 * 배율(${multiplier})을 부여합니다.`);
          damage = Math.round(100 * multiplier);
      }
      
      this.score += damage; 
      this.scoreText.setText(`점수: ${this.score}`);
      
      // 🎯 [수정] 메시지에서 스테이지 정보 제거
      this.showMessage(`✅ 정답! (+${damage} SCORE) (난이도: ${this.currentDifficulty})`);
      await this.performAttack(damage, true); 
      await this.delay(originalNextWaveDelay);

      this.isProcessing = false; 
      this.currentQuiz = null; 
      this.startNextWave();

    } else {
      this.wrongCount++;
      
      this.playerLives--;
      this.updateLivesUI();
      
      this.showMessage(`❌ 오답! 목숨이 1개 줄었습니다. (남은 목숨: ${this.playerLives})`);
      
      await this.animateHurt(this.playerSprite); 

      if (this.playerLives <= 0) {
        this.onDefeat();
        return;
      }
      
      await this.delay(originalNextWaveDelay);

      this.isProcessing = false; 
      this.currentQuiz = null; 
      this.startNextWave();
    }
  }
  
  /**
   * 💡 [핵심 수정] UI 잔상 오류 해결을 위해 요소를 안전하게 필터링 후 파괴합니다.
   */
  clearQuizUI() {
    const elementsToDestroy = this.children.list.filter(child => { 
        return child.getData && child.getData('quizElement') === true;
    });

    elementsToDestroy.forEach(child => {
        if (child.active) {
            child.destroy();
        }
    });
    
    if (this.quizButtons) this.quizButtons = [];
    if (this.quizTimer) {
        this.quizTimer.remove(false); 
        this.quizTimer = null;
    }
  }
  
  // ======================
  // UI/헬퍼 함수 
  // ======================
  
  /**
   * 🎯 [추가] 스테이지 표시 UI 생성
   */
  createStageUI() {
      const width = this.cameras.main.width;
      // 초기값은 0이지만, 첫 로드 시 1로 업데이트될 예정
      this.stageText = this.add.text(width / 2, 80, `스테이지: ${this.stageAttemptCount}`, {
          fontSize: '24px',
          color: '#ffffff',
          fontStyle: 'bold',
          backgroundColor: '#475569',
          padding: { x: 10, y: 5 }
      }).setOrigin(0.5);
  }

  /**
   * 🎯 [추가] 스테이지 번호 증가 및 UI 업데이트
   */
  updateStageDisplay() {
      this.stageAttemptCount++;
      if (this.stageText) {
          this.stageText.setText(`스테이지: ${this.stageAttemptCount}`);
      }
      console.log(`📌 스테이지 번호 업데이트: ${this.stageAttemptCount}`);
  }

  createBackButton(width, height) {
    const backButton = this.add.text(20, 20, '← 포기 (메인 메뉴)', {
      fontSize: '18px',
      color: '#ef4444'
    }).setInteractive({ useHandCursor: true })
      .setDepth(999) 
      .on('pointerdown', () => this.goBackToMainMenu())
      .on('pointerover', () => backButton.setColor('#fca5a5'))
      .on('pointerout', () => backButton.setColor('#ef4444'));
  }

  goBackToMainMenu() {
    window.removeEventListener("finger-count", this.handleGestureInput.bind(this));
    if (this.quizTimer) this.time.removeEvent(this.quizTimer); 
    removeGesture(); 
    this.scene.start('MainMenuScene');
  }

  createCharacters() {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      
      this.playerSprite = this.add.sprite(width / 5, height - 150, this.currentLionKey)
        .setScale(0.3).setOrigin(0.5, 1);
this.bossSprite = this.add.sprite(width * 4 / 5, height - 100, `boss_${this.stageData.id}`)
        .setScale(0.6).setOrigin(0.5, 1);
  }

  createMessageBox() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.messageBox = this.add.rectangle(width / 2, height - 70, width * 0.9, 100, 0x000000, 0.7)
      .setStrokeStyle(4, 0xcccccc);
    this.messageText = this.add.text(width / 2, height - 70, '게임을 시작합니다.', {
      fontSize: '24px',
      color: '#ffffff',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);
  }
  
  showMessage(text) { 
      if (this.messageText) {
          this.messageText.setText(text);
      }
      console.log(`[MSG] ${text}`); 
  }
  
  delay(ms) { return new Promise(resolve => this.time.delayedCall(ms, resolve)); }

  async performAttack(score, isCorrect) {
    const originalX = this.playerSprite.x;
    this.tweens.add({ targets: this.playerSprite, x: originalX + 50, duration: 100, yoyo: true, ease: 'Power1' });
    
    const damageText = isCorrect ? `+${score} SCORE` : `❌ MISS`;
    this.showDamageText(this.bossSprite.x, this.bossSprite.y - 80, damageText, isCorrect ? 0x10b981 : 0xef4444);
    
    this.bossSprite.setTint(0xff0000);
    this.time.delayedCall(150, () => { this.bossSprite.clearTint(); });

    await this.delay(500); 
  }
  
  animateHurt(targetSprite) {
    return new Promise(resolve => {
        this.tweens.add({
            targets: targetSprite,
            alpha: 0.5,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                targetSprite.setAlpha(1);
                targetSprite.clearTint();
                resolve();
            }
        });
    });
  }
  
  playDeathAnimation(targetSprite) {
    return new Promise(resolve => {
        this.tweens.add({
            targets: targetSprite,
            alpha: 0,
            angle: 90,
            scaleY: 0,
            duration: 500,
            onComplete: resolve
        });
    });
  }
  
  showDamageText(x, y, text, color) {
    const damage = this.add.text(x, y, text, {
        fontSize: '30px',
        color: `#${color.toString(16)}`,
        fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
        targets: damage,
        y: y - 50,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            damage.destroy();
        }
    });
  }

  createLifeAndBossUI() {
      const width = this.cameras.main.width;
      const lifePanelX = 250;
      const lifePanelY = 150;
      
      this.scoreText = this.add.text(lifePanelX, lifePanelY - 50, `점수: ${this.score}`, {
          fontSize: '24px',
          color: '#fcd34d',
          fontStyle: 'bold'
      }).setOrigin(0.5);

      this.lifeIcons = [];
      const iconSize = 40;
      const iconGap = 10;
      const totalWidth = (this.maxLives * iconSize) + ((this.maxLives - 1) * iconGap);
      let startX = lifePanelX - totalWidth / 2 + iconSize / 2;

      for (let i = 0; i < this.maxLives; i++) {
          const life = this.add.text(startX + i * (iconSize + iconGap), lifePanelY, '❤️', {
              fontSize: `${iconSize}px`
          }).setOrigin(0.5);
          this.lifeIcons.push(life);
      }
      
      const bossHPBarX = width - 250;
      const bossHPBarY = 150;
      
      this.add.text(bossHPBarX, bossHPBarY, '🛡️ 무한 체력', {
          fontSize: '20px',
          color: '#a5b4fc',
          fontStyle: 'bold'
      }).setOrigin(0.5);
      
      this.add.text(bossHPBarX, bossHPBarY + 30, this.stageData.name, {
          fontSize: '18px',
          color: '#e5e7eb',
      }).setOrigin(0.5);
      
      this.updateLivesUI();
  }
  
  updateLivesUI() {
      this.lifeIcons.forEach((icon, index) => {
          icon.setAlpha(index < this.playerLives ? 1 : 0.2);
      });
  }

  async onDefeat() {
    window.removeEventListener("finger-count", this.handleGestureInput.bind(this));
    this.currentPhase = 'GAME_OVER';
    this.showMessage(`💀 무한 도전 실패! 최종 점수: ${this.score}`);
    await this.playDeathAnimation(this.playerSprite);
    await this.delay(1000);
    this.showFinalResultPanel();
    removeGesture(); 
  }

  showFinalResultPanel() {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setDepth(1000);
      
      this.add.text(width / 2, height / 2 - 100, '🚨 게임 오버 🚨', {
          fontSize: '36px',
          color: '#ef4444',
          fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);

      // 🎯 [수정] 최종 스테이지를 총 시도 횟수(stageAttemptCount)로 변경
      this.add.text(width / 2, height / 2 - 20, `최종 도전 스테이지: ${this.stageAttemptCount}회`, {
          fontSize: '24px',
          color: '#ffffff'
      }).setOrigin(0.5).setDepth(1001);
      
      // 참고용 정답 횟수 표시
      this.add.text(width / 2, height / 2 + 10, `(정답 횟수: ${this.correctCount}회)`, {
          fontSize: '18px',
          color: '#94a3b8'
      }).setOrigin(0.5).setDepth(1001);

      this.add.text(width / 2, height / 2 + 50, `획득 점수: ${this.score}점`, {
          fontSize: '28px',
          color: '#fcd34d',
          fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(1001);
      
      // 메인 메뉴 버튼
      this.add.text(width / 2 - 100, height / 2 + 130, '메인 메뉴', {
          fontSize: '22px',
          color: '#60a5fa',
          backgroundColor: '#1e3a8a',
          padding: { x: 20, y: 10 }
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1001)
        .on('pointerdown', () => this.goBackToMainMenu());

      // 재도전 버튼 위치 조정
      this.add.text(width / 2 + 100, height / 2 + 130, '재도전', {
          fontSize: '22px',
          color: '#10b981',
          backgroundColor: '#064e3b',
          padding: { x: 20, y: 10 }
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1001)
        .on('pointerdown', () => this.scene.restart());
  }
}
