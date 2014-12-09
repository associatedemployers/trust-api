var Employee = require('../models/employee');

module.exports = function () {

  Employee.update({ 'address.city': { $regex: /bil/i } }, { $set: { 'address.city': 'Billings' } }, { multi: true }).exec(function ( err, employees ) {
    if( err ) throw err;

    console.log('Updated', employees, 'employees w/ billings addresses');
  });

  Employee.distinct({}, 'address.city').exec(function ( err, cities ) {
    if( err ) throw err;

    var citiesFiltered = cities.filter(function ( city ) {
      return city !== titleCase( city );
    });

    citiesFiltered.forEach(function ( city ) {
      Employee.update({ 'address.city': city }, { $set: { 'address.city': titleCase( city ) } }, { multi: true }).exec(function ( err, num ) {
        if( err ) throw err;

        console.log('Updated', num, 'employees with un-normalized city:', city, 'with', titleCase( city ));
      });
    });
  });

};

function titleCase ( str ) {
  return str.replace(/\w\S*/g, function ( subStr ) {
    return subStr.charAt(0).toUpperCase() + subStr.substr(1).toLowerCase();
  });
}
