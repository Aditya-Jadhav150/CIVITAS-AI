import os
import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import IsolationForest
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS_DIR = os.path.dirname(os.path.abspath(__file__))

def train_flood_model():
    logger.info("Generating synthetic data for Flood Prediction...")
    # Features: rainfall, river_level, humidity, drainage_complaints, district (encoded)
    np.random.seed(42)
    n_samples = 5000
    
    rainfall = np.random.uniform(0, 200, n_samples)
    river_level = np.random.uniform(2, 15, n_samples)
    humidity = np.random.uniform(40, 100, n_samples)
    drainage = np.random.randint(0, 100, n_samples)
    district = np.random.randint(0, 5, n_samples) # 0 to 4 representing districts
    
    # Calculate synthetic flood probability
    risk = (rainfall / 200) * 0.4 + (river_level / 15) * 0.3 + (drainage / 100) * 0.2 + (humidity/100) * 0.1
    risk += np.random.normal(0, 0.05, n_samples)
    risk = np.clip(risk, 0, 1) * 100 # Scale to 0-100
    
    df = pd.DataFrame({
        'rainfall': rainfall,
        'river_level': river_level,
        'humidity': humidity,
        'drainage_complaints': drainage,
        'district': district,
        'flood_risk': risk
    })
    
    X = df[['rainfall', 'river_level', 'humidity', 'drainage_complaints', 'district']]
    y = df['flood_risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    logger.info("Training XGBoost Regressor for Flood Prediction...")
    model = xgb.XGBRegressor(n_estimators=100, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    logger.info(f"Flood Model R2 Score: {score:.4f}")
    
    model_path = os.path.join(MODELS_DIR, "flood_xgboost.pkl")
    joblib.dump(model, model_path)
    logger.info(f"Saved Flood Model to {model_path}")

def train_anomaly_model():
    logger.info("Training Isolation Forest for Anomaly Detection...")
    # Inputs: AQI, temperature, humidity, emissions, waste_collection_delay
    np.random.seed(42)
    n_samples = 2000
    
    # Normal data
    normal_data = np.random.normal(loc=[50, 22, 60, 100, 2], scale=[15, 5, 10, 20, 1], size=(n_samples, 5))
    # Anomalous data
    anomalies = np.random.normal(loc=[180, 35, 90, 400, 12], scale=[20, 5, 5, 50, 4], size=(100, 5))
    
    X = np.vstack([normal_data, anomalies])
    df = pd.DataFrame(X, columns=['AQI', 'temperature', 'humidity', 'emissions', 'waste_collection_delay'])
    
    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(df)
    
    model_path = os.path.join(MODELS_DIR, "anomaly_isolation_forest.pkl")
    joblib.dump(model, model_path)
    logger.info(f"Saved Anomaly Model to {model_path}")

if __name__ == "__main__":
    train_flood_model()
    train_anomaly_model()
