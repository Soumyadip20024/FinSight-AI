
import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest


def detect_spending_anomalies(
    transactions,
    contamination=0.05
):
    """
    Detect unusual expenses using:
    1. Isolation Forest
    2. Category-wise 3x average spending rule

    A flagged transaction is an unusual spending alert,
    not proof of fraud.
    """

    if len(transactions) < 5:
        raise ValueError(
            "At least 5 transactions are required"
        )

    if not 0 < contamination <= 0.5:
        raise ValueError(
            "Contamination must be between 0 and 0.5"
        )

    data = pd.DataFrame([
        transaction.model_dump()
        for transaction in transactions
    ])

    data["date"] = pd.to_datetime(data["date"])

    # Feature engineering
    data["log_amount"] = np.log1p(data["amount"])
    data["day"] = data["date"].dt.day
    data["day_of_week"] = data["date"].dt.dayofweek
    data["month"] = data["date"].dt.month

    category_features = pd.get_dummies(
        data["category"],
        prefix="category",
        dtype=int
    )

    numerical_features = data[
        [
            "log_amount",
            "day",
            "day_of_week",
            "month"
        ]
    ]

    features = pd.concat(
        [numerical_features, category_features],
        axis=1
    )

    # Isolation Forest
    model = IsolationForest(
        n_estimators=200,
        contamination=contamination,
        random_state=42
    )

    predictions = model.fit_predict(features)
    raw_scores = model.decision_function(features)

    # Relative Isolation Forest scores
    min_score = float(raw_scores.min())
    max_score = float(raw_scores.max())

    score_range = max_score - min_score

    if score_range == 0:
        isolation_scores = np.zeros(len(raw_scores))
    else:
        isolation_scores = (
            (max_score - raw_scores) / score_range
        ) * 100

    results = []

    for index, row in data.iterrows():

        amount = float(row["amount"])
        category = row["category"]

        # Compare against other transactions in the same category.
        category_peers = data[
            (data["category"] == category) &
            (data.index != index)
        ]

        if not category_peers.empty:
            baseline = float(
                category_peers["amount"].mean()
            )
            baseline_source = "category_average"
        else:
            # Fallback: average of all other transactions.
            other_transactions = data.drop(index)

            baseline = float(
                other_transactions["amount"].mean()
            )
            baseline_source = "overall_average"

        threshold = baseline * 3

        # Strictly greater than 3x the baseline.
        amount_anomaly = amount > threshold

        isolation_anomaly = predictions[index] == -1

        # Flag if either method detects an anomaly.
        is_anomaly = (
            amount_anomaly or isolation_anomaly
        )

        if not is_anomaly:
            continue

        ratio = (
            amount / baseline
            if baseline > 0
            else 0
        )

        # Keep the score as a relative ranking, not a probability.
        rule_score = min(
            (ratio / 3) * 100,
            100
        )

        anomaly_score = max(
            float(isolation_scores[index]),
            rule_score if amount_anomaly else 0
        )

        methods = []

        if isolation_anomaly:
            methods.append("isolation_forest")

        if amount_anomaly:
            methods.append("category_spending_rule")

        results.append({
            "title": str(row["title"]),
            "amount": round(amount, 2),
            "category": str(category),
            "date": row["date"].strftime("%Y-%m-%d"),
            "anomaly_score": round(anomaly_score, 2),
            "baseline_amount": round(baseline, 2),
            "threshold_amount": round(threshold, 2),
            "baseline_source": baseline_source,
            "detection_methods": methods,
            "reason": (
                f"Expense is {ratio:.2f} times the "
                f"comparison average for this transaction."
                if amount_anomaly
                else
                "This transaction differs from the "
                "spending patterns in your submitted history."
            )
        })

    results.sort(
        key=lambda item: item["anomaly_score"],
        reverse=True
    )

    return {
        "total_transactions": len(data),
        "anomalies_detected": len(results),
        "normal_transactions": len(data) - len(results),
        "contamination": contamination,
        "anomalies": results
    }
