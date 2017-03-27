'use strict';

const util = require('util');

const _ = require('lodash');

const moment = require('moment');
const pg = require('pg');
const baby = require('babyparse');
const request = require('request');
const ProgressBar = require('progress');


//--------------------------------------------------------------------------
// stuff into database

function _insertEntries(entries, callback) {
	const bar = new ProgressBar('inserting [:bar] :percent :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: entries.length
	});

	let insertCount = 0;
	let duplicateCount = 0;
	let otherCount = 0;
	const inserted = [];

	function insertEntry(client, entry) {
		// console.log(`scheduling insert ${util.inspect(entry, {breakLength: 100})}...`);
		client.query("INSERT INTO dispatch (date, duid, power) values ($1, $2, $3) ", [entry.date, entry.duid, entry.power], (err, result) => {
			bar.tick();
			if (!err) {
				insertCount++;
				inserted.push(entry);
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
		callback(null, inserted);
	});

	client.connect();
	_.each(entries, entry => insertEntry(client, entry));
}

function _getDispatchIndividual(duid, period, callback) {
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

function _getDispatchBatch(stations, period, callback) {
	let rows = [];
	let index = 0;

	function next(index, period) {
		const duid = stations[index];
		_getDispatchIndividual(duid, period, (err, data) => {
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

exports.importData = (stations, interval, callback) => {
	console.log(`fetch: download ${interval} of data`);
	_getDispatchBatch(stations, interval, rows => {
		// console.log(util.inspect(rows, {colors: false, breakLength: 150}));
		_insertEntries(rows, callback);
	});
};
