/**
 * 스토리지 관리 유틸리티
 * 게스트 모드: sessionStorage (브라우저 탭 닫으면 자동 삭제)
 * 일반 모드: localStorage (영구 저장)
 */

/**
 * 게스트 모드 여부 확인
 */
export function isGuestMode() {
  return localStorage.getItem('isGuestMode') === 'true';
}

/**
 * 게스트 모드 설정
 */
export function setGuestMode(isGuest) {
  localStorage.setItem('isGuestMode', isGuest.toString());
}

/**
 * 게임 진행 상황 저장
 * 게스트: sessionStorage, 일반: localStorage
 */
export function saveGameData(key, value) {
  if (isGuestMode()) {
    sessionStorage.setItem(key, value);
    console.log(`💾 [게스트] ${key} 저장 (세션): ${value}`);
  } else {
    localStorage.setItem(key, value);
    console.log(`💾 [회원] ${key} 저장 (영구): ${value}`);
  }
}

/**
 * 게임 진행 상황 로드
 * 게스트: sessionStorage, 일반: localStorage
 */
export function loadGameData(key, defaultValue = null) {
  let value;

  if (isGuestMode()) {
    value = sessionStorage.getItem(key);
  } else {
    value = localStorage.getItem(key);
  }

  return value !== null ? value : defaultValue;
}

/**
 * 게스트 모드 데이터 전체 삭제
 */
export function clearGuestData() {
  console.log('🗑️ 게스트 데이터 삭제');

  // sessionStorage 전체 삭제
  sessionStorage.clear();

  // 게스트 모드 플래그도 삭제
  localStorage.removeItem('isGuestMode');
}

/**
 * 게임 데이터 초기화 (게스트/일반 모두)
 */
export function resetGameData() {
  console.log('🔄 게임 데이터 초기화');

  if (isGuestMode()) {
    sessionStorage.removeItem('maxClearedStage');
    sessionStorage.removeItem('maxLionLevel');
  } else {
    localStorage.removeItem('maxClearedStage');
    localStorage.removeItem('maxLionLevel');
  }
}
