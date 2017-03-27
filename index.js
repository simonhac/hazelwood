'use strict';

const hrstart = process.hrtime();

const util = require('util');

const bytes = require('bytes');
const pg = require('pg');
const baby = require('babyparse');

const archive = require('./lib/archive.js');
const report = require('./lib/report.js');


const STATIONS = [
	`HWPS1`, `HWPS2`, `HWPS3`, `HWPS4`,
	`HWPS5`, `HWPS6`, `HWPS7`, `HWPS8`
];


function done() {
	function round(val) {
		return Math.round(val * 100)/100;
	}

	const hrend = process.hrtime(hrstart);
	const elapsed = round((hrend[0] * 1000) +  hrend[1]/1000000);
	console.log("\ntime: %d ms", elapsed);
}

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
				const csv = baby.unparse(result.rows);
				console.log(`foo: ` + csv);
				callback(`bar: ` + csv);
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
	console.log('==> archiver fetching records for past ${period}…');

	archive.importData(STATIONS, period, (err, records) => {
		if (!err) {
			console.log(`==> archived ${records.length} entries.`);
			const lines = baby.unparse(records).split(`\r\n`);
			callback(err, util.inspect(lines));
		} else {
			console.log(`==> bailing: ${err}`);
			callback(err);
		}
	});
};

exports.reporter= (event, context, callback) => {
	console.log('==> reporter…');

	report.buildReport((err, csv) => {
		if (!err) {
			console.log(`==> built ${bytes(csv.length, {unitSeparator:' '})} CSV file`);
			callback(null, csv);
		} else {
			console.log(`==> bailing: ${err}`);
			callback(err);
		}
	});
};

//--------------------------------------------------------------------------
// choose mode from environment variable when running in local env

switch (process.env.FAKE) {
	case `archiver`:
		exports.archiver(null, null, (err, data) => {
			console.log(`==> output: \n${data}`);
		});
		break;

	case `reporter`:
		exports.reporter(null, null, (err, data) => {
			console.log(`==> output: \n${data}`);
		});
		break;

	default:
		console.log(`no FAKE env set.`);
}
