
import pandas as pd
import joblib

from sklearn.model_selection import (
    train_test_split,
    GridSearchCV,
    StratifiedKFold
)

from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score
)

from app.config import DATASET_DIR, MODEL_DIR, EXPENSE_CATEGORIES


DATASET_PATH = DATASET_DIR / "transactions_expanded.csv"
MODEL_PATH = MODEL_DIR / "expense_categorizer.joblib"


def train_model():

    print("=" * 60)
    print("FINSIGHT AI - IMPROVED EXPENSE CATEGORIZATION")
    print("=" * 60)

    # 1. Load dataset
    print("\nLoading dataset...")

    df = pd.read_csv(DATASET_PATH)

    df = df.dropna(subset=["description", "category"])

    df["description"] = (
        df["description"].astype(str).str.strip()
    )

    df["category"] = (
        df["category"].astype(str).str.strip()
    )

    df = df[
        (df["description"] != "") &
        (df["category"] != "")
    ].copy()

    unknown_categories = (
        set(df["category"]) - set(EXPENSE_CATEGORIES)
    )

    if unknown_categories:
        raise ValueError(
            f"Unknown categories: {unknown_categories}"
        )

    print("Total records:", len(df))
    print("Total categories:", df["category"].nunique())

    print("\nCategory distribution:")
    print(df["category"].value_counts().sort_index())

    # Check duplicate descriptions
    duplicate_count = df.duplicated(
        subset=["description"]
    ).sum()

    print("\nDuplicate descriptions:", duplicate_count)

    # 2. Prepare features and labels
    X = df["description"]
    y = df["category"]

    labels = sorted(y.unique())

    # 3. Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print("\nTraining examples:", len(X_train))
    print("Testing examples:", len(X_test))

    # 4. Baseline model
    baseline_model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                max_features=5000,
                sublinear_tf=True
            )
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        )
    ])

    print("\nTraining baseline model...")

    baseline_model.fit(X_train, y_train)

    baseline_predictions = baseline_model.predict(X_test)

    baseline_accuracy = accuracy_score(
        y_test,
        baseline_predictions
    )

    baseline_f1 = f1_score(
        y_test,
        baseline_predictions,
        average="macro",
        zero_division=0
    )

    # 5. Improved word + character TF-IDF model
    improved_model = Pipeline([
        (
            "features",
            FeatureUnion([
                (
                    "word",
                    TfidfVectorizer(
                        analyzer="word",
                        lowercase=True,
                        ngram_range=(1, 2),
                        max_features=10000,
                        sublinear_tf=True,
                        strip_accents="unicode"
                    )
                ),
                (
                    "char",
                    TfidfVectorizer(
                        analyzer="char_wb",
                        lowercase=True,
                        ngram_range=(3, 5),
                        max_features=15000,
                        sublinear_tf=True,
                        strip_accents="unicode"
                    )
                )
            ])
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=3000,
                random_state=42
            )
        )
    ])

    # 6. Tune hyperparameters using training data only
    parameter_grid = {
        "classifier__C": [
            0.1, 0.5, 1, 2, 5, 10
        ],
        "features__word__ngram_range": [
            (1, 1),
            (1, 2)
        ]
    }

    cross_validation = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=42
    )

    grid_search = GridSearchCV(
        estimator=improved_model,
        param_grid=parameter_grid,
        scoring="f1_macro",
        cv=cross_validation,
        n_jobs=1,
        verbose=1
    )

    print("\nTuning improved model...")
    print("This may take a little time.")

    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_

    # 7. Evaluate on untouched test data
    predictions = best_model.predict(X_test)

    improved_accuracy = accuracy_score(
        y_test,
        predictions
    )

    improved_f1 = f1_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    print("\n" + "=" * 60)
    print("MODEL COMPARISON")
    print("=" * 60)

    print(
        f"Baseline Accuracy:  {baseline_accuracy * 100:.2f}%"
    )

    print(
        f"Improved Accuracy:  {improved_accuracy * 100:.2f}%"
    )

    print(
        f"Baseline Macro F1:  {baseline_f1:.4f}"
    )

    print(
        f"Improved Macro F1:  {improved_f1:.4f}"
    )

    print(
        f"\nBest Cross-validation Macro F1: "
        f"{grid_search.best_score_:.4f}"
    )

    print("\nBest Parameters:")
    print(grid_search.best_params_)

    # 8. Classification report
    print("\n" + "=" * 60)
    print("CLASSIFICATION REPORT")
    print("=" * 60)

    print(
        classification_report(
            y_test,
            predictions,
            labels=labels,
            target_names=labels,
            zero_division=0
        )
    )

    # 9. Confusion matrix
    matrix = confusion_matrix(
        y_test,
        predictions,
        labels=labels
    )

    confusion_df = pd.DataFrame(
        matrix,
        index=labels,
        columns=labels
    )

    print("\n" + "=" * 60)
    print("CONFUSION MATRIX")
    print("=" * 60)

    print("Rows = Actual categories")
    print("Columns = Predicted categories")

    print(confusion_df)

    # 10. Save best model
    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(best_model, MODEL_PATH)

    print("\n" + "=" * 60)
    print("TRAINING COMPLETED")
    print("=" * 60)

    print("Best model saved at:")
    print(MODEL_PATH)


if __name__ == "__main__":
    train_model()
