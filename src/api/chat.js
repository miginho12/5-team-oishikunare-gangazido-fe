//chat.js
import api from './index';


// LLM 채팅 전송
export const sendLLMChat = (chatData) => {
  //chatData: { latitude, longitude, message }
  const token = localStorage.getItem('token');
  return api.post('/v1/llm', chatData);
};
