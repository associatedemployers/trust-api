/*
  XML File Manifest
*/

module.exports = [
  {
    from:    'Medical Key.xml',
    to:      'medical_plan_key.xml',
    rootKey: 'Medical_x0020_Key',
    type:    'medicalPlanKey'
  },
  {
    from:    'Q - Active Companies for xml upload.xml',
    to:      'access_companies.xml',
    rootKey: 'Q_x0020_-_x0020_Active_x0020_Companies_x0020_for_x0020_xml_x0020_upload',
    type:    'companies'
  },
  {
    from:    'Q - Medical_Office Plans.xml',
    to:      'access_medical_rates.xml',
    rootKey: 'Q_x0020_-_x0020_Medical_x002F_Office_x0020_Plans',
    type:    'medicalRates'
  }
];
