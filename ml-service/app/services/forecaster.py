
import warnings

import numpy as np
import pandas as pd

from statsmodels.tsa.holtwinters import (
    ExponentialSmoothing,
    Holt
)


def prepare_history(history):
    """
    Convert historical expenses into a continuous monthly series.

    Missing months are treated as zero expenses.
    """

    data = pd.DataFrame([
        {
            "month": item.month,
            "total_expense": item.total_expense
        }
        for item in history
    ])

    data["month"] = pd.PeriodIndex(
        data["month"],
        freq="M"
    )

    data = data.sort_values("month")

    # Create a continuous monthly index.
    # Months without transactions receive zero expenses.
    full_index = pd.period_range(
        start=data["month"].min(),
        end=data["month"].max(),
        freq="M"
    )

    series = (
        data.set_index("month")["total_expense"]
        .reindex(full_index, fill_value=0)
        .astype(float)
    )

    return series


def detect_trend(last_expense, first_forecast):
    """
    Identify the predicted expense direction.
    """

    if first_forecast > last_expense * 1.05:
        return "increasing"

    if first_forecast < last_expense * 0.95:
        return "decreasing"

    return "stable"


def predict_expenses(history, forecast_months=3):
    """
    Forecast future monthly expenses.

    Parameters:
        history: List of MonthlyExpense objects.
        forecast_months: Number of future months to predict.

    Returns:
        Dictionary containing predictions and metadata.
    """

    if len(history) < 2:
        raise ValueError(
            "At least two months of expense history are required"
        )

    if not 1 <= forecast_months <= 12:
        raise ValueError(
            "Forecast months must be between 1 and 12"
        )

    # Prepare historical data
    series = prepare_history(history)

    history_count = len(series)

    last_month = series.index[-1]
    last_expense = float(series.iloc[-1])

    average_expense = float(series.mean())

    # Select forecasting method
    if history_count == 2:

        # Baseline: two-month average
        predictions = np.full(
            forecast_months,
            average_expense
        )

        method = "two_month_average_baseline"

    elif history_count >= 24:

        # Seasonal forecasting
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")

                model = ExponentialSmoothing(
                    series,
                    trend="add",
                    damped_trend=True,
                    seasonal="add",
                    seasonal_periods=12,
                    initialization_method="estimated"
                )

                fitted_model = model.fit(
                    optimized=True
                )

                predictions = fitted_model.forecast(
                    forecast_months
                ).to_numpy()

            method = "holt_winters_seasonal"

        except Exception:

            # Fall back to Holt's trend model
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")

                model = Holt(
                    series,
                    damped_trend=True,
                    initialization_method="estimated"
                )

                fitted_model = model.fit(
                    optimized=True
                )

                predictions = fitted_model.forecast(
                    forecast_months
                ).to_numpy()

            method = "holt_trend_fallback"

    else:

        # Trend forecasting for shorter histories
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")

            model = Holt(
                series,
                damped_trend=True,
                initialization_method="estimated"
            )

            fitted_model = model.fit(
                optimized=True
            )

            predictions = fitted_model.forecast(
                forecast_months
            ).to_numpy()

        method = "holt_trend"

    # Expenses cannot be negative.
    predictions = np.maximum(
        predictions,
        0
    )

    # Generate future month labels
    future_months = pd.period_range(
        start=last_month + 1,
        periods=forecast_months,
        freq="M"
    )

    forecast = [
        {
            "month": str(month),
            "predicted_expense": round(
                float(prediction),
                2
            )
        }
        for month, prediction in zip(
            future_months,
            predictions
        )
    ]

    # Determine predicted expense direction
    trend = detect_trend(
        last_expense,
        float(predictions[0])
    )

    total_forecast = float(
        np.sum(predictions)
    )

    return {
        "forecast": forecast,
        "method": method,
        "history_months": history_count,
        "forecast_months": forecast_months,
        "average_monthly_expense": round(
            average_expense,
            2
        ),
        "last_month_expense": round(
            last_expense,
            2
        ),
        "total_predicted_expense": round(
            total_forecast,
            2
        ),
        "trend": trend
    }
