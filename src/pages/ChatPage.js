import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendLLMChat } from "../api/chat";
import axios from "axios";

function ChatPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "안녕하세요! 산책에 관한 질문이 있으신가요?",
      isUser: false,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const suggestedQuestions = [
    "오늘 어디 갈까?",
    "오늘 미세먼지 어때?",
    "오늘 산책하는거 어떨까?",
    "오늘 옷은 어떻게 입히는 게 좋을까?",
  ];

  const goToMap = () => navigate("/map");
  const goToProfile = () => navigate("/profile");
  const goToPetInfo = () => navigate("/pets");
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position.coords);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleSendMessage = async (overrideMessage = null) => {
    if (isLoading) return;
    const userInput =
      typeof (overrideMessage ?? message) === "string"
        ? overrideMessage ?? message
        : String(message);

    if (userInput.trim().length === 0) {
      alert("메시지를 입력해주세요!");
      return;
    }

    if (typeof userInput !== "string") {
      console.warn("userInput is not a string:", userInput);
      alert("메시지를 입력해주세요!");
      return;
    }
    setIsLoading(true);

    const newUserMessage = {
      id: chatMessages.length + 1,
      text: userInput,
      isUser: true,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const loadingMessage = {
      id: newUserMessage.id + 1,
      text: "답변을 생성 중입니다... (최대 30초)",
      isUser: false,
      time: "",
    };

    setChatMessages((prev) => [...prev, newUserMessage, loadingMessage]);
    setMessage("");

    try {
      let coords;
      try {
        coords = await getCurrentLocation();
      } catch (error) {
        alert("📍 위치 정보를 가져오지 못했어요. 기본 위치로 응답을 생성합니다.");
        console.error("위치 가져오기 실패:", error);
        //coords = { latitude: 37.5665, longitude: 126.9780 }; // 서울 시청
      }
  
      const { latitude, longitude } = coords;

      const { data } = await sendLLMChat({
        latitude,
        longitude,
        message: userInput,
      });

      const cleanResponse = data.data.response.replace(/```json\n|\n```/g, "");

      let parsed, aiText;

      try {
        parsed = JSON.parse(cleanResponse);
        if (parsed.routes) {
          // 산책로 추천 응답
          aiText = "🏞️ 근처 산책로 추천!\n\n" + parsed.routes.map((route, idx) =>
            `📍 ${idx + 1}. ${route.name} (${route.distance_km}km)\n- ${route.description}`
          ).join("\n\n");
        } else {
          // 일반 산책 추천 응답
          aiText = `🐾 오늘은 ${parsed.recommendation}!\n📌 이유: ${
            parsed.reason
          }\n✅ 팁: ${parsed.safety_tips.join(", ")}`;
        }
      } catch {
        aiText = cleanResponse;
      }

      const aiResponse = {
        id: loadingMessage.id,
        text: aiText,
        isUser: false,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatMessages((prev) => prev.slice(0, -1).concat(aiResponse));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        switch (status) {
          case 401:
            alert("로그인 해주세요");
            break;
          case 404:
            if (window.confirm("반려견 정보를 찾을 수 없습니다. 반려견 정보를 등록해주세요.")) {
              navigate("/pets/register");
            }
            break;
          case 400:
            alert("요청 형식이 잘못되었거나 날씨 정보가 유효하지 않습니다.");
            break;
          case 500:
            alert("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            break;
          default:
            alert(`알 수 없는 오류가 발생했습니다. (${status})`);
        }
      } else {
        alert("예상치 못한 네트워크 오류가 발생했습니다.");
      }

      const errorResponse = {
        id: loadingMessage.id,
        text: "AI 응답에 실패했어요. 다시 시도해주세요!",
        isUser: false,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatMessages((prev) => prev.slice(0, -1).concat(errorResponse));
    }finally {
      setIsLoading(false); // 무조건 실행
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSendMessage(question); // 바로 전송
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-full overflow-hidden">
      {/* 헤더 */}
      <header className="bg-white pt-2 pb-0 px-4 shadow-md flex items-center justify-center w-full">
        <div className="flex items-center h-full gap-2">
          <img
            src="/gangazido-logo-header.png"
            alt="Gangazido Logo Header"
            className="h-14 w-28 object-cover self-center"
          />
        </div>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
        <div className="space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  msg.isUser ? "bg-amber-800 text-white" : "bg-white shadow-md"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.text}</p>
                <p
                  className={`text-xs mt-1 text-right ${
                    msg.isUser ? "text-amber-100" : "text-gray-500"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 추천 질문 */}
      <div className="bg-white p-3 border-t border-gray-200 w-full">
        <p className="text-xs text-gray-500 mb-2">추천 질문</p>
        <div className="flex overflow-x-auto space-x-2 pb-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedQuestion(question)}
              className="whitespace-nowrap px-3 py-2 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-amber-100 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 입력 */}
      <div className="bg-white p-4 border-t border-gray-200 w-full">
        <div className="flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요"
            disabled={isLoading} // 👉 로딩 중 비활성화
            className="flex-1 p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading} // 👉 로딩 중 버튼 비활성화
            className="p-3 bg-amber-800 text-white rounded-r-md hover:bg-amber-900 transition-colors"
          >
            {isLoading ? (
              <span className="text-sm">전송 중...</span>
            ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            )}
          </button>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="bg-white border-t border-gray-200 shadow-lg w-full">
        <div className="flex justify-between px-2">
          <button
            onClick={goToMap}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">지도</span>
          </button>
          <button className="flex flex-col items-center py-3 flex-1 text-amber-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">채팅</span>
          </button>
          <button
            onClick={goToProfile}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">내 정보</span>
          </button>
          <button
            onClick={goToPetInfo}
            className="flex flex-col items-center py-3 flex-1 text-gray-500 hover:text-amber-800 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 21s-6-4.35-9-8c-3-3.35-3-7.35 0-10 3-3 7.5-2 9 2 1.5-4 6-5 9-2 3 3 3 7 0 10-3 3.65-9 8-9 8z"
              />
            </svg>
            <span className="text-xs mt-1 font-medium">반려견 정보</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default ChatPage;
