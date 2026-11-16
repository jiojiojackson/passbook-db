async function invoke(handler, { method = 'POST', body, token, query, headers = {} } = {}) {
  const res = {
    statusCode: 200, headers: {}, data: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
    end(data) { this.data = data; return this; },
    send(data) { this.data = data; return this; },
  };
  const req = { method, body, query, headers: { ...headers, ...(token ? { authorization: 'Bearer ' + token } : {}) } };
  await handler(req, res);
  return res;
}
module.exports = { invoke };
