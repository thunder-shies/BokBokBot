"""
TTS 服務 - Microsoft Edge TTS 整合
"""

import edge_tts
import io
from config import config


class TTSService:
    """文字轉語音服務"""

    def __init__(self):
        self.voice = config.TTS_VOICE  # 粵語語音
        self.rate = "+0%"  # 語速
        self.volume = "+0%"  # 音量

    async def synthesize_speech(self, text: str) -> bytes:
        """
        將文本轉換為語音

        Args:
            text: 要轉換的文本

        Returns:
            MP3 文件字節
        """
        try:
            communicate = edge_tts.Communicate(
                text=text,
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
