from ai.sql_validator import validate_sql
import pytest

def test_validate_sql_safe():
    validate_sql("SELECT * FROM health_facts")
    
def test_validate_sql_forbidden():
    import pytest
    with pytest.raises(ValueError):
        validate_sql("DROP TABLE health_facts")
