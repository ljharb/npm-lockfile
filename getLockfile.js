'use strict';

const path = require('path');
const inspect = require('object-inspect');
const colors = require('colors/safe');

const { Arborist } = require('@npmcli/arborist');
const { stat } = require('fs').promises;

module.exports = async function getLockfile(packageFile, date = void undefined, options = {}) {
	if (typeof packageFile !== 'string' || packageFile.length === 0) {
		throw colors.red(`\`packageFile\` must be a non-empty string; got ${inspect(packageFile)}`);
	}
	if (!(await stat(packageFile)).isFile()) {
		throw colors.red('`packageFile` must be a file that exists');
	}
	if (typeof date !== 'undefined' && !new Date(date).getTime()) {
		throw colors.red(`\`date\` must be a valid Date format if provided; got ${inspect(date)}`);
	}

	const pkgDir = path.dirname(packageFile);
	const arb = new Arborist({
		path: pkgDir,
		before: date,
		...options,
	});

	const { meta } = await arb.buildIdealTree();

	await meta.commit();

	return String(meta);
};
