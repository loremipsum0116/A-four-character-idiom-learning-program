using System.Collections.Generic;

[System.Serializable]
public class StageResultData
{
    public int stageId;

    public float stageClearTimeSec;   // 스테이지 클리어 총 시간
    public int totalQuestions;        // 문제 수
    public int wrongAnswers;          // 오답 수
    public List<float> responseTimes; // 각 문제 응답 시간(ms 또는 sec)

    public int maxHp;                 // 스테이지 시작 HP
    public List<int> hpHistory;       // 턴마다의 HP 값 (시작값 포함)
}
/*결과 데이터 담을 클래스
