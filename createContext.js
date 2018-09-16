const util = require('util')

const proto = {
  get method() {
    return this.request.method
  },

  get url() {
    return this.request.url
  },

  get headers() {
    return this.request.headers
  },

  toJSON() {
    return {
      request: this.request,
      url: this.url,
      headers: this.headers
    }
  }
}

if (util.inspect.custom) {
  proto[util.inspect.custom] = function inspect() {
    return this.toJSON()
  }
}

const ownPropertyDescriptors = Object.getOwnPropertyDescriptors(proto)

function createContext(src) {
  const request = {
    get method() {
      return src.req.method
    },

    get url() {
      return src.req.url
    },

    get headers() {
      return src.req.headers
    }
  }

  const ctx = Object.assign({
    request
  }, src)

  Object.defineProperties(ctx, ownPropertyDescriptors)

  return ctx
}

module.exports = createContext
