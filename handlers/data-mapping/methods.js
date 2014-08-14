/*
  Data Mapping Methods
  ---
  ~The following hooks will be fired:

  @normalize
  @serialize
  @inject
  @eject

  ~In the following order:

  From XML parser to @normalize to @inject
  From database to @eject to @serialize
*/

var medicalPlanKeyMethods = require('./methods/medical-plan-key');

module.exports = {
  'medical_plan_key': {
    iterate: true,
    normalize: medicalPlanKeyMethods.normalize,
    inject: medicalPlanKeyMethods.inject
  }
}
