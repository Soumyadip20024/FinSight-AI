
from pydantic import BaseModel, Field


class CategorizationRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Transaction description to categorize"
    )
