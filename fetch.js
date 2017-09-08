;
(function (name, deps, definition) {
    if (typeof deps === "function") {
        definition = deps;
        deps = [];
    }
    if (typeof deps === "string") {
        deps = [deps];
    }

    if (typeof define === "function" && typeof define.amd === "object") {
        define.call(this, deps, definition);
    } else if (typeof module !== "undefined") {
        deps = deps.map(function (dep) {
            return require(dep);
        });
        module.exports = definition.apply(this, deps);
    } else {
        deps = deps.map(function (dep) {
            return this[dep];
        });
        this[name] = definition.apply(this, deps);
    }
}("fetch", ["fetch"], function (_fetch) {
    _fetch = window.fetch || _fetch;
    if (!_fetch){
        throw new Error("fetch is undefined");
    }

    let ServerError = function (json) {
        if (!json) {
            json = {};
        } else if (typeof json === "string") {
            json = {
                message: json,
                notification: true
            };
        }
        this.status = json.status || 500;
        this.message = json.message || "Network Error";
        if (json.notification === "string") {
            this.notification = json.notification;
        } else if (json.notification === true) {
            this.notification = this.message;
        }
    };
    ServerError.prototype = {};
    ServerError.prototype.toString = function () {
        return "[ServerError][" + this.status + "]: " + this.message + (this.hasOwnProperty("notification") ? ( ": \"" + this.notification + "\"") : "");
    };
    
    let fetch = function (options) {
        options = options || {};
        options.method = options.method || fetch.options.method;
        options.uri = options.url || options.uri || fetch.options.url || fetch.options.uri;
        options.credentials = options.credentials || fetch.options.credentials; // To use cookies
        if (options.body) {
            options.headers = options.headers || fetch.options.headers || {};
            if (options.body instanceof Blob) {
                options.headers["Content-Type"] = options.headers["Content-Type"] || options.body.type;
            } else if (options.body instanceof FormData) {
                options.headers["Content-Type"] = options.headers["Content-Type"] || "multipart/form-data";
            } else {
                options.headers["Content-Type"] = options.headers["Content-Type"] || "application/json";
                options.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
            }
        }

        return _fetch(options.uri, options).then(function (response) {
            let contentType = response.headers.get("Content-Type");
            if (response.ok) { // true if response.status is in the 200-299 range
                if (contentType === "application/json") {
                    return response.json();
                } else if (contentType.startsWith("image/")) {
                    return response.blob();
                } else if (contentType.startsWith("text/plain")) {
                    return response.text();
                } else {
                    return response;
                }
            } else {
                if (contentType === "application/json") {
                    return response.json().then(function (json) {
                        throw new ServerError(json);
                    }, function (err) {
                        throw new ServerError("Failed Error Parsing: " + err.message);
                    });
                } else {
                    throw new ServerError({status: response.status});
                }
            }
        }, function (err) {
            throw new ServerError(err);
        });
    };
    fetch.options = {
        method: "GET",
        credentials: "same-origin"
    };
    
    return fetch;
}));

