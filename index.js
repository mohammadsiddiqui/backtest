const yahooFinance = require("yahoo-finance");
const express = require("express");

const axios = require("axios");
const moment = require("moment");

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/update/:q", async (req, res) => {
	let symbol = req.params.q;
	let props = req.body;

	props.monthly = props.monthly || 0;

	if (!props.monthly && !props.initial) {
		return res.json({ props, error: true, message: "Please enter Initial amount or monthly contribution." });
	}

	if (props.start > props.end) {
		return res.json({ props, error: true, message: "Start Year should be less than or equal to End Year." });
	}

	try {
		let stock = {};

		let params = {
			symbol: symbol,
			from: moment(props.start).format("YYYY-MM-DD"), // props.start,
			to: moment(props.end).format("YYYY-MM-DD"), //props.end,
			period: "m",
		};

		let data = await yahooFinance.historical(params);

		if (data && data.length >= 2) {
			const lmonth = moment(data[0].date).format("YYYYMM");
			const l0month = moment(data[1].date).format("YYYYMM");
			if (lmonth == l0month) {
				data.splice(0, 1);
			}
		}

		data.sort((a, b) => a.date - b.date);

		stock.qty = 0;
		stock.amount_invested = 0;

		let lastprice = 0;

		for (let i = 0; i < data.length; i++) {
			let el = data[i];

			el.date = moment(el.date).format("ll");

			el.invested = parseFloat(props.monthly || 0);

			if (i == 0 && props.initial) el.invested = parseFloat(props.monthly || 0) + parseFloat(props.initial || 0);
			el.qty = el.invested / el.adjClose;

			el.qty = parseFloat(el.qty).toFixed(4);
			el.adjClose = parseFloat(el.adjClose).toFixed(2);

			stock.qty += parseFloat(el.qty);
			stock.amount_invested += el.invested;

			lastprice = parseFloat(el.adjClose);

			el.total_invested = parseFloat(stock.amount_invested).toFixed(2);
			el.total_qty = parseFloat(stock.qty).toFixed(4);
			el.total_amount = parseFloat(stock.qty * lastprice).toFixed(2);

			el.return = parseFloat(parseFloat(el.total_amount) - parseFloat(el.total_invested)).toFixed(2);
			el.return_percent = parseFloat((parseFloat(el.return) * 100) / parseFloat(el.total_invested)).toFixed(2);
			el.return_percent = el.return_percent + "%";
		}

		// stock.amount = parseFloat(stock.qty * stock.regularMarketPrice).toFixed(2);
		stock.amount = parseFloat(stock.qty * lastprice).toFixed(2);
		stock.qty = parseFloat(stock.qty).toFixed(4);

		stock.return = parseFloat(parseFloat(stock.amount) - parseFloat(stock.amount_invested)).toFixed(2);
		stock.return_percent = parseFloat((parseFloat(stock.return) * 100) / parseFloat(stock.amount_invested)).toFixed(2);

		stock.amount_invested = parseFloat(stock.amount_invested).toFixed(2);

		return res.json({ props, data, stock });
	} catch (error) {
		console.log(error);
		return res.json({ props, error: true, message: error.statusText });
	}
});

app.get("/search/:q", async (req, res) => {
	try {
		let q = req.params.q;
		if (!q || q.length < 3) return res.json([]);
		const { data } = await axios.get(`https://query1.finance.yahoo.com/v1/finance/search?q=${q}`);
		return res.json(data.quotes || []);
	} catch (error) {
		console.log(error);
		return res.json([]);
	}
});

const port = process.env.PORT || 4004;
app.listen(port, () => console.log(`App listening to port http://localhost:${port}`));
