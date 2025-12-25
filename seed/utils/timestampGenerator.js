function generateTimestamps(config) {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const timestamps = [];

  // Last 7 days
  const last7Start = now - 7 * oneDayMs;
  const last7Timestamps = distributeEvenly(
    last7Start,
    now,
    config.last7DaysCount,
    { avoidClustering: true, workingHours: true }
  );
  timestamps.push(...last7Timestamps);

  // Days 8-30
  const days8to30Start = now - 30 * oneDayMs;
  const days8to30End = now - 8 * oneDayMs;
  const days8to30Timestamps = distributeEvenly(
    days8to30Start,
    days8to30End,
    config.days8to30Count,
    { avoidClustering: true, workingHours: true }
  );
  timestamps.push(...days8to30Timestamps);

  return timestamps.sort((a, b) => a - b);
}

function distributeEvenly(startMs, endMs, count, options = {}) {
  const timestamps = [];
  const intervalMs = (endMs - startMs) / count;

  for (let i = 0; i < count; i++) {
    let timestamp = startMs + (intervalMs * i);
    const variation = (Math.random() - 0.5) * intervalMs * 0.6;
    timestamp += variation;

    if (options.workingHours) {
      timestamp = snapToWorkingHours(timestamp);
    }

    if (options.avoidClustering) {
      timestamp = avoidWeekendClustering(timestamp);
    }

    timestamps.push(new Date(timestamp));
  }

  return timestamps;
}

function snapToWorkingHours(timestamp) {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour < 10) {
    date.setHours(10 + Math.floor(Math.random() * 3));
  } else if (hour > 20) {
    date.setHours(16 + Math.floor(Math.random() * 4));
  }

  return date.getTime();
}

function avoidWeekendClustering(timestamp) {
  const date = new Date(timestamp);
  const dayOfWeek = date.getDay();

  if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.5) {
    const shift = dayOfWeek === 0 ? 1 : -1;
    date.setDate(date.getDate() + shift);
  }

  return date.getTime();
}

module.exports = { generateTimestamps };
