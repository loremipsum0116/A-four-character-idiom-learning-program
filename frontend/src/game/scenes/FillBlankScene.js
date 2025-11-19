import Phaser from 'phaser';
import { idioms } from '../../data/idioms.js';

const IDIOMS_DATA = idioms; 

// 난이도 매핑
const DIFFICULTY_MAP = {
    'EASY': 'EASY', 
    'MEDIUM': 'MEDIUM', 
    'HARD': 'HARD' 
};

export default class FillBlankScene extends Phaser.Scene {
    // --- Configuration & State ---
    maxLives = 3; 
    baseScore = 10;
    timeBonus = 10; 
    hintPenalty = 5; 
    maxTime = 50; 
    maxQuestions = 5; 

    _idiomPool = []; 
    _currentIdiom = null; 
    _currentChoices = [];
    _correctAnswer = '';
    _blankPosition = -1; 
    _currentLives = 0;
    _currentScore = 0; 
    _timeRemaining = 0;
    _isGameActive = false; 
    _hintUsed = false;
    _currentQuestionNumber = 0; 
    difficulty = 'EASY'; 

    // UI Reference
    timerText;
    scoreLabel;
    livesLabel; 
    levelText;
    questionCountText; 
    idiomText;
    hangulText; 
    meaningText; 
    feedbackText;
    choiceButtons = []; 
    hintButton;
    
    constructor() {
        super({ key: 'FillBlankScene' });
    }

    init(data) {
        if (data && data.difficulty) {
            this.difficulty = data.difficulty; 
        }
    }

    // --- Phaser Lifecycle Methods ---
    create() {
        this.cameras.main.setBackgroundColor('#1e293b'); 
        this.setupUI();

        // 초기 게임 상태
        this._currentLives = this.maxLives;
        this._currentScore = 0;
        this._currentQuestionNumber = 0;
        this._isGameActive = false; 
        
        this.updateUI();
        this.loadIdiomsAndStartGame();
    }

    update(time, delta) {
        if (this._isGameActive) {
            this._timeRemaining -= delta / 1000;
            if (this._timeRemaining <= 0) {
                this._timeRemaining = 0;
                this.handleTimeout();
            }
            this.updateTimerDisplay();
        }
    }

    // --- Game Logic ---
    loadIdiomsAndStartGame() {
        const requiredDifficulty = DIFFICULTY_MAP[this.difficulty];
        let filteredIdioms = IDIOMS_DATA.filter(idiom => idiom.difficulty === requiredDifficulty);

        if (filteredIdioms.length === 0) {
            this.feedbackText.setText(`데이터 로드 실패: 난이도 '${this.difficulty}' 데이터가 없습니다.`);
            return;
        }

        this._idiomPool = Phaser.Utils.Array.Shuffle(filteredIdioms);
        this.maxQuestions = Math.min(this.maxQuestions, this._idiomPool.length); 
        
        this.loadNextQuestion();
    }

    loadNextQuestion() {
        

        if (this._currentQuestionNumber >= this.maxQuestions || this._idiomPool.length === 0) {
            // 바로 endGame 호출하지 말고 allMatched/gameOver처럼 처리
            const allQuestionsDone = this._currentQuestionNumber >= this.maxQuestions;
            const gameOver = this._currentLives <= 0;

            if (allQuestionsDone || gameOver) {
                const message = allQuestionsDone 
                    ? `🎉 게임 클리어! 최종 점수: ${this._currentScore}점` 
                    : `💀 게임 오버! 최종 점수: ${this._currentScore}점`;
            
                this.feedbackText.setText(message).setFontSize('36px').setColor(allQuestionsDone ? '#60a5fa' : '#ef4444').setVisible(true);
                this.idiomText.setText('GAME OVER');
                this.hangulText.setText('');
                this.meaningText.setVisible(false);
                this.questionCountText.setVisible(false);
                this.timerText.setVisible(false);

                this.time.delayedCall(3000, () => {
                this.resetGame();
                this.scene.start("DifficultySelectScene");
            });

                return;
            }

            this.endGame();
            return;
        }

        this._currentQuestionNumber++;
        this._currentIdiom = this._idiomPool.shift();

        const hanjaArray = this._currentIdiom.hanja; 
        this._blankPosition = Phaser.Math.Between(0, hanjaArray.length - 1); 
        this._correctAnswer = hanjaArray[this._blankPosition]; 
        this._hintUsed = false;

        const displayHanja = hanjaArray.map((char, index) => index === this._blankPosition ? '?' : char).join('');
        this.idiomText.setText(displayHanja);

        this.hangulText.setText(this._currentIdiom.hangul);
        this.meaningText.setText(`뜻: ${this._currentIdiom.meaning}`).setVisible(false);
        this.feedbackText.setText('').setVisible(false);
        this.questionCountText.setText(`문제 ${this._currentQuestionNumber}/${this.maxQuestions}`);

        // 힌트 버튼 초기화
        if (this.hintButton) {
            if (this.difficulty === 'EASY') {
                this.hintButton.setVisible(true).setAlpha(1).setInteractive(true);
            } else {
                this.hintButton.setVisible(false);
            }
        }

        this.generateAndDisplayChoices(IDIOMS_DATA); 

        this._timeRemaining = this.maxTime;
        this.updateTimerDisplay();
        this.enableChoices(true);
        this._isGameActive = true; 
    }

    generateAndDisplayChoices(fullData) {
        const correctHanja = this._correctAnswer;
        const allPossibleBlanks = [];

        fullData.forEach(idiom => {
            idiom.hanja.forEach(char => {
                allPossibleBlanks.push(char);
            });
        });

        let incorrectChoices = Phaser.Utils.Array.Shuffle(Array.from(new Set(allPossibleBlanks.filter(h => h !== correctHanja))));
        incorrectChoices = incorrectChoices.slice(0, 3); 

        this._currentChoices = Phaser.Utils.Array.Shuffle([correctHanja, ...incorrectChoices]);

        this.choiceButtons.forEach((choice, index) => {
            choice.text.setText(this._currentChoices[index] || ' '); 
            choice.rect.fillColor = 0x475569; 
            choice.rect.setStrokeStyle(0);
            choice.text.setColor('#ffffff');
            choice.rect.setAlpha(1);
            choice.rect.input.enabled = true;
        });
    }

    handleChoice(choiceIndex) {
        if (!this._isGameActive) return;
        this._isGameActive = false; 
        this.enableChoices(false); 

        const selectedHanja = this._currentChoices[choiceIndex];
        const choiceButton = this.choiceButtons[choiceIndex];
        const isCorrect = selectedHanja === this._correctAnswer;

        if (isCorrect) {
            choiceButton.rect.fillColor = 0x22c55e; 
            this.handleCorrectAnswer();
        } else {
            choiceButton.rect.fillColor = 0xef4444; 
            this.handleIncorrectAnswer();
            const correctIndex = this._currentChoices.indexOf(this._correctAnswer);
            if (correctIndex !== -1) {
                 this.choiceButtons[correctIndex].rect.fillColor = 0x60a5fa; 
            }
        }

        this.time.delayedCall(1500, () => {
             if (this._currentLives <= 0) {
                 this.endGame(true);
                 return;
             }
             this.loadNextQuestion();
        }, [], this);
    }

    handleCorrectAnswer() {
        let earnedScore = this.baseScore;
        if (this._hintUsed) {
            earnedScore = this.difficulty === 'EASY' ? this.baseScore : 5; 
        } else {
            earnedScore += Math.floor(Math.max(0, this._timeRemaining) / 5) * this.timeBonus;
        }
        
        this._currentScore += earnedScore;
        this.updateUI();

        this.idiomText.setText(this._currentIdiom.hanja.join('')); 
        this.feedbackText.setText(`✅ 정답! (+${earnedScore}점)`).setColor('#22c55e').setVisible(true);
    }

    handleIncorrectAnswer() {
        this._currentLives--;
        this.updateUI();
        this.feedbackText.setText(`❌ 오답! 정답: ${this._correctAnswer}`).setColor('#ef4444').setVisible(true);
        this.idiomText.setText(this._currentIdiom.hanja.join('')); 
    }

    handleTimeout() {
        this._isGameActive = false; 
        this.enableChoices(false);
        this._currentLives--;
        this.updateUI();

        this.feedbackText.setText(`⏰ 시간 초과! 정답: ${this._correctAnswer}`).setColor('#fbbf24').setVisible(true);
        this.idiomText.setText(this._currentIdiom.hanja.join(''));

        this.time.delayedCall(1500, () => {
            if (this._currentLives <= 0) {
                this.endGame(true);
                return;
            }
            this.loadNextQuestion();
        }, [], this);
    }

    showHint() {
        if (this._hintUsed) return;
        this._hintUsed = true;

        // EASY 난이도는 패널티 없음
        if (this.difficulty !== 'EASY') {
            this._currentScore = Math.max(0, this._currentScore - this.hintPenalty);
        }

        this.meaningText.setVisible(true); 
        if (this.hintButton) {
            this.hintButton.setAlpha(0.5).setInteractive(false); 
        }
        this.updateUI();
    }

    endGame(isLost = false) {
        this._isGameActive = false;
        this.time.removeAllEvents();
        this.choiceButtons.forEach(choice => choice.rect.removeAllListeners());
        this.choiceButtons = [];
        if (this.hintButton) this.hintButton.removeAllListeners();
        if (this.hintButton) this.hintButton.setVisible(false);
    
        // 난이도 선택 씬으로 이동
        this.time.delayedCall(500, () => {
            this.scene.start('DifficultySelectScene', { finalScore: this._currentScore });
        });
    }


    // --- UI ---
    setupUI() {
        const headerY = 30;
        const fontConfig = { fontSize: '24px', color: '#fff', fontStyle: 'bold' };
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, 80, '사자성어 빈칸 채우기', { 
            fontSize: '32px', 
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scoreLabel = this.add.text(width - 150, headerY, '⭐ 0', fontConfig);
        this.livesLabel = this.add.text(width - 150, headerY + 30, '❤️ 5', fontConfig);

        const difficultyLabel = this.difficulty === 'EASY' ? '초급' : this.difficulty === 'MEDIUM' ? '중급' : '고급';
        this.levelText = this.add.text(20, headerY, `레벨 ${difficultyLabel}`, fontConfig);
        this.questionCountText = this.add.text(20, headerY + 30, `문제 0/${this.maxQuestions}`, fontConfig);

        this.timerText = this.add.text(width / 2, 140, `남은 시간: ${this.maxTime}초`, { 
            fontSize: '28px', 
            color: '#fbbf24',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const idiomY = height / 2 - 120;
        this.idiomText = this.add.text(width / 2, idiomY, '----', { 
            fontSize: '90px', 
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.hangulText = this.add.text(width / 2, idiomY + 90, '독음 표시', { 
            fontSize: '32px', 
            color: '#94a3b8' 
        }).setOrigin(0.5);

        this.meaningText = this.add.text(width / 2, idiomY + 140, '뜻: 사자성어의 뜻이 여기에 표시됩니다.', { 
            fontSize: '26px', 
            color: '#fbbf24',
            wordWrap: { width: width - 200 }
        }).setOrigin(0.5).setVisible(false);

        this.feedbackText = this.add.text(width / 2, idiomY + 220, '문제를 로드 중...', { 
            fontSize: '30px', 
            color: '#22c55e',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.createChoiceButtons();

        // 힌트 버튼 (초급에서만 표시, 뒤로가기와 겹치지 않도록 위치 조정)
        if (this.difficulty === 'EASY') {
            this.hintButton = this.add.text(120, height - 60, '💡 힌트 보기', {
                fontSize: '20px',
                color: '#38bdf8'
            }).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showHint());
        }

        this.add.text(20, height - 60, '← 뒤로', {
            fontSize: '20px',
            color: '#94a3b8'
        }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.time.removeAllEvents();
            this.choiceButtons.forEach(choice => choice.rect.removeAllListeners());
            this.choiceButtons = [];
            if (this.hintButton) this.hintButton.removeAllListeners();
            this.scene.start('DifficultySelectScene');
        });

    }

    createChoiceButtons() {
         this.choiceButtons.forEach(choice => {
        choice.rect.destroy();
        choice.text.destroy();
    });
    this.choiceButtons = [];
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const buttonWidth = 200;
        const buttonHeight = 70;
        const gap = 40; 
        const totalWidth = 4 * buttonWidth + 3 * gap;
        const startX = width / 2 - totalWidth / 2 + buttonWidth / 2;
        const startY = height - 150;

        for (let i = 0; i < 4; i++) {
            const x = startX + i * (buttonWidth + gap);

            const rect = this.add.rectangle(x, startY, buttonWidth, buttonHeight, 0x475569, 1)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.handleChoice(i));

            const text = this.add.text(x, startY, '漢', { 
                fontSize: '40px', 
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.choiceButtons.push({ rect, text, index: i });
        }
    }

    enableChoices(enable) {
        this.choiceButtons.forEach(choice => {
            choice.rect.input.enabled = enable;
            choice.rect.setAlpha(enable ? 1 : 0.7);
        });
    }

    updateUI() {
        this.scoreLabel.setText(`⭐ ${this._currentScore}`);
        const livesDisplay = '❤️'.repeat(this._currentLives) + '🤍'.repeat(this.maxLives - this._currentLives);
        this.livesLabel.setText(`목숨 ${livesDisplay}`);
        this.questionCountText.setText(`문제 ${this._currentQuestionNumber}/${this.maxQuestions}`);
    }

    updateTimerDisplay() {
        const time = Math.max(0, this._timeRemaining).toFixed(0);
        this.timerText.setText(`남은 시간: ${time}초`);
        this.timerText.setColor(this._timeRemaining < 10 && this._isGameActive ? '#ef4444' : '#fbbf24');
    }
}
