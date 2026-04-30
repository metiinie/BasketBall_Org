const axios = require('axios');

async function testAuditLog() {
  const url = 'http://localhost:3000/audit-logs';
  const payload = {
    user_id: '00000000-0000-0000-0000-000000000000',
    action: 'TEST_ACTION',
    entity_id: 'test-entity',
    details: { message: 'Checking if audit logging works' }
  };

  try {
    // This will likely fail with 401 because we don't have a JWT
    const response = await axios.post(url, payload);
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
  }
}

testAuditLog();
