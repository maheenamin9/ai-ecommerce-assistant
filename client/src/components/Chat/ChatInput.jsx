import { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp } from 'lucide-react';
import VoiceInput from './VoiceInput';
import useVoice from '../../hooks/useVoice';
import useChatStore from '../../store/chatStore';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const { sendMessage, isStreaming } = useChatStore();
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim(), 'text');
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceStop = async () => {
    const transcript = await stopRecording();
    if (transcript) {
      sendMessage(transcript, 'voice');
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-[#2f2f2f] rounded-2xl border border-[#3f3f3f] focus-within:border-[#555] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ShopAI..."
            rows={1}
            className="w-full bg-transparent resize-none px-4 py-3 pr-24 text-sm text-gray-100 placeholder-gray-500 focus:outline-none max-h-48"
            disabled={isStreaming || isRecording || isTranscribing}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <VoiceInput
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onStart={startRecording}
              onStop={handleVoiceStop}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center transition-opacity disabled:opacity-20 hover:bg-gray-200"
            >
              <ArrowUp size={16} className="text-black" />
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-gray-600 mt-2">
          ShopAI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
