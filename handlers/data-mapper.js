/*
  Data Map Request
  ---
  Experimental Route Handler, do not use a url to init a db injection
*/

var fs        = require('fs-extra'),
    ftpserver = require('../config/ftp').createConnection();

exports.mapData = function (req, res, next) {
  var date = new Date(),
      timeStarted = date.getTime();

  console.log('transferring');

  ftpserver.cd('AccessXML').get('Dependents.xml', '../../temp_data/access_dependents.xml').exec(function (err, response) {
    console.log('complete');
    var date = new Date(),
        timeEnded = date.getTime();

    res.send( ( ( timeStarted - timeEnded ) * 1000 ).toString() + " seconds to complete.");
  });

  
}
