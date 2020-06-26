class ResponseError extends Error {
	constructor(response) {
		var message = `Response Error ${response.status} ${response.statusText}`;
		super(message);
		this.status = response.status;
		this.data = response.data
	}
}

module.exports = function status(response) {
	if (!(response.status == 200 || response.status == 422 )) {
		return Promise.reject(new ResponseError(response));
	}
	return Promise.resolve(response);
}
