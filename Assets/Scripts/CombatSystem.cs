using UnityEngine;

public class CombatSystem : MonoBehaviour
{
    public static CombatSystem Instance;
    public int playerHP = 100;
    public int enemyHP = 100;

    void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    // 빈칸/카드 결과 공통 보고 인터페이스
    public void ReportQuizResult(bool isCorrect, float timeUsed, int difficulty)
    {
        int damage = CalculateDamage(isCorrect, timeUsed, difficulty);
        ApplyDamageToEnemy(damage);
        Debug.Log($"ReportQuizResult → correct:{isCorrect} time:{timeUsed} difficulty:{difficulty} damage:{damage}");
    }

    public void ReportCardMatchResult(bool isCorrect, float timeUsed, int difficulty)
    {
        // same handling for now
        ReportQuizResult(isCorrect, timeUsed, difficulty);
    }

    int CalculateDamage(bool isCorrect, float timeUsed, int difficulty)
    {
        if (!isCorrect) return 0;

        // 예시 공식: baseDamage * difficultyMultiplier * speedMultiplier
        int baseDamage = 10;
        float difficultyMultiplier = 1f + (difficulty - 1) * 0.5f; // 초급1->1.0, 중급2->1.5, 고급3->2.0
        float speedMultiplier = Mathf.Clamp(1.5f - (timeUsed / 10f), 0.5f, 1.5f); // 빨리 풀수록 증가

        int dmg = Mathf.RoundToInt(baseDamage * difficultyMultiplier * speedMultiplier);
        return dmg;
    }

    void ApplyDamageToEnemy(int dmg)
    {
        enemyHP -= dmg;
        if (enemyHP < 0) enemyHP = 0;
        // TODO: 갱신 UI 호출
    }
}
