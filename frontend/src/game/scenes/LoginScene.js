import Phaser from 'phaser';
import { apiClient } from '../../services/APIClient.js';
import { setGuestMode, clearGuestData } from '../../utils/storageManager.js';

/**
 * LoginScene - 로그인/회원가입 씬
 *
 * FR 1.1: 회원가입
 * FR 1.2: 로그인
 */
export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
    this.loginMode = true; // true: 로그인, false: 회원가입
  }

  init() {
    // 로그인 화면 진입 시 이전 게스트 데이터 삭제
    clearGuestData();
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 배경
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d3561);

    // 타이틀
    this.add.text(width / 2, 100, '🦁 사자의 역습', {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 160, '12지신을 물리치고 왕이 되어라!', {
      fontSize: '20px',
      color: '#a5b4fc'
    }).setOrigin(0.5);

    // 로그인 패널
    this.createLoginPanel();

    // 자동 로그인 비활성화 - 사용자가 명시적으로 로그인하도록 함
    // 이전 세션의 토큰이 있어도 로그인 화면을 표시
    /*
    if (apiClient.isAuthenticated()) {
      this.attemptAutoLogin();
    }
    */
  }

  createLoginPanel() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;

    // 모드 타이틀
    this.modeText = this.add.text(centerX, 220, '로그인', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 버튼들 (화면 하단에 배치)
    this.createButtons(centerX, height - 150);

    // HTML 폼 생성 (중앙에 배치)
    this.createHTMLForm();
  }

  createButtons(x, y) {
    // 로그인 버튼
    const loginButton = this.add.rectangle(x - 120, y, 200, 50, 0x667eea)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleLogin())
      .on('pointerover', () => loginButton.setFillStyle(0x818cf8))
      .on('pointerout', () => loginButton.setFillStyle(0x667eea));

    this.add.text(x - 120, y, '로그인', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 회원가입 버튼
    const signupButton = this.add.rectangle(x + 120, y, 200, 50, 0x10b981)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handleSignup())
      .on('pointerover', () => signupButton.setFillStyle(0x34d399))
      .on('pointerout', () => signupButton.setFillStyle(0x10b981));

    this.add.text(x + 120, y, '회원가입', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 게스트 모드 버튼 (테스트용)
    const guestButton = this.add.rectangle(x, y + 80, 200, 40, 0x64748b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.enterGuestMode())
      .on('pointerover', () => guestButton.setFillStyle(0x94a3b8))
      .on('pointerout', () => guestButton.setFillStyle(0x64748b));

    this.add.text(x, y + 80, '게스트로 시작', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 상태 메시지
    this.statusText = this.add.text(x, y + 140, '', {
      fontSize: '16px',
      color: '#fbbf24'
    }).setOrigin(0.5);
  }

  createHTMLForm() {
    // Phaser와 HTML 폼 통합
    // 실제 프로덕션에서는 React 컴포넌트로 대체
    const formHTML = `
      <div id="login-form" style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 1000;
        background: rgba(30, 41, 59, 0.95);
        padding: 25px 30px;
        border-radius: 12px;
        border: 2px solid #667eea;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      ">
        <input type="email" id="email" placeholder="이메일" style="
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid #475569;
          border-radius: 6px;
          width: 320px;
          background: #1e293b;
          color: #ffffff;
          outline: none;
          transition: border-color 0.2s;
        " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#475569'">
        <input type="password" id="password" placeholder="비밀번호" style="
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid #475569;
          border-radius: 6px;
          width: 320px;
          background: #1e293b;
          color: #ffffff;
          outline: none;
          transition: border-color 0.2s;
        " onfocus="this.style.borderColor='#667eea'" onblur="this.style.borderColor='#475569'">
        <input type="text" id="nickname" placeholder="닉네임 (회원가입 시)" style="
          padding: 12px 16px;
          font-size: 16px;
          border: 2px solid #475569;
          border-radius: 6px;
          width: 320px;
          background: #1e293b;
          color: #ffffff;
          outline: none;
          transition: border-color 0.2s;
          display: none;
        " onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#475569'">
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formHTML;
    document.body.appendChild(tempDiv);
  }

  async handleLogin() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
      this.showStatus('이메일과 비밀번호를 입력하세요', '#ef4444');
      return;
    }

    this.showStatus('로그인 중...', '#fbbf24');

    try {
      const response = await apiClient.login(email, password);
      console.log('✅ 로그인 성공:', response);
      this.showStatus('로그인 성공!', '#10b981');

      // 일반 로그인 - 게스트 모드 false
      setGuestMode(false);

      // 메인 메뉴로 이동
      this.time.delayedCall(1000, () => {
        // HTML 폼 제거 (scene 전환 직전)
        this.removeHTMLForm();
        this.scene.start('IntroScene', { user: response.user });
      });
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      this.showStatus('로그인 실패: ' + error.message, '#ef4444');
    }
  }

  async handleSignup() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const nickname = document.getElementById('nickname')?.value;

    // 닉네임 입력 필드 표시
    const nicknameInput = document.getElementById('nickname');
    if (nicknameInput) {
      nicknameInput.style.display = 'block';
    }

    if (!email || !password || !nickname) {
      this.showStatus('모든 필드를 입력하세요', '#ef4444');
      return;
    }

    this.showStatus('회원가입 중...', '#fbbf24');

    try {
      const response = await apiClient.signup(email, password, nickname);
      console.log('✅ 회원가입 성공:', response);
      this.showStatus('회원가입 성공!', '#10b981');

      // 일반 회원가입 - 게스트 모드 false
      setGuestMode(false);

      // 메인 메뉴로 이동
      this.time.delayedCall(1000, () => {
        // HTML 폼 제거 (scene 전환 직전)
        this.removeHTMLForm();
        this.scene.start('IntroScene', { user: response.user });
      });
    } catch (error) {
      console.error('❌ 회원가입 실패:', error);
      this.showStatus('회원가입 실패: ' + error.message, '#ef4444');
    }
  }

  async attemptAutoLogin() {
    this.showStatus('자동 로그인 중...', '#fbbf24');

    try {
      const user = await apiClient.getCurrentUser();
      console.log('✅ 자동 로그인 성공:', user);
      this.showStatus('자동 로그인 성공!', '#10b981');

      // 자동 로그인 - 게스트 모드 false
      setGuestMode(false);

      this.time.delayedCall(1000, () => {
        // HTML 폼 제거 (scene 전환 직전)
        this.removeHTMLForm();
        this.scene.start('IntroScene', { user });
      });
    } catch (error) {
      console.error('❌ 자동 로그인 실패:', error);
      apiClient.logout();
      this.showStatus('다시 로그인하세요', '#fbbf24');
    }
  }

  enterGuestMode() {
    console.log('🎮 게스트 모드로 진입');
    this.showStatus('게스트 모드로 시작합니다', '#10b981');

    // 게스트 모드 플래그 설정
    setGuestMode(true);

    this.time.delayedCall(1000, () => {
      // HTML 폼 제거 (scene 전환 직전)
      this.removeHTMLForm();
      this.scene.start('IntroScene', {
        user: { nickname: '게스트', email: 'guest@example.com' }
      });
    });
  }

  showStatus(message, color) {
    if (this.statusText) {
      this.statusText.setText(message);
      this.statusText.setColor(color);
    }
  }

  removeHTMLForm() {
    // 모든 login-form 관련 요소 제거
    const forms = document.querySelectorAll('#login-form');
    forms.forEach(form => {
      if (form && form.parentElement) {
        form.parentElement.remove();
      }
    });

    // 혹시 남아있을 수 있는 모든 login-form 관련 요소 제거
    const allForms = document.querySelectorAll('[id="login-form"]');
    allForms.forEach(element => {
      element.remove();
    });

    console.log('🗑️ 로그인 폼 제거 완료');
  }

  shutdown() {
    console.log('🔚 LoginScene shutdown');
    this.removeHTMLForm();
  }
}
