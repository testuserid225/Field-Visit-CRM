import ContactPerson from '../models/ContactPerson.js';

export const INITIAL_CONTACT_PERSONS = [
  {
    name: 'Dr. Rajesh Sharma',
    customerOrganizationName: 'Apex Healthcare Diagnostics Ltd',
    designation: 'Medical Director',
    mobileNumber: '+91 98230 44122',
    email: 'dr.sharma@apexhealth.com',
    status: 'Active'
  },
  {
    name: 'Priya Nair',
    customerOrganizationName: 'Zenith Retail & Hypermarkets',
    designation: 'Head of Procurement',
    mobileNumber: '+91 99401 55210',
    email: 'priya.nair@zenithretail.in',
    status: 'Active'
  },
  {
    name: 'Vikram Malhotra',
    customerOrganizationName: 'Blue Horizon Maritime Logistics',
    designation: 'Operations Vice President',
    mobileNumber: '+91 98840 12903',
    email: 'v.malhotra@bluehorizon.com',
    status: 'Active'
  },
  {
    name: 'Sunita Deshmukh',
    customerOrganizationName: 'GreenPulse Agri Foods & Beverages',
    designation: 'Managing Director & Founder',
    mobileNumber: '+91 97110 33882',
    email: 'sunita@greenpulsefoods.com',
    status: 'Active'
  },
  {
    name: 'Arun Verma',
    customerOrganizationName: 'Sterling Advanced Polymers',
    designation: 'Senior Plant Manager',
    mobileNumber: '+91 98199 77412',
    email: 'arun.verma@sterlingpolymers.com',
    status: 'Active'
  },
  {
    name: 'Klaus Weber',
    customerOrganizationName: 'Metro Transit Tech Solutions',
    designation: 'Regional Technical Liaison',
    mobileNumber: '+49 89 636 0012',
    email: 'klaus.weber@siemens-health.de',
    status: 'Inactive'
  }
];

export const seedContactPersons = async () => {
  try {
    const count = await ContactPerson.countDocuments();
    if (count === 0) {
      await ContactPerson.insertMany(INITIAL_CONTACT_PERSONS);
      console.log(`[Seed] Seeded ${INITIAL_CONTACT_PERSONS.length} initial contact persons`);
    }
  } catch (err) {
    console.error(`[Seed Contact Persons Error]: ${err.message}`);
  }
};
