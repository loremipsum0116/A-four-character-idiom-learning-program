using UnityEngine;

public class CameraFollowPlayerCenter : MonoBehaviour
{
    public Transform player;  // 따라갈 플레이어

    private void LateUpdate()
    {
        if (player == null) return;

        // 플레이어 위치로 카메라 이동, Z축만 유지
        transform.position = new Vector3(player.position.x, player.position.y, transform.position.z);
    }
}
