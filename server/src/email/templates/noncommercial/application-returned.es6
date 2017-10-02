const moment = require('moment');
const vcapConstants = require('../../../vcap-constants.es6');

module.exports = application => {
  return {
    to: application.applicantInfoEmailAddress,
    subject: 'An update on your recent permit application to the Forest Service.',
    body: `
Permit application status update
**************************************

Unfortunately the following permit application has not been accepted.

${application.applicantMessage}


Application details
**************************************

Event name: ${application.eventName}
Start date: ${moment(application.noncommercialFieldsStartDateTime, 'YYYY-MM-DDTHH:mm:ss').format('MM/DD/YYYY hh:mm a')}
End date: ${moment(application.noncommercialFieldsEndDateTime, 'YYYY-MM-DDTHH:mm:ss').format('MM/DD/YYYY hh:mm a')}
Number of participants: ${application.noncommercialFieldsNumberParticipants}
Number of spectators: ${application.noncommercialFieldsSpectatorCount}
Location: ${application.noncommercialFieldsLocationDescription}

If you would like to submit another permit application visit ${vcapConstants.intakeClientBaseUrl}.


Contact us
**************************************

If you have questions or need to contact the permit staff at the National Forest Service, please use a method listed below.

Noncommercial contact
Name: Sue Sherman-Biery
Title: Special use administrator
Phone: 360-854-2660
Email: sshermanbiery@fs.fed.us

Thank you for your interest in our National Forests.
`
  };
};
