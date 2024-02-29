// ********************************************************************
// 1- create an api user with permissions to call functions on Particle:
//    https://docs.particle.io/getting-started/cloud/cloud-api/#api-users
// 2- set the key by running this command in the terminal, under the functions folder:
//    $ firebase functions:config:set api.key.callfx='1235083045abcdef'
// 3- set the Particle product of your Monitor One device:
//    $ firebase functions:config:set particle.productid='123456'
// 4- set the device id of your Monitor One device:
//    $ firebase functions:config:set particle.deviceid='1234567890abcdef'
// 5- deploy like this:
//    $ firebase deploy --only functions
//
// NOTE: always install npm libraries from the functions folder.
//
// ********************************************************************
import * as functions from "firebase-functions";
import * as bent from "bent";
import * as formurlencoded from "form-urlencoded";
import admin = require("firebase-admin");
admin.initializeApp();

// ********************************************************************
// call a function on Particle
// ********************************************************************
export const callParticleFunction = functions.https.onCall(async (data, context): Promise<string> => {

    console.log("Data is", data);

    if (!verifyCallerInfo(context))
        return Promise.reject("User not signed in");

    let functionName: string = "";
    let arg: string = "";
    try {
        functionName = data.functionName;
        arg = data.arg;
    } catch (err) {
        console.log(err);
        return Promise.reject("Missing function name or args");
    }

    const form = {
        arg: arg
    };

    try {
        // we store the key with:
        // firebase functions:config:set api.key.callfx='1235083045abcdef'
        const key = functions.config().api.key.callfx;
        const productid = functions.config().particle.productid;
        const deviceid = functions.config().particle.deviceid;
        const PARTICLE_FUNCTIONS: string = "/v1/products/" + productid + "/devices/";
        const url = PARTICLE_FUNCTIONS + deviceid + "/" + functionName;

        const PARTICLE_API: string = "https://api.particle.io";
        const post = bent(PARTICLE_API, "POST", "json", [200]);
        const headers = {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/x-www-form-urlencoded"
        };
        let response = await post(url, formurlencoded(form), headers);

        console.log("POST function call response", response);

        return Promise.resolve(JSON.stringify(response));
    }
    catch (err) {
        console.error("the function call failed");
        console.error(err);
        return Promise.reject("error")
    }

});


export function verifyCallerInfo(context: any): boolean {
    if (!context.auth) {
        return false;
    }
    try {
        const callerEmail = context.auth?.token?.email ?? null;
        const callerUid = context.auth?.token?.uid || null;
        if ((!callerEmail) || (!callerUid)) {
            return false;
        }
    }
    catch (err) {
        console.error("verifyCallerInfo", err);
        return false;
    }

    console.log("verifyCallerInfo ok");
    return true;
}
