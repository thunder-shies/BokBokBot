from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    user_input: str = Field(..., alias="userInput", min_length=1)

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
