// require('dotenv').config({path: './env'})
import connectDB from "./db/indexdb.js";
import dotenv from "dotenv"


dotenv.config({
    path: './.env'
})

connectDB()




/*
import express from "express"
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", () => {
        console.log("Error:", error);
        throw error
    })

    app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`)
    })

  } catch (err) {
    console.error("ERROR", err);
    throw err;
  }
})()*/
