#!/usr/bin/env node

'use strict';

const colors = require('colors/safe');
const finder = require('find-package-json');

const path = require('path');
const { writeFile } = require('fs').promises;

const { filename } = finder(process.cwd()).next();

const getLockfile = require('./getLockfile');

const {
	output,
	date,
	package: pkg,
} = require('yargs')
	.help()
	.option('date', {
		type: 'string',
		describe: '“now”, or a date (same format as `new Date()`)',
		demandOption: true,
		coerce(arg) {
			if (arg !== 'now' && !new Date(arg).getTime()) {
				throw new TypeError('`date` must be “now” or a valid format for `new Date`');
			}
			return arg;
		},
	})
	.option('package', {
		type: 'string',
		describe: 'path to a `package.json` file',
		normalize: true,
		coerce(arg) { return path.resolve(arg); },
	})
	.default('package', filename, path.relative(process.cwd(), filename))
	.option('output', {
		alias: 'o',
		describe: 'output file path',
		normalize: true,
		demandOption: true,
	})
	.parse();

getLockfile(pkg, date === 'now' ? undefined : date)
	.then((lockfile) => writeFile(output, lockfile))
	.then(() => { console.log(colors.green('Lockfile contents written!')); })
	.catch((err) => console.error(err));
