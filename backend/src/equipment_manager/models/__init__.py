from backend.src.equipment_manager.models.locations import Region, District, Site, ZoneASC
from backend.src.equipment_manager.models.asc import ASC, Supervisor, em_supervisor_sites
from backend.src.equipment_manager.models.employees import Department, Position, Employee, EmployeeHistory
from backend.src.equipment_manager.models.equipment import Equipment, EquipmentHistory, Accessory
from backend.src.equipment_manager.models.tickets import (
    ProblemType, RepairTicket, Issue, TicketEvent, TicketComment,
    DelayAlertRecipient, DelayAlertLog,
)
