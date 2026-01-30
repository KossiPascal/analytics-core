# 11️⃣ ai/predictor.py – Prédiction complète

from prophet import Prophet
import pandas as pd
import logging

class Predictor:
    """Prédiction et tendances"""

    def forecast(self, df: pd.DataFrame, periods=30):
        if df.empty or 'period' not in df.columns or 'value' not in df.columns:
            logging.warning("DataFrame invalide pour prédiction")
            return []
        try:
            df_model = df.rename(columns={'period':'ds','value':'y'})
            model = Prophet()
            model.fit(df_model)
            future = model.make_future_dataframe(periods=periods)
            forecast = model.predict(future)
            return forecast[['ds','yhat','yhat_lower','yhat_upper']].tail(10).to_dict(orient='records')
        except Exception as e:
            logging.error(f"Erreur prédiction: {e}")
            return []

    def trend(self, df: pd.DataFrame, column='value'):
        if df.empty or column not in df.columns:
            return None
        try:
            return df[column].diff().mean()
        except Exception as e:
            logging.error(f"Erreur trend: {e}")
            return None
