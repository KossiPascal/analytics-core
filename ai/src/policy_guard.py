# 16️⃣ ai/policy_guard.py – Filtrage multi-niveau

import logging

class PolicyGuard:
    @staticmethod
    def filter(df, role='national', region=None, district=None):
        if df.empty:
            return df
        try:
            if role == 'district' and district:
                return df[df['district'] == district]
            if role == 'region' and region:
                return df[df['region'] == region]
            return df
        except Exception as e:
            logging.error(f"Erreur PolicyGuard: {e}")
            return df
