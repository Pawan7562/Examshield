const fs = require('fs');
const path = require('path');

const serverFile = path.resolve(__dirname, '../server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// 1. Add import
if (!content.includes('autoEmailBatchService')) {
  content = content.replace(
    "const { formatIST } = require('./utils/timezone');",
    "const { formatIST } = require('./utils/timezone');\r\nconst { startDailyEmailScheduler, dispatchBatch } = require('./services/autoEmailBatchService');"
  );
}

// 2. Add endpoint
if (!content.includes('/api/trigger-email-batch')) {
  const triggerCode = `
// Automated Daily Email Batch Manual Trigger Endpoint
app.get('/api/trigger-email-batch', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 300, 300);
    logger.info(\`[Admin Request] Manual trigger for email batch dispatch requested (limit: \${limit})\`);
    
    if (req.query.async === 'true') {
      dispatchBatch(limit).catch(err => logger.error('[Async Batch Error]:', err));
      return res.json({
        success: true,
        message: \`Batch dispatch of \${limit} emails started in the background. Check logs for delivery progress.\`
      });
    }

    const result = await dispatchBatch(limit);
    return res.json({
      success: result.success,
      message: result.message || \`Dispatched \${result.sentCount} emails. (\${result.failCount || 0} failed)\`,
      data: result
    });
  } catch (error) {
    logger.error('Email batch trigger failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
`;

  content = content.replace("// 404 handler", triggerCode.trim() + "\r\n\r\n// 404 handler");
}

// 3. Start scheduler
if (!content.includes('startDailyEmailScheduler()')) {
  content = content.replace(
    'autoCloseExpiredExams().then((res) => {',
    'startDailyEmailScheduler();\r\n\r\n  autoCloseExpiredExams().then((res) => {'
  );
}

fs.writeFileSync(serverFile, content, 'utf8');
console.log('✅ server.js patched successfully!');
