// ********************************************************************
//
// HOW TO USE
//
// 1- create an api user with permissions to call functions on Particle:
//    https://docs.particle.io/getting-started/cloud/cloud-api/#api-users
//
// 2- create an .env file under the functions folder with the following:
//    API_KEY_CALLFX="1235083045abcdef"
//    PARTICLE_PRODUCTID="123456"
//    PARTICLE_DEVICEID="1234567890abcdef"
//
//    Do not commit the .env file to your repository.
//
// 3- deploy like this:
//    $ firebase deploy --only functions
//
// NOTE: always install npm libraries from the functions folder.
//
// ********************************************************************
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2");

import * as bent from "bent";
import * as formurlencoded from "form-urlencoded";
import admin = require("firebase-admin");
admin.initializeApp();

// ********************************************************************
// call a function on Particle
// ********************************************************************
exports.callParticleFunction = onCall(async (request: any) => {

    logger.info("Request is", request);
    logger.info("Request data is", request.data);
    logger.info("Request auth is", request.auth);

    if (!verifyCallerInfo(request.auth))
        throw new HttpsError("not signed in", "User not signed in.");

    let functionName: string = "";
    let arg: string = "";
    try {
        functionName = request.data.functionName;
        arg = request.data.arg;
    } catch (err) {
        logger.info(err);
        throw new HttpsError("invalid data", "Missing function name or args.");
    }

    const form = {
        arg: arg
    };

    try {
        // env variables have to be stored as described at the top of this file
        const key = process.env.API_KEY_CALLFX;
        const productid = process.env.PARTICLE_PRODUCTID;
        const deviceid = process.env.PARTICLE_DEVICEID;

        // validate secrets
        if ((!key) || (!productid) || (!deviceid)) {
            logger.error("missing environment variables.");
            throw new HttpsError("internal", "Missing environment variables.");
        }

        const PARTICLE_FUNCTIONS: string = "/v1/products/" + productid + "/devices/";
        const url = PARTICLE_FUNCTIONS + deviceid + "/" + functionName;

        const PARTICLE_API: string = "https://api.particle.io";
        const post = bent(PARTICLE_API, "POST", "json", [200]);
        const headers = {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/x-www-form-urlencoded"
        };
        let response = await post(url, formurlencoded(form), headers);

        logger.info("POST function call response", response);

        return JSON.stringify(response);
    }
    catch (err) {
        logger.error("the function call failed");
        logger.error(err);
        throw new HttpsError("internal", "The function call failed.");
    }

});


export function verifyCallerInfo(auth: any): boolean {
    if (!auth) {
        return false;
    }
    try {
        const callerEmail = auth?.token?.email ?? null;
        const callerUid = auth?.token?.uid || null;
        if ((!callerEmail) || (!callerUid)) {
            return false;
        }
    }
    catch (err) {
        logger.error("verifyCallerInfo", err);
        return false;
    }

    logger.info("verifyCallerInfo ok");
    return true;
}
