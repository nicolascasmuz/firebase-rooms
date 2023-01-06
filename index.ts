import { rtdb, firestore } from "./db";
import * as express from "express";
import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";
import * as cors from "cors";

const port = 3000;
const app = express();

app.use(express.json());
app.use(cors());

const usersCollection = firestore.collection("users");
const roomsCollection = firestore.collection("rooms");

// post rooms
app.post("/rooms", function (req, res) {
  const longRoomId = req.body.longRoomId;
  const shortRoomId = req.body.shortRoomId;

  roomsCollection.doc(shortRoomId.toString()).set({ fullRoomId: longRoomId });
});

// post users
app.post("/users", function (req, res) {
  const longUserId = req.body.longUserId;
  const shortUserId = req.body.shortUserId;
  const userEmail = req.body.userEmail;
  const userFullname = req.body.userFullname;

  usersCollection
    .doc(shortUserId.toString())
    .set({ userId: longUserId, email: userEmail, fullname: userFullname });
});

// post messages
app.post("/messages", (req, res) => {
  const { roomId } = req.body;
  const { messages } = req.body;

  const roomMessagesRef = rtdb.ref("rooms/" + roomId + "/messages");
  roomMessagesRef.push(messages);
});

// get rooms
app.get("/rooms/:roomId", function (req, res) {
  const existingRoom = req.params.roomId;

  roomsCollection
    .get()
    .then((roomsSnap) => {
      const roomsDoc = roomsSnap.docs;
      const foundRoom = roomsDoc.find((r) => {
        const path = r.ref.path.slice(6);
        return path == existingRoom;
      });
      return foundRoom;
    })
    .then((slicedPath) => {
      res.json(slicedPath);
    });
});

// get messages
app.get("/rooms/messages/:roomId", function (req, res) {
  const roomId = req.params.roomId;

  const roomRef = rtdb.ref("rooms/" + roomId + "/messages");
  roomRef.get().then((snap) => {
    res.json(snap);
  });
});

// SETEA EL PUERTO
app.listen(port, () => {
  console.log(`iniciado en http://localhost:${port}`);
});