import Phaser from "phaser";
import { idioms } from '../../../data/idioms.js';

const WIDTH = 1280;
const HEIGHT = 720;

export const CardType = {
    IDIOM: "IDIOM",
    MEANING: "MEANING"
};

export class Card {
    // Card 클래스에 index 인자를 추가하여 번호를 표시합니다.
    constructor(scene, x, y, content, type, pairId, index) { 
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.content = content;
        this.type = type;
        this.pairId = pairId;
        this.index = index; // 카드의 열 내 인덱스 (0-4)
        this.isSelected = false;
        this.isMatched = false;

        this.rect = scene.add.rectangle(x, y, 400, 80, 0x475569).setStrokeStyle(2, 0x000);
        this.text = scene.add.text(x, y, content, { fontSize: "20px", color: "#ffffff", align: "center", wordWrap: { width: 350 } }).setOrigin(0.5);

        // [제스처 힌트] 카드 좌측 상단에 번호 표시 (1부터 시작)
        scene.add.text(x - 180, y - 30, (index + 1).toString(), {
            fontSize: '18px',
            color: '#94a3b8',
            fontStyle: 'bold'
        });

        this.rect.setInteractive({ useHandCursor: true });
        this.rect.on("pointerup", () => this.handleClick());
        this.onClickCallback = null;
    }

    handleClick() {
        if (this.onClickCallback) this.onClickCallback(this);
    }

    onClick(callback) {
        this.onClickCallback = callback;
    }

    setSelected(selected) {
        if (this.isMatched) return;
        this.isSelected = selected;
        this.rect.setFillStyle(selected ? 0xfbbf24 : 0x475569); 
    }

    setMatched(matched) {
        this.isMatched = matched;
        this.isSelected = false;
        this.rect.setFillStyle(matched ? 0x22c55e : 0x475569); 
        this.text.setColor(matched ? "#ffffff" : "#ffffff");
    }

    destroy() {
        this.rect.destroy();
        this.text.destroy();
    }
}

export default class CardMatchGame extends Phaser.Scene {
    // --- Config / State ---
    maxLives = 3;
    baseScore = 10;
    timeBonus = 10;
    maxTime = 50;

    // [제스처] 분리된 카드 목록 및 제스처 처리 상태 추가
    leftCards = [];
    rightCards = [];
    isProcessingGesture = false; // 제스처 처리 중복 방지

    constructor() {
        super({ key: "CardMatchScene" }); 
    }

    init(data) {
        this.difficulty = data.difficulty || "EASY";
        this.resetGame();
    }

    resetGame() {
        this.score = 0;
        this.lives = this.maxLives;
        this.selectedCards = [];
        this.currentQuestion = 0;
        
        // 카드 목록 초기화
        if (this.allCards) this.allCards.forEach(c => c.destroy());
        this.allCards = [];
        this.leftCards = []; // 추가: 왼쪽 카드 목록
        this.rightCards = []; // 추가: 오른쪽 카드 목록
        
        this.fullIdiomPool = []; 
        this.totalPairs = 10; 
        this.pairsToShow = 5; 
        this.isProcessingGesture = false; // 추가
    }

    preload() {
        this.load.image("cardBack", "/assets/card_back.png");
        this.load.image("cardFront", "/assets/card_front.png");
    }

    create() {
        const headerY = 20;
        const fontConfig = { fontSize: '24px', color: '#fff', fontStyle: 'bold' };
        this.cameras.main.setBackgroundColor("#1e293b");

        // UI
        this.scoreLabel = this.add.text(WIDTH - 150, headerY, '⭐ 0', fontConfig);
        this.livesLabel = this.add.text(WIDTH - 150, headerY + 30, '❤️ 3', fontConfig);
        // 제스처 사용 안내 메시지 추가
        this.feedbackText = this.add.text(WIDTH / 2, 80, "카드를 두 장 선택하세요. (제스처 1~5 사용)", { fontSize: "28px", color: "#fbbf24" }).setOrigin(0.5);

        this.questionCountText = this.add.text(20, headerY + 60, `매칭된 쌍 0/${this.totalPairs}`, fontConfig);

        // 뒤로가기
        this.add.text(20, 20, '← 뒤로', {
            fontSize: '20px',
            color: '#94a3b8'
        }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.time.removeAllEvents();
            this.shutdown(); // 씬 종료 및 이벤트 리스너 제거
            this.scene.start("DifficultySelectScene");
        });

        this.generateCards();
        this.updateUI();

        // [제스처] 전역 이벤트 리스너 등록
        window.addEventListener("finger-count", this.handleFingerCountEvent);
    }

    // [제스처] 전역 이벤트 리스너 핸들러
    handleFingerCountEvent = (e) => {
        if (this.isProcessingGesture) return;
        
        const count = Number(e.detail.count); // 1~5 손가락 개수

        // 1부터 5까지의 손가락 제스처만 처리
        if (count >= 1 && count <= this.pairsToShow) {
            this.isProcessingGesture = true;
            const index = count - 1; // 배열 인덱스 (0~4)

            let cardToSelect = null;
            
            // 1. 선택된 카드가 없을 때: 좌측(IDIOM) 카드 선택 시도
            if (this.selectedCards.length === 0) {
                cardToSelect = this.leftCards[index];
            } 
            // 2. 한 장이 이미 선택된 상태일 때: 우측(MEANING) 카드 선택 시도
            else if (this.selectedCards.length === 1) {
                cardToSelect = this.rightCards[index];
            }
            
            // 유효한 카드가 있고, 아직 매칭되지 않았고, 선택된 카드가 아닐 경우에만 처리
            if (cardToSelect && !cardToSelect.isMatched && !cardToSelect.isSelected) {
                console.log(`Gesture selected card ${count} in ${cardToSelect.type} column.`);
                this.onCardSelected(cardToSelect);
            }
            
            // 짧은 지연 후 재활성화하여 다음 제스처를 받습니다. (중복 처리 방지)
            this.time.delayedCall(300, () => {
                this.isProcessingGesture = false;
            });
        }
    }

    generateCards() {
        // ... (기존 카드 데이터 준비 로직)
        const pairCount = this.totalPairs; 

        if (this.fullIdiomPool.length === 0) {
            const idiomPool = idioms.filter(i => i.difficulty === this.difficulty);
            Phaser.Utils.Array.Shuffle(idiomPool);
            this.fullIdiomPool = idiomPool.slice(0, pairCount);
        }

        const selectedIdioms = this.fullIdiomPool.slice(0, this.pairsToShow);

        const leftCardsData = [];
        const rightCardsData = [];

        selectedIdioms.forEach(idiom => {
            leftCardsData.push({ content: `${idiom.hangul}\n${idiom.hanja.join('')}`, pairId: idiom.idiomId });
            rightCardsData.push({ content: idiom.meaning, pairId: idiom.idiomId });
        });

        Phaser.Utils.Array.Shuffle(leftCardsData);
        Phaser.Utils.Array.Shuffle(rightCardsData);
        
        const startX_Left = 300; 
        const startX_Right = WIDTH - 300; 
        const startY = 200; 
        const spacingY = 100; 

        this.leftCards = [];
        this.rightCards = [];

        //좌측 카드 (IDIOM)
        leftCardsData.forEach((data, idx) => {
            const x = startX_Left; 
            const y = startY + idx * spacingY; 

            // Card 생성자에 index 전달
            const card = new Card(this, x, y, data.content, CardType.IDIOM, data.pairId, idx);
            card.onClick(this.onCardSelected.bind(this));
            this.allCards.push(card);
            this.leftCards.push(card); // leftCards 배열에 저장
        });

        //우측 카드 (MEANING)
        rightCardsData.forEach((data, idx) => {
            const x = startX_Right; 
            const y = startY + idx * spacingY; 

            // Card 생성자에 index 전달
            const card = new Card(this, x, y, data.content, CardType.MEANING, data.pairId, idx);
            card.onClick(this.onCardSelected.bind(this));
            this.allCards.push(card);
            this.rightCards.push(card); // rightCards 배열에 저장
        });
    }

    onCardSelected(card) {
        //이미 매칭된 카드면 무시
        if (card.isMatched) return;

        //선택 취소 기능 (마우스 클릭에 대해서만 유지)
        if (card.isSelected) {
            if (this.selectedCards.includes(card)) {
                card.setSelected(false);
                this.selectedCards = this.selectedCards.filter(c => c !== card);
            }
            return;
        }

        //이미 다른 카드 한 장 선택된 상태라면 타입 체크
        if (this.selectedCards.length === 1) {
            const firstCard = this.selectedCards[0];

            //같은 타입 카드 선택 → 안내 메시지 (마우스/제스처 모두 적용)
            if (firstCard.type === card.type) {
                firstCard.setSelected(false);           
                this.selectedCards = [];                
                this.feedbackText.setText('같은 타입 카드입니다. 다시 선택하세요.').setColor('#facc15');

                // 1.5초 뒤 안내 텍스트 사라짐
                this.time.delayedCall(1500, () => {
                    this.feedbackText.setText("카드를 두 장 선택하세요. (제스처 1~5 사용)").setColor("#fbbf24");
                });
                return;
            }
        }

        //카드 선택
        card.setSelected(true);
        this.selectedCards.push(card);

        //두 장 선택되면 매칭 체크
        if (this.selectedCards.length === 2) {
            this.time.delayedCall(500, () => this.checkMatch());
        }
    }


    checkMatch() {
        const [card1, card2] = this.selectedCards;

        if (card1.pairId === card2.pairId) {
            card1.setMatched(true);
            card2.setMatched(true);

            const earnedScore = 10;
            this.score += earnedScore;

            this.feedbackText.setText(`✅ 매칭 성공! (+${earnedScore}점)`).setColor('#22c55e').setVisible(true);
        } else {
            card1.setSelected(false);
            card2.setSelected(false);
            this.lives--;
            this.feedbackText.setText(`❌ 매칭 실패!`).setColor('#ef4444').setVisible(true);
        }

        this.selectedCards = [];
        this.currentQuestion++; // 매칭 시도 횟수
        this.updateUI();
        
        // 피드백 메시지 1.5초 후 초기화 및 게임 종료 체크
        this.time.delayedCall(1500, () => {
             this.feedbackText.setText("카드를 두 장 선택하세요. (제스처 1~5 사용)").setColor("#fbbf24");
             this.checkGameEnd();
        });
    }


    updateUI() {
        this.scoreLabel.setText(`⭐ ${this.score}`);
        const livesDisplay = '❤️'.repeat(this.lives) + '🤍'.repeat(this.maxLives - this.lives);
        this.livesLabel.setText(`목숨 ${livesDisplay}`);

        const totalMatchedPairs = this.allCards.filter(c => c.isMatched).length / 2;
        this.questionCountText.setText(`매칭된 쌍 ${totalMatchedPairs}/${this.totalPairs}`);
    }


    checkGameEnd() {
        const allMatchedOnScreen = this.allCards.every(c => c.isMatched);
        const gameOver = this.lives <= 0;

        if (allMatchedOnScreen) {
            this.fullIdiomPool.splice(0, this.pairsToShow);
            
            if (this.fullIdiomPool.length > 0) {
                // 다음 라운드 시작
                this.feedbackText.setText(`👍 5쌍 완료! 다음 라운드 시작!`).setColor('#7dd3fc');
                this.time.delayedCall(1500, () => {
                    this.allCards.forEach(c => c.destroy()); 
                    this.allCards = [];
                    this.leftCards = [];
                    this.rightCards = [];
                    this.currentQuestion = 0; 
                    this.updateUI(); 
                    this.generateCards(); 
                    this.feedbackText.setText("카드를 두 장 선택하세요. (제스처 1~5 사용)").setColor("#fbbf24");
                });
                return; 
            }
        }

        //전체 10쌍 완료 또는 게임 오버
        if (this.fullIdiomPool.length === 0 || gameOver) {
            const allMatched = (this.fullIdiomPool.length === 0);
            
            this.feedbackText.setText(allMatched ? `🎉 게임 클리어! 최종 점수: ${this.score}점` : `💀 게임 오버! 최종 점수: ${this.score}점`);
            
            this.time.delayedCall(3000, () => {
                this.resetGame();
                this.scene.start("DifficultySelectScene");
            });
        }
    }
    
    // [제스처] 씬 종료 시 이벤트 리스너 제거
    shutdown() {
        console.log('CardMatchGame shutdown. Removing finger-count listener.');
        window.removeEventListener('finger-count', this.handleFingerCountEvent);
        this.resetGame(); // cleanup
    }
}