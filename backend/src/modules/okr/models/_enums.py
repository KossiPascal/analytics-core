import enum
import uuid
from backend.src.app.configs.extensions import db


def generate_uuid():
    return str(uuid.uuid4())

# ENUMS
class DirectionEnum(enum.Enum):
    INCREASE = "increase"
    DECREASE = "decrease"
    MAINTAIN = "maintain"          # garder une valeur stable
    RANGE = "range"                # rester dans une plage (ex: 95-100%)

class ActivityStatusEnum(enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    ON_HOLD = "on_hold"
    DONE = "done"
    CANCELLED = "cancelled"

class ActivityPriorityEnum(enum.Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatusEnum(enum.Enum):
    BACKLOG = "backlog"
    TODO = "todo"
    READY = "ready"
    DOING = "doing"
    REVIEW = "review"
    BLOCKED = "blocked"
    DONE = "done"
    CANCELLED = "cancelled"

class ProjectStatusEnum(enum.Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RiskLevelEnum(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MilestoneStatusEnum(enum.Enum):
    PENDING = "pending"
    ACHIEVED = "achieved"
    DELAYED = "delayed"

class GlobalStatusEnum(enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"