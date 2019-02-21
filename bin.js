#!/usr/bin/env node

'use strict';

const promisify = require('util.promisify');
const chalk = require('chalk');
const finder = require('find-package-json');

const path = require('path');
const writeFile = promisify(require('fs').writeFile);

const { filename } = finder(process.cwd()).next();

const getLockfile = require('./getLockfile');

const {
	argv: {
		output,
		date,
		'package': pkg
	}
} = require('yargs')
	.help()
	.option('date', {
		type: 'string',
		describe: '“now”, or a date (same format as `new Date()`)',
		demandOption: true,
		coerce: function (arg) { return arg === 'now' ? arg : new Date(arg); }
	})
	.option('package', {
		type: 'string',
		describe: 'path to a `package.json` file',
		normalize: true,
		coerce: function (arg) { return path.resolve(arg); }
	})
	.default('package', filename, path.relative(process.cwd(), filename))
	.option('output', {
		alias: 'o',
		describe: 'output file path',
		normalize: true,
		demandOption: true
	});

getLockfile(pkg, date === 'now' ? undefined : date, console.log.bind(console))
	.then(lockfile => writeFile(output, lockfile))
	.then(() => { console.log(chalk.green('Lockfile contents written!')); })
	.catch(err => console.error(err));
