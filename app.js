require("dotenv").config();
const csurf = require("csurf");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
var app = express();


app.use(bodyParser.json());
app.use(cors({ credentials: true, origin: true, withCredentials: true }));
app.use(cookieParser("secret"));
var csrfProtection = csurf({
  cookie: true,
  ignoreMethods: ["GET", "POST", "HEAD", "OPTIONS"],
});
var adminController = require("./admin/adminController.js");
var guestController = require("./guest/guestController.js");
var userController = require("./users/userController.js");

let options = {
  httpOnly: true,
};

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.listen(process.env.PORT, () =>
  console.log(`Server started at port : ${process.env.PORT}`)
);
app.use(csrfProtection);
app.use("/guest", guestController);
app.use(authenticateToken);
app.use("/admin", adminController);
app.use("/users", userController);

app.get("/refreshtoken", urlencodedParser, (req, res, next) => {
  const refreshToken = req.cookies.authorization.refreshToken;
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = jwt.sign({ user_id: user.user_id, priviledge: user.priviledge },process.env.ACCESS_TOKEN_SECRET,{ expiresIn: "24h" });
    console.log("refreshed");
    res.cookie("authorization",{ accessToken: accessToken, refreshToken: refreshToken },options);
    res.json({ user_id: user.user_id, accessToken: accessToken });
  });
});

function authenticateToken(req, res, next) {
  const token = req.signedCookies["authorization"].accessToken;
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}
