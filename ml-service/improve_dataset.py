
import pandas as pd

from pathlib import Path


DATASET_PATH = Path("datasets/transactions.csv")
OUTPUT_PATH = Path("datasets/transactions_cleaned.csv")


def improve_dataset():

    print("Loading original dataset...")

    df = pd.read_csv(DATASET_PATH)

    print("Original records:", len(df))

    # Consistent category corrections
    corrections = {
        "Music streaming subscription": "Subscriptions",
        "Gaming subscription payment": "Subscriptions",
        "Online learning subscription": "Subscriptions",
        "Programming tutorial subscription": "Subscriptions"
    }

    for description, new_category in corrections.items():

        mask = (
            df["description"].str.strip().str.lower()
            == description.lower()
        )

        if mask.any():

            old_category = df.loc[
                mask, "category"
            ].iloc[0]

            df.loc[mask, "category"] = new_category

            print(
                f"Updated: {description} | "
                f"{old_category} -> {new_category}"
            )

    # Remove duplicate descriptions
    df["description"] = (
        df["description"].astype(str).str.strip()
    )

    df["category"] = (
        df["category"].astype(str).str.strip()
    )

    df = df.dropna(
        subset=["description", "category"]
    )

    df = df.drop_duplicates(
        subset=["description"],
        keep="first"
    )

    # Save cleaned dataset separately
    df.to_csv(OUTPUT_PATH, index=False)

    print("\nDataset cleaning completed!")
    print("Total records:", len(df))
    print("\nUpdated category distribution:")
    print(df["category"].value_counts().sort_index())

    print("\nSaved to:", OUTPUT_PATH)


if __name__ == "__main__":
    improve_dataset()
