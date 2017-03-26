'use strict';

const util = require('util');

const _ = require('lodash');

const moment = require('moment');
const pg = require('pg');
const baby = require('babyparse');
const bytes = require('bytes');

//--------------------------------------------------------------------------
// report

function _tidyUpLastRow(rows) {
	// there's a possibility that the last row will have missing data -- remove it
	if (rows.length !== 0) {
		const lastRow = _.last(rows);
		if (_.includes(lastRow, null)) {
			console.log(`removing last row: ` + util.inspect(lastRow));
			rows.pop();
		}
	}
}

function _getRecords(callback) {
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

			_tidyUpLastRow(rows);

			_.each(rows, row => {
				row.date = moment(row.date).utcOffset(`+10`).format(`YYYY-MM-DDTHH:mm+10`);
			});

			callback(rows);
		} else {
			console.log(err);
		}
	});
}

exports.buildReport = (callback) => {
	_getRecords(records => {
		const csv = baby.unparse(records);
		const byteStr = bytes(csv.length, {unitSeparator:' '});
		console.log(`report: ${byteStr} CSV file`);
		console.log(csv);
		callback(csv);
	});
};
