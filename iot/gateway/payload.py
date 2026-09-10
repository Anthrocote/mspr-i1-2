import json


def format_iso8601(t):
    # t : time tuple (year, month, mday, hour, minute, second, ...)
    return "%04d-%02d-%02dT%02d:%02d:%02dZ" % (t[0], t[1], t[2], t[3], t[4], t[5])


def build_payload(temperature, humidite, mesure_le, device_id):
    return json.dumps({
        "temperature": temperature,
        "humidite": humidite,
        "mesure_le": mesure_le,
        "device_id": device_id,
    })
