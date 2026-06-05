"""Centralized logging configuration for all modules."""

import logging
import sys
from datetime import datetime

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(levelname)-8s | %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)

# Get module-specific loggers
logger_generador = logging.getLogger("app.generador")
logger_decision_tree = logging.getLogger("app.decision_tree")
logger_web_scraper = logging.getLogger("app.web_scraper")
logger_residue_tracking = logging.getLogger("app.residue_tracking")
logger_partners = logging.getLogger("app.partners")
logger_banobras = logging.getLogger("app.banobras")


class AuditLogger:
    """Log all data mutations for audit trail."""

    def __init__(self):
        self.logger = logging.getLogger("app.audit")

    def log_create(self, entity_type: str, entity_id: str, user_id: str, data: dict) -> None:
        """Log entity creation."""
        self.logger.info(
            f"CREATE | {entity_type} | id={entity_id} | user={user_id} | data={data}"
        )

    def log_update(self, entity_type: str, entity_id: str, user_id: str, changes: dict) -> None:
        """Log entity update."""
        self.logger.info(
            f"UPDATE | {entity_type} | id={entity_id} | user={user_id} | changes={changes}"
        )

    def log_delete(self, entity_type: str, entity_id: str, user_id: str) -> None:
        """Log entity deletion."""
        self.logger.info(
            f"DELETE | {entity_type} | id={entity_id} | user={user_id}"
        )

    def log_access(self, entity_type: str, entity_id: str, user_id: str, action: str) -> None:
        """Log data access."""
        self.logger.info(
            f"ACCESS | {entity_type} | id={entity_id} | user={user_id} | action={action}"
        )


audit_logger = AuditLogger()
