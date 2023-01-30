import { rtdb, firestore } from "./db";
import * as express from "express";
import { nanoid } from "nanoid";
import * as cors from "cors";

const port = 3000;
const app = express();

app.use(express.json());
app.use(cors());

const usersCollection = firestore.collection("users");
const roomsCollection = firestore.collection("rooms");

// post auth
app.post("/auth", (req, res) => {
  const { email } = req.body;
  const { fullname } = req.body;

  usersCollection
    .where("email", "==", email)
    .get()
    .then((searchResponse) => {
      if (searchResponse.empty) {
        const fullUserId = nanoid();
        const userId = fullUserId.slice(16);
        usersCollection
          .doc(userId.toString())
          .set({ email: email, fullname: fullname, userId: fullUserId })
          .then(() => {
            res.json({ id: userId.toString() });
          });
      } else {
        res.json({
          id: searchResponse.docs[0].id,
        });
      }
    });
});

// post rooms
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
                res.json({
                  id: roomId.toString(),
                  fullId: fullRoomId.toString(),
                });
              });
          });
      } else {
        res.status(401).json({
          message: "doesn't exist",
        });
      }
    });
});

// get rooms
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

// get existing room
app.get("/room/:roomId", (req, res) => {
  const { roomId } = req.params;

  roomsCollection
    .doc(roomId.toString())
    .get()
    .then((roomData) => {
      const data = roomData.data();
      res.json(data);
    });
});

// post messages
app.post("/messages", (req, res) => {
  const { rtdbRoomId } = req.body;
  const { message } = req.body;
  const { from } = req.body;

  const roomMessagesRef = rtdb.ref(`rooms/${rtdbRoomId}/messages`);

  roomMessagesRef
    .push({ message: message, from: from })
    .then((r) => res.json(r));
});

/* // get messages
app.get("/rooms/messages/:roomId", function (req, res) {
  const roomId = req.params.roomId;

  var roomRef = rtdb.ref("rooms/" + roomId + "/messages");
  roomRef.on("value", (snapshot) => {
    return snapshot.val();
  });
}); */

app.delete("/deleteroom", (req, res) => {
  const { roomId } = req.body;

  roomsCollection
    .doc(roomId.toString())
    .delete()
    .then(() => {
      res.json("Document successfully deleted!");
      console.log("Document successfully deleted!");
    })
    .catch((error) => {
      res.json("Error removing document");
      console.error("Error removing document: ", error);
    });
});

// SETEA EL PUERTO
app.listen(port, () => {
  console.log(`iniciado en http://localhost:${port}`);
});
