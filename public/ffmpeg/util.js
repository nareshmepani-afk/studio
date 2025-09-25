var r = Object.defineProperty;
var e = Object.getOwnPropertyDescriptor;
var t = Object.getOwnPropertyNames;
var o = Object.prototype.hasOwnProperty;
var a = (n, i) => {
    for (var s in i) r(n, s, { get: i[s], enumerable: !0 })
}, c = (n, i, s, l) => {
    if (i && typeof i == "object" || typeof i == "function")
        for (let d of t(i)) !o.call(n, d) && d !== s && r(n, d, { get: () => i[d], enumerable: !(l = e(i, d)) || l.enumerable });
    return n
};
var p = n => c(r(n != null ? Object.create(Object.getPrototypeOf(n)) : {}, "default", { value: n, enumerable: !0 }), n);
var u = {};
a(u, { default: () => m, toBlob: () => h, toBlobURL: () => f, FFmpegError: () => g });

const f = async (n, i) => {
    const s = await fetch(n);
    if (!s.ok) throw new Error(`Failed to fetch ${n}: ${s.status} ${s.statusText}`);
    const l = await s.blob();
    return URL.createObjectURL(new Blob([l], { type: i }))
};

const h = async n => {
    if (n instanceof URL) {
        const i = await fetch(n);
        if (!i.ok) throw new Error(`Failed to fetch ${n}: ${i.status} ${i.statusText}`);
        return await i.blob()
    }
    return new Blob([n], { type: "application/octet-stream" })
};

class g extends Error {
    constructor(n, i) {
        super(n), this.name = n, this.message = i
    }
}
g.LOAD_FAILED = "LOAD_FAILED";
g.NOT_LOADED = "NOT_LOADED";
g.CANCELED = "CANCELED";
var m = u;
export { g as FFmpegError, m as default, h as toBlob, f as toBlobURL };
