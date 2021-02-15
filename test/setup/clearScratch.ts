require('reflect-metadata');
const fs = require('fs');
const path = require('path');

const SCRATCH_PATH = './scratch';

if (fs.existsSync(SCRATCH_PATH)) {
  const files = fs.readdirSync(SCRATCH_PATH);
  files.forEach((file: string) => fs.rmSync(path.join(SCRATCH_PATH, file)));
}
