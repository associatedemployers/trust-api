var cwd = process.cwd();

var winston   = require('winston').loggers.get('default'),
    chalk     = require('chalk'),
    normalize = require(cwd + '/config/data-normalization'),
    respond   = require(cwd + '/handlers/response'),
    moment    = require('moment'),
    _         = require('lodash');

var EnrollmentPeriod = require(cwd + '/models/enrollment-period'),
    ResourceMixin    = require(cwd + '/lib/mixins/resource-handler');

exports.fetchAll = ResourceMixin.getAll('EnrollmentPeriod');
exports.fetchByID = ResourceMixin.getById('EnrollmentPeriod');

exports.create = function ( req, res, next ) {
  var payload = req.body.enrollmentPeriod;

  var _clientError = function ( err ) {
    res.status(400).send(err);
  };

  if ( !payload || !payload.start || !payload.end ) {
    return _clientError('Invalid payload');
  }

  EnrollmentPeriod.find({ super: true }, function ( err, enrollmentPeriods ) {
    if ( err ) {
      return respond.error.res(res, err, true);
    }

    var startDate = moment(payload.start),
        endDate   = moment(payload.end);

    if ( startDate.isAfter(endDate) ) {
      return _clientError('Enrollment Period start must be before end date');
    }

    var inSuperPeriod = _.find(enrollmentPeriods, function ( period ) {
      return moment(period.start).subtract(1, 'day').isBefore(startDate) && moment(period.end).add(1, 'day').isAfter(period.end);
    });

    if ( !inSuperPeriod ) {
      return _clientError('Enrollment Period must exist within a administration open enrollment period');
    }

    var enrollmentPeriod = new EnrollmentPeriod(_.merge(payload, {
      company: req.session.user._id,
      super: false
    }));

    enrollmentPeriod.save(function ( err, savedPeriod ) {
      if ( err ) {
        return respond.error.res(res, err, true);
      }

      res.send({
        enrollmentPeriod: savedPeriod
      });
    });
  });
};

exports.del = function ( req, res, next ) {
  EnrollmentPeriod.findById(req.params.id, function ( err, enrollmentPeriod ) {
    if ( err ) {
      return respond.error.res(res, err, true);
    }

    if ( enrollmentPeriod.company.toString() !== req.session.user._id.toString() ) {
      return res.status(401).send('Requested resource does not belong to user');
    }

    enrollmentPeriod.remove(function ( err, deleted ) {
      if ( err ) {
        return respond.error.res(res, err, true);
      }

      res.status(200).send({});
    });
  });
};
