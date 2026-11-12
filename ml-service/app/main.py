
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.categorization import CategorizationRequest
from app.services.categorizer import predict_category

from app.schemas.anomaly import AnomalyRequest
from app.services.anomaly_detector import detect_spending_anomalies


app = FastAPI(
    title="FinSight AI - ML Service",
    description="Machine Learning API for personal finance analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Welcome to FinSight AI ML Service",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "FinSight AI ML Service",
        "status": "Running"
    }


@app.post("/categorize")
def categorize_transaction(request: CategorizationRequest):
    try:
        result = predict_category(request.description)

        return {
            "success": True,
            "message": "Transaction categorized successfully",
            "data": result
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred during categorization"
        )


@app.post("/detect-anomalies")
def detect_anomalies(request: AnomalyRequest):
    try:
        result = detect_spending_anomalies(
            transactions=request.transactions,
            contamination=request.contamination
        )

        return {
            "success": True,
            "message": "Spending anomaly detection completed",
            "data": result
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred during anomaly detection"
        )
