from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Thresholds:
    ideal_temperature: float
    ideal_humidity: float
    temp_tolerance: float = 3.0
    humidity_tolerance: float = 2.0

    def is_out_of_range(self, temperature: float, humidity: float) -> bool:
        temp_ko = abs(temperature - self.ideal_temperature) > self.temp_tolerance
        hum_ko = abs(humidity - self.ideal_humidity) > self.humidity_tolerance
        return temp_ko or hum_ko


def is_expired(arrived_at: datetime, now: datetime, max_age_days: int = 365) -> bool:
    return (now - arrived_at).days > max_age_days
