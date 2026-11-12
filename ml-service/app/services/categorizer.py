
import re
import joblib

from app.config import MODEL_DIR

MODEL_PATH = MODEL_DIR / "expense_categorizer.joblib"

# Minimum probability for accepting an ML prediction
CONFIDENCE_THRESHOLD = 35.0


# High-specificity keyword rules
CATEGORY_RULES = {
    "Food": [
        r"\brestaurant\b", r"\bfood delivery\b", r"\bswiggy\b",
        r"\bzomato\b", r"\bbiryani\b", r"\bpizza\b",
        r"\bcafe\b", r"\bcoffee\b", r"\blunch\b",
        r"\bdinner\b", r"\bbreakfast\b"
    ],
    "Groceries": [
        r"\bgrocery\b", r"\bgroceries\b", r"\bbigbasket\b",
        r"\bblinkit\b", r"\bzepto\b", r"\bdmart\b",
        r"\bvegetables\b", r"\bfruits\b", r"\bkirana\b",
        r"\bsupermarket\b"
    ],
    "Transportation": [
        r"\buber\b", r"\bola\b", r"\brapido\b",
        r"\bpetrol\b", r"\bfuel\b", r"\bmetro\b",
        r"\bbus ticket\b", r"\bauto rickshaw\b",
        r"\btoll\b", r"\bparking\b", r"\btrain ticket\b"
    ],
    "Utilities": [
        r"\belectricity\b", r"\bwater bill\b",
        r"\bbroadband\b", r"\bwifi\b", r"\binternet bill\b",
        r"\bgas cylinder\b", r"\bmobile recharge\b",
        r"\bdth recharge\b"
    ],
    "Healthcare": [
        r"\bdoctor\b", r"\bhospital\b", r"\bpharmacy\b",
        r"\bmedicine\b", r"\bmedical\b", r"\bclinic\b",
        r"\bdental\b", r"\bdiagnostic\b", r"\bblood test\b"
    ],
    "Education": [
        r"\bonline education\b",
        r"\beducational course\b",
        r"\bonline course\b",
        r"\btuition\b", r"\bcollege fees\b",
        r"\bcourse\b", r"\btextbook\b", r"\bexam fee\b",
        r"\budemy\b", r"\bcoursera\b", r"\bbootcamp\b",
        r"\buniversity\b",
        r"\bacademic\b", r"\bschool fees\b",
        r"\btraining program\b"
    ],
    "Entertainment": [
        r"\bmovie\b", r"\bcinema\b", r"\bpvr\b",
        r"\bconcert\b", r"\bamusement park\b",
        r"\bgaming\b", r"\btheatre\b", r"\bnetflix movie\b"
    ],
    "Shopping": [
        r"\bamazon shopping\b", r"\bflipkart\b",
        r"\bmyntra\b", r"\bclothes\b", r"\bshoes\b",
        r"\bheadphones\b", r"\bsmartphone\b",
        r"\belectronics purchase\b", r"\bfurniture\b"
    ],
    "Rent": [
        r"\bhouse rent\b", r"\bmonthly rent\b",
        r"\bapartment rent\b", r"\bflat rent\b",
        r"\broom rent\b", r"\blandlord\b",
        r"\bpg accommodation\b"
    ],
    "Travel": [
        r"\bflight\b", r"\bhotel reservation\b",
        r"\bholiday\b", r"\bvacation\b", r"\btour package\b",
        r"\bmakemytrip\b", r"\bgoibibo\b",
        r"\binternational airline\b"
    ],
    "Insurance": [
        r"\binsurance\b", r"\blic premium\b",
        r"\bpolicy premium\b", r"\bterm insurance\b",
        r"\bhealth cover\b"
    ],
    "Personal Care": [
        r"\bhaircut\b", r"\bsalon\b", r"\bspa\b",
        r"\bfacial\b", r"\bmanicure\b", r"\bpedicure\b",
        r"\bgrooming\b", r"\bskincare\b"
    ],
    "Subscriptions": [
    r"\bspotify\b",
    r"\bnetflix\b",
    r"\bamazon prime\b",
    r"\bgoogle one\b",
    r"\bmicrosoft 365\b",
    r"\badobe\b",
    r"\bgithub premium\b",
    r"\bcanva pro\b",
    r"\bcloud storage\b",
    r"\bhosting renewal\b"
    ]
}


def load_categorization_model():
    """Load the trained ML pipeline."""

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Expense categorization model not found. "
            "Train the model first."
        )

    return joblib.load(MODEL_PATH)


model = load_categorization_model()


def predict_category(description: str):
    """Predict a transaction category using rules and ML."""

    if not isinstance(description, str) or not description.strip():
        raise ValueError("Transaction description cannot be empty.")

    text = description.strip()
    normalized_text = text.lower()

    # 1. Try high-specificity keyword rules
    for category, patterns in CATEGORY_RULES.items():
        for pattern in patterns:
            if re.search(pattern, normalized_text):
                return {
                    "description": text,
                    "category": category,
                    "confidence": None,
                    "source": "keyword_rule",
                    "needs_review": False
                }

    # 2. Use ML model when no keyword rule matches
    prediction = model.predict([text])[0]

    probabilities = model.predict_proba([text])[0]
    confidence = float(max(probabilities) * 100)

    # 3. Flag uncertain predictions
    needs_review = confidence < CONFIDENCE_THRESHOLD

    return {
        "description": text,
        "category": prediction,
        "confidence": round(confidence, 2),
        "source": "machine_learning",
        "needs_review": needs_review
    }
