#include "DHT.h"

#define DHTPIN 2
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("ERR");
  } else {
    Serial.print("T=");
    Serial.print(t, 1);
    Serial.print(";H=");
    Serial.println(h, 1);
  }
  delay(2000);
}
