// runner.js
const { VM } = require("vm2");

const vm = new VM({
  timeout: 3000,
  sandbox: {},
  eval: false,
  wasm: false
});

try {
  const result = vm.run(process.argv[2]);
  console.log(JSON.stringify({ success: true, result }));
} catch (e) {
  console.log(JSON.stringify({ success: false, error: e.message }));
}
