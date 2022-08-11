const jwt = require("jsonwebtoken");
function authRole(/**/) {
  return (req, res, next) => {
    var args = arguments;
    let priviledge = getPriviledge(
      req.signedCookies["authorization"].accessToken
    );
    for (var i = 0; i < args.length; i++) {
      if (args[i] == priviledge) {
        return next();
      }
    }
    res.status(401);
    return res.send("Forbidden to access this role");
  };
}
function authCurrentUser() {
  return (req, res, next) => {
    let currentUser = getCurrentUser(
      req.signedCookies["authorization"].accessToken
    );
    if (currentUser != req.body.user_id) {
      res.status(401);
      return res.send("Forbidden to access other user");
    }
    next();
  };
}

function getPriviledge(token) {
  let priviledge;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    priviledge = user.priviledge;
  });
  return priviledge;
}
function getCurrentUser(token) {
  let currentUser;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    currentUser = user.user_id;
  });
  return currentUser;
}
module.exports = { authRole, authCurrentUser };
