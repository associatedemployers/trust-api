module.exports = {
  port:   587,
  host:   'smtp.office365.com',
  secureConnection: false,
  debug:  ( process.env.environment === 'dev' || process.env.environment === 'development' ),
  auth: {
    user: process.env.mail_user,
    pass: process.env.mail_pass
  }
};
