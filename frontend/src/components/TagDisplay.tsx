import { useState, useEffect, type FC } from 'react';

interface TagDisplayProps {
  tag: string;
  index: number;
}

const TagDisplay: FC<TagDisplayProps> = ({ tag, index }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 延遲出現效果
    const timeout = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timeout);
  }, [index]);

  // 生成漸變顏色組合
  const gradients = [
    'from-cyan-400 to-blue-600',
    'from-magenta-400 to-purple-600',
    'from-lime-400 to-cyan-400',
  ];
  const gradient = gradients[index % gradients.length];

  // 解析標籤數值
  const match = tag.match(/(\d+)%/);
  const percentage = match ? parseInt(match[1]) : 0;

  return (
    <div
      className={`transform transition-all duration-500 ${
        isVisible
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-75 translate-y-2'
      }`}
    >
      <div className={`relative inline-block px-4 py-2 rounded-full bg-gradient-to-r ${gradient} text-black font-bold text-sm shadow-lg group`}>
        {/* 背景光暈 */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full opacity-50 blur-lg -z-10`} />

        {/* 標籤內容 */}
        <span className="relative flex items-center gap-2">
          <span>{tag}</span>
          {/* 進度條 */}
          <div className="w-12 h-1.5 bg-black bg-opacity-40 rounded-full overflow-hidden">
            <div
              className="h-full bg-white bg-opacity-80 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </span>

        {/* 懸停時的提示 */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          用戶評分
        </div>
      </div>
    </div>
  );
};

export default TagDisplay;
