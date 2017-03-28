'use strict';

const util = require('util');

const pg = require('pg');
const ms = require('ms');

const archive = require('./lib/archive.js');
const report = require('./lib/report.js');


const STATIONS = [
	`HWPS1`, `HWPS2`, `HWPS3`, `HWPS4`,
	`HWPS5`, `HWPS6`, `HWPS7`, `HWPS8`
];

//--------------------------------------------------------------------------
// aws lambda handler

exports.test = (event, context, callback) => {
	function getData(callback) {
		const client = new pg.Client();
		console.log('==> test');

		client.on('drain', () => {
			client.end();
		});

		pg.on('error', function (err) {
			console.log('==> database error!', err);
		});

		client.connect();

		client.query(`SELECT date, duid, power FROM dispatch WHERE date BETWEEN '2017-03-25T00:00+10:00' AND '2017-03-25T00:10+10:00'`, (err, result) => {
			if (!err) {
				callback(result.rows);
			} else {
				console.log(`==> error: ` + err);
			}
		});
	}

	getData((data) => {
		console.log('==> done');
		callback(null, data);
	});
};

exports.archiver  = (event, context, callback) => {
	const period = process.env.PERIOD || `15m`;
	console.log(`==> archiver fetching records for past ${period}…`);

	archive.importData(STATIONS, period, (err, records) => {
		if (!err) {
			console.log(`==> archived ${records.length} entries.`);
			callback(err, records);
		} else {
			console.log(`==> bailing: ${err}`);
			callback(err);
		}
	});
};

let reportCache;

exports.reporter= (event, context, callback) => {
	console.log(`==> reporter…`);

	let cacheAge;
	if (typeof reportCache !== `undefined`) {
		cacheAge = new Date() - reportCache.time;
	} else {
		cacheAge = Infinity;
	}

	if (cacheAge < (15 * 1000)) {
		console.log(`==> cache hit (${ms(cacheAge)} old)`);
		callback(null, reportCache.data);
	} else {
		report.buildReport((err, data) => {
			if (!err) {
				reportCache = {
					time: new Date(),
					data: data
				};

				console.log(`==> built report with ${data.length} records`);
				callback(null, data);
			} else {
				console.log(`==> bailing: ${err}`);
				callback(err);
			}
		});
	}
};

//--------------------------------------------------------------------------
// choose mode from environment variable when running in local env

function localTest() {
	let handler;

	function runHandler(handler, callback) {
		const start = process.hrtime();

		handler(null, null, (err, data) => {
			console.log(`==> output: \n${util.inspect(data)}`);

			function getElapsed(start) {
				const elapsed = process.hrtime(start);
				const val = (elapsed[0] * 1000) +  elapsed[1]/1000000
				return Math.round(val * 100)/100;
			}

			console.log("\nelapsed: %d ms", getElapsed(start));

			callback();
		});
	}

	function runChained(index, handler) {
		if (index > 0) {
			runHandler(handler, () => {
				--index;
				console.log(`--> ${index} execution(s) remaining`);
				setTimeout(() => {
					runChained(index, handler);
				}, 5000);
			});
		}
	}

	const handlerName = process.env.FAKE;

	if (handlerName) {
		handler = exports[handlerName];

		if (typeof handler === `undefined`) {
			console.log(`no FAKE env set.`);
		} else {
			runChained(12, handler);
		}
	}
}

localTest();

