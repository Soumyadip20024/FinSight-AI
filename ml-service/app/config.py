
from pathlib import Path

# ML service root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset directory
DATASET_DIR = BASE_DIR / "datasets"

# Trained model directory
MODEL_DIR = BASE_DIR / "trained_models"

# Application settings
APP_NAME = "FinSight AI ML Service"
APP_VERSION = "1.0.0"

# API settings
API_HOST = "127.0.0.1"
API_PORT = 8000

# Supported expense categories
EXPENSE_CATEGORIES = [
    "Food",
    "Groceries",
    "Transportation",
    "Utilities",
    "Healthcare",
    "Education",
    "Entertainment",
    "Shopping",
    "Rent",
    "Travel",
    "Insurance",
    "Personal Care",
    "Subscriptions",
    "Other"
]

# Supported income categories
INCOME_CATEGORIES = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Gift",
    "Other"
]

# Default currency
DEFAULT_CURRENCY = "INR"
