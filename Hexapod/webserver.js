var express = require("express");
var app = express();
app.use(express.static("."));
app.listen(8080, function() {
  console.log("--- Hexapod WebServer ---");
  console.log("Serve filed from the Hexapod folder.");
  console.log("Express app started on port 8080");
});
