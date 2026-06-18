import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"



const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    }
    catch(err){
        console.log(err);
        throw new ApiError(500, "Something went wrong while generating the access and refresh tokens")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    

    // 1) Get User Details from Frontend
    const {username, fullname, email, password} = req.body;
    // console.log("email: " ,email);


    // 2) Validation not empty
    if([fullname, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }


    // 3) Check if user already exists
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User already exists with given username or email")
    }


    // console.log("req.body =", req.body);
    // console.log("req.files =", req.files);

    // 4) Check for Images
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


    // Used because we get undefined error when the user keeps the coverImage field empty
    // let coverImageLocalPath;
    // if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }


    // 5) Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }


    // 6) Create User object and make an entry in DB
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    // 7) Remove password and RefreshToken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    // 8) Check for User Creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering")
    }


    // 9) Sending the response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})


const loginUser = asyncHandler( async (req, res) => {
     
    // 1) Take data from req body
    const {email, username, password} = req.body;

    // 2) Username or email
    if(!(username || email)){
        throw new ApiError(400, "Username or email is required");
    }

    // 3) Find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User doesn't exist");
    }

    // 4) Password Check
    const validPassword = await user.isPasswordCorrect(password)
    if(!validPassword){
        throw new ApiError(404, "Invalid User Credentials");
    }


    // 5) Access and Refresh Token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    // 6) Send Cookie
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).
    cookie("accessToken", accessToken, options).
    cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User Logged in Successfully"
        )
    )
})


const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).
    json(new ApiResponse(200, {}, "User Logged out Successfully"))
})


const requestAccessToken = asyncHandler(async (req, res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res.status(200).
        cookie("accessToken", accessToken, options).
        cookie("refresh Token", newrefreshToken, options).
        json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})


export {registerUser, loginUser, logoutUser, requestAccessToken} 