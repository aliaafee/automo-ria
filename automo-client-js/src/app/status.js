class ResponseError extends Error {
	constructor(response) {
		var message = `Response Error ${response.status} ${response.statusText}`;
		super(message);
		this.status = response.status;
	}
}

module.exports = function status(response) {
	if (!response.ok) {
		return Promise.reject(new ResponseError(response));
	}
	return Promise.resolve(response);
}
