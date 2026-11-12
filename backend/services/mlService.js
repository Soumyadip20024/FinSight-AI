
const axios = require("axios");

const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

// Axios client for Python ML service
const mlClient = axios.create({
    baseURL: ML_SERVICE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Categorize a transaction
const categorizeTransaction = async (description) => {
    try {
        const response = await mlClient.post("/categorize", {
            description
        });

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(
                error.response.data.detail ||
                "ML service returned an error"
            );
        }

        if (error.code === "ECONNABORTED") {
            throw new Error("ML service request timed out");
        }

        throw new Error(
            "Unable to connect to the ML service"
        );
    }
};

// Detect unusual spending patterns
const detectAnomalies = async (
    transactions,
    contamination = 0.05
) => {
    try {
        const response = await mlClient.post(
            "/detect-anomalies",
            {
                transactions,
                contamination
            }
        );

        return response.data;

    } catch (error) {
        if (error.response) {
            throw new Error(
                error.response.data.detail ||
                "Anomaly detection failed"
            );
        }

        if (error.code === "ECONNABORTED") {
            throw new Error(
                "Anomaly detection request timed out"
            );
        }

        throw new Error(
            "Unable to connect to the ML service"
        );
    }
};

module.exports = {
    categorizeTransaction,
    detectAnomalies
};
