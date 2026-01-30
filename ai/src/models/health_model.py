import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score
import logging

class HealthModel:
    """
    Modèle santé robuste :
    - Prévision temporelle avec Prophet
    - Prédiction catégorielle ou continue avec RandomForest
    """

    def __init__(self):
        self.prophet_model = None
        self.rf_model = None
        self.label_encoders = {}
        logging.info("HealthModel initialisé")

    # ---------------- Temporal Forecast ----------------
    def train_forecast(self, df: pd.DataFrame, date_col='period', value_col='value'):
        if df.empty or date_col not in df.columns or value_col not in df.columns:
            logging.warning("Données invalides pour forecast")
            return None

        df = df.rename(columns={date_col:'ds', value_col:'y'})
        self.prophet_model = Prophet()
        try:
            self.prophet_model.fit(df)
            logging.info("Modèle Prophet entraîné")
            return self.prophet_model
        except Exception as e:
            logging.error(f"Erreur entraînement Prophet: {e}")
            return None

    def predict_forecast(self, periods=30):
        if not self.prophet_model:
            logging.warning("Modèle Prophet non entraîné")
            return None
        future = self.prophet_model.make_future_dataframe(periods=periods)
        forecast = self.prophet_model.predict(future)
        return forecast[['ds','yhat','yhat_lower','yhat_upper']]

    # ---------------- RandomForest pour prédiction ----------------
    def train_rf(self, df: pd.DataFrame, target: str):
        if df.empty or target not in df.columns:
            logging.warning("Données invalides pour RandomForest")
            return None

        X = df.drop(columns=[target])
        y = df[target]

        # Encodage des colonnes catégorielles
        for col in X.select_dtypes(include=['object']).columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            self.label_encoders[col] = le

        self.rf_model = RandomForestRegressor(n_estimators=200, random_state=42)
        try:
            self.rf_model.fit(X, y)
            logging.info("RandomForest entraîné")
            return self.rf_model
        except Exception as e:
            logging.error(f"Erreur entraînement RandomForest: {e}")
            return None

    def predict_rf(self, X_new: pd.DataFrame):
        if self.rf_model is None:
            logging.warning("RandomForest non entraîné")
            return None
        # Encodage
        for col, le in self.label_encoders.items():
            if col in X_new.columns:
                X_new[col] = le.transform(X_new[col].astype(str))
        try:
            return self.rf_model.predict(X_new)
        except Exception as e:
            logging.error(f"Erreur prédiction RandomForest: {e}")
            return None

    # ---------------- Evaluation ----------------
    def evaluate_rf(self, X_test, y_test):
        if self.rf_model is None:
            return {}
        y_pred = self.predict_rf(X_test)
        return {
            "mse": mean_squared_error(y_test, y_pred),
            "r2": r2_score(y_test, y_pred)
        }
