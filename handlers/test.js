var Mailman = require(process.cwd() + '/lib/controllers/mailman');

var localFixtures = {
  'admin-setup-account': {
    name: {
      first: 'James',
      last: 'Collins'
    },    
    link: '123456',
    reason: 'someone set up an account for you on the AE Trust administration panel'
  }
};

exports.previewEmail = function ( req, res, next ) {
  var templateName = req.params.template,
      postalWorker = new Mailman(),
      locals       = localFixtures[ templateName ] || {};

  postalWorker.__render('admin-setup-account', locals).then(function ( rendered ) {
    res.send( rendered.html );
  });
};
