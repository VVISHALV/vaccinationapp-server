var mysql = require("mysql");

var con = mysql.createConnection({
  multipleStatements: true,
  host: "localhost",
  user: "root",
  password: "11111111",
  database: "vaccination",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected! sql");
});
module.exports = con