new Vue({
	el: "#app",
	data: {
		search: "",
		selected: false,
		results: [],
		props: {},
		loading: false,
		details: null,
		columns: [
			{
				field: "date",
				label: "Date",
			},

			{
				field: "open",
				label: "Stock Price",
				centered: true,
			},

			{
				field: "qty",
				label: "Stock Quantity",
				centered: true,
			},

			{
				field: "invested",
				label: "Invested Amount",
				centered: true,
			},
		],
	},
	methods: {
		showDetail(x) {
			this.selected = x.symbol;
		},
		clear() {
			this.selected = null;
			this.details = null;
			this.search = "";
			this.results = [];
		},
		getData() {
			var q = this.search;
			if (q && q.length > 2) this.getList(q);
		},
		async getList(q) {
			try {
				var url = `/search/${q}`;
				var { data } = await axios.get(url);
				this.results = data;
			} catch (e) {
				console.log(e);
			}
		},
		async getDetails() {
			this.loading = true;
			try {
				var url = `/update/${this.selected}`;
				var { data } = await axios.post(url, this.props);
				if (data.error) {
					this.$buefy.snackbar.open({
						duration: 5000,
						message: "Error in fetching data, Please review the data and try again!",
						type: "is-danger",
						position: "is-bottom-right",
					});
				} else {
					this.details = data;
				}
			} catch (e) {
				console.log(e);
			}
			this.loading = false;
		},
	},
	mounted() {
		var app = document.getElementById("app");
		app.classList.remove("hide");

		var loading = document.getElementById("loading");
		loading.classList.add("hide");
	},
});
