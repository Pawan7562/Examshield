const testFake = async () => {
  const relayUrl = 'https://examshield.vercel.app/api/send-email';
  try {
    const res = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        internalSecret: 'examshield-secure-relay-9921',
        host: 'smtp.gmail.com',
        port: 587,
        user: 'pawankumaryadav75628697@gmail.com',
        pass: 'FAKE_PASSWORD_12345',
        mailOptions: {
          to: 'shuklasuraj997@gmail.com',
          subject: 'Fake test',
          html: '<p>Testing fake</p>'
        }
      })
    });
    const data = await res.json();
    console.log('Result with fake password:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
};

testFake();
