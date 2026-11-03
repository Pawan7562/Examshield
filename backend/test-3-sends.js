const testRelay = async (toEmail, i) => {
  const relayUrl = 'https://examshield.vercel.app/api/send-email';
  console.log(`[${i}] Sending to ${toEmail}...`);
  try {
    const res = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internalSecret: 'examshield-secure-relay-9921',
        host: 'smtp.gmail.com',
        port: 587,
        user: 'pawankumaryadav75628697@gmail.com',
        pass: 'suev oqsh vnuf duqx',
        mailOptions: {
          to: toEmail,
          subject: `Sequential Test ${i} for ${toEmail}`,
          html: `<p>Testing sequential email ${i}</p>`
        }
      })
    });
    const data = await res.json();
    console.log(`[${i}] Result:`, data);
  } catch (err) {
    console.error(`[${i}] Error:`, err.message);
  }
};

async function run() {
  await testRelay('codingcollege12@gmail.com', 1);
  await testRelay('shuklasuraj997@gmail.com', 2);
  await testRelay('suraj718126@gmail.com', 3);
}

run();
