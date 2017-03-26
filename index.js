'use strict';


const hrstart = process.hrtime();

const util = require('util');

const _ = require('lodash');

const moment = require('moment');
const pg = require('pg');
const baby = require('babyparse');
const request = require('request');
const bytes = require('bytes');
const ProgressBar = require('progress');

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

archive.importData(STATIONS, `1h`, () => {
	report.buildReport(done);
});


/*
//--------------------------------------------------------------------------
// aws lambda handler


exports.archiver = (event, context, callback) => {
	function getData(callback) {
		console.log('==> archiver 1');
		const client = new pg.Client();
		console.log('==> archiver 2');

		client.on('drain', () => {
			client.end();
		});

		pg.on('error', function (err) {
			console.log('Database error!', err);
		});

		client.connect();
		console.log('==> archiver 3');

		client.query(`SELECT date, duid, power FROM dispatch WHERE date BETWEEN '2017-03-25T00:00+10:00' AND '2017-03-25T00:10+10:00'`, (err, result) => {
			console.log('==> archiver 4');
			if (!err) {
				const csv = baby.unparse(result.rows);
				console.log(`foo: ` + csv);
				callback(`bar: ` + csv);
			} else {
				console.log(`==> error: ` + err);
			}
			//client.destroy();
		});
	}

	console.log('==> archiver start');

	getData((data) => {
		console.log('==> archiver got data');
		callback(null, data);
	});
};


// importData(`10m`, () => {
// 	console.log(`archiver done`);
// 	callback(null);
// });

exports.archiver(null, null, (err, data) => {
	console.log(data);
});

// exports.handler = (event, context, callback) => {
// 	console.log('Received event:', JSON.stringify(event, null, 2));
//
// 	const done = (err, res) => callback(null, {
// 		statusCode: err ? '400' : '200',
// 		body: err ? err.message : res,
// 		headers: {
// 			'Content-Type': 'text/csv',
// 		},
// 	});
//
// 	switch (event.httpMethod) {
// 		case 'GET':
// 			exportData(csv => done(null, csv));
// 			break;
//
// 		default:
// 			done(new Error(`Unsupported method2 "${event.httpMethod}"`));
// 	}
// };

console.log('==> archiver end of file');
*/