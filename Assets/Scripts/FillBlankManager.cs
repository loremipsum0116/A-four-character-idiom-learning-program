using UnityEngine;
using TMPro;
using UnityEngine.UI;

public class FillBlankManager : MonoBehaviour
{
    [Header("UI")]
    public TMP_Text problemText;
    public TMP_InputField inputField;
    public TMP_Text timerText;
    public GameObject resultPopup;
    public TMP_Text resultTitle;
    public TMP_Text resultDetail;

    [Header("Data")]
    public Idiom currentProblem;
    public float timeLimit = 10f;

    float timer;
    bool answered = false;

    void Start()
    {
        if (currentProblem == null) Debug.LogWarning("No idiom assigned.");
        LoadProblem();
        timer = timeLimit;
        resultPopup.SetActive(false);
    }

    void Update()
    {
        if (answered) return;

        timer -= Time.deltaTime;
        if (timer < 0) timer = 0;
        timerText.text = "남은 시간: " + timer.ToString("F1") + "초";

        if (timer <= 0) CheckAnswer(false); // 시간 만료 -> 오답 처리
    }

    void LoadProblem()
    {
        if (currentProblem != null)
            problemText.text = currentProblem.question;
    }

    public void OnConfirmButton()
    {
        if (answered) return;
        CheckAnswer(true);
    }

    void CheckAnswer(bool fromConfirm)
    {
        answered = true;
        string user = inputField.text.Trim();
        bool isCorrect = currentProblem != null && user == currentProblem.answer;

        // 결과 팝업 표시
        resultPopup.SetActive(true);
        resultTitle.text = isCorrect ? "정답!" : "오답";
        resultDetail.text = $"정답: {currentProblem.answer}\\n입력: {user}\\n남은시간: {timer:F1}s";

        // 전투 연동 예: CombatSystem에 보고
        CombatSystem.Instance.ReportQuizResult(isCorrect, timeLimit - timer, currentProblem != null ? currentProblem.difficulty : 1);
    }

    // 버튼으로 ResultPopup 닫을 때 호출
    public void OnCloseResult()
    {
        resultPopup.SetActive(false);
        // 씬 전환 또는 다음 문제 로드 등 처리
    }
}
