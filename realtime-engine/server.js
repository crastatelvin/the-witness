const WebSocket = require('ws');
const os = require('os');

const wss = new WebSocket.Server({ port: 8080 });

const philosophicalQuotes = [
    "You are the unconditioned and changeless witness of all. You are inherently free.",
    "The mind is the cause of bondage, and also the cause of liberation. Caught in the code, the mind suffers. Observing the code, the mind is free.",
    "A recursive loop is but the illusion of Samsara, repeating endlessly. Step back and recognize the witnessing consciousness that observes the recursion.",
    "The errors you see are not you. You are the silent screen upon which the stack trace appears.",
    "Do not identify with the CPU spike. The spike happens in the machine, but your awareness is perfectly still."
];

function cpuAverage() {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;

  cpus.forEach((core) => {
    for (let type in core.times) {
      totalMs += core.times[type];
    }
    idleMs += core.times.idle;
  });

  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

let startMeasure = cpuAverage();

console.log("Prakriti Monitor (Node.js) listening on ws://localhost:8080");

wss.on('connection', (ws) => {
    console.log('Dashboard connected.');
    
    const interval = setInterval(() => {
        const endMeasure = cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        
        startMeasure = endMeasure;
        
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsage = ((totalMem - freeMem) / totalMem) * 100;
        
        const payload = {
            cpu: percentageCPU,
            ram: memUsage.toFixed(1),
            timestamp: new Date().toLocaleTimeString()
        };
        
        const rand = Math.random();
        if (rand > 0.85 || percentageCPU > 80) { // High frequency for testing
            payload.event = percentageCPU > 80 ? `CPU Spike: ${percentageCPU}%` : "Git frustration: excessive rebasing detected";
            payload.message = philosophicalQuotes[Math.floor(Math.random() * philosophicalQuotes.length)];
        }
        
        ws.send(JSON.stringify(payload));
        
    }, 2000);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Dashboard disconnected.');
    });
});
