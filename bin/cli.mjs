#!/usr/bin/env node
import { run } from '../src/cli.mjs';

const MINIMUM_MAJOR = 20;

const currentMajor = () => Number.parseInt(process.versions.node.split('.')[0], 10);

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (currentMajor() < MINIMUM_MAJOR) {
  fail(`agent-rules needs Node ${MINIMUM_MAJOR} or newer (found ${process.versions.node}).`);
}

run(process.argv.slice(2)).catch((error) => fail(error.message));
