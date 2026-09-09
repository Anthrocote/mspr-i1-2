def parse_line(line):
    line = line.strip()
    if not line.startswith("T=") or ";H=" not in line:
        return None
    try:
        temp_part, hum_part = line.split(";H=")
        return float(temp_part[2:]), float(hum_part)
    except (ValueError, IndexError):
        return None
