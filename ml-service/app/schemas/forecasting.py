
from datetime import datetime
import re

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator
)


class MonthlyExpense(BaseModel):
    """
    Represents one month's total expenses.
    """

    month: str = Field(
        ...,
        description="Month in YYYY-MM format"
    )

    total_expense: float = Field(
        ...,
        ge=0,
        description="Total expenses for the month"
    )

    @field_validator("month")
    @classmethod
    def validate_month(cls, value):
        if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", value):
            raise ValueError(
                "Month must be in YYYY-MM format"
            )

        return value


class ForecastRequest(BaseModel):
    """
    Request schema for monthly expense forecasting.
    """

    history: list[MonthlyExpense] = Field(
        ...,
        min_length=2,
        max_length=36,
        description="Historical monthly expense data"
    )

    forecast_months: int = Field(
        default=3,
        ge=1,
        le=12,
        description="Number of future months to predict"
    )

    @model_validator(mode="after")
    def validate_history(self):

        months = [
            item.month
            for item in self.history
        ]

        if len(months) != len(set(months)):
            raise ValueError(
                "Duplicate months are not allowed"
            )

        # Sort historical data chronologically
        self.history.sort(
            key=lambda item: item.month
        )

        return self
