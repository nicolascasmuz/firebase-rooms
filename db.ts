import * as admin from "firebase-admin";
import * as serviceAccount from "./key-rooms.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
  databaseURL:
    "https://rooms-f59c5-default-rtdb.europe-west1.firebasedatabase.app",
});

const firestore = admin.firestore();
const rtdb = admin.database();

export { firestore, rtdb };
