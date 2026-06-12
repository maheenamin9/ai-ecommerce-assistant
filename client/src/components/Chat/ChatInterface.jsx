import { useEffect, useRef } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import useChatStore from '../../store/chatStore';

const SUGGESTIONS = [
  'Find me wireless headphones under $200',
  'What are the best ergonomic chairs?',
  'Show me gaming keyboards',
  'I need a portable Bluetooth speaker',
];

const WelcomeScreen = ({ onSuggest }) => (
  <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 pt-16">
    <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center mb-4">
      <ShoppingBag size={28} className="text-white" />
    </div>
    <h1 className="text-2xl font-semibold text-white mb-2">ShopAI Assistant</h1>
    <p className="text-gray-400 text-sm mb-8 text-center max-w-sm">
      Your intelligent shopping companion. Find products, compare options, and get personalized recommendations.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSuggest(s)}
          className="flex items-center gap-2 px-4 py-3 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-xl text-sm text-gray-300 text-left transition-colors border border-[#3f3f3f] hover:border-[#555]"
        >
          <Sparkles size={14} className="text-green-500 flex-shrink-0" />
          {s}
        </button>
      ))}
    </div>
  </div>
);

const ChatInterface = () => {
  const { currentMessages, sessionId, sendMessage } = useChatStore();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {currentMessages.length === 0 ? (
          <WelcomeScreen onSuggest={(text) => sendMessage(text)} />
        ) : (
          <div className="max-w-3xl mx-auto py-6">
            {currentMessages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <ChatInput />
    </div>
  );
};

export default ChatInterface;
