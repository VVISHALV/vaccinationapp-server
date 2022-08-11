const express = require("express");
const bodyParser = require("body-parser");
var router = express.Router();
const con = require("../db.js");
const { authRole } = require("../permission");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const csurf = require("csurf");
var csrfProtection = csurf({
  cookie: true,
  ignoreMethods: ["GET", "POST", "HEAD", "OPTIONS"],
});
ADMIN_ROLE = 1;
MEDICO_ROLE = 2;
router.use(authRole(ADMIN_ROLE, MEDICO_ROLE));
router.post("/updateslot", (req, res, next) => {
  con.query(
    `insert into camp(city_id,slot,seats) values ('${req.body.city_id}','${req.body.slot}','${req.body.seats}');`,
    (err, result, fields) => {
      if (err) {
        if (err.errno.toString() === "1062") {
          con.query(
            `update camp set  seats=${req.body.seats} where city_id=${req.body.city_id} and slot=${req.body.slot};`,
            function (err, result, fields) {
              if (err) {
                res.send(err.errno);
                return;
              }
              res.send(JSON.stringify(result));
            }
          );
          return;
        }
        res.send(JSON.stringify(result));
      }
    }
  );
});

router.post("/addcity", urlencodedParser, (req, res, next) => {
  con.query(
    `insert into cities(city) values('${req.body.city}');`,
    function (err, result, fields) {
      if (err) {
        res.send(err.code);
        return;
      }
      res.send(JSON.stringify(result));
    }
  );
});
router.get("/getusers", urlencodedParser, (req, res, next) => {
  con.query(
    `SELECT users.firstname,details.*,cities.city FROM details
    INNER JOIN users ON details.user_id=users.user_id 
    INNER JOIN cities ON details.city_id=cities.city_id;`,
    function (err, result, fields) {
      if (err) {
        res.send(err);
        return;
      }
      res.send(JSON.stringify(result));
    }
  );
});
router.post("/approveuser", urlencodedParser, (req, res, next) => {
  var today = new Date();
  today = today.toISOString().substring(0, 10);
  con.query(
    `update details set status=1,taken_date='${today}' where user_id='${req.body.user_id}' and status=0;`,
    function (err, result, fields) {
      if (err) {
        res.json({ success: "0", message: "something wrong" });
        return;
      }
      res.json({ success: "1", message: "approved successfully" });
    }
  );
});
module.exports = router;
