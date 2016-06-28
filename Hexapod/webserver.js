var express = require("express");
var app = express();
app.use(express.static("."));
app.listen(8080, function() {
  console.log("Express app started on port 8080");
});
