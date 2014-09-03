/*
  Company Methods
*/

var Company     = require(process.cwd() + '/models/company'),
    munger      = require('./munger'),
    winston     = require('winston'),
    chalk       = require('chalk'),
    moment      = require('moment'),
    _           = require('lodash');

var toDate = {
  normalize: function ( v ) {
    return ( v ) ? new Date( v ) : v;
  },
  serialize: function ( v ) {
    return ( v ) ? v.toISOString().split('.')[0] : v;
  },
};

var definition = {
  CompanyNumber: 'legacyCompanyNumber',
  AEM_MemberID: 'legacyAemMemberId',
  BrokerID: 'legacyBrokerId',

  Company: {
    inHash: 'name',
    toKey:  'company'
  },

  Creation_x0020_date: {
    normalize: function ( v ) {
      return ( v ) ? moment( v ).format("YYYY/MM/DD HH:mm:ss") : v;
    },
    serialize: function ( v ) {
      return ( v ) ? moment( v, "YYYY/MM/DD HH:mm:ss" ).format("YYYY/MM/DD") + "T00:00:00" : v;
    },
    toKey: 'time_stamp'
  },

  ContactName: {
    inHash: 'contact',
    toKey:  'name'
  },

  ContactPhoneNumber: {
    inHash: 'contact',
    toKey:  'phone'
  },

  Contact_x0020_FaxNumber: {
    inHash: 'contact',
    toKey:  'fax'
  },

  ContactAddress: {
    inHash: 'address',
    toKey:  'line1'
  },

  ContactCity: {
    inHash: 'address',
    toKey:  'city'
  },

  ContactState: {
    inHash: 'address',
    toKey:  'state'
  },

  ContactZip: {
    inHash: 'address',
    toKey:  'zipcode'
  },

  RateTier: 'legacyRateTier',

  CompEffectDate: _.merge( {}, toDate, { toKey: 'legacyCompEffectDate' }),
  BrokerEffectDate: _.merge( {}, toDate, { toKey: 'legacyBrokerEffectDate'}),

  WaitingPeriod: 'legacyWaitingPeriod',
  SelectCare: 'legacySelectCare',
  MininumHours: 'legacyMinimumHours', // XML data typo
  SoleProprietor: 'legacySoleProprietor',
  Retires: 'legacyRetirees',
  LOA: 'legacyLoa',
  Contribution: 'legacyContribution',
  Notes: 'legacyNotes',
  WebID: 'legacyWebId',
  WebPassword: 'legacyWebPassword',
  WebEmail: 'legacyWebEmail',
  Affiliated: 'legacyAffiliated',
  LifeCovEvenIfWaived: 'legacyCoverLifeIfWaived',
  BrightChoices: 'legacyBrightChoicesFlag',
  MTChamber: 'legacyMtChamberFlag',
  Wellness: 'legacyWellnessFlag',
  Effective_x0020_Month: 'legacyEffectiveMonth',
  PrimaryCo: 'legacyPrimaryCo',
  Number_x0020_of_x0020_Employees: 'legacyNumberEmployees'
};

exports.normalize = function ( hashes ) {
  return munger( definition, hashes );
};

exports.inject = function ( hashes, callback ) {
  var hashLen   = hashes.length,
      fulfilled = 0,
      companies = [];

  hashes.forEach(function ( hash ) {
    Company.findOne({ 'name.company': hash.name.company }, function ( err, record ) {
      if( err ) {
        winston.log('error', chalk.bgRed(err));
        throw new Error(err);
      }

      if( !record ) {
        record = new Company( hash );
      } else {
        _.merge( record, hash );
      }

      record.save(function ( err, company ) {
        if( err ) {
          winston.log('error', chalk.bgRed(err));
          throw new Error(err);
        }

        winston.info('Saved company', company.name.company);

        fulfilled++;
        companies.push( company );

        if( hashLen === fulfilled ) {
          console.log( company );
          callback( companies );
        }

      });
    });
  });
};
