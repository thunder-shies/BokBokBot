"""
TTS 服務 - Microsoft Edge TTS 整合
"""

import edge_tts
import io
import re
from config import config


class TTSService:
    """文字轉語音服務"""

    def __init__(self):
        self.voice = config.TTS_VOICE  # 粵語語音
        self.rate = "+30%"  # 語速
        self.volume = "+0%"  # 音量

    def _sanitize_text_for_tts(self, text: str) -> str:
        """移除 emoji，避免 TTS 朗讀符號或導致合成不穩定"""
        emoji_pattern = re.compile(
            "["
            "\U0001f300-\U0001f5ff"  # symbols & pictographs
            "\U0001f600-\U0001f64f"  # emoticons
            "\U0001f680-\U0001f6ff"  # transport & map
            "\U0001f700-\U0001f77f"  # alchemical
            "\U0001f780-\U0001f7ff"  # geometric extended
            "\U0001f800-\U0001f8ff"  # arrows-c
            "\U0001f900-\U0001f9ff"  # supplemental symbols
            "\U0001fa00-\U0001faff"  # symbols & pictographs extended
            "\U00002700-\U000027bf"  # dingbats
            "\U00002600-\U000026ff"  # misc symbols
            "\U0001f1e6-\U0001f1ff"  # flags
            "\u200d"  # zero-width joiner
            "\ufe0f"  # variation selector-16
            "\U0001f3fb-\U0001f3ff"  # skin tones
            "]+",
            flags=re.UNICODE,
        )
        sanitized = emoji_pattern.sub("", text)
        sanitized = " ".join(sanitized.split())
        return sanitized

    async def synthesize_speech(self, text: str) -> bytes:
        """
        將文本轉換為語音

        Args:
            text: 要轉換的文本

        Returns:
            MP3 文件字節
        """
        try:
            clean_text = self._sanitize_text_for_tts(text)
            if not clean_text:
                clean_text = "嗯"

            communicate = edge_tts.Communicate(
                text=clean_text,
                voice=self.voice,
                rate=self.rate,
                volume=self.volume,
            )

            # 收集音頻數據
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]

            return audio_data

        except Exception as e:
            print(f"❌ TTS 錯誤: {str(e)}")
            raise

    def get_available_voices(self) -> list:
        """
        獲取可用的語音列表

        Returns:
            語音列表
        """
        # 粵語相關語音
        cantonese_voices = [
            "zh-HK-YurisNeural",  # 女性
            "zh-HK-WanRuiNeural",  # 女性
            "zh-HK-HiuMaanNeural",  # 女性
            "zh-HK-ZunNingNeural",  # 男性
        ]
        return cantonese_voices


# 全局實例
tts_service = TTSService()
