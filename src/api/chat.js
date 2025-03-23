import api from './index';

// LLM 채팅 전송
export const sendLLMChat = (chatData) => {
  // chatData: { latitude, longitude, message }
  return api.post('/v1/llm', chatData);
};
