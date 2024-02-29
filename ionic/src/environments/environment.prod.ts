// You'll need to create the credentials.ts file your own firebase credentials
import { firebaseConfig } from "./credentials";

export const environment = {
  firebase: firebaseConfig,
  production: true
};
