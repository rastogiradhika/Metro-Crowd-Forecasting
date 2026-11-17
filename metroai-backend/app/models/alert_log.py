from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.station_id", ondelete="CASCADE"), nullable=False, index=True)
    station_name = Column(String(255), nullable=True)
    risk_level = Column(String(50), nullable=False, index=True)  # LOW, MODERATE, HIGH, CRITICAL
    predicted_inflow = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationship to Station
    station = relationship("Station", backref="alert_logs")

    def __repr__(self):
        return f"<AlertLog station_id={self.station_id} risk={self.risk_level} inflow={self.predicted_inflow}>"
