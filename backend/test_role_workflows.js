const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== STARTING DOCUFLOW AI ROLE & SUBJECT WORKFLOW VALIDATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Admin Authentication
    console.log('--- Step 1: Admin Authentication ---');
    const adminLoginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@kongu.edu',
      password: 'Admin@DocuFlow2026!'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.user.role === 'admin', 'Admin login successful with role: admin');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Fetch Assignment Options and Subjects
    console.log('\n--- Step 2: Fetch Assignment Options ---');
    const optionsRes = await axios.get(`${BASE_URL}/api/admin/assignment-options`, { headers: adminHeaders });
    assert(optionsRes.status === 200 && optionsRes.data.options.subjects.length > 0, `Retrieved ${optionsRes.data.options.subjects.length} subjects and ${optionsRes.data.options.users.length} eligible users`);

    const users = optionsRes.data.options.users;
    const subjects = optionsRes.data.options.subjects;
    const batches = optionsRes.data.options.batches;
    const testSubject = subjects[0];
    const testBatch = batches[0];

    const facultyUser = users.find(u => u.role === 'faculty') || users[0];
    const expertUser = users.find(u => u.role === 'expert') || users.find(u => u.role === 'faculty') || users[0];
    const hodUser = users.find(u => u.role === 'hod') || users[0];

    console.log(`Target Users -> Faculty: ${facultyUser.name}, Expert: ${expertUser.name}, HOD: ${hodUser.name}`);
    console.log(`Target Subject -> ${testSubject.subjectCode}: ${testSubject.subjectName}`);

    // 3. Admin Assigns Subject to Faculty
    console.log('\n--- Step 3: Admin Assigns Subject to Faculty ---');
    let facultyAssignId = null;
    try {
      const assignFacRes = await axios.post(`${BASE_URL}/api/admin/assign-subject`, {
        userId: facultyUser._id,
        role: 'faculty',
        subjectId: testSubject._id,
        batchId: testBatch?._id,
        department: testSubject.department || 'Master of Computer Applications (MCA)'
      }, { headers: adminHeaders });
      assert(assignFacRes.status === 201, 'Faculty subject assignment succeeded');
      facultyAssignId = assignFacRes.data.assignment._id;
    } catch (err) {
      if (err.response?.status === 409) {
        assert(true, 'Faculty was already assigned (duplicate caught cleanly with 409)');
      } else {
        assert(false, `Faculty assign error: ${err.message}`);
      }
    }

    // 4. Duplicate Check: Admin assigns same faculty to same subject & batch
    console.log('\n--- Step 4: Duplicate Assignment Prevention (Faculty) ---');
    try {
      await axios.post(`${BASE_URL}/api/admin/assign-subject`, {
        userId: facultyUser._id,
        role: 'faculty',
        subjectId: testSubject._id,
        batchId: testBatch?._id
      }, { headers: adminHeaders });
      assert(false, 'Duplicate assignment should have been blocked');
    } catch (err) {
      assert(err.response?.status === 409, `Duplicate blocked with HTTP 409: ${err.response?.data?.message}`);
    }

    // 5. Admin Assigns Subject to Expert
    console.log('\n--- Step 5: Admin Assigns Subject to Expert ---');
    let expertAssignId = null;
    try {
      const assignExpRes = await axios.post(`${BASE_URL}/api/admin/assign-subject`, {
        userId: expertUser._id,
        role: 'expert',
        subjectId: testSubject._id,
        department: testSubject.department || 'Master of Computer Applications (MCA)'
      }, { headers: adminHeaders });
      assert(assignExpRes.status === 201, 'Expert subject assignment succeeded');
      expertAssignId = assignExpRes.data.assignment._id;
    } catch (err) {
      if (err.response?.status === 409) {
        assert(true, 'Expert was already assigned (duplicate caught cleanly with 409)');
      } else {
        assert(false, `Expert assign error: ${err.message}`);
      }
    }

    // 6. Duplicate Check: Admin assigns same expert to same subject
    console.log('\n--- Step 6: Duplicate Assignment Prevention (Expert) ---');
    try {
      await axios.post(`${BASE_URL}/api/admin/assign-subject`, {
        userId: expertUser._id,
        role: 'expert',
        subjectId: testSubject._id
      }, { headers: adminHeaders });
      assert(false, 'Duplicate expert assignment should have been blocked');
    } catch (err) {
      assert(err.response?.status === 409, `Duplicate blocked with HTTP 409: ${err.response?.data?.message}`);
    }

    // 7. Admin Assigns Subject to HOD
    console.log('\n--- Step 7: Admin Assigns Subject to HOD ---');
    let hodAssignId = null;
    try {
      const assignHodRes = await axios.post(`${BASE_URL}/api/admin/assign-subject`, {
        userId: hodUser._id,
        role: 'hod',
        subjectId: testSubject._id,
        department: testSubject.department || 'Master of Computer Applications (MCA)'
      }, { headers: adminHeaders });
      assert(assignHodRes.status === 201, 'HOD subject oversight assignment succeeded');
      hodAssignId = assignHodRes.data.assignment._id;
    } catch (err) {
      if (err.response?.status === 409) {
        assert(true, 'HOD was already assigned (duplicate caught cleanly with 409)');
      } else {
        assert(false, `HOD assign error: ${err.message}`);
      }
    }

    // 8. Admin List Subject Assignments
    console.log('\n--- Step 8: Admin List Subject Assignments ---');
    const listAssignRes = await axios.get(`${BASE_URL}/api/admin/subject-assignments`, { headers: adminHeaders });
    assert(listAssignRes.status === 200 && listAssignRes.data.assignments.length > 0, `Listed ${listAssignRes.data.assignments.length} unified assignments (Faculty, Expert, HOD)`);

    // 9. Boundary Test: Admin MUST NOT approve academic documents
    console.log('\n--- Step 9: Boundary Test - Admin Blocked From Academic Approvals ---');
    try {
      await axios.post(`${BASE_URL}/api/hod/approve/507f1f77bcf86cd799439011`, {
        decision: 'approved'
      }, { headers: adminHeaders });
      assert(false, 'Admin should NOT be allowed to approve academic documents');
    } catch (err) {
      assert(err.response?.status === 403, `Admin approval blocked with HTTP 403: ${err.response?.data?.message}`);
    }

    // 10. Boundary Test: Admin MUST NOT submit expert reviews
    console.log('\n--- Step 10: Boundary Test - Admin Blocked From Expert Reviews ---');
    try {
      await axios.post(`${BASE_URL}/api/expert/review/507f1f77bcf86cd799439011`, {
        decision: 'approved',
        comments: 'Admin attempting review'
      }, { headers: adminHeaders });
      assert(false, 'Admin should NOT be allowed to review documents');
    } catch (err) {
      assert(err.response?.status === 403, `Admin review blocked with HTTP 403: ${err.response?.data?.message}`);
    }

    // 11. Boundary Test: Admin MUST NOT upload academic documents as faculty
    console.log('\n--- Step 11: Boundary Test - Admin Blocked From Faculty Document Uploads ---');
    try {
      await axios.post(`${BASE_URL}/api/faculty/upload`, {}, { headers: adminHeaders });
      assert(false, 'Admin should NOT be allowed to upload documents as faculty');
    } catch (err) {
      assert(err.response?.status === 403, `Admin upload blocked with HTTP 403: ${err.response?.data?.message}`);
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (globalErr) {
    console.error('Fatal test execution error:', globalErr.response?.data || globalErr.message);
    process.exit(1);
  }
}

runTests();
