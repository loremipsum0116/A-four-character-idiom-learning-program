using UnityEngine;

#if UNITY_EDITOR
[ExecuteInEditMode]
#endif
public class HorizontalTiler : MonoBehaviour
{
    public float spacing = 0f; // 이미지 사이 간격 (원하면 0)
    void Update()
    {
        // 자식으로 있는 SpriteRenderer들을 가져옴 (순서는 Hierarchy 순서를 따름)
        SpriteRenderer[] srs = GetComponentsInChildren<SpriteRenderer>();

        float x = 0f;
        for (int i = 0; i < srs.Length; i++)
        {
            SpriteRenderer sr = srs[i];
            if (sr == null) continue;

            // sprite의 월드 폭 (bounds는 scale 영향 포함)
            float width = sr.bounds.size.x;

            // pivot이 center일 때: localPosition.x를 (x + width/2)
            // 먼저 부모가 (0,0)이라 가정. 자식의 localPosition 사용.
            Vector3 localPos = sr.transform.localPosition;
            localPos.x = x + width * 0.5f;
            localPos.y = 0f;
            sr.transform.localPosition = localPos;

            // 다음 x 시작위치는 현재 끝 + spacing
            x += width + spacing;
        }
    }
}
