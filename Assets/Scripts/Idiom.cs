using UnityEngine;

[CreateAssetMenu(fileName = "Idiom", menuName = "Quiz/Idiom")]
public class Idiom : ScriptableObject
{
    [TextArea] public string question; // e.g. "一石 〇〇"
    public string answer;             // e.g. "二鳥"
    public int difficulty = 1;        // 1=초급,2=중급,3=고급 (선택)
}
