#include "Particle.h"
#include "edge.h"
#include "monitor_edge_ioexpansion.h" // For general pin defines

SYSTEM_THREAD(ENABLED);
SYSTEM_MODE(SEMI_AUTOMATIC);

#if EDGE_PRODUCT_NEEDED
PRODUCT_ID(EDGE_PRODUCT_ID);
#endif // EDGE_PRODUCT_NEEDED
PRODUCT_VERSION(EDGE_PRODUCT_VERSION);

STARTUP(
    Edge::startup(););

SerialLogHandler logHandler(115200, LOG_LEVEL_INFO,
                            {
                                {"app.gps.nmea", LOG_LEVEL_WARN},
                                {"app.gps.ubx", LOG_LEVEL_WARN},
                                {"ncp.at", LOG_LEVEL_WARN},
                                {"net.ppp.client", LOG_LEVEL_WARN},
                            });

bool toggleRelay = false;

// -1: unknown
//  0: garage open
//  1: garage closed
int status = -1;

// set a flag that loop() will read
int toggleRelayCloudFx(String parameter)
{
    toggleRelay = true;
    return 0;
}

int getStatusCloudFx(String parameter)
{
    return status;
}

void setup()
{
    Edge::instance().init();

    Particle.function("toggleRelay", toggleRelayCloudFx);
    Particle.function("getStatus", getStatusCloudFx);

    // pinMode(A5, INPUT);
}

void loop()
{
    Edge::instance().loop();

    static unsigned long lastTime = millis();
    unsigned long now = millis();
    if ((now - lastTime) >= 2000)
    {
        lastTime = now;
        Log.info("status: %s", status == 0 ? "open" : "closed");
    }

    // The general purpose 24V input is inverted as it passes through an optoisolator.
    // The garage is closed when the dry contact is closed, so we invert the input.
    status = !digitalRead(MONITOREDGE_IOEX_DIGITAL_IN_PIN);

    if (toggleRelay)
    {
        toggleRelay = false;
        digitalWrite(MONITOREDGE_IOEX_RELAY_OUT_PIN, HIGH);
        delay(1000);
        digitalWrite(MONITOREDGE_IOEX_RELAY_OUT_PIN, LOW);
    }
}
