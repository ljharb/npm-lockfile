'use strict';

const { execSync } = require('child_process');
const path = require('path');
const { readFileSync, unlinkSync } = require('fs');

const test = require('tape');

const lockPath = path.join(__dirname, '../package-lock.json');

test('simple test', (t) => {
	execSync(`"${path.join(__dirname, '../bin.js')}" -o package-lock.json --date=now`);
	const lockPackage = readFileSync(lockPath, { encoding: 'utf-8' });
	t.ok(lockPackage, 'lockfile produced by package');
	execSync('npm install --package-lock --package-lock-only', { encoding: 'utf-8', cwd: path.join(__dirname, '..') });
	const lockActual = readFileSync(lockPath, { encoding: 'utf-8' });
	t.ok(lockActual, 'lockfile produced by npm');
	unlinkSync(lockPath);
	t.deepEqual(JSON.parse(lockActual), JSON.parse(lockPackage), 'actual =~= package');
	t.end();
});

test('invalid date', (t) => {
	try {
		execSync(`"${path.join(__dirname, '../bin.js')}" -o /dev/null --date=not-a-date`, { encoding: 'utf-8', stdio: 'pipe' });
		t.fail('should have thrown');
	} catch (e) {
		t.ok(e.status !== 0, 'exits with non-zero status');
		t.ok(e.stderr.indexOf('date') > -1, 'error message mentions date');
	}
	t.end();
});

test('specific date', (t) => {
	execSync(`"${path.join(__dirname, '../bin.js')}" -o /dev/null --date=2024-01-01`, { encoding: 'utf-8', stdio: 'pipe' });
	t.pass('runs with a specific date');
	t.end();
});

test('getLockfile error is caught', (t) => {
	execSync(`"${path.join(__dirname, '../bin.js')}" -o /dev/null --date=now --package=/nonexistent/package.json`, { encoding: 'utf-8', stdio: 'pipe' });
	t.pass('process exits without crashing');
	t.end();
});
