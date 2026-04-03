const mongoose = require("mongoose");

const uri =
  "mongodb+srv://mattiaseskilsson_db_user:mattias123@cluster-workout-app.xlmiecv.mongodb.net/?appName=Cluster-Workout-App";

async function run() {
  try {
    await mongoose.connect(uri, {
      dbName: "workout-app",
    });
    console.log("Connected to mongoDB with mongoose");

    const userSchema = new mongoose.Schema({
      name: {
        type: String,
        required: true,
      },
      age: Number,
      address: String,
    });

    const User = mongoose.model("User", userSchema);

    const user = new User({
      name: "Mattias",
      age: 31,
      address: "Skomakarebyn 7E",
    });

    await user.save();
    console.log("User Inserted!");
    console.log(user);
  } catch (error) {
    console.log(error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
