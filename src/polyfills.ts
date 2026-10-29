if (!Array.prototype.at) {
    Array.prototype.at = function (n: number) {
        n = Math.trunc(n) || 0
        if (n < 0) n += this.length
        if (n < 0 || n >= this.length) return undefined
        return this[n]
    }
}

if (!String.prototype.at) {
    String.prototype.at = function (n: number) {
        n = Math.trunc(n) || 0
        if (n < 0) n += this.length
        if (n < 0 || n >= this.length) return undefined
        return this[n]
    }
}

if (!Array.prototype.findLast) {
    Array.prototype.findLast = function (predicate: (value: unknown, index: number, array: unknown[]) => boolean, thisArg?: unknown) {
        for (let i = this.length - 1; i >= 0; i--) {
            if (predicate.call(thisArg, this[i], i, this)) return this[i]
        }
        return undefined
    }
}

if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = ((obj: unknown) => JSON.parse(JSON.stringify(obj))) as typeof structuredClone
}

if (!Object.hasOwn) {
    Object.hasOwn = (obj: object, prop: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, prop)
}

// Not in the ES2023 lib types, so describe the shape being added
const PromiseWithResolvers = Promise as PromiseConstructor & {
    withResolvers?: <T>() => {
        promise: Promise<T>
        resolve: (value: T | PromiseLike<T>) => void
        reject: (reason?: unknown) => void
    }
}

if (!PromiseWithResolvers.withResolvers) {
    PromiseWithResolvers.withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void
        let reject!: (reason?: unknown) => void
        const promise = new Promise<T>((res, rej) => {
            resolve = res
            reject = rej
        })
        return { promise, resolve, reject }
    }
}

if (typeof ReadableStream !== 'undefined' && !(Symbol.asyncIterator in ReadableStream.prototype)) {
    (ReadableStream.prototype as unknown as AsyncIterable<unknown>)[Symbol.asyncIterator] = async function* (this: ReadableStream) {
        const reader = this.getReader()
        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) return
                yield value
            }
        } finally {
            reader.releaseLock()
        }
    }
}
