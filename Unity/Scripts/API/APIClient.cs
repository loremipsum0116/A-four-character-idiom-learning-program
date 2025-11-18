using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using IdiomLearning.Models;

namespace IdiomLearning.API
{
    /// <summary>
    /// Unity용 API 클라이언트
    /// ASP.NET Core 백엔드와 HTTP 통신
    /// </summary>
    public class APIClient : MonoBehaviour
    {
        private static APIClient _instance;
        public static APIClient Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("APIClient");
                    _instance = go.AddComponent<APIClient>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        // API 베이스 URL (Inspector에서 설정 가능)
        [SerializeField]
        private string apiBaseUrl = "http://localhost:5000/api";

        private string authToken = "";

        void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);

            // PlayerPrefs에서 토큰 로드
            authToken = PlayerPrefs.GetString("AuthToken", "");
        }

        #region Authentication

        /// <summary>
        /// FR 1.2: 로그인
        /// </summary>
        public IEnumerator Login(string email, string password, Action<AuthResponse> onSuccess, Action<string> onError)
        {
            var request = new LoginRequest { email = email, password = password };
            string json = JsonUtility.ToJson(request);

            using (UnityWebRequest www = new UnityWebRequest($"{apiBaseUrl}/auth/login", "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");

                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    AuthResponse response = JsonUtility.FromJson<AuthResponse>(www.downloadHandler.text);
                    authToken = response.token;
                    PlayerPrefs.SetString("AuthToken", authToken);
                    PlayerPrefs.Save();
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(www.error);
                }
            }
        }

        /// <summary>
        /// FR 1.1: 회원가입
        /// </summary>
        public IEnumerator Signup(string email, string password, string nickname, Action<AuthResponse> onSuccess, Action<string> onError)
        {
            var request = new SignupRequest { email = email, password = password, nickname = nickname };
            string json = JsonUtility.ToJson(request);

            using (UnityWebRequest www = new UnityWebRequest($"{apiBaseUrl}/auth/signup", "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");

                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    AuthResponse response = JsonUtility.FromJson<AuthResponse>(www.downloadHandler.text);
                    authToken = response.token;
                    PlayerPrefs.SetString("AuthToken", authToken);
                    PlayerPrefs.Save();
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(www.error);
                }
            }
        }

        /// <summary>
        /// 로그아웃
        /// </summary>
        public void Logout()
        {
            authToken = "";
            PlayerPrefs.DeleteKey("AuthToken");
            PlayerPrefs.Save();
        }

        #endregion

        #region Game API

        /// <summary>
        /// FR 4.1: 스테이지 목록 조회
        /// </summary>
        public IEnumerator GetStages(Action<StagesResponse> onSuccess, Action<string> onError)
        {
            using (UnityWebRequest www = UnityWebRequest.Get($"{apiBaseUrl}/game/stages"))
            {
                www.SetRequestHeader("Authorization", $"Bearer {authToken}");
                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    StagesResponse response = JsonUtility.FromJson<StagesResponse>(www.downloadHandler.text);
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(www.error);
                }
            }
        }

        /// <summary>
        /// FR 4.6: 공격 처리
        /// </summary>
        public IEnumerator ProcessAttack(AttackRequest request, Action<AttackResponse> onSuccess, Action<string> onError)
        {
            string json = JsonUtility.ToJson(request);

            using (UnityWebRequest www = new UnityWebRequest($"{apiBaseUrl}/game/attack", "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");
                www.SetRequestHeader("Authorization", $"Bearer {authToken}");

                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    AttackResponse response = JsonUtility.FromJson<AttackResponse>(www.downloadHandler.text);
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(www.error);
                }
            }
        }

        /// <summary>
        /// FR 4.8: 방어 처리
        /// </summary>
        public IEnumerator ProcessDefense(DefenseRequest request, Action<DefenseResponse> onSuccess, Action<string> onError)
        {
            string json = JsonUtility.ToJson(request);

            using (UnityWebRequest www = new UnityWebRequest($"{apiBaseUrl}/game/defend", "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");
                www.SetRequestHeader("Authorization", $"Bearer {authToken}");

                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    DefenseResponse response = JsonUtility.FromJson<DefenseResponse>(www.downloadHandler.text);
                    onSuccess?.Invoke(response);
                }
                else
                {
                    onError?.Invoke(www.error);
                }
            }
        }

        #endregion

        #region Idiom API

        /// <summary>
        /// FR 3.2: 빈칸 맞추기 퀴즈 조회
        /// </summary>
        public IEnumerator GetBlankQuiz(string difficulty, Action<BlankQuiz> onSuccess, Action<string> onError)
        {
            string url = $"{apiBaseUrl}/idioms/quiz/blank";
            if (!string.IsNullOrEmpty(difficulty))
            {
                url += $"?difficulty={difficulty}";
            }

            using (UnityWebRequest www = UnityWebRequest.Get(url))
            {
                www.SetRequestHeader("Authorization", $"Bearer {authToken}");
                yield return www.SendWebRequest();

                if (www.result == UnityWebRequest.Result.Success)
                {
                    BlankQuiz quiz = JsonUtility.FromJson<BlankQuiz>(www.downloadHandler.text);
                    onSuccess?.Invoke(quiz);
                }
                else
                {
                    onError?.Invoke(www.error);
                }
            }
        }

        #endregion

        /// <summary>
        /// 인증 토큰 설정 (외부에서 사용)
        /// </summary>
        public void SetAuthToken(string token)
        {
            authToken = token;
            PlayerPrefs.SetString("AuthToken", token);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// 현재 인증 상태 확인
        /// </summary>
        public bool IsAuthenticated()
        {
            return !string.IsNullOrEmpty(authToken);
        }
    }
}
