using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

public class PlayerSceneManager : MonoBehaviour
{
    public GameObject[] players;  // 12개 캐릭터
    private string targetSceneName = "ModeSelect";

    void Update()
    {
        if (Keyboard.current == null) return;

        // 스페이스바 입력 체크
        if (Keyboard.current.spaceKey.wasPressedThisFrame)
        {
            foreach (var player in players)
            {
                if (player != null && player.activeInHierarchy)
                {
                    SceneManager.LoadScene(targetSceneName);
                    return; // 첫 활성 플레이어만 처리 후 종료
                }
            }
        }
    }
}
