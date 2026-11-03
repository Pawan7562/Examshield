const testRelay = async (toEmail) => {
  const relayUrl = 'https://examshield.vercel.app/api/send-email';
  console.log('Sending test POST to', relayUrl, 'for', toEmail);
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
          subject: 'Relay Test for ' + toEmail,
          html: '<p>Testing relay</p>'
        }
      })
    });
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response text:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
};

testRelay('shuklasuraj997@gmail.com');
