const exp = require("express");
const mongoClient = require("mongodb").MongoClient;
const path = require("path");
const { uploadMiddleware } = require("./middlewares/fileUpload");
require("dotenv").config();
const app = exp();
const cors = require("cors");

app.use(cors());
app.use(exp.json());
app.use(uploadMiddleware);

mongoClient
  .connect(process.env.DB_URL)
  .then((client) => {
    const neosync = client.db("neosync");
    const usersCollection = neosync.collection("usersCollection");
    app.set("neosync", neosync);
    app.set("usersCollection", usersCollection);
    console.log("DB Connection Successful");
  })
  .catch((err) => console.log("Error in connection of database", err));

const userApp = require("./APIs/userApi");
const projectApp = require("./APIs/projectApi");
const notificationApi = require("./APIs/notificationApi");
const reviewApi = require("./APIs/reviewApi");
const youtubeApi = require("./APIs/youtubeApi");

app.use("/userApi", userApp);
app.use("/projectApi", projectApp);
app.use("/notificationApi", notificationApi);
app.use("/reviewApi", reviewApi);
app.use("/youtubeApi", youtubeApi);

app.use((err, req, res, next) => {
  res.send({ message: "error", payload: err.message });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
