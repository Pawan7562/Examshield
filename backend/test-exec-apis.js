async function testAsyncPolling() {
  const code = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    cout << "0 1" << endl;
    return 0;
}`;

  console.log('1. Submitting without wait=true...');
  const t0 = Date.now();
  const subRes = await fetch('https://ce.judge0.com/submissions?base64_encoded=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: Buffer.from(code).toString('base64'),
      language_id: 54, // C++
      stdin: Buffer.from('nums = [2,7,11,15], target = 9').toString('base64'),
    }),
    signal: AbortSignal.timeout(8000)
  });
  const subData = await subRes.json();
  console.log('Submission token:', subData.token, 'Took:', Date.now() - t0, 'ms');

  if (!subData.token) return;

  // 2. Poll token
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 400));
    const pollRes = await fetch(`https://ce.judge0.com/submissions/${subData.token}?base64_encoded=true`, {
      signal: AbortSignal.timeout(5000)
    });
    const pollData = await pollRes.json();
    console.log(`Poll #${i + 1} status:`, pollData.status?.id, pollData.status?.description);
    if (pollData.status?.id > 2) {
      console.log('Finished execution!', pollData);
      break;
    }
  }
}
testAsyncPolling();
