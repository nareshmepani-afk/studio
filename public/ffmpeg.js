/*
 * FFmpeg
 *
 * Copyright (c) 2020-2021 Joone Hur.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FFmpeg = {}));
})(this, (function (exports) { 'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(Object(source), true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  /*
   * Helper functions
   */
  const {
    log: l
  } = console;
  const setLogger = ({
    log: l$1,
    type
  }, message) => {
    l$1(type, message);
  };
  const b64ToU8 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  const defaultLogger = (type, message) => {
    l(type, message);
  };

  /**
   * Use these methods to interact with the Emscripten
   * filesystem.
   *
   * @see https://emscripten.org/docs/api_reference/Filesystem-API.html
   *
   * @example
   * const ffmpeg = createFFmpeg();
   * const { FS } = ffmpeg;
   *
   * // Create a file in the Emscripten virtual filesystem
   * FS('writeFile', 'test.txt', 'Hello, world!');
   *
   * // Read a file
   * const data = FS('readFile', 'test.txt');
   *
   * // Delete a file
   * FS('unlink', 'test.txt');
   */

  const FS = (ffmpeg, method, ...args) => {
    const {
      fs
    } = ffmpeg;

    if (typeof fs === 'undefined') {
      throw Error('ffmpeg.fs is not ready, make sure you have executed `await ffmpeg.load()`');
    } else if (typeof fs[method] === 'undefined') {
      throw Error(`ffmpeg.fs.${method} is not a function.`);
    }

    return fs[method](...args);
  };

  const ERR_UNKNOWN = -1;
  const ERR_INIT_FAILED_NOT_LOADED = -2;
  const ERR_LOAD_TIMEOUT = -3;
  const ErrorMap = new Map();
  ErrorMap.set(ERR_UNKNOWN, 'Unknown error');
  ErrorMap.set(ERR_INIT_FAILED_NOT_LOADED, 'ffmpeg.wasm is not loaded, call `await ffmpeg.load()` first');
  ErrorMap.set(ERR_LOAD_TIMEOUT, 'ffmpeg.load() timed out');
  const getMessage = code => ErrorMap.get(code);

  const CORE_VERSION = '0.10.0';
  const CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/ffmpeg-core.js`;
  const WASM_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/ffmpeg-core.wasm`;
  const WORKER_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/ffmpeg-core.worker.js`;

  const createFFmpeg = (...args) => {
    const {
      log = false,
      logger = defaultLogger,
      mainName = 'main',
      corePath: corePathFromArgs
    } = args.length > 0 && typeof args[0] === 'object' ? args[0] : {};

    const corePath = typeof corePathFromArgs === 'undefined' ? CORE_URL : corePathFromArgs;
    let ffmpeg = null;
    /*
     * Assign message handler for listeners.
     */

    const assignMessageHandler = () => {
      ffmpeg.onmessage = ({
        data: {
          type,
          data
        }
      }) => {
        const {
          message
        } = ffmpeg;

        if (typeof message.onmessage === 'function') {
          message.onmessage({
            type,
            data
          });
        }
      };
    };
    /*
     * Get and set progress for progress events.
     */


    const getProgress = ({
      data: {
        duration,
        time
      }
    }, transcode) => {
      const {
        progress
      } = ffmpeg;
      const ratio = time / duration;

      if (typeof progress.onprogress === 'function') {
        progress.onprogress({
          ratio: transcode ? ratio : 1,
          time,
          duration
        });
      }
    };
    /*
     * Get and set output for output events.
     */


    const setOutput = ({
      data,
      type
    }) => {
      const {
        logger
      } = ffmpeg;

      if (typeof logger.onlogger === 'function') {
        logger.onlogger({
          type,
          message: data
        });
      }

      if (log) {
        setLogger(logger, data);
      }
    };
    /*
     * Initialize ffmpeg-core.
     */


    const init = () => new Promise(resolve => {
      const {
        logger: l
      } = ffmpeg;

      if (log) {
        setLogger(l, 'initializing ffmpeg-core');
      }

      const eventHandler = ({
        data: {
          type,
          data
        }
      }) => {
        if (type === 'done') {
          if (log) {
            setLogger(l, 'ffmpeg-core initialized');
          }

          ffmpeg.removeEventListener('message', eventHandler);
          resolve(0);
        }
      };

      ffmpeg.addEventListener('message', eventHandler);
      ffmpeg.postMessage({
        type: 'run',
        data: `ffmpeg-core init ${mainName}`
      });
    });
    /*
     * Error handler.
     */


    const error = (code, extra) => {
      if (log && ffmpeg) {
        const {
          logger
        } = ffmpeg;
        setLogger(logger, `error: ${getMessage(code)}`);

        if (typeof extra !== 'undefined') {
          setLogger(logger, `error: ${extra}`);
        }
      }

      return code;
    };
    /*
     * A simple timeout function.
     */


    const timeout = ms => new Promise((_, reject) => {
      setTimeout(() => reject(ERR_LOAD_TIMEOUT), ms);
    });

    return {
      /*
       * A state to check if ffmpeg-core is loaded.
       *
       * @returns {boolean}
       */
      isLoaded: () => ffmpeg !== null,

      /*
       * Helper function to execute ffmpeg commands.
       *
       * @param {string[]} args An array of ffmpeg command arguments.
       *
       * @example
       * await ffmpeg.run('-i', 'video.avi', '-c', 'copy', 'video.mp4');
       */
      run: (...args) => {
        const {
          progress
        } = ffmpeg;

        if (log) {
          const {
            logger
          } = ffmpeg;
          setLogger(logger, `run ffmpeg command: ${args.join(' ')}`);
        }

        return new Promise(resolve => {
          // transcode is a state to check if the command is a transcode command.
          // FFmpeg only prints progress when it is transcoding.
          const transcode = args.indexOf('-i') !== -1;
          const eventHandler = ({
            data: {
              type,
              data
            }
          }) => {
            if (type === 'progress') {
              getProgress({
                data
              }, transcode);
            } else if (type === 'done') {
              if (log) {
                const {
                  logger
                } = ffmpeg;
                setLogger(logger, 'ffmpeg command done');
              }

              ffmpeg.removeEventListener('message', eventHandler);
              resolve(0);
            } else if (type === 'stdout' || type === 'stderr') {
              setOutput({
                data,
                type
              });
            }
          };

          ffmpeg.onmessage = null;
          ffmpeg.addEventListener('message', eventHandler);
        });
      },

      /*
       * Load ffmpeg-core script.
       * It is required to execute this method before calling run() or FS().
       *
       * @returns {Promise<number>}
       */
      load: () => Promise.race([timeout(600000), new Promise(resolve => {
        // It is important to have path of ffmpeg-core.js.
        // It is not possible to find it with document.currentScript.src
        // as it is inside a worker.
        if (log) {
          setLogger({ log: logger, type: 'ffmpeg-core' }, `loading ffmpeg-core from ${corePath}`);
        }

        const worker = new Worker(WORKER_URL, {
          name: 'ffmpeg-core-worker'
        });
        const eventHandler = ({
          data: {
            type,
            data
          }
        }) => {
          if (type === 'ffmpeg-core-script-loaded') {
            worker.terminate();
            worker.removeEventListener('message', eventHandler);
            resolve(0);
          }
        };

        worker.addEventListener('message', eventHandler);
        worker.postMessage({
          type: 'load-ffmpeg-core',
          data: {
            corePath,
            wasmPath: WASM_URL,
            workerPath: WORKER_URL
          }
        });
      })]).then(async () => {
        ffmpeg = new Worker(corePath);
        ffmpeg.fs = null; // a lazy way to check if fs is initialized.

        ffmpeg.logger = {
          log: l,
          onlogger: logger,
          type: 'ffmpeg-core'
        };
        ffmpeg.progress = {
          onprogress: () => {}
        };
        ffmpeg.message = {
          onmessage: () => {}
        };
        assignMessageHandler();
        await init();
        ffmpeg.fs = {};
        ['writeFile', 'readFile', 'unlink', 'readdir', 'mkdir', 'rmdir'].forEach(method => {
          ffmpeg.fs[method] = (...args) => new Promise((resolve, reject) => {
            const {
              message
            } = ffmpeg;
            const id = Math.random().toString(36).slice(2);

            message.onmessage = ({
              type,
              data
            }) => {
              const {
                id:
                /*
                 * fs `id` is used to distinguish message as sometimes message
                 * can be delivered twice.
                 *
                 * See issue #102 for details.
                 */
                _id,
                err,
                data: d
              } = data;

              if (id === _id) {
                message.onmessage = null;

                if (err) {
                  reject(err);
                } else {
                  resolve(d);
                }
              }
            };

            ffmpeg.postMessage({
              type: 'fs',
              data: {
                method,
                id,
                args
              }
            });
          });
        });
        return 0;
      }, err => {
        if (err === ERR_LOAD_TIMEOUT) {
          return error(ERR_LOAD_TIMEOUT);
        }

        return error(ERR_UNKNOWN, err);
      }),
      FS: (method, ...args) => {
        if (!ffmpeg) {
          error(ERR_INIT_FAILED_NOT_LOADED);
          return null;
        }

        return FS(ffmpeg, method, ...args);
      },
      setLogger: _logger => {
        const {
          logger: l
        } = ffmpeg;
        l.onlogger = _logger;
      },
      setLogging: _log => {
        log = _log;
      },
      setProgress: _progress => {
        const {
          progress
        } = ffmpeg;
        progress.onprogress = _progress;
      },
      // For lazy loading
      ffmpeg: null
    };
  };

  exports.b64ToU8 = b64ToU8;
  exports.createFFmpeg = createFFmpeg;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
