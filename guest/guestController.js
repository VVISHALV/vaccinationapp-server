const express = require("express");
const bodyParser = require("body-parser");
var router = express.Router();
const jwt = require("jsonwebtoken");
const con = require("../db.js");
const bcrypt = require("bcryptjs");
const csurf =require('csurf');
var csrfProtection = csurf({ cookie: true , ignoreMethods: ["GET","POST", "HEAD", "OPTIONS"],})
let options = {
  signed:true,
  httpOnly: true,
};

var urlencodedParser = bodyParser.urlencoded({ extended: false });
router.get("/logout", urlencodedParser, (req, res, next) => {
  res.clearCookie("authorization");
  res.clearCookie("XSRF-TOKEN");
  res.clearCookie("_csrf");
  res.end();
});
router.post("/register", urlencodedParser, (req, res, next) => {
  con.query(`SELECT * FROM users where mobile='${req.body.mobile}' `,
    async function (err, result, fields) {
      if (err) {
        res.send(err);
        return;
      }
      if (result[0] === undefined) {
        await con.query(`INSERT INTO users (firstname, lastname, mobile ,aadhaar,dob,password )VALUES ('${req.body.firstname}','
        ${req.body.lastname}','${req.body.mobile}','${req.body.aadhaar}','${req.body.dob}','${await bcrypt.hash(req.body.password, 5)}');`,
          function (err, result, fields) {
            if (err) {
              res.send(err);
              return;
            }
          }
        );
        res.json({"success":"1","message":"registered successfully"});
        return;
      } else {
        res.json({"success":"0","message":"already registered"});
        return;
      }
    }
  );
});

router.post("/login", urlencodedParser,csrfProtection, async (req, res, next) => {
  con.query(`SELECT * FROM users where users.mobile='${req.body.mobile}';`,
    async function (err, result, fields) {
      if (err) {
        res.send(err);
        return;
      }
      if (result[0] === undefined) {
        res.json({"success":"0","message":"no user"});
        return;
      }
      pass = result[0].password;
      valid = await bcrypt.compare(req.body.password, pass);
      if (result[0] === undefined || !valid) {
        res.json({"success":"0","message":"invalid credentials"});
        return;
      } else {
        const user = {user_id: result[0].user_id,priviledge: result[0].priviledge,};
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "24h",});
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        res.cookie('XSRF-TOKEN', req.csrfToken());
        res.cookie("authorization",{ accessToken: accessToken, refreshToken: refreshToken },options);
        res.json({user_id: result[0].user_id,accessToken: accessToken,refreshToken: refreshToken,});
        return;
      }
    }
  );
});
router.get("/getcities", urlencodedParser, (req, res, next) => {
  con.query(`select * from cities;`, function (err, result, fields) {
    if (err) {
      res.send(err);
      return;
    }
    res.send(JSON.stringify(result));
  });
});
router.get("/getcampandcities", urlencodedParser,(req, res, next) => {
  con.query(`select * from camp INNER JOIN cities ON camp.city_id=cities.city_id;`,
    function (err, result, fields) {
      if (err) {
        res.send(err);
        return;
      }
      res.send(JSON.stringify(result));
    }
  );
});
module.exports = router;
