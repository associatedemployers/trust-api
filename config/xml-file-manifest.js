/*
  XML File Manifest
*/

module.exports = [
  {
    from:    'Medical Key.xml',
    to:      'medical-plan-key.xml',
    rootKey: 'Medical_x0020_Key',
    type:    'medicalPlanKey'
  },
  {
    from:    'Contact.xml',
    to:      'access-companies.xml',
    rootKey: 'Contact',
    type:    'companies'
  },
  {
    from:    'Office.xml',
    to:      'access-company-locations.xml',
    rootKey: 'Office',
    type:    'location'
  },
  {
    from:    'OfficePlans.xml',
    to:      'access-legacy-company-plans',
    rootKey: 'OfficePlans',
    type:    'companyPlans'
  },
  {
    from:    'MedicalRates.xml',
    to:      'access-medical-rates.xml',
    rootKey: 'MedicalRates',
    type:    'medicalRates'
  },
  {
    from:    'DentalRates.xml',
    to:      'access-dental-rates.xml',
    rootKey: 'DentalRates',
    type:    'dentalRates'
  },
  {
    from:    'VisionRates.xml',
    to:      'access-vision-rates.xml',
    rootKey: 'VisionRates',
    type:    'visionRates'
  },
  {
    from:    'LifeInsuranceRates.xml',
    to:      'access-life-rates.xml',
    rootKey: 'LifeInsuranceRates',
    type:    'lifeRates'
  },
  {
    from:    'ClientDUPSok.xml',
    to:      'access-employees.xml',
    rootKey: 'ClientDUPSok',
    type:    'employees'
  },
  {
    from:    'History Individual File.xml',
    to:      'access-employee-current.xml',
    rootKey: 'History_x0020_Individual_x0020_File',
    type:    'employeeHistory'
  },
  {
    from:    'Dependents File.xml',
    to:      'access-dependents.xml',
    rootKey: 'Dependents_x0020_File',
    type:    'dependents'
  }
];
