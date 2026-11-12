from datetime import date
from pydantic import BaseModel, Field, field_validator


class ExpenseTransaction(BaseModel):
    """
    Represents an expense transaction for anomaly detection.
    """

    title: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    amount: float = Field(
        ...,
        gt=0
    )

    category: str = Field(
        default="Uncategorized",
        max_length=100
    )

    date: date

    @field_validator("title", "category")
    @classmethod
    def clean_text(cls, value):
        return value.strip()


class AnomalyRequest(BaseModel):
    """
    Request schema for spending anomaly detection.
    """

    transactions: list[ExpenseTransaction] = Field(
        ...,
        min_length=5,
        max_length=5000
    )

    contamination: float = Field(
        default=0.05,
        gt=0,
        le=0.5,
        description="Expected proportion of anomalous transactions"
    )