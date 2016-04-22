/*
  User (admin) - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var ticker = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify = require('mongoose-cryptify'),
    winston = require('winston');

var userSchema = new Schema({
  name: {
    first: String,
    last:  String
  },

  login: {
    email:    String,
    password: String
  },

  type:          String,
  super:         Boolean,
  receiveEmails: Boolean,
  apiAccess:     Boolean,
  verified:      { type: Boolean, default: false },

  permissions: [{ type: Schema.ObjectId, ref: 'UserPermission' }],

  'time_stamp': { type: Date, default: Date.now, index: true }
});

var Mailman = require('../lib/controllers/mailman');

// Hold isNew status for post hooks
userSchema.pre('save', function ( next ) {
  this.wasNew = this.verified = this.isNew;
  next();
});

// Async Mail Notification Middleware
// ---
// Sends user an email with id link
// from email so that we can set their password
userSchema.post('save', function ( doc ) {
  if( !this.wasNew || !this.login.email ) {
    return;
  }

  if( process.env.environment === 'test' && ( process.env.allow_test_sendmail === 'false' || !process.env.allow_test_sendmail ) ) {
    return;
  }

  var mailer = new Mailman();

  mailer.send(this.login.email, 'Complete your Trust Administration account setup', 'admin-setup-account', {
    name: this.name,
    link: doc._id.toString()
  }).catch(function ( err ) {
    winston.log('error', chalk.red('There was an error sending mail for user signup:', err));
    throw err;
  });
});

// Attach some mongoose hooks
userSchema = ticker.attach( userSchema )
            .plugin(cryptify, {
              paths: [ 'login.password' ],
              factor: 11
            });

module.exports = createModel('User', userSchema);
