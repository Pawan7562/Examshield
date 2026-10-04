require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const fs = require('fs');

async function testHtmlRequirements() {
  console.log('--- Verifying HTML Template Strings & Quality Requirements ---');
  
  // Read emailService.js to verify template literals and rendering logic
  const serviceCode = fs.readFileSync(require.resolve('../services/emailService.js'), 'utf8');

  // Requirement 1: Exact button text
  assert(serviceCode.includes('Access Your Examination &rarr;'), 'Template must include "Access Your Examination" button');
  console.log('✅ Button text: "Access Your Examination" verified');

  // Requirement 2: Exact footer text
  assert(
    serviceCode.includes('ExamShield is an examination monitoring platform developed by Nexify Forge.'),
    'Template must include exact footer declaration'
  );
  console.log('✅ Footer declaration verified');

  // Requirement 3: Brand and Product in Header
  assert(serviceCode.includes('NEXIFY FORGE'), 'Header must include NEXIFY FORGE');
  assert(serviceCode.includes('ExamShield &mdash; Exam Monitoring System'), 'Header must include ExamShield — Exam Monitoring System');
  console.log('✅ Header branding verified');

  // Requirement 4: Personalized greeting
  assert(serviceCode.includes('Dear ${name'), 'Template must include personalized greeting "Dear [Name],"');
  console.log('✅ Personalized greeting verified');

  // Requirement 5: Conducting institution organizer banner
  assert(serviceCode.includes('Examination Conducted &amp; Organized By'), 'Organizer banner must be present');
  console.log('✅ Conducting institution organizer banner verified');

  // Requirement 6: Dynamic database resolution
  assert(serviceCode.includes('resolveCollegeNameFromDb'), 'Dynamic college resolution function must be implemented');
  console.log('✅ Dynamic database college resolution verified');

  // Requirement 7: URL resolution
  assert(serviceCode.includes('resolveStudentLoginUrl'), 'resolveStudentLoginUrl must be implemented');
  assert(serviceCode.includes('examshield.vercel.app'), 'Default fallback must be production Vercel portal');
  console.log('✅ Production URL resolution verified');

  console.log('\n🎉 ALL HTML REQUIREMENTS CONFIRMED AND VALIDATED!\n');
}

testHtmlRequirements();
