#include "Particle.h"
#include "edge.h"
#include "monitor_edge_ioexpansion.h" // For general pin defines
#include "BeaconScanner.h"

SYSTEM_THREAD(ENABLED);
SYSTEM_MODE(SEMI_AUTOMATIC);

#if EDGE_PRODUCT_NEEDED
PRODUCT_ID(EDGE_PRODUCT_ID);
#endif // EDGE_PRODUCT_NEEDED
PRODUCT_VERSION(EDGE_PRODUCT_VERSION);

#define BLACK_BUTTON "B4:35:22:28:AB:38"
#define WHITE_BUTTON "5C:C7:C1:EE:37:D2"

Ledger garageLedger;

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
int previousStatus = -1;

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

// if the status of the input changes, update the ledger
void checkStatus()
{
    // The general purpose 24V input is inverted as it passes through an optoisolator.
    // The garage is closed when the dry contact is closed, so we invert the input.
    status = !digitalRead(MONITOREDGE_IOEX_DIGITAL_IN_PIN);

    if (status != previousStatus)
    {
        previousStatus = status;

        // Save the value to the ledger.
        // The ledger will automatically be synced to the cloud by DeviceOS pretty fast (I observed 200 msec or so)
        // This sync consumes one Data Operation:
        // https://www.particle.io/pricing/#How-are-data-automation-activities-charged?
        Variant data;
        data.set("status", status);                           // this is for the web app
        data.set("statusH", status == 0 ? "open" : "closed"); // this is for humans
        if (Time.isValid())
        {
            data.set("time", Time.now());                             // this is for the web app
            data.set("timeH", Time.format(TIME_FORMAT_ISO8601_FULL)); // this is for humans
        }
        garageLedger.set(data);
        Log.info("set ledger %s", data.toJSON().c_str());
    }
}

void setup()
{
    Edge::instance().init();

    Particle.function("toggleRelay", toggleRelayCloudFx);
    Particle.function("getStatus", getStatusCloudFx);

    garageLedger = Particle.ledger("garage-monitor-edge");
}

void loop()
{
    Edge::instance().loop();

    checkStatus();

    static unsigned long lastTime = millis();
    unsigned long now = millis();
    if ((now - lastTime) >= 2000)
    {
        lastTime = now;
        Log.info("status: %s", status == 0 ? "open" : "closed");
    }

    if (toggleRelay)
    {
        toggleRelay = false;
        digitalWrite(MONITOREDGE_IOEX_RELAY_OUT_PIN, HIGH);
        delay(1000);
        digitalWrite(MONITOREDGE_IOEX_RELAY_OUT_PIN, LOW);
    }

    static unsigned long scannedTime = 0;
    if ((millis() - scannedTime) > 100)
    {
        Log.info("Scanning...");
        scannedTime = millis();

        Scanner.scan(1, SCAN_BTHOME);

        Vector<BTHome> beacons = Scanner.getBTHome();
        while (!beacons.isEmpty())
        {
            BTHome beacon = beacons.takeFirst();
            Log.info("BTHome Address: %s, Battery: %d, Button: %d, Window: %d, Rotation: %d", beacon.getAddress().toString().c_str(), beacon.getBatteryLevel(), beacon.getButtonEvent(), beacon.getWindowState(), beacon.getRotation());

            if (strcmp(beacon.getAddress().toString().c_str(), BLACK_BUTTON) == 0 || strcmp(beacon.getAddress().toString().c_str(), WHITE_BUTTON) == 0)
            {
                Log.info("beacon.getButtonEvent() = %d", beacon.getButtonEvent());

                if (beacon.getButtonEvent() > 0)
                {
                    Log.info("Button pressed");
                    toggleRelay = true;
                }
            }
        }
    }
}
