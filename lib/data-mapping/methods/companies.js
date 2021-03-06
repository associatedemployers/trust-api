/*
  Company Methods
*/

var Company     = require(process.cwd() + '/models/company'),
    munger      = require('./helpers/munger'),
    toDate      = require('./helpers/to-date'),
    winston     = require('winston').loggers.get('default'),
    chalk       = require('chalk'),
    moment      = require('moment'),
    _           = require('lodash');

var definition = {
  CompanyNumber: 'legacyCompanyNumber',
  AEM_MemberID:  'legacyAemMemberId',
  BrokerID:      'legacyBrokerId',

  Company: {
    inHash: 'name',
    toKey:  'company'
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

  WebID: {
    inHash: 'login',
    toKey: 'companyId'
  },
  WebPassword: {
    inHash: 'login',
    toKey: 'password'
  },
  WebEmail: {
    inHash: 'login',
    toKey: 'email'
  },

  RateTier: 'legacyRateTier',

  Creation_x0020_date:         _.merge({}, toDate, { toKey: 'time_stamp'}),
  CompEffectDate:              _.merge({}, toDate, { toKey: 'legacyCompEffectDate' }),
  BrokerEffectDate:            _.merge({}, toDate, { toKey: 'legacyBrokerEffectDate'}),
  Group_x0020_Term_x0020_Date: _.merge({}, toDate, { toKey: 'removedOn'}),

  WaitingPeriod:                   'legacyWaitingPeriod',
  SelectCare:                      'legacySelectCare',
  MininumHours:                    'legacyMinimumHours', // XML data typo
  SoleProprietor:                  'legacySoleProprietor',
  Retires:                         'legacyRetirees',
  LOA:                             'legacyLoa',
  Contribution:                    'legacyContribution',
  Notes:                           'legacyNotes',
  Affiliated:                      'legacyAffiliated',
  LifeCovEvenIfWaived:             'legacyCoverLifeIfWaived',
  BrightChoices:                   'legacyBrightChoicesFlag',
  MTChamber:                       'legacyMtChamberFlag',
  Wellness:                        'legacyWellnessFlag',
  Effective_x0020_Month:           'legacyEffectiveMonth',
  PrimaryCo:                       'legacyPrimaryCo',
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
    Company.findOne({ legacyCompanyNumber: hash.legacyCompanyNumber }, function ( err, record ) {
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

        winston.log('info', chalk.dim( 'Saved Company', company.name.company, '-', fulfilled, 'of', hashLen ));

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
