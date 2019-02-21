'use strict';

const path = require('path');
const { exec } = require('child_process');
const promisify = require('util.promisify');
const isDate = require('is-date-object');
const inspect = require('object-inspect');
const chalk = require('chalk');

const copyFile = promisify(require('fs-copy-file'));
const readFile = promisify(require('fs').readFile);

const getProjectTempDir = require('./getProjectTempDir');

module.exports = function getLockfile(packageFile, date, logger = () => {}) {
	if (typeof packageFile !== 'string' || packageFile.length === 0) {
		return Promise.reject(chalk.red(`\`packageFile\` must be a non-empty string; got ${inspect(packageFile)}`));
	}
	if (typeof date !== 'undefined' && !isDate(date)) {
		return Promise.reject(chalk.red(`\`date\` must be a Date object if provided; got ${inspect(date)}`));
	}
	const tmpDirP = getProjectTempDir();
	const dateStr = (date || new Date()).toISOString();
	const copyPkg = tmpDirP.then(tmpDir => {
		logger(chalk.blue(`Creating \`package.json\` in temp dir for ${dateStr} lockfile`));
		return copyFile(packageFile, path.join(tmpDir, 'package.json'));
	});
	return Promise.all([tmpDirP, copyPkg]).then(([tmpDir]) => new Promise((resolve, reject) => {
		const PATH = path.join(tmpDir, '../node_modules/.bin');
		logger(chalk.blue(`Running npm install to create lockfile for ${dateStr}...`));
		exec(`PATH=${PATH}:$PATH npm install --package-lock-only --before=${dateStr}`, { cwd: tmpDir }, err => {
			if (err) {
				reject(err);
			} else {
				resolve(tmpDir);
			}
		});
	})).then(tmpDir => {
		logger(chalk.blue(`Reading lockfile contents for ${dateStr}...`));
		const lockfile = path.join(tmpDir, 'package-lock.json');
		return readFile(lockfile, { encoding: 'utf-8' });
	});
};
