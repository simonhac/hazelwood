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


//--------------------------------------------------------------------------
// constants

const STATIONS = [
	`HWPS1`, `HWPS2`, `HWPS3`, `HWPS4`,
	`HWPS5`, `HWPS6`, `HWPS7`, `HWPS8`
];


//--------------------------------------------------------------------------
// stuff into database

function insertEntries(entries, callback) {
	const bar = new ProgressBar('inserting [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: entries.length
	});

	let insertCount = 0;
	let duplicateCount = 0;
	let otherCount = 0;

	function insertEntry(client, entry) {
		// console.log(`scheduling insert ${util.inspect(entry, {breakLength: 100})}...`);
		client.query("INSERT INTO dispatch (date, duid, power) values ($1, $2, $3) ", [entry.date, entry.duid, entry.power], (err, result) => {
			bar.tick();
			if (!err) {
				insertCount++;
				// console.log(`inserted ${util.inspect(entry, {breakLength: 100})}: ${result.rowCount} row`);
			} else {
				if (err.constraint === `dispatch_date_duid_power_key`) {
					duplicateCount++;
				} else {
					otherCount++;
					console.log(`insertion fail: ${util.inspect(entry, {breakLength: 100})}: ${err.detail}`);
				}
			}
		});
	}

	const client = new pg.Client();

	client.on('drain', () => {
		client.end();
		console.log(`\nstash: inserted ${insertCount}, ignored ${duplicateCount} duplicates, rejected ${otherCount} entries`);
		callback();
	});

	client.connect();
	_.each(entries, entry => insertEntry(client, entry));
}

function getDispatchIndividual(duid, period, callback) {
	// thanks data61!
	const url = `http://services.aremi.nationalmap.gov.au/aemo/v4/duidcsv/${duid}?offset=${period}`;
	request(url, (error, response, body) => {
		if (error) {
			console.log('error:', error);
			console.log('statusCode:', response && response.statusCode);
			callback(error);
		} else if (response.statusCode === 200) {
			const parsed = baby.parse(body, { delimiter: `,`, skipEmptyLines: true, header: true });
			const data = _.map(parsed.data, row => {
				return {date: row[`Time (AEST)`], duid: duid, power: row.MW};
			});

			console.log(`fetch: received ${data.length} rows from ${duid}`);
		callback(null, data);
		} else {
			console.log('unexpected statusCode:', response && response.statusCode);
			callback(`unexpected statusCode ${response && response.statusCode}`);
		}
	});
}

function getDispatchBatch(stations, period, callback) {
	let rows = [];
	let index = 0;

	function next(index, period) {
		const duid = stations[index];
		getDispatchIndividual(duid, period, (err, data) => {
			if (!err) {
				// TODO what's the lodash way to merging one array into another?
				rows = _.union(rows, data);
			}

			if (++index === stations.length) {
				callback(rows);
			} else {
				next(index, period);
			}
		});
	}

	next(index, period);
}

//--------------------------------------------------------------------------
// report

function tidyUpLastRow(rows) {
	// there's a possibility that the last row will have missing data -- remove it
	if (rows.length !== 0) {
		const lastRow = _.last(rows);
		if (_.includes(lastRow, null)) {
			console.log(`removing last row: ` + util.inspect(lastRow));
			rows.pop();
		}
	}
}

function getRecords(callback) {
	const from = `2017-03-25T00:00+10:00`;
	const to = `2017-04-02T00:00+10:00`;

	// i'd love to let PG substitute in from & to, but can't make it work with the crosstab quoted query
	const CROSSTAB = `SELECT * FROM crosstab('SELECT date, duid, power FROM dispatch WHERE date BETWEEN ''${from}'' AND ''${to}'' ORDER BY 1, 2'
			 ,$$VALUES ('HWPS1'::text), ('HWPS2'), ('HWPS3'), ('HWPS4'), ('HWPS5'), ('HWPS6'), ('HWPS7'), ('HWPS8')$$)
		   AS ct("date" TIMESTAMP WITH TIME ZONE, "unit 1" REAL, "unit 2" REAL, "unit 3" REAL, "unit 4" REAL, "unit 5" REAL, "unit 6" REAL, "unit 7" REAL, "unit 8" REAL);`;

	const client = new pg.Client();

	client.on('drain', () => {
		client.end();
	});

	client.connect();

	client.query(CROSSTAB, (err, result) => {
		if (!err) {
			const rows = result.rows;

			tidyUpLastRow(rows);

			_.each(rows, row => {
				row.date = moment(row.date).utcOffset(`+10`).format(`YYYY-MM-DDTHH:mm+10`);
			});

			callback(rows);
		} else {
			console.log(err);
		}
	});
}

//--------------------------------------------------------------------------
// main

const FETCH = true;

function importData(interval, callback) {
	console.log(`fetch: download ${interval} of data`);
	getDispatchBatch(STATIONS, interval, rows => {
		// console.log(util.inspect(rows, {colors: false, breakLength: 150}));
		insertEntries(rows, callback);
	});
}

function exportData(callback) {
	getRecords(records => {
		const csv = baby.unparse(records);
		const byteStr = bytes(csv.length, {unitSeparator:' '});
		console.log(`report: ${byteStr} CSV file`);
		callback(csv);
	});
}

function done() {
	function round(val) {
		return Math.round(val * 100)/100;
	}

	const hrend = process.hrtime(hrstart);
	const elapsed = round((hrend[0] * 1000) +  hrend[1]/1000000);
	console.log("time: %d ms", elapsed);
}

if (FETCH) {
	importData(`12h`, () => exportData(done));
} else {
	exportData(done);
}

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