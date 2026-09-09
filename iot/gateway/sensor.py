DHT22_TEMP_MIN = -40
DHT22_TEMP_MAX = 80
DHT22_HUM_MIN = 0
DHT22_HUM_MAX = 100


def is_plausible(temperature, humidite):
    return (DHT22_TEMP_MIN <= temperature <= DHT22_TEMP_MAX
            and DHT22_HUM_MIN <= humidite <= DHT22_HUM_MAX)
