from datetime import datetime

def parse_date(date_str):
    return datetime.strptime(date_str, "%Y-%m-%d")

def format_float(value):
    return round(float(value),2)
