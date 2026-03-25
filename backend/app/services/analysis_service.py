"""
分析服務 - 生成標籤和強度分析
"""

from typing import List, Tuple


class AnalysisService:
    """分析服務"""

    @staticmethod
    def calculate_intensity(user_input: str, tags: List[str]) -> float:
        """
        計算對話激烈度

        Args:
            user_input: 用戶輸入
            tags: 標籤列表

        Returns:
            0-100 的激烈度高度
        """
        # 基礎長度分
        length_score = min(len(user_input) / 50 * 30, 30)

        # 激烈詞彙檢查
        intense_keywords = [
            "廢",
            "蠢",
            "智障",
            "垃圾",
            "不值得",
            "必須",
            "絕對",
            "唯一",
            "只有",
            "都是",
            "全部",
            "永遠",
            "從不",
        ]
        keyword_score = 0
        for keyword in intense_keywords:
            if keyword in user_input:
                keyword_score += 10

        # 標籤計數分
        tag_score = len(tags) * 5

        # 綜合計算
        intensity = min(length_score + keyword_score + tag_score, 100)
        return intensity

    @staticmethod
    def extract_sentiment(text: str) -> str:
        """
        提取情感傾向

        Args:
            text: 文本

        Returns:
            情感類型
        """
        positive_words = ["好", "讚", "支持", "同意", "聰明"]
        negative_words = ["差", "廢", "反對", "不同意", "蠢"]

        pos_count = sum(1 for word in positive_words if word in text)
        neg_count = sum(1 for word in negative_words if word in text)

        if pos_count > neg_count:
            return "positive"
        elif neg_count > pos_count:
            return "negative"
        else:
            return "neutral"

    @staticmethod
    def format_tag_with_percentage(tag_name: str, percentage: int) -> str:
        """
        格式化標籤

        Args:
            tag_name: 標籤名稱
            percentage: 百分比

        Returns:
            格式化後的標籤
        """
        return f"{tag_name}: {min(max(percentage, 0), 100)}%"


# 全局實例
analysis_service = AnalysisService()
