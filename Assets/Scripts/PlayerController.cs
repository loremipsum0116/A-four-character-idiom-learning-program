using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 10f;
    private Rigidbody2D rb;
    private Vector2 movement;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        movement = Vector2.zero;

        if (Keyboard.current != null)
        {
            if (Keyboard.current.leftArrowKey.isPressed) movement.x = -1;
            if (Keyboard.current.rightArrowKey.isPressed) movement.x = 1;
            if (Keyboard.current.upArrowKey.isPressed) movement.y = 1;
            if (Keyboard.current.downArrowKey.isPressed) movement.y = -1;
        }

        movement = movement.normalized; // 대각선 이동 속도 보정
    }

    void FixedUpdate()
    {
        rb.linearVelocity = movement * moveSpeed;
    }
}
