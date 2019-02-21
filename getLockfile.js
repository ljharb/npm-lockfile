'use strict';

const path = require('path');
const { exec } = require('child_process');
const promisify = require('util.promisify');
const inspect = require('object-inspect');
const chalk = require('chalk');

const copyFile = promisify(require('fs-copy-file'));
const readFile = promisify(require('fs').readFile);

const getProjectTempDir = require('./getProjectTempDir');

module.exports = function getLockfile(packageFile, date, logger = () => {}) {
	if (typeof packageFile !== 'string' || packageFile.length === 0) {
		return Promise.reject(chalk.red(`\`packageFile\` must be a non-empty string; got ${inspect(packageFile)}`));
	}
	if (typeof date !== 'undefined' && !new Date(date).getTime()) {
		return Promise.reject(chalk.red(`\`date\` must be a valid Date format if provided; got ${inspect(date)}`));
	}
	const tmpDirP = getProjectTempDir();
	const npmRC = path.join(path.dirname(packageFile), '.npmrc');
	const copyPkg = tmpDirP.then(tmpDir => {
		logger(chalk.blue(`Creating \`package.json\` in temp dir for ${date} lockfile`));
		return Promise.all([
			copyFile(packageFile, path.join(tmpDir, 'package.json')),
			copyFile(npmRC, path.join(tmpDir, '.npmrc'))
		]);
	});
	return Promise.all([tmpDirP, copyPkg]).then(([tmpDir]) => new Promise((resolve, reject) => {
		const PATH = path.join(tmpDir, '../node_modules/.bin');
		logger(chalk.blue(`Running npm install to create lockfile for ${date}...`));
		exec(`PATH=${PATH}:$PATH npm install --package-lock-only${date ? ` --before=${date}` : ''}`, { cwd: tmpDir }, err => {
			if (err) {
				reject(err);
			} else {
				resolve(tmpDir);
			}
		});
	})).then(tmpDir => {
		logger(chalk.blue(`Reading lockfile contents for ${date}...`));
		const lockfile = path.join(tmpDir, 'package-lock.json');
		return readFile(lockfile, { encoding: 'utf-8' });
	});
};
