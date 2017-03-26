'use strict';

const util = require('util');

const _ = require('lodash');

const moment = require('moment');
const pg = require('pg');
const baby = require('babyparse');
const request = require('request');
const bytes = require('bytes');


//--------------------------------------------------------------------------
// constants

const STATIONS = [
	`HWPS1`, `HWPS2`, `HWPS3`, `HWPS4`,
	`HWPS5`, `HWPS6`, `HWPS7`, `HWPS8`
];


//--------------------------------------------------------------------------
// stuff into database

function insertEntries(entries, callback) {
	let insertCount = 0;
	let duplicateCount = 0;
	let otherCount = 0;

	function insertEntry(client, entry) {
		// console.log(`scheduling insert ${util.inspect(entry, {breakLength: 100})}...`);
		client.query("INSERT INTO dispatch (date, duid, power) values ($1, $2, $3) ", [entry.date, entry.duid, entry.power], (err, result) => {
			if (!err) {
				insertCount++;
				console.log(`inserted ${util.inspect(entry, {breakLength: 100})}: ${result.rowCount} row`);
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
		console.log(`inserted ${insertCount}, duplicates ${duplicateCount}, errors ${otherCount}`);
		client.end();
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

			console.log(`${duid}: ${data.length} rows`);
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
	getDispatchBatch(STATIONS, interval, rows => {
		// console.log(util.inspect(rows, {colors: false, breakLength: 150}));
		insertEntries(rows, callback);
	});
}


function exportData() {
	getRecords(records => {
		const csv = baby.unparse(records);
		const byteStr = bytes(csv.length, {unitSeparator:' '});
		console.log(`CSV: ${byteStr}`);
	});
}

if (FETCH) {
	importData(`1h`, exportData);
} else {
	exportData();
}
