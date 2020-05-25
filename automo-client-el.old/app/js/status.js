class ResponseError extends Error {
	constructor(response) {
		var message = `Response Error ${response.status} ${response.statusText}`;
		super(message);
		this.status = response.status;
	}
}

function status(response) {
	if (!response.ok && response.status != 422) {
		return Promise.reject(new ResponseError(response));
	}
	return Promise.resolve(response);
}

module.exports = status;
