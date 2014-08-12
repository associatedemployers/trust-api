/*
  Data Map Request
  ---
  Experimental Route Handler, do not use a url to init a db injection
*/

var winston = require('winston'),
    fs      = require('fs-extra'),
    ftp     = require('../config/ftp'),
    parser  = require('xml2json'),
    _       = require('lodash');

exports.mapData = function (req, res, next) {
  var date = new Date(),
      timeStarted = date.getTime();

  if(!req.params.id) {
    return res.send('Provide a file id');
  }

  winston.info('Connecting to SFTP Server...');

  var connection = ftp.createConnection();

  winston.info('Connection created, resolving...');

  connection.on('ready', function () {
    winston.info('SSH Connection :: ready');

    connection.sftp(function (err, sftp) {
      if(err) {
        throw err;
      }

      winston.info('SFTP Connection :: ready');

      var fromDir = ftp.options.dataDirectory,
          toDir   = process.cwd() + ftp.options.toLocalDirectory;

      var fileManifest = [
        {
          from: 'Q - Medical_Office Plans.xml',
          to:   'access_medical_plans.xml',
          rootkey: 'Q_x0020_-_x0020_Medical_x002F_Office_x0020_Plans'
        },
        {
          from: 'Medical Key.xml',
          to:   'medical_plan_key.xml',
          rootkey: 'Medical_x0020_Key'
        },
        {
          from: 'Q - Active Companies for xml upload.xml',
          to:   'access_companies.xml',
          rootkey: 'Q_x0020_-_x0020_Active_x0020_Companies_x0020_for_x0020_xml_x0020_upload'
        }
      ];

      var totalFiles = fileManifest.length,
          fulfilled  = 0;

      winston.info('Fulfilling', totalFiles, 'file requests');

      for ( var f = 0; f < totalFiles; f++ ) {
        var fromDest = fromDir + fileManifest[f].from,
            toDest   = toDir + fileManifest[f].to;

        winston.info('SFTP: Transferring from', fromDest, 'to', toDest);

        sftp.fastGet(fromDest, toDest, function (err) {
          if(err) {
            throw err;
          }

          winston.info('SFTP: Got file');

          fulfilled++;

          if( totalFiles === fulfilled ) {
            startMap(fileManifest[req.params.id], function (response) {
              sendRes(res, timeStarted, response);
            });
          }

        });
      }

    });
  }).on('error', function (err) {
    console.error(err);
  }).connect(_.merge({
    port: 22,
  }, ftp.configuration));
}

function startMap (fileToFetch, callback) {
  var path      = process.cwd() + ftp.options.toLocalDirectory + fileToFetch.to,
      xmlBuffer = fs.readFileSync( path );

  var xml = xmlBuffer.toString();

  var parsed = parser.toJson(xml, {
    object: true
  }).dataroot[fileToFetch.rootkey];

  buildHTML(parsed, callback);
}

function sendRes (res, timeStarted, toSend) {
  if(toSend) {
    return res.send(200, toSend);
  }

  var date = new Date(),
      timeEnded = date.getTime();

  res.send( ( ( timeEnded - timeStarted ) / 1000 ).toString() + " seconds to complete.");
}

// Just a visual thing, experimental
function buildHTML (data, callback) {
  var dataKeys = [];
  var html = '<html>' +
             '<head><style>table { border: 1px solid #666; width: 100%; } th {background: #f8f8f8; font-weight: bold; padding: 2px; } </style></head>' +
             '<body>';

  html += '<table><tr>';

  for (var key in data[0]) {
    html += '<th>' + key + '</th>';
    dataKeys.push(key);
  }

  html += '</tr>';

  data.forEach(function (item) {
    html += '<tr>';

    for (var key in item) {
      html += '<td>' + item[key] + '</td>';
    }

    html += '</tr>';
  });

  html += '</table></body></html>';

  callback(html);
}
