import { useEffect, useState, type FC } from 'react';

interface AIResponseProps {
  response: string;
}

const AIResponse: FC<AIResponseProps> = ({ response }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);

  // 打字機效果
  useEffect(() => {
    if (!isAnimating) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < response.length) {
        setDisplayedText(response.substring(0, index + 1));
        index++;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 30); // 每 30ms 顯示一個字符

    return () => clearInterval(interval);
  }, [response, isAnimating]);

  return (
    <div className={`max-w-sm p-4 rounded-lg border ${
      Math.random() > 0.5 
        ? 'border-cyan-400 border-opacity-50 bg-gradient-to-br from-cyan-950 to-black'
        : 'border-fuchsia-400 border-opacity-50 bg-gradient-to-br from-fuchsia-950 to-black'
    }`}>
      <div className="flex items-start">
        <div className="flex-1">
          <div className="text-sm text-gray-100 leading-relaxed font-mono">
            {displayedText}
            {isAnimating && (
              <span className="animate-pulse text-cyan-400">▋</span>
            )}
          </div>

          {/* 回應內容 */}
          {!isAnimating && (
            <div className="mt-3 pt-2 border-t border-gray-700" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponse;
