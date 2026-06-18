// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})
import connectDB from "./db/indexdb.js";
import express from "express";
import {app} from "./app.js"

// console.log("PORT =", process.env.PORT);
// console.log("ACCESS_TOKEN_SECRET =", process.env.ACCESS_TOKEN_SECRET);
// console.log("REFRESH_TOKEN_SECRET =", process.env.REFRESH_TOKEN_SECRET);

connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server running at: , ${process.env.PORT}`)
  })
})
.catch((err) => {
  console.log("MONGODB connection failed", err);
})






























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
