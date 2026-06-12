import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ShoppingBag, Volume2 } from 'lucide-react';
import useVoice from '../../hooks/useVoice';
import ProductDetailModal from './ProductDetailModal';

const ProductCard = ({ product, onClick }) => (
  <div
    onClick={onClick}
    className="bg-[#2f2f2f] rounded-xl p-3 flex gap-3 min-w-[200px] max-w-[240px] border border-[#3f3f3f] hover:border-green-600/50 transition-colors cursor-pointer"
  >
    <div className="w-16 h-16 bg-[#404040] rounded-lg flex items-center justify-center flex-shrink-0">
      <ShoppingBag size={24} className="text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-white truncate">{product.name}</p>
      <p className="text-xs text-gray-400 mt-0.5">{product.brand || product.category}</p>
      <p className="text-sm font-bold text-green-400 mt-1">${product.price?.toFixed(2)}</p>
      {product.rating && (
        <p className="text-[10px] text-yellow-400 mt-0.5">★ {product.rating} ({product.numReviews} reviews)</p>
      )}
      <p className="text-[10px] text-green-600 mt-1">View details →</p>
    </div>
  </div>
);

const ChatMessage = ({ message }) => {
  const { speak } = useVoice();
  const [selectedProductId, setSelectedProductId] = useState(null);
  const isUser = message.role === 'user';

  let products = [];
  let textContent = message.content;
  try {
    const match = message.content.match(/\{"products":\s*\[.*?\]\}/s);
    if (match) {
      const parsed = JSON.parse(match[0]);
      products = parsed.products || [];
      textContent = message.content.replace(match[0], '').trim();
    }
  } catch {}

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 px-4">
        <div className="max-w-[80%] bg-[#2f2f2f] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-100">
          {message.content}
          {message.metadata?.inputType === 'voice' && (
            <span className="ml-2 text-[10px] text-green-400 opacity-60">🎤</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 px-4 group">
      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-1">
        <ShoppingBag size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        {message.thinkingActivity && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">{message.thinkingActivity.join(' · ')}…</span>
          </div>
        )}
        <div className={`text-sm text-gray-100 prose prose-invert prose-sm max-w-none ${message.streaming ? 'typing-cursor' : ''}`}>
          <ReactMarkdown>{textContent || ''}</ReactMarkdown>
        </div>

        {products.length > 0 && (
          <div className="flex gap-3 mt-3 overflow-x-auto pb-2">
            {products.map((p, i) => (
              <ProductCard key={i} product={p} onClick={() => p.id && setSelectedProductId(p.id)} />
            ))}
          </div>
        )}

        {selectedProductId && (
          <ProductDetailModal
            productId={selectedProductId}
            onClose={() => setSelectedProductId(null)}
          />
        )}

        {!message.streaming && message.content && (
          <button
            onClick={() => speak(textContent)}
            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300"
          >
            <Volume2 size={12} />
            Read aloud
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
