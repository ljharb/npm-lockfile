'use strict';

const tmp = require('tmp');
const nodeCleanup = require('node-cleanup');
const semver = require('semver');
const promisify = require('util.promisify');
const rimraf = require('rimraf');
const chalk = require('chalk');

const path = require('path');
const { exec, execSync } = require('child_process');
const writeFile = promisify(require('fs').writeFile);

const cleanupHandlers = [];
const finalCleanup = function finalCleanup() {
	for (let i = 0; i < cleanupHandlers.length; ++i) {
		cleanupHandlers[i]();
	}
};

let rootTempDir;
const getRootTempDir = function getRootTempDir(npmNeeded, logger = () => {}) {
	if (!rootTempDir) {
		logger(chalk.blue('Creating root temp directory, to hold temporary lockfiles...'));
		rootTempDir = new Promise((resolve, reject) => {
			tmp.dir((err, tmpDir, cleanup) => {
				if (err) {
					reject(err);
				} else {
					resolve(tmpDir);
					cleanupHandlers.push(cleanup);
					nodeCleanup(finalCleanup);
				}
			});
		}).then((tmpDir) => {
			const npmV = execSync('npm --version', { encoding: 'utf-8', cwd: tmpDir }).trim();
			logger(`${chalk.blue('Checking npm version:')} \`npm --version\` -> v${npmV}`);
			if (!semver.satisfies(npmV, npmNeeded)) {
				const pkgContents = {
					private: true,
					name: 'npm-jail',
					dependencies: {
						npm: npmNeeded,
					},
				};
				return writeFile(
					path.join(tmpDir, 'package.json'),
					JSON.stringify(pkgContents)
				).then(() => new Promise((resolve, reject) => {
					cleanupHandlers.unshift(() => {
						rimraf.sync(path.join(tmpDir, '*'));
					});
					exec('npm install --no-package-lock --silent >/dev/null', { cwd: tmpDir }, (err) => {
						if (err) {
							return reject(err);
						}
						resolve(tmpDir);
					});
				}));
			}
			return tmpDir;
		});
	}
	return rootTempDir;
};

module.exports = function getProjectTempDir({ npmNeeded = '^6.9.0-0', logger = undefined } = {}) {
	return getRootTempDir(npmNeeded, logger).then((rootDir) => {
		const projectDir = path.join(rootDir, 'XXXXXX');
		return new Promise((resolve, reject) => {
			tmp.dir({ template: projectDir }, (err, tmpDir, cleanup) => {
				if (err) {
					reject(err);
				} else {
					resolve(tmpDir);
					cleanupHandlers.unshift(cleanup);
				}
			});
		});
	});
};
