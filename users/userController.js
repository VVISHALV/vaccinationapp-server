const express = require("express");
const bodyParser = require("body-parser");
var router = express.Router();
const con = require("../db.js");
const {authRole,authCurrentUser} = require("../permission");
const csurf =require('csurf');
var csrfProtection = csurf({ cookie: true , ignoreMethods: ["GET","POST", "HEAD", "OPTIONS"],})
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var last=0;
var today = new Date();
MAX_DOSAGE=2;
USER_ROLE = 0;
ADMIN_ROLE = 1;
MEDICO_ROLE = 2;
router.use(authRole(USER_ROLE, ADMIN_ROLE, MEDICO_ROLE));
router.use(authCurrentUser())
router.post("/retrieve", urlencodedParser,csrfProtection, (req, res, next) => {con.query(
  `SELECT users.firstname,cities.city,details.* FROM details 
  INNER JOIN users ON details.user_id=users.user_id 
  INNER JOIN cities ON details.city_id=cities.city_id where details.user_id='${req.body.user_id}' order by dosage;`,
  function (err, result, fields) {
    if (err) {
      res.send(err);
      return;
    }
    res.send(JSON.stringify(result));
  }
  );
});

router.post("/bookslot", urlencodedParser,validate(), (req, res, next) => {con.query(
  `insert into details(city_id,slot,user_id,dosage,date) values ('${req.body.city_id}','${req.body.slot}','${req.body.user_id}','${last + 1}','${today}') ;update camp set seats=seats-1 where city_id='${req.body.city_id}' and slot='${req.body.slot}'`,
  (err, result, fields) => {
    if (err) {
      res.send(err);
      return;
    }
    res.send(JSON.stringify(result));
  }
  );
});

router.post("/loaduser", urlencodedParser, (req, res, next) => {con.query(`select * from users where user_id='${req.body.user_id}';`,
    function (err, result, fields) {
      if (err) {
        res.send(err);
        return;
      }
      res.send(result);
    }
  );
});

function dayGap(myDate) {
  let difference = new Date().getTime() - myDate.getTime();
  let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return TotalDays;
}
function validate(){
  return (req,res,next)=>{
    var date = new Date();
    con.query("select max(dosage) as max,max(date) as date from details where user_id=" +req.body.user_id +";", function (err, result, fields) {
    if (err) {
      console.log(err);
      return;
    }
    last = result[0].max;date = result[0].date;
    today=new Date();today = today.toISOString().substring(0, 10);
    var gap = dayGap(new Date(date));
    var temp = 0;
    if (last >= MAX_DOSAGE) { 
      res.json({"success":"0","message":"fully vaccinated"});return;
    }
    if (last != 0 && gap < 45) {
      res.json({"success":"0","message":"wait"+(45 - gap).toString()+"days"}); return;
    }
    if (req.body.slot == undefined) {
      res.json({"success":"1","message":"eligible"});
      return;
    } con.query(`select seats from camp where city_id='${req.body.city_id}' and slot='${req.body.slot}';`,
      function (err, result, fields) {
        if (err) {
          res.send(err);
          return;
        }
        temp = result[0].seats;
        if (temp > 0) {
          next();
      }else {
        res.json({"success":"0","message":"insufficient slot"});
      }
    });
  });
}
}
module.exports = router;
