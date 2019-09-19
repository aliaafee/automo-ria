function status(response) {
	if (response.status === 200) {
		return Promise.resolve(response)
	} else if (response.status === 401) {
		return Promise.reject(new Error("Invalid Authorization"));
	}
	return Promise.reject(new Error(response));
}

module.exports = status;
