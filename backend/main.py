import uvicorn
import os
import logging


class SuppressVisionAccessLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return "/api/vision/detect-person" not in message


if __name__ == "__main__":
    port = int(os.getenv("APP_PORT", "8001"))
    logging.getLogger("uvicorn.access").addFilter(SuppressVisionAccessLogFilter())
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
