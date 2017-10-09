const express = require('express');
const app = express();
var http = require('http'),
  fs = require('fs'),
  url = require('url'),
  request = require('request'),
  path = require('path');

const hostname = '127.0.0.1';
const port = 3000;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://localhost:27017/assembla_db';

app.get('/', function(req, res) {
  sendFileContent(res, __dirname + '/views/index.html', 'text/html');
});

app.get('/assemblaCode', function(req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var assemblaCode = query.code;
  console.log('Assembla Code ' + assemblaCode);

  request.post(
    'https://augdmUP68r57ldacwqjQYw:02535496a26c8df7a1b7dfd92e3c7f80@api.assembla.com/token?grant_type=authorization_code&code=' + assemblaCode, {},
    function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var token_resp = JSON.parse(body);
        var access_token = token_resp.access_token;
        var refresh_token = token_resp.refresh_token;

        console.log("Bearer Token : " + body);
        request({
          headers: {
            "Authorization": "Bearer " + access_token
          },
          uri: 'https://api.assembla.com/v1/user.json',
          method: 'GET'
        }, function(err, assembla_resp, body) {
          console.log("Response : " + JSON.stringify(body));
          var user_details = JSON.parse(body);
          var username = user_details.name;
          MongoClient.connect(mongourl, function(err, db) {
            assert.equal(null, err);
            db.collection('assembla_users').insertOne({
              "username": username,
              "bearer_token": access_token,
              "refresher_token": refresh_token
            }, function(err, result) {
              assert.equal(err, null);
              console.log("Inserted a document into the restaurants collection.");

              sendFileContent(res, __dirname + '/views/index.html', 'text/html');
            });
          });
        });


      }
    }
  );
});

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
});

function sendFileContent(response, fileName, contentType) {
  fs.readFile(fileName, function(err, data) {
    if (err) {
      response.writeHead(404);
      response.write("Not Found!");
    } else {
      response.writeHead(200, {
        'Content-Type': contentType
      });
      response.write(data);
    }
    response.end();
  });
}