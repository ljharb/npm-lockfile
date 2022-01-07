'use strict';

const path = require('path');
const inspect = require('object-inspect');
const colors = require('colors/safe');

const { Arborist } = require('@npmcli/arborist');
const { statSync } = require('fs');

module.exports = async function getLockfile(packageFile, date = void undefined, { only } = {}) {
	if (typeof packageFile !== 'string' || packageFile.length === 0) {
		throw colors.red(`\`packageFile\` must be a non-empty string; got ${inspect(packageFile)}`);
	}
	if (!statSync(packageFile).isFile()) {
		throw colors.red('`packageFile` must be a file that exists');
	}
	if (typeof date !== 'undefined' && !new Date(date).getTime()) {
		throw colors.red(`\`date\` must be a valid Date format if provided; got ${inspect(date)}`);
	}

	const pkgDir = path.dirname(packageFile);
	const arb = new Arborist({
		path: pkgDir,
		before: date,
		only,
	});

	const tree = await arb.buildIdealTree();

	await tree.meta.commit();

	// TODO: remove once X is released in arborist
	// eslint-disable-next-line no-restricted-properties
	tree.meta.indent = tree.package[Symbol.for('indent')];

	return String(tree.meta);
};
