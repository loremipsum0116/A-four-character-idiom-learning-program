import Phaser from "phaser";
import { idioms } from '../../../data/idioms.js';

const WIDTH = 1280;
const HEIGHT = 720;

export const CardType = {
    IDIOM: "IDIOM",
    MEANING: "MEANING"
};

export class Card {
    constructor(scene, x, y, content, type, pairId) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.content = content;
        this.type = type;
        this.pairId = pairId;
        this.isSelected = false;
        this.isMatched = false;

        this.rect = scene.add.rectangle(x, y, 400, 80, 0x475569).setStrokeStyle(2, 0x000);
        this.text = scene.add.text(x, y, content, { fontSize: "20px", color: "#ffffff", align: "center", wordWrap: { width: 350 } }).setOrigin(0.5);

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
        this.rect.setFillStyle(selected ? 0xfbbf24 : 0x475569); // 선택시 노란색
    }

    setMatched(matched) {
        this.isMatched = matched;
        this.isSelected = false;
        this.rect.setFillStyle(matched ? 0x22c55e : 0x475569); // 성공: 초록, 기본: 회색
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
        if (this.allCards) this.allCards.forEach(c => c.destroy());
        this.allCards = [];
        
        this.fullIdiomPool = []; 
        this.totalPairs = 10; 
        this.pairsToShow = 5; 
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
        this.feedbackText = this.add.text(WIDTH / 2, 80, "카드를 두 장 선택하세요.", { fontSize: "28px", color: "#fbbf24" }).setOrigin(0.5);

        this.questionCountText = this.add.text(20, headerY + 60, `문제 0/5`, fontConfig);

        // 뒤로가기
        this.add.text(20, 20, '← 뒤로', {
            fontSize: '20px',
            color: '#94a3b8'
        }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.time.removeAllEvents();
            this.allCards.forEach(c => c.destroy());
            this.scene.start("DifficultySelectScene");
        });

        this.generateCards();
        this.updateUI();
    }

    generateCards() {
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

        //좌측 카드
        leftCardsData.forEach((data, idx) => {
            const x = startX_Left; 
            const y = startY + idx * spacingY; 

            const card = new Card(this, x, y, data.content, CardType.IDIOM, data.pairId);
            card.onClick(this.onCardSelected.bind(this));
            this.allCards.push(card);
        });

        //우측 카드
        rightCardsData.forEach((data, idx) => {
            const x = startX_Right; 
            const y = startY + idx * spacingY; 

            const card = new Card(this, x, y, data.content, CardType.MEANING, data.pairId);
            card.onClick(this.onCardSelected.bind(this));
            this.allCards.push(card);
        });
    }

    onCardSelected(card) {
    //이미 매칭된 카드면 무시
    if (card.isMatched) return;

    //선택 취소 기능
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

        //같은 타입 카드 선택 → 안내 메시지
        if (firstCard.type === card.type) {
            firstCard.setSelected(false);           // 이전 카드 선택 취소
            this.selectedCards = [];                // 선택 배열 초기화
            this.feedbackText.setText('같은 타입 카드입니다. 다시 선택하세요.').setColor('#facc15');

            //10초 뒤 안내 텍스트 사라짐
            this.time.delayedCall(10000, () => {
                this.feedbackText.setText('');
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
    this.currentQuestion++; // 문제 번호 증가
    this.updateUI();
    this.checkGameEnd();
}


    updateUI() {
    this.scoreLabel.setText(`⭐ ${this.score}`);
    const livesDisplay = '❤️'.repeat(this.lives) + '🤍'.repeat(this.maxLives - this.lives);
    this.livesLabel.setText(`목숨 ${livesDisplay}`);

    const totalMatchedPairs = this.totalPairs - this.fullIdiomPool.length;
    this.questionCountText.setText(`문제 ${totalMatchedPairs}/${this.totalPairs}`);
}


    checkGameEnd() {
        const allMatchedOnScreen = this.allCards.every(c => c.isMatched);
        const gameOver = this.lives <= 0;

        if (allMatchedOnScreen) {
            
            this.fullIdiomPool.splice(0, this.pairsToShow);
            
            if (this.fullIdiomPool.length > 0) {

                this.feedbackText.setText(`👍 5쌍 완료! 다음 라운드 시작!`).setColor('#7dd3fc');
                this.time.delayedCall(1500, () => {
                    this.allCards.forEach(c => c.destroy()); 
                    this.allCards = [];
                    this.currentQuestion = 0; 
                    this.updateUI(); 
                    this.generateCards(); 
                    this.feedbackText.setText('');
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
}