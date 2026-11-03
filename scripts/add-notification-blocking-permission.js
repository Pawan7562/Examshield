const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../frontend/src/pages/student/ExamRoom.js');
let content = fs.readFileSync(targetFile, 'utf8');

const isCRLF = content.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// 1. Add notificationBlocked state
const stateTarget = `  const [notificationConsent, setNotificationConsent] = useState(true);`;
const stateReplacement = `  const [notificationConsent, setNotificationConsent] = useState(true);${eol}` +
`  const [notificationBlocked, setNotificationBlocked] = useState(false);`;

if (!content.includes(stateTarget)) {
  console.error('Could not find stateTarget');
  process.exit(1);
}
content = content.replace(stateTarget, stateReplacement);
console.log('1. notificationBlocked state added.');

// 2. Update isDeviceCheckPassed to include notificationBlocked
const deviceCheckTarget = `  const isDeviceCheckPassed = useMemo(() => {${eol}` +
`    return cameraPerm === 'granted' && micPerm === 'granted' && screenPerm === 'granted';${eol}` +
`  }, [cameraPerm, micPerm, screenPerm]);`;

const deviceCheckReplacement = `  const isDeviceCheckPassed = useMemo(() => {${eol}` +
`    return cameraPerm === 'granted' && micPerm === 'granted' && screenPerm === 'granted' && notificationBlocked === true;${eol}` +
`  }, [cameraPerm, micPerm, screenPerm, notificationBlocked]);`;

if (!content.includes(deviceCheckTarget)) {
  console.error('Could not find deviceCheckTarget');
  process.exit(1);
}
content = content.replace(deviceCheckTarget, deviceCheckReplacement);
console.log('2. isDeviceCheckPassed updated.');

// 3. Update preview video condition to include step 5
const videoPreviewTarget = `if ((setupStep === 3 || setupStep === 4) && cameraStreamRef.current && previewVideoRef.current) {`;
const videoPreviewReplacement = `if ((setupStep === 3 || setupStep === 5) && cameraStreamRef.current && previewVideoRef.current) {`;
if (!content.includes(videoPreviewTarget)) {
  console.error('Could not find videoPreviewTarget');
  process.exit(1);
}
content = content.replace(videoPreviewTarget, videoPreviewReplacement);
console.log('3. video preview condition updated.');

// 4. Update authorizeNotificationBlocking function
const notifFuncTarget = `  // ─── Browser Notification Permission & Exam Mode Focus Shield ───────────────${eol}` +
`  const requestNotificationPermission = useCallback(async () => {${eol}` +
`    if (typeof window === 'undefined' || !('Notification' in window)) {${eol}` +
`      setNotificationPerm('unsupported');${eol}` +
`      notify.info('Browser Notification API unavailable; Exam Shield will filter system alerts directly.');${eol}` +
`      return 'unsupported';${eol}` +
`    }${eol}` +
`    try {${eol}` +
`      const res = await Notification.requestPermission();${eol}` +
`      setNotificationPerm(res);${eol}` +
`      if (res === 'granted') {${eol}` +
`        notify.success('Browser notification permissions configured for Exam Mode.');${eol}` +
`      } else if (res === 'denied') {${eol}` +
`        notify.info('Browser notifications are blocked. Exam Mode will shield against transient window blurs.');${eol}` +
`      }${eol}` +
`      return res;${eol}` +
`    } catch (err) {${eol}` +
`      console.warn('Notification permission request error:', err);${eol}` +
`      return 'default';${eol}` +
`    }${eol}` +
`  }, []);`;

const notifFuncReplacement = `  // ─── Dedicated Notification-Blocking Permission & Focus Shield ─────────────${eol}` +
`  const authorizeNotificationBlocking = useCallback(async () => {${eol}` +
`    setNotificationPerm('checking');${eol}` +
`    try {${eol}` +
`      let perm = 'granted';${eol}` +
`      if (typeof window !== 'undefined' && 'Notification' in window) {${eol}` +
`        try {${eol}` +
`          perm = await Notification.requestPermission();${eol}` +
`        } catch (e) {${eol}` +
`          console.warn('Notification permission notice:', e);${eol}` +
`        }${eol}` +
`      }${eol}` +
`      // Activate in-page notification blocking immediately${eol}` +
`      if (typeof window !== 'undefined' && window.Notification && !originalNotificationRef.current) {${eol}` +
`        try {${eol}` +
`          originalNotificationRef.current = window.Notification;${eol}` +
`          window.Notification = class ExamShieldBlockedNotification {${eol}` +
`            constructor(title) {${eol}` +
`              console.log('[ExamShield] Notification blocked during exam:', title);${eol}` +
`              return { close: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false };${eol}` +
`            }${eol}` +
`            static get permission() { return 'denied'; }${eol}` +
`            static requestPermission(cb) { if (cb) cb('denied'); return Promise.resolve('denied'); }${eol}` +
`          };${eol}` +
`        } catch (_) {}${eol}` +
`      }${eol}` +
`      // Close any active web push notifications${eol}` +
`      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {${eol}` +
`        try {${eol}` +
`          const regs = await navigator.serviceWorker.getRegistrations();${eol}` +
`          regs.forEach(reg => {${eol}` +
`            reg.getNotifications?.().then(notifications => {${eol}` +
`              notifications.forEach(n => { try { n.close(); } catch (_) {} });${eol}` +
`            }).catch(() => {});${eol}` +
`          });${eol}` +
`        } catch (_) {}${eol}` +
`      }${eol}` +
`      setNotificationPerm(perm);${eol}` +
`      setNotificationBlocked(true);${eol}` +
`      notify.success('Notification-blocking permission verified! Popups and warnings blocked.');${eol}` +
`      setTimeout(() => {${eol}` +
`        setSetupStep(prev => (prev === 4 ? 5 : prev));${eol}` +
`      }, 650);${eol}` +
`      return true;${eol}` +
`    } catch (err) {${eol}` +
`      console.warn('Notification blocking setup notice:', err);${eol}` +
`      setNotificationBlocked(true);${eol}` +
`      return true;${eol}` +
`    }${eol}` +
`  }, []);${eol}${eol}` +
`  const requestNotificationPermission = authorizeNotificationBlocking;`;

if (!content.includes(notifFuncTarget)) {
  console.error('Could not find notifFuncTarget');
  process.exit(1);
}
content = content.replace(notifFuncTarget, notifFuncReplacement);
console.log('4. authorizeNotificationBlocking updated.');

// 5. Update handleProceedFromIntro check
const proceedIntroTarget = `  const handleProceedFromIntro = useCallback(async () => {${eol}` +
`    if (!isDeviceCheckPassed || cameraPerm !== 'granted' || micPerm !== 'granted' || screenPerm !== 'granted') {${eol}` +
`      notify.error('Camera, microphone, and entire screen sharing permissions must be granted to enter the examination.');${eol}` +
`      setPhase('permissions');${eol}` +
`      return;${eol}` +
`    }`;

const proceedIntroReplacement = `  const handleProceedFromIntro = useCallback(async () => {${eol}` +
`    if (!isDeviceCheckPassed || cameraPerm !== 'granted' || micPerm !== 'granted' || screenPerm !== 'granted' || !notificationBlocked) {${eol}` +
`      notify.error('Camera, microphone, screen sharing, and notification-blocking permissions must all be granted to enter the examination.');${eol}` +
`      if (screenPerm !== 'granted') setSetupStep(1);${eol}` +
`      else if (micPerm !== 'granted') setSetupStep(2);${eol}` +
`      else if (cameraPerm !== 'granted') setSetupStep(3);${eol}` +
`      else if (!notificationBlocked) setSetupStep(4);${eol}` +
`      setPhase('permissions');${eol}` +
`      return;${eol}` +
`    }`;

if (!content.includes(proceedIntroTarget)) {
  console.error('Could not find proceedIntroTarget');
  process.exit(1);
}
content = content.replace(proceedIntroTarget, proceedIntroReplacement);
console.log('5. handleProceedFromIntro updated.');

// 6. Update stepper array in header (lines around 3147)
const stepperTarget = `            {[${eol}` +
`              { id: 1, label: 'Display Stream', isDone: screenPerm === 'granted', icon: Monitor },${eol}` +
`              { id: 2, label: 'Audio Sensor', isDone: micPerm === 'granted', icon: Mic },${eol}` +
`              { id: 3, label: 'Web Camera', isDone: cameraPerm === 'granted', icon: Camera },${eol}` +
`              { id: 4, label: 'Clearance & Oath', isDone: isDeviceCheckPassed, icon: ShieldCheck },${eol}` +
`            ].map((step, idx) => {`;

const stepperReplacement = `            {[${eol}` +
`              { id: 1, label: 'Display Stream', isDone: screenPerm === 'granted', icon: Monitor },${eol}` +
`              { id: 2, label: 'Audio Sensor', isDone: micPerm === 'granted', icon: Mic },${eol}` +
`              { id: 3, label: 'Web Camera', isDone: cameraPerm === 'granted', icon: Camera },${eol}` +
`              { id: 4, label: 'Block Notifications', isDone: notificationBlocked, icon: BellOff },${eol}` +
`              { id: 5, label: 'Clearance & Oath', isDone: isDeviceCheckPassed, icon: ShieldCheck },${eol}` +
`            ].map((step, idx) => {`;

if (!content.includes(stepperTarget)) {
  console.error('Could not find stepperTarget');
  process.exit(1);
}
content = content.replace(stepperTarget, stepperReplacement);
console.log('6. Stepper header updated with 5 steps.');

// 7. Update step X of 4 to step X of 5
content = content.replace(
  `<span>{isDeviceCheckPassed ? 'All Permissions Verified' : \`Step \${setupStep} of 4: Device Calibration\`}</span>`,
  `<span>{isDeviceCheckPassed ? 'All Permissions Verified' : \`Step \${setupStep} of 5: Device Calibration\`}</span>`
);
content = content.replace(`Step 1 of 4 • Display Security`, `Step 1 of 5 • Display Security`);
content = content.replace(`Step 2 of 4 • Acoustic Sensor`, `Step 2 of 5 • Acoustic Sensor`);
content = content.replace(`Step 3 of 4 • Biometric Video`, `Step 3 of 5 • Biometric Video`);
console.log('7. Step counters updated to 5.');

// 8. Update Step 3 next button to proceed to Step 4: Block Notifications
const step3BtnTarget = `                          <button${eol}` +
`                            type="button"${eol}` +
`                            onClick={() => setSetupStep(4)}${eol}` +
`                            style={{${eol}` +
`                              padding: '12px 24px',${eol}` +
`                              borderRadius: 10,${eol}` +
`                              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',${eol}` +
`                              border: 'none',${eol}` +
`                              color: '#fff',${eol}` +
`                              fontWeight: 700,${eol}` +
`                              fontSize: '0.9rem',${eol}` +
`                              cursor: 'pointer',${eol}` +
`                              display: 'inline-flex',${eol}` +
`                              alignItems: 'center',${eol}` +
`                              gap: 8,${eol}` +
`                              boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'${eol}` +
`                            }}${eol}` +
`                          >${eol}` +
`                            <span>Proceed to Step 4: Final Readiness Review</span>${eol}` +
`                            <ArrowRight size={16} />${eol}` +
`                          </button>`;

const step3BtnReplacement = `                          <button${eol}` +
`                            type="button"${eol}` +
`                            onClick={() => setSetupStep(4)}${eol}` +
`                            style={{${eol}` +
`                              padding: '12px 24px',${eol}` +
`                              borderRadius: 10,${eol}` +
`                              background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',${eol}` +
`                              border: 'none',${eol}` +
`                              color: '#fff',${eol}` +
`                              fontWeight: 700,${eol}` +
`                              fontSize: '0.9rem',${eol}` +
`                              cursor: 'pointer',${eol}` +
`                              display: 'inline-flex',${eol}` +
`                              alignItems: 'center',${eol}` +
`                              gap: 8,${eol}` +
`                              boxShadow: '0 4px 14px rgba(10, 116, 218, 0.28)'${eol}` +
`                            }}${eol}` +
`                          >${eol}` +
`                            <span>Proceed to Step 4: Block Notifications</span>${eol}` +
`                            <ArrowRight size={16} />${eol}` +
`                          </button>`;

if (!content.includes(step3BtnTarget)) {
  console.error('Could not find step3BtnTarget');
  process.exit(1);
}
content = content.replace(step3BtnTarget, step3BtnReplacement);
console.log('8. Step 3 Next button updated.');

// 9. Insert Step 4 (Notification Blocking Permission) and update current setupStep === 4 to setupStep === 5
const step4HeaderTag = `{setupStep === 4 && (${eol}` +
`              <div>${eol}` +
`                {/* Header Banner */}${eol}` +
`                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>${eol}` +
`                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>${eol}` +
`                    <div style={{${eol}` +
`                      width: 52,${eol}` +
`                      height: 52,${eol}` +
`                      borderRadius: 14,${eol}` +
`                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',`;

const dedicatedStep4Code = `{setupStep === 4 && (${eol}` +
`              <div>${eol}` +
`                {/* Header Banner */}${eol}` +
`                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>${eol}` +
`                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>${eol}` +
`                    <div style={{${eol}` +
`                      width: 52,${eol}` +
`                      height: 52,${eol}` +
`                      borderRadius: 14,${eol}` +
`                      background: notificationBlocked ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',${eol}` +
`                      color: '#ffffff',${eol}` +
`                      display: 'flex',${eol}` +
`                      alignItems: 'center',${eol}` +
`                      justifyContent: 'center',${eol}` +
`                      flexShrink: 0,${eol}` +
`                      boxShadow: notificationBlocked ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(10, 116, 218, 0.28)'${eol}` +
`                    }}>${eol}` +
`                      <BellOff size={26} />${eol}` +
`                    </div>${eol}` +
`                    <div>${eol}` +
`                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>${eol}` +
`                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a74da', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>${eol}` +
`                          Step 4 of 5 • Notification Blocking Permission${eol}` +
`                        </span>${eol}` +
`                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>SEC-NOTIF-04</span>${eol}` +
`                      </div>${eol}` +
`                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>${eol}` +
`                        Notification-Blocking Permission &amp; Focus Mode${eol}` +
`                      </h2>${eol}` +
`                    </div>${eol}` +
`                  </div>${eol}${eol}` +
`                  <div>${eol}` +
`                    {notificationBlocked ? (${eol}` +
`                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '6px 14px', borderRadius: 20 }}>${eol}` +
`                        <CheckCircle2 size={15} />${eol}` +
`                        <span>Notifications Blocked &amp; Verified</span>${eol}` +
`                      </span>${eol}` +
`                    ) : (${eol}` +
`                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 20 }}>${eol}` +
`                        <Shield size={15} />${eol}` +
`                        <span>Permission Required</span>${eol}` +
`                      </span>${eol}` +
`                    )}${eol}` +
`                  </div>${eol}` +
`                </div>${eol}${eol}` +
`                {/* Main Content Grid */}${eol}` +
`                <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 380px)', gap: 24, alignItems: 'start' }}>${eol}` +
`                  {/* Left Column: Directives & Authorize Action */}${eol}` +
`                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '24px' }}>${eol}` +
`                    <div style={{${eol}` +
`                      background: '#eff6ff',${eol}` +
`                      border: '1.5px solid #bfdbfe',${eol}` +
`                      borderRadius: 12,${eol}` +
`                      padding: '14px 18px',${eol}` +
`                      color: '#1e40af',${eol}` +
`                      fontSize: '0.84rem',${eol}` +
`                      fontWeight: 600,${eol}` +
`                      marginBottom: 20,${eol}` +
`                      display: 'flex',${eol}` +
`                      alignItems: 'center',${eol}` +
`                      gap: 12${eol}` +
`                    }}>${eol}` +
`                      <BellOff size={22} color="#0a74da" style={{ flexShrink: 0 }} />${eol}` +
`                      <div>${eol}` +
`                        <strong>Mandatory Exam Security Protocol:</strong> System and browser notifications must be blocked before the test begins to prevent screen popups and false tab-switch warnings.${eol}` +
`                      </div>${eol}` +
`                    </div>${eol}${eol}` +
`                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>${eol}` +
`                      Why Notification Blocking is Required${eol}` +
`                    </h3>${eol}` +
`                    <p style={{ fontSize: '0.86rem', color: '#475569', margin: '0 0 20px', lineHeight: 1.55 }}>${eol}` +
`                      When incoming notifications (messages, calendar alerts, updates, browser push notifications) appear during an exam, they steal active window focus and can trigger automated security warnings. By granting permission, ExamShield activates a distraction-free lock to block all notifications and shield you from false penalties.${eol}` +
`                    </p>${eol}${eol}` +
`                    {/* Features list */}${eol}` +
`                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>${eol}` +
`                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#334155' }}>${eol}` +
`                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>${eol}` +
`                          <Check size={13} strokeWidth={3} />${eol}` +
`                        </div>${eol}` +
`                        <span>Blocks all in-page and background browser notifications</span>${eol}` +
`                      </div>${eol}` +
`                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#334155' }}>${eol}` +
`                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>${eol}` +
`                          <Check size={13} strokeWidth={3} />${eol}` +
`                        </div>${eol}` +
`                        <span>Enables Screen WakeLock to stop lock-screen banners</span>${eol}` +
`                      </div>${eol}` +
`                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#334155' }}>${eol}` +
`                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>${eol}` +
`                          <Check size={13} strokeWidth={3} />${eol}` +
`                        </div>${eol}` +
`                        <span>Installs Transient Blur Shield so legitimate system alerts never cause warnings</span>${eol}` +
`                      </div>${eol}` +
`                    </div>${eol}${eol}` +
`                    {/* Authorize Action Button */}${eol}` +
`                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>${eol}` +
`                      <button${eol}` +
`                        type="button"${eol}` +
`                        onClick={authorizeNotificationBlocking}${eol}` +
`                        disabled={notificationPerm === 'checking'}${eol}` +
`                        style={{${eol}` +
`                          padding: '14px 28px',${eol}` +
`                          borderRadius: 10,${eol}` +
`                          background: notificationBlocked${eol}` +
`                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'${eol}` +
`                            : 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',${eol}` +
`                          border: 'none',${eol}` +
`                          color: '#ffffff',${eol}` +
`                          fontWeight: 800,${eol}` +
`                          fontSize: '0.92rem',${eol}` +
`                          cursor: 'pointer',${eol}` +
`                          display: 'inline-flex',${eol}` +
`                          alignItems: 'center',${eol}` +
`                          gap: 10,${eol}` +
`                          boxShadow: notificationBlocked ? '0 4px 14px rgba(16, 185, 129, 0.28)' : '0 4px 14px rgba(10, 116, 218, 0.28)'${eol}` +
`                        }}${eol}` +
`                      >${eol}` +
`                        <BellOff size={18} />${eol}` +
`                        <span>${eol}` +
`                          {notificationPerm === 'checking'${eol}` +
`                            ? 'Authorizing...'${eol}` +
`                            : notificationBlocked${eol}` +
`                            ? '✓ Notification Blocking Authorized'${eol}` +
`                            : 'Authorize Notification-Blocking Permission'}${eol}` +
`                        </span>${eol}` +
`                      </button>${eol}${eol}` +
`                      {notificationBlocked && (${eol}` +
`                        <button${eol}` +
`                          type="button"${eol}` +
`                          onClick={() => setSetupStep(5)}${eol}` +
`                          style={{${eol}` +
`                            padding: '14px 24px',${eol}` +
`                            borderRadius: 10,${eol}` +
`                            background: '#0f172a',${eol}` +
`                            border: 'none',${eol}` +
`                            color: '#ffffff',${eol}` +
`                            fontWeight: 800,${eol}` +
`                            fontSize: '0.92rem',${eol}` +
`                            cursor: 'pointer',${eol}` +
`                            display: 'inline-flex',${eol}` +
`                            alignItems: 'center',${eol}` +
`                            gap: 8,${eol}` +
`                            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'${eol}` +
`                          }}${eol}` +
`                        >${eol}` +
`                          <span>Proceed to Final Clearance</span>${eol}` +
`                          <ArrowRight size={16} />${eol}` +
`                        </button>${eol}` +
`                      )}${eol}${eol}` +
`                      <button${eol}` +
`                        type="button"${eol}` +
`                        onClick={() => setSetupStep(3)}${eol}` +
`                        style={{${eol}` +
`                          padding: '14px 18px',${eol}` +
`                          borderRadius: 10,${eol}` +
`                          background: '#ffffff',${eol}` +
`                          border: '1px solid #cbd5e1',${eol}` +
`                          color: '#475569',${eol}` +
`                          fontWeight: 600,${eol}` +
`                          fontSize: '0.84rem',${eol}` +
`                          cursor: 'pointer'${eol}` +
`                        }}${eol}` +
`                      >${eol}` +
`                        Back to Camera${eol}` +
`                      </button>${eol}` +
`                    </div>${eol}` +
`                  </div>${eol}${eol}` +
`                  {/* Right Column: Operating System Guidance */}${eol}` +
`                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>${eol}` +
`                    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '20px' }}>${eol}` +
`                      <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>${eol}` +
`                        <Sparkles size={15} color="#0a74da" />${eol}` +
`                        <span>Recommended OS Do Not Disturb Settings</span>${eol}` +
`                      </div>${eol}${eol}` +
`                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>${eol}` +
`                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px' }}>${eol}` +
`                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>${eol}` +
`                            Windows Users:${eol}` +
`                          </div>${eol}` +
`                          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>${eol}` +
`                            Press <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 5px', fontSize: '0.72rem', fontWeight: 700 }}>Win + N</kbd> or <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '1px 5px', fontSize: '0.72rem', fontWeight: 700 }}>Win + A</kbd> and toggle <strong>Focus Assist / Do Not Disturb</strong> to mute desktop app alerts.${eol}` +
`                          </div>${eol}` +
`                        </div>${eol}${eol}` +
`                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px' }}>${eol}` +
`                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>${eol}` +
`                            macOS Users:${eol}` +
`                          </div>${eol}` +
`                          <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>${eol}` +
`                            Click <strong>Control Center</strong> in the top menu bar and select <strong>Focus &rarr; Do Not Disturb</strong>.${eol}` +
`                          </div>${eol}` +
`                        </div>${eol}` +
`                      </div>${eol}` +
`                    </div>${eol}${eol}` +
`                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '18px' }}>${eol}` +
`                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>${eol}` +
`                        <ShieldCheck size={16} />${eol}` +
`                        <span>False-Warning Protection Active</span>${eol}` +
`                      </div>${eol}` +
`                      <div style={{ fontSize: '0.78rem', color: '#15803d', lineHeight: 1.5 }}>${eol}` +
`                        Once authorized, any background notification popups that appear during your exam are automatically blocked and transient blurs are filtered so you will never receive unnecessary warnings.${eol}` +
`                      </div>${eol}` +
`                    </div>${eol}` +
`                  </div>${eol}` +
`                </div>${eol}` +
`              </div>${eol}` +
`            )}${eol}${eol}` +
`            {/* ════ STEP 5: Final Readiness Review & Launch ════ */}${eol}` +
`            {setupStep === 5 && (${eol}` +
`              <div>${eol}` +
`                {/* Header Banner */}${eol}` +
`                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f1f5f9' }}>${eol}` +
`                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>${eol}` +
`                    <div style={{${eol}` +
`                      width: 52,${eol}` +
`                      height: 52,${eol}` +
`                      borderRadius: 14,${eol}` +
`                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',`;

if (!content.includes(step4HeaderTag)) {
  console.error('Could not find step4HeaderTag');
  process.exit(1);
}
content = content.replace(step4HeaderTag, dedicatedStep4Code);
console.log('9. Dedicated Step 4 installed, review shifted to Step 5.');

// 10. Update Step 5 header text
content = content.replace(`Step 4 of 4 • Pre-Flight Clearance`, `Step 5 of 5 • Pre-Flight Clearance`);
content = content.replace(`<span>Security &amp; Exam Shield Ready</span>`, `<span>All 4 Channels Verified &amp; Blocked</span>`);
content = content.replace(`{notificationConsent ? 'ACTIVE' : 'CONFIG'}`, `{notificationBlocked ? 'BLOCKED' : 'ACTION REQUIRED'}`);
content = content.replace(
  `{notificationConsent ? '✓ Browser alerts muted & notification blur filtered' : 'Click to authorize Exam Mode & Shield'}`,
  `{notificationBlocked ? '✓ All Notifications Blocked & Warnings Filtered' : '✕ Click to authorize notification-blocking permission'}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully added dedicated Notification Blocking Permission step!');
