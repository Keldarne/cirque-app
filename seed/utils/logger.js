function success(message) {
  console.log(`✅ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

function warn(message) {
  console.log(`⚠️  ${message}`);
}

function error(message) {
  console.log(`❌ ${message}`);
}

function header(message) {
  console.log('\n' + '═'.repeat(50));
  console.log(`  ${message}`);
  console.log('═'.repeat(50) + '\n');
}

function section(message) {
  console.log(`\n🔹 ${message}`);
}

module.exports = {
  success,
  info,
  warn,
  error,
  header,
  section
};
