import os
import time

master, slave = os.openpty()
print("PTY=%s" % os.ttyname(slave), flush=True)

i = 0
while True:
    line = "T=%.1f;H=%.1f\n" % (29.0 + (i % 5) * 0.3, 55.0 + (i % 5))
    os.write(master, line.encode())
    i += 1
    time.sleep(2)
