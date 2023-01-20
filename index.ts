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

//post signup
app.post("/signup", (req, res) => {
  const email = req.body.email;
  const nombre = req.body.nombre;

  usersCollection
    .where("email", "==", email)
    .get()
    .then((searchResponse) => {
      if (searchResponse.empty) {
        usersCollection
          .add({
            email,
            nombre,
          })
          .then((newUserRef) => {
            res.json({
              id: newUserRef.id,
              new: true,
            });
          });
      } else {
        res.status(400).json({
          message: "user already exists",
        });
      }
    });
});

//post auth
app.post("/auth", (req, res) => {
  const { email } = req.body;

  usersCollection
    .where("email", "==", email)
    .get()
    .then((searchResponse) => {
      if (searchResponse.empty) {
        res.status(404).json({
          message: "not found",
        });
      } else {
        res.json({
          id: searchResponse.docs[0].id,
        });
      }
    });
});

/* //post rooms
app.post("/rooms", (req, res) => {
  const { userId } = req.body;

  usersCollection
    .doc(userId.toString())
    .get()
    .then((doc) => {
      if (doc.exists) {
        const roomRef = rtdb.ref("rooms/" + nanoid());
        roomRef
          .set({
            messages: [],
            owner: userId,
          })
          .then(() => {
            const roomLongId = roomRef.key;
            const roomId = 1000 + Math.floor(Math.random() * 999);
            roomsCollection
              .doc(roomId.toString())
              .set({ rtdbRoomId: roomLongId })
              .then(() => {
                res.json({ id: roomId.toString() });
              });
          });
      } else {
        res.status(401).json({
          message: "doesn't exist",
        });
      }
    });
}); */

//post rooms 2.0
app.post("/rooms", (req, res) => {
  const { userId } = req.body;

  usersCollection
    .doc(userId.toString())
    .get()
    .then((doc) => {
      if (doc.exists) {
        const roomRef = rtdb.ref("rooms/" + nanoid());
        roomRef
          .set({
            messages: [],
            owner: userId,
          })
          .then(() => {
            const fullRoomId = roomRef.key;
            const roomId = fullRoomId.slice(16);
            roomsCollection
              .doc(roomId.toString())
              .set({ rtdbRoomId: fullRoomId })
              .then(() => {
                res.json({ id: roomId.toString() });
              });
          });
      } else {
        res.status(401).json({
          message: "doesn't exist",
        });
      }
    });
});

//get rooms:id
app.get("/rooms/:roomId", (req, res) => {
  const { userId } = req.query;
  const { roomId } = req.params;

  usersCollection
    .doc(userId.toString())
    .get()
    .then((doc) => {
      if (doc.exists) {
        roomsCollection
          .doc(roomId)
          .get()
          .then((snap) => {
            const data = snap.data();
            res.json(data);
          });
      } else {
        res.status(401).json({
          message: "doesn't exist",
        });
      }
    });
});

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
  const { rtdbRoomId } = req.body;
  const { messages } = req.body;

  const roomMessagesRef = rtdb.ref("rooms/" + rtdbRoomId + "/messages");
  roomMessagesRef.push(messages);
});

// get rooms
/* app.get("/rooms/:roomId", function (req, res) {
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
}); */

// get messages
app.get("/rooms/messages/:roomId", function (req, res) {
  const roomId = req.params.roomId;

  /*  const roomRef = rtdb.ref("rooms/" + roomId + "/messages");
  roomRef.get().then((snap) => {
    res.json(snap); */

  var roomRef = rtdb.ref("rooms/" + roomId + "/messages");
  roomRef.on("value", (snapshot) => {
    return snapshot.val();
  });
});

// SETEA EL PUERTO
app.listen(port, () => {
  console.log(`iniciado en http://localhost:${port}`);
});
