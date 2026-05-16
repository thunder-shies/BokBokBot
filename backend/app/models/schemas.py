from typing import Literal

from pydantic import BaseModel, Field


AppLocale = Literal["zh-HK", "en"]


class AnalyzeRequest(BaseModel):
    user_input: str = Field(..., alias="userInput", min_length=1)
    locale: AppLocale = "zh-HK"

    model_config = {"populate_by_name": True}


class Metrics(BaseModel):
    stupidity: float
    conformity: float
    polarization: float


class AnalyzeResponse(BaseModel):
    response: str
    metrics: Metrics
    labels: list[str]


class PersonDetectionResponse(BaseModel):
    detected: bool
    count: int
    confidence: float
