using System.Collections.Generic;
using UnityEngine;
using TMPro;

/// <summary>
/// 스테이지 결과창에서 텍스트(클리어 시간, 오답률, 평균 응답시간)와
/// HP 변화 꺾은선 그래프를 그려주는 스크립트
/// </summary>
public class StageResultView : MonoBehaviour
{
    [Header("Text UI")]
    public TextMeshProUGUI clearTimeText;
    public TextMeshProUGUI wrongRateText;
    public TextMeshProUGUI avgResponseTimeText;

    [Header("Graph UI")]
    public RectTransform graphArea;   // 그래프가 그려질 패널(RectTransform)
    public LineRenderer lineRenderer; // HP 꺾은선 그래프용

    [Header("그래프 옵션")]
    public float graphPadding = 20f;  // 그래프 테두리 여백(px)

    /// <summary>
    /// GameManager 등에서 스테이지 종료 시 호출해주면 됨
    /// </summary>
    public void Show(StageResultData data)
    {
        if (data == null)
        {
            Debug.LogError("StageResultData is null");
            return;
        }

        // 1) 텍스트 세팅
        SetTextStats(data);

        // 2) HP 꺾은선 그래프 그리기
        DrawHpGraph(data);
    }

    #region Text 표시

    void SetTextStats(StageResultData data)
    {
        // 스테이지 클리어 시간
        clearTimeText.text = $"클리어 시간: {data.stageClearTimeSec:F1}초";

        // 오답률
        float wrongRate = 0f;
        if (data.totalQuestions > 0)
        {
            wrongRate = (float)data.wrongAnswers / data.totalQuestions * 100f;
        }
        wrongRateText.text = $"오답률: {wrongRate:F1}%";

        // 평균 응답 시간 (responseTimes 단위가 sec라고 가정)
        float avgResp = 0f;
        if (data.responseTimes != null && data.responseTimes.Count > 0)
        {
            float sum = 0f;
            foreach (var t in data.responseTimes)
                sum += t;

            avgResp = sum / data.responseTimes.Count;
        }
        // ms 단위면 여기서 *1000 또는 텍스트 표시만 바꾸면 됨
        avgResponseTimeText.text = $"평균 응답 시간: {avgResp:F2}초";
    }

    #endregion

    #region HP 그래프

    void DrawHpGraph(StageResultData data)
    {
        if (lineRenderer == null || graphArea == null)
        {
            Debug.LogError("Graph components not assigned");
            return;
        }

        List<int> hpList = data.hpHistory;
        if (hpList == null || hpList.Count < 2 || data.maxHp <= 0)
        {
            // 그릴 데이터가 없으면 라인 숨김
            lineRenderer.positionCount = 0;
            return;
        }

        int count = hpList.Count;
        lineRenderer.positionCount = count;

        // 그래프 영역 크기 (내부에서 padding 제외)
        Rect rect = graphArea.rect;
        float width = rect.width - graphPadding * 2f;
        float height = rect.height - graphPadding * 2f;

        // x는 턴 인덱스 기준으로 0~1 정규화
        // y는 HP / maxHp 기준으로 0~1 정규화
        for (int i = 0; i < count; i++)
        {
            float t = (count == 1) ? 0f : (float)i / (count - 1);   // 0~1
            float normalizedHp = Mathf.Clamp01((float)hpList[i] / data.maxHp);

            float x = -width / 2f + t * width;
            float y = -height / 2f + normalizedHp * height;

            // 그래프 영역의 로컬 좌표 → 월드 좌표
            Vector3 localPos = new Vector3(
                x + Mathf.Sign(x) * 0f,  // 필요하면 보정
                y,
                0f
            );
            Vector3 worldPos = graphArea.TransformPoint(localPos);

            lineRenderer.SetPosition(i, worldPos);
        }
    }

    #endregion
}
/* 결과창 UI + 그래프
