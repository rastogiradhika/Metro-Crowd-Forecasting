from sqlalchemy import Column, Integer, String, Float, Boolean
from app.core.database import Base


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    line = Column(String(50), index=True, nullable=False)
    gates = Column(Integer, default=2)
    lifts = Column(Integer, default=2)
    platforms = Column(Integer, default=2)
    concourses = Column(Integer, default=2)
    interchange = Column(Boolean, default=False)

    def __repr__(self):
        return f"<Station {self.station_id}: {self.name} ({self.line})>"
