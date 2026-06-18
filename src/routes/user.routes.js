import { Router } from "express";
import { loginUser, logoutUser, registerUser, requestAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()
console.log("User routes loaded");


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// router.get("/test", (req, res) => {
//     res.send("test route works");
// });

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(requestAccessToken)
export default router