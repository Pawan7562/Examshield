const { Client } = require('../backend/node_modules/ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== DOCKER INSPECT STATE (backend 10 & 11) ==="
    docker inspect examshield-backend-10 --format '{{.Name}}: StartedAt={{.State.StartedAt}}, FinishedAt={{.State.FinishedAt}}, ExitCode={{.State.ExitCode}}'
    docker inspect examshield-backend-11 --format '{{.Name}}: StartedAt={{.State.StartedAt}}, FinishedAt={{.State.FinishedAt}}, ExitCode={{.State.ExitCode}}'
    echo "=== RECENT DOCKER EVENTS ==="
    docker events --since '30m' --until '0s' --filter 'type=container' | tail -n 20 || true
    echo "=== CRON JOBS ==="
    crontab -l || true
    echo "=== SYSTEMD AUTOSCALER / TIMERS ==="
    systemctl list-timers --no-pager || true
    systemctl list-units --type=service --state=running | grep -E 'scale|exam|docker|orderkare' || true
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.pipe(process.stdout);
    stream.stderr.pipe(process.stderr);
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '147.93.19.252',
  port: 22,
  username: 'root',
  password: 'a?2n,rVia15/Qqih'
});

