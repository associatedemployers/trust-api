/*
  User (admin) - Server Data Model
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var createModel = require('./helpers/create-model');

var ticker     = require(process.cwd() + '/lib/ticker/ticker'),
    cryptify   = require('mongoose-cryptify'),
    searchable = require('./plugins/searchable');

var userSchema = new Schema({
  name: {
    first: String,
    last:  String
  },

  login: {
    email:    { type: String, unique: true },
    password: String
  },

  type:          String,
  super:         Boolean,
  receiveEmails: Boolean,
  apiAccess:     Boolean,

  permissions: [{ type: Schema.ObjectId, ref: 'UserPermission' }],

  time_stamp: { type: Date, default: Date.now, index: true }
});

var Mailman = require('../lib/controllers/mailman'),
    crypto  = require('crypto');

// Hold isNew status for post hooks
userSchema.pre('save', function ( next ) {
  this.isNew_post = this.isNew;
  next();
});

// Async Mail Notification Middleware
// ---
// Sends user an email with MD5 link gen'd
// from email so that we can set their password
userSchema.post('save', function ( doc ) {
  if( !this.isNew_post || !this.login.email ) {
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
