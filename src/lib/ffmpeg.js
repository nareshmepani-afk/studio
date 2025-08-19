/*
 * FFmpeg.js
 *
 * Copyright (c) 2024 Jerome Wu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is

 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports.FFmpeg = t())
    : (e.FFmpeg = t());
})(globalThis, () =>
  (() => {
    "use strict";
    var e = {
        d: (t, r) => {
          for (var n in r)
            e.o(r, n) &&
              !e.o(t, n) &&
              Object.defineProperty(t, n, { enumerable: !0, get: r[n] });
        },
        o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
        r: (e) => {
          "undefined" != typeof Symbol &&
            Symbol.toStringTag &&
            Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
            Object.defineProperty(e, "__esModule", { value: !0 });
        },
      },
      t = {};
    e.r(t), e.d(t, { createFFmpeg: () => _, fetchFile: () => P });
    const r = (e, t, r) => (
        (r = "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/"),
        (e) =>
          new Promise((t, n) => {
            const o = new AbortController(),
              i = setTimeout(() => {
                o.abort(),
                  n(
                    Error(
                      "failed to load FFMPEG script, took too long to load"
                    )
                  );
              }, 3e4);
            fetch(e, { signal: o.signal })
              .then((e) => (clearTimeout(i), e.text()))
              .then(t)
              .catch(n);
          })
      ),
      n = async (e) => {
        const t = await fetch(e);
        return new Response(t.body, {
          headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
          },
        });
      },
      o = async (e) => {
        let t;
        const r = e.split("?")[0],
          o = [
            "webm",
            "mov",
            "mp4",
            "m4a",
            "3gp",
            "3g2",
            "mj2",
            "flv",
            "MPEG-4",
            "MPEG-4",
            "MPEG-PS",
            "MPEG-TS",
            "mxf",
            "mxf",
            "mxf",
            "gif",
            "avi",
            "asf",
            "ivf",
            "mkv",
            "matroska",
            "webm",
            "flv",
            "f4v",
            "ogv",
            "ogg",
            "mov",
            "mp3",
            "aac",
            "wav",
            "flac",
            "alac",
            "pcm",
            "aiff",
            "au",
            "amr",
            "voc",
            "ac3",
            "eac3",
            "dts",
            "dtshd",
            "wma",
            "mpegaudio",
            "mpeg",
            "mpegts",
            "mpegvideo",
            "3gpp",
            "3gpp2",
            "ogg",
            "ogx",
            "oga",
            "ogv",
            "spx",
            "opus",
          ].find((e) => r.endsWith(`.${e}`));
        if (o) {
          let r;
          r = ["mp4", "mov", "m4a", "3gp", "3g2", "mj2"].includes(o)
            ? "video"
            : ["webm", "mkv", "matroska", "ogv", "flv", "f4v"].includes(o)
            ? "video"
            : ["mp3", "aac", "wav", "flac", "alac", "pcm", "aiff", "au"].includes(
                o
              )
            ? "audio"
            : "application";
          const i = {
            "MPEG-4": "mp4",
            "MPEG-PS": "mpeg",
            "MPEG-TS": "ts",
            mxf: "mxf",
            gif: "gif",
            avi: "avi",
            asf: "asf",
            ivf: "ivf",
            mpegaudio: "mp3",
            mpeg: "mpeg",
            mpegts: "ts",
            mpegvideo: "mpeg",
            "3gpp": "3gp",
            "3gpp2": "3g2",
            ogg: "ogg",
            ogx: "ogx",
            oga: "oga",
            spx: "opus",
          }[o];
          t = `${r}/${i || o}`;
        }
        const i = await n(e);
        return new Blob([await i.blob()], { type: t });
      },
      i = (e) =>
        new Promise((t, r) => {
          const n = new FileReader();
          (n.onload = () => {
            t(n.result);
          }),
            (n.onerror = ({ target: { error: e } }) => {
              r(e);
            }),
            n.readAsDataURL(e);
        }),
      s = async (e) => {
        let t;
        const r = e.split("?")[0],
          n = [
            "webm",
            "mov",
            "mp4",
            "m4a",
            "3gp",
            "3g2",
            "mj2",
            "flv",
            "MPEG-4",
            "MPEG-4",
            "MPEG-PS",
            "MPEG-TS",
            "mxf",
            "mxf",
            "mxf",
            "gif",
            "avi",
            "asf",
            "ivf",
            "mkv",
            "matroska",
            "webm",
            "flv",
            "f4v",
            "ogv",
            "ogg",
            "mov",
            "mp3",
            "aac",
            "wav",
            "flac",
            "alac",
            "pcm",
            "aiff",
            "au",
            "amr",
            "voc",
            "ac3",
            "eac3",
            "dts",
            "dtshd",
            "wma",
            "mpegaudio",
            "mpeg",
            "mpegts",
            "mpegvideo",
            "3gpp",
            "3gpp2",
            "ogg",
            "ogx",
            "oga",
            "ogv",
            "spx",
            "opus",
          ].find((e) => r.endsWith(`.${e}`));
        if (n) {
          let r;
          r = ["mp4", "mov", "m4a", "3gp", "3g2", "mj2"].includes(n)
            ? "video"
            : ["webm", "mkv", "matroska", "ogv", "flv", "f4v"].includes(n)
            ? "video"
            : ["mp3", "aac", "wav", "flac", "alac", "pcm", "aiff", "au"].includes(
                n
              )
            ? "audio"
            : "application";
          const o = {
            "MPEG-4": "mp4",
            "MPEG-PS": "mpeg",
            "MPEG-TS": "ts",
            mxf: "mxf",
            gif: "gif",
            avi: "avi",
            asf: "asf",
            ivf: "ivf",
            mpegaudio: "mp3",
            mpeg: "mpeg",
            mpegts: "ts",

            mpegvideo: "mpeg",
            "3gpp": "3gp",
            "3gpp2": "3g2",
            ogg: "ogg",
            ogx: "ogx",
            oga: "oga",
            spx: "opus",
          }[n];
          t = `${r}/${o || n}`;
        }
        return new Blob([await (await fetch(e)).blob()], { type: t });
      },
      a = "FFMPEG_TERMINATED",
      c = (e) => "FFmpeg is not loaded, please call `await ffmpeg.load()` first";
    class l {
      constructor(e) {
        (this.config = e),
          (this.loaded = !1),
          (this.listeners = {}),
          (this.running = !1),
          (this.messager = (() => {
            let e;
            const t = (t) => {
                const {
                  type: r,
                  data: { transId: n, ...o },
                } = t.data;
                "FFMPEG_RESPONSE" === r
                  ? this.listeners[n] &&
                    (delete o.type, this.listeners[n](o), delete this.listeners[n])
                  : (e(r, o),
                    "FFMPEG_DONE" === r &&
                      ((this.running = !1),
                      Object.keys(this.listeners).forEach((e) => {
                        this.listeners[e]({ type: a, data: "Done" }),
                          delete this.listeners[e];
                      })));
              },
              r = (r) => {
                e = r;
                const n = `\n        let ffmpeg;\n        self.onmessage = async ({ data: { type, data: { transId, ...data } } }) => {\n          if (type === "FFMPEG_INIT") {\n            if (ffmpeg) {\n              ffmpeg.terminate();\n            }\n            ffmpeg = await self.FFmpeg.create(data);\n            self.postMessage({ type: "FFMPEG_RESPONSE", data: { transId } });\n          } else if (type === "FFMPEG_TERMINATE") {\n            if (ffmpeg) {\n              ffmpeg.terminate();\n            }\n            ffmpeg = undefined;\n            self.postMessage({ type: "FFMPEG_RESPONSE", data: { transId } });\n          } else {\n            const { type: dataType, data: dataData } = data;\n            if (ffmpeg) {\n              ffmpeg.on(dataType, (d) => {\n                self.postMessage({ type: "FFMPEG_PROGRESS", data: { ...d, ...dataData } });\n              });\n              await ffmpeg.exec(...dataData.args);\n              ffmpeg.off(dataType);\n              self.postMessage({ type: "FFMPEG_DONE", data: { ...dataData } });\n            } else {\n              self.postMessage({ type: "FFMPEG_DONE", data: { ...dataData, error: new Error("FFMPEG is not initialized.") } });\n            }\n          }\n        }\n        `;
                this.worker = new Worker(
                  URL.createObjectURL(
                    new Blob([r, n], { type: "application/javascript" })
                  )
                );
                const o = ({ type: e, data: t }) => {
                  "FFMPEG_PROGRESS" === e ? r(e, t) : this.listeners[t.transId](t);
                };
                return (
                  (this.worker.onmessage = t),
                  (this.worker.onerror = console.error),
                  (t, r) => {
                    const n = Math.floor(Math.random() * Math.pow(10, 8));
                    return new Promise((i) => {
                      (this.listeners[n] = i),
                        this.worker.postMessage({
                          type: t,
                          data: { transId: n, ...r },
                        });
                    });
                  }
                );
              };
            return { getMessage: r, postMessage: this.worker.postMessage };
          })());
      }
      on(e, t) {
        this.listeners[e] = t;
      }
      off(e) {
        delete this.listeners[e];
      }
      exec(e, t = -1) {
        if (this.running)
          throw Error("ffmpeg.exec(): previous task is not finished");
        if (!this.loaded) throw Error(c());
        return (
          (this.running = !0),
          new Promise((r, n) => {
            const o = Math.floor(Math.random() * Math.pow(10, 8));
            this.on(o, ({ type: t, data: i }) => {
              t === a ? n(t) : r(i);
            }),
              this.worker.postMessage(
                ["-i", ...e],
                o,
                t
              );
          })
        );
      }
      terminate() {
        this.worker.terminate();
      }
    }
    const u = ({ coreURL: e, wasmURL: t, workerURL: n }) => {
      let o;
      if ("undefined" == typeof window) throw Error("failed to load ffmpeg-core");
      return Promise.all([r(e), r(t), r(n)]).then(
        ([e, t, r]) => (
          (o = r),
          new Promise((r) => {
            const n = `\n        let ffmpeg;\n        self.onmessage = async ({ data: { type, data: { transId, ...data } } }) => {\n          if (type === "FFMPEG_INIT") {\n            if (ffmpeg) {\n              ffmpeg.terminate();\n            }\n            ffmpeg = await self.FFmpeg.create(data);\n            self.postMessage({ type: "FFMPEG_RESPONSE", data: { transId } });\n          } else if (type === "FFMPEG_TERMINATE") {\n            if (ffmpeg) {\n              ffmpeg.terminate();\n            }\n            ffmpeg = undefined;\n            self.postMessage({ type: "FFMPEG_RESPONSE", data: { transId } });\n          } else {\n            const { type: dataType, data: dataData } = data;\n            if (ffmpeg) {\n              ffmpeg.on(dataType, (d) => {\n                self.postMessage({ type: "FFMPEG_PROGRESS", data: { ...d, ...dataData } });\n              });\n              await ffmpeg.exec(...dataData.args);\n              ffmpeg.off(dataType);\n              self.postMessage({ type: "FFMPEG_DONE", data: { ...dataData } });\n            } else {\n              self.postMessage({ type: "FFMPEG_DONE", data: { ...dataData, error: new Error("FFMPEG is not initialized.") } });\n            }\n          }\n        }\n        `;
            const i = [e, t, n].map((e) =>
              URL.createObjectURL(new Blob([e], { type: "text/javascript" }))
            );
            (o = new Worker(i[2])), r(o);
          })
        )
      );
    };
    class d {
      constructor(e) {
        (this.config = e),
          (this.worker = null),
          (this.loaded = !1),
          (this.running = !1),
          (this.listeners = {});
      }
      async load() {
        if (((this.worker = await u(this.config)), this.worker)) {
          const {
            coreURL: e,
            wasmURL: t,
            workerLoadURL: r,
            ...n
          } = this.config;
          return (
            (this.worker.onmessage = ({
              data: { type: e, data: t, transId: r },
            }) => {
              "FFMPEG_PROGRESS" === e
                ? this.listeners.progress(t)
                : "FFMPEG_LOG" === e
                ? this.listeners.log(t)
                : "FFMPEG_DONE" === e
                ? ((this.running = !1), this.listeners[r](t))
                : "FFMPEG_TERMINATED" === e
                ? (this.listeners[r](new Error(a)))
                : void 0;
            }),
            new Promise((e) => {
              const t = Math.floor(Math.random() * Math.pow(10, 8));
              (this.listeners[t] = e),
                this.worker.postMessage({
                  type: "FFMPEG_INIT",
                  config: { ...n, wasmURL: t, coreURL: e, workerLoadURL: r },
                  transId: t,
                });
            })
          );
        }
      }
      on(e, t) {
        this.listeners[e] = t;
      }
      off(e) {
        delete this.listeners[e];
      }
      exec(e, t = -1) {
        if (this.running)
          throw Error("ffmpeg.exec(): previous task is not finished");
        if (!this.loaded) throw Error(c());
        return (
          (this.running = !0),
          new Promise((r, n) => {
            const o = Math.floor(Math.random() * Math.pow(10, 8));
            this.on(o, (e) => {
              e instanceof Error ? n(e) : r(e);
            }),
              this.worker.postMessage({ args: e, timeout: t, transId: o });
          })
        );
      }
      terminate() {
        if (!this.loaded) throw Error(c());
        if (this.worker) {
          this.worker.terminate();
          const e = Math.floor(Math.random() * Math.pow(10, 8));
          return new Promise((t) => {
            (this.listeners[e] = t),
              this.worker.postMessage({ type: "FFMPEG_TERMINATE", transId: e });
          });
        }
      }
    }
    class h {
      constructor(e) {
        var t, r;
        if (
          ((this.config = e),
          (this.fs = null),
          (this.loaded = !1),
          (this.running = !1),
          (this.listeners = {}),
          "undefined" == typeof window)
        )
          throw Error("failed to load ffmpeg-core.js");
        const n =
          null !== (t = this.config.coreURL) && void 0 !== t
            ? t
            : "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";
        if (
          ((this.core = new Promise((e, t) => {
            const r = document.createElement("script");
            r.setAttribute("src", n),
              (r.async = !0),
              (r.onload = () => {
                r.remove(), e();
              }),
              (r.onerror = (e) => {
                r.remove(), t(Error(`failed to load ffmpeg-core.js: ${n}`));
              }),
              document.head.appendChild(r);
          })),
          (this.FFmpeg = window.FFmpeg),
          (null === (r = this.config) || void 0 === r ? void 0 : r.log) &&
            this.on("log", console.log),
          this.config.progress)
        ) {
          const e = (e) => {
            var t;
            return (
              (null === (t = this.config) || void 0 === t
                ? void 0
                : t.progress) && this.config.progress(e)
            );
          };
          this.on("progress", e);
        }
      }
      on(e, t) {
        this.listeners[e] = t;
      }
      off(e) {
        delete this.listeners[e];
      }
      exec(e, t = -1) {
        var r;
        if (this.running)
          throw Error("ffmpeg.exec(): previous task is not finished");
        if (!this.loaded) throw Error(c());
        (this.running = !0),
          (r = this.ffmpeg),
          r.setTimeout(t),
          r.exec(...e),
          (this.running = !1);
      }
      terminate() {
        var e;
        if (!this.loaded) throw Error(c());
        (this.running = !1), null === (e = this.ffmpeg) || void 0 === e || e.exit();
      }
      async load() {
        var e, t;
        await this.core;
        const { log: r, progress: n, ...o } = this.config;
        (this.ffmpeg = await this.FFmpeg.create({
          ...o,
          log: r,
          progress: n,
        })),
          (this.loaded = !0),
          (e = this.ffmpeg),
          (t = {}),
          (t.readdir = (r) => e.FS.readdir(r)),
          (t.mkdir = (r) => e.FS.mkdir(r)),
          (t.rmdir = (r) => e.FS.rmdir(r)),
          (t.writeFile = (r, n) => e.FS.writeFile(r, n)),
          (t.readFile = (r, n) => e.FS.readFile(r, n)),
          (t.unlink = (r) => e.FS.unlink(r)),
          (t.rename = (r, n) => e.FS.rename(r, n)),
          (this.fs = t);
      }
    }
    const f = async (e) => {
      if ("string" == typeof e)
        return "undefined" != typeof window
          ? s(e).then((e) => new Uint8Array(e))
          : o(e).then((e) => new Uint8Array(e));
      if (e instanceof URL)
        return "undefined" != typeof window
          ? s(e.href).then((e) => new Uint8Array(e))
          : o(e.href).then((e) => new Uint8Array(e));
      if (e instanceof File || e instanceof Blob)
        return new Uint8Array(await e.arrayBuffer());
      if (e instanceof ArrayBuffer) return new Uint8Array(e);
      if (e instanceof Uint8Array) return e;
      throw Error("Invalid input type, check file-or-url for more details.");
    };
    class m extends h {
      constructor(e) {
        super(e);
      }
      async writeFile(e, t) {
        if (!this.loaded) throw Error(c());
        this.fs.writeFile(e, await f(t));
      }
      async readFile(e, t = "binary") {
        if (!this.loaded) throw Error(c());
        const r = this.fs.readFile(e);
        return "binary" === t ? r : "utf8" === t ? new TextDecoder().decode(r) : r;
      }
      async unlink(e) {
        if (!this.loaded) throw Error(c());
        this.fs.unlink(e);
      }
      async rename(e, t) {
        if (!this.loaded) throw Error(c());
        this.fs.rename(e, t);
      }
      async mkdir(e) {
        if (!this.loaded) throw Error(c());
        this.fs.mkdir(e);
      }
      async rmdir(e) {
        if (!this.loaded) throw Error(c());
        this.fs.rmdir(e);
      }
      async readdir(e) {
        if (!this.loaded) throw Error(c());
        return this.fs.readdir(e);
      }
      async toURL(e) {
        if (!this.loaded) throw Error(c());
        return i(new Blob([e]));
      }
    }
    const _ = (e) => new m(e),
      P = f;
    return t;
  })()
);
//# sourceMappingURL=ffmpeg.js.map
