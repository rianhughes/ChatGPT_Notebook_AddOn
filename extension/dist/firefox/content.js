(function() {
  "use strict";
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var browserPolyfill = { exports: {} };
  (function(module, exports) {
    (function(global2, factory) {
      {
        factory(module);
      }
    })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : commonjsGlobal, function(module2) {
      if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
        throw new Error("This script should only be loaded in a browser extension.");
      }
      if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
        const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
        const wrapAPIs = (extensionAPIs) => {
          const apiMetadata = {
            "alarms": {
              "clear": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "clearAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "get": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "bookmarks": {
              "create": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getChildren": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getRecent": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getSubTree": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTree": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "move": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeTree": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "browserAction": {
              "disable": {
                "minArgs": 0,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "enable": {
                "minArgs": 0,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "getBadgeBackgroundColor": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getBadgeText": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getPopup": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTitle": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "openPopup": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "setBadgeBackgroundColor": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setBadgeText": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setIcon": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "setPopup": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setTitle": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "browsingData": {
              "remove": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "removeCache": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeCookies": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeDownloads": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeFormData": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeHistory": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeLocalStorage": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removePasswords": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removePluginData": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "settings": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "commands": {
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "contextMenus": {
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "cookies": {
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAllCookieStores": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "set": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "devtools": {
              "inspectedWindow": {
                "eval": {
                  "minArgs": 1,
                  "maxArgs": 2,
                  "singleCallbackArg": false
                }
              },
              "panels": {
                "create": {
                  "minArgs": 3,
                  "maxArgs": 3,
                  "singleCallbackArg": true
                },
                "elements": {
                  "createSidebarPane": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              }
            },
            "downloads": {
              "cancel": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "download": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "erase": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getFileIcon": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "open": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "pause": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeFile": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "resume": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "show": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "extension": {
              "isAllowedFileSchemeAccess": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "isAllowedIncognitoAccess": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "history": {
              "addUrl": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "deleteAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "deleteRange": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "deleteUrl": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getVisits": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "i18n": {
              "detectLanguage": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAcceptLanguages": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "identity": {
              "launchWebAuthFlow": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "idle": {
              "queryState": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "management": {
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getSelf": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "setEnabled": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "uninstallSelf": {
                "minArgs": 0,
                "maxArgs": 1
              }
            },
            "notifications": {
              "clear": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "create": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getPermissionLevel": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "pageAction": {
              "getPopup": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTitle": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "hide": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setIcon": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "setPopup": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setTitle": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "show": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "permissions": {
              "contains": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "request": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "runtime": {
              "getBackgroundPage": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getPlatformInfo": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "openOptionsPage": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "requestUpdateCheck": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "sendMessage": {
                "minArgs": 1,
                "maxArgs": 3
              },
              "sendNativeMessage": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "setUninstallURL": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "sessions": {
              "getDevices": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getRecentlyClosed": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "restore": {
                "minArgs": 0,
                "maxArgs": 1
              }
            },
            "storage": {
              "local": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "managed": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "sync": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              }
            },
            "tabs": {
              "captureVisibleTab": {
                "minArgs": 0,
                "maxArgs": 2
              },
              "create": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "detectLanguage": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "discard": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "duplicate": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "executeScript": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getCurrent": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getZoom": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getZoomSettings": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "goBack": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "goForward": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "highlight": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "insertCSS": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "move": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "query": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "reload": {
                "minArgs": 0,
                "maxArgs": 2
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeCSS": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "sendMessage": {
                "minArgs": 2,
                "maxArgs": 3
              },
              "setZoom": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "setZoomSettings": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "update": {
                "minArgs": 1,
                "maxArgs": 2
              }
            },
            "topSites": {
              "get": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "webNavigation": {
              "getAllFrames": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getFrame": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "webRequest": {
              "handlerBehaviorChanged": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "windows": {
              "create": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getCurrent": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getLastFocused": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            }
          };
          if (Object.keys(apiMetadata).length === 0) {
            throw new Error("api-metadata.json has not been included in browser-polyfill");
          }
          class DefaultWeakMap extends WeakMap {
            constructor(createItem, items = void 0) {
              super(items);
              this.createItem = createItem;
            }
            get(key) {
              if (!this.has(key)) {
                this.set(key, this.createItem(key));
              }
              return super.get(key);
            }
          }
          const isThenable = (value) => {
            return value && typeof value === "object" && typeof value.then === "function";
          };
          const makeCallback = (promise, metadata) => {
            return (...callbackArgs) => {
              if (extensionAPIs.runtime.lastError) {
                promise.reject(new Error(extensionAPIs.runtime.lastError.message));
              } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                promise.resolve(callbackArgs[0]);
              } else {
                promise.resolve(callbackArgs);
              }
            };
          };
          const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
          const wrapAsyncFunction = (name, metadata) => {
            return function asyncFunctionWrapper(target, ...args) {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                if (metadata.fallbackToNoCallback) {
                  try {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  } catch (cbError) {
                    console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                    target[name](...args);
                    metadata.fallbackToNoCallback = false;
                    metadata.noCallback = true;
                    resolve();
                  }
                } else if (metadata.noCallback) {
                  target[name](...args);
                  resolve();
                } else {
                  target[name](...args, makeCallback({
                    resolve,
                    reject
                  }, metadata));
                }
              });
            };
          };
          const wrapMethod = (target, method, wrapper) => {
            return new Proxy(method, {
              apply(targetMethod, thisObj, args) {
                return wrapper.call(thisObj, target, ...args);
              }
            });
          };
          let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
          const wrapObject = (target, wrappers = {}, metadata = {}) => {
            let cache = /* @__PURE__ */ Object.create(null);
            let handlers = {
              has(proxyTarget2, prop) {
                return prop in target || prop in cache;
              },
              get(proxyTarget2, prop, receiver) {
                if (prop in cache) {
                  return cache[prop];
                }
                if (!(prop in target)) {
                  return void 0;
                }
                let value = target[prop];
                if (typeof value === "function") {
                  if (typeof wrappers[prop] === "function") {
                    value = wrapMethod(target, target[prop], wrappers[prop]);
                  } else if (hasOwnProperty(metadata, prop)) {
                    let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                    value = wrapMethod(target, target[prop], wrapper);
                  } else {
                    value = value.bind(target);
                  }
                } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                  value = wrapObject(value, wrappers[prop], metadata[prop]);
                } else if (hasOwnProperty(metadata, "*")) {
                  value = wrapObject(value, wrappers[prop], metadata["*"]);
                } else {
                  Object.defineProperty(cache, prop, {
                    configurable: true,
                    enumerable: true,
                    get() {
                      return target[prop];
                    },
                    set(value2) {
                      target[prop] = value2;
                    }
                  });
                  return value;
                }
                cache[prop] = value;
                return value;
              },
              set(proxyTarget2, prop, value, receiver) {
                if (prop in cache) {
                  cache[prop] = value;
                } else {
                  target[prop] = value;
                }
                return true;
              },
              defineProperty(proxyTarget2, prop, desc) {
                return Reflect.defineProperty(cache, prop, desc);
              },
              deleteProperty(proxyTarget2, prop) {
                return Reflect.deleteProperty(cache, prop);
              }
            };
            let proxyTarget = Object.create(target);
            return new Proxy(proxyTarget, handlers);
          };
          const wrapEvent = (wrapperMap) => ({
            addListener(target, listener, ...args) {
              target.addListener(wrapperMap.get(listener), ...args);
            },
            hasListener(target, listener) {
              return target.hasListener(wrapperMap.get(listener));
            },
            removeListener(target, listener) {
              target.removeListener(wrapperMap.get(listener));
            }
          });
          const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
            if (typeof listener !== "function") {
              return listener;
            }
            return function onRequestFinished(req) {
              const wrappedReq = wrapObject(req, {}, {
                getContent: {
                  minArgs: 0,
                  maxArgs: 0
                }
              });
              listener(wrappedReq);
            };
          });
          const onMessageWrappers = new DefaultWeakMap((listener) => {
            if (typeof listener !== "function") {
              return listener;
            }
            return function onMessage(message, sender, sendResponse) {
              let didCallSendResponse = false;
              let wrappedSendResponse;
              let sendResponsePromise = new Promise((resolve) => {
                wrappedSendResponse = function(response) {
                  didCallSendResponse = true;
                  resolve(response);
                };
              });
              let result;
              try {
                result = listener(message, sender, wrappedSendResponse);
              } catch (err) {
                result = Promise.reject(err);
              }
              const isResultThenable = result !== true && isThenable(result);
              if (result !== true && !isResultThenable && !didCallSendResponse) {
                return false;
              }
              const sendPromisedResult = (promise) => {
                promise.then((msg) => {
                  sendResponse(msg);
                }, (error) => {
                  let message2;
                  if (error && (error instanceof Error || typeof error.message === "string")) {
                    message2 = error.message;
                  } else {
                    message2 = "An unexpected error occurred";
                  }
                  sendResponse({
                    __mozWebExtensionPolyfillReject__: true,
                    message: message2
                  });
                }).catch((err) => {
                  console.error("Failed to send onMessage rejected reply", err);
                });
              };
              if (isResultThenable) {
                sendPromisedResult(result);
              } else {
                sendPromisedResult(sendResponsePromise);
              }
              return true;
            };
          });
          const wrappedSendMessageCallback = ({
            reject,
            resolve
          }, reply) => {
            if (extensionAPIs.runtime.lastError) {
              if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                resolve();
              } else {
                reject(new Error(extensionAPIs.runtime.lastError.message));
              }
            } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
              reject(new Error(reply.message));
            } else {
              resolve(reply);
            }
          };
          const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
            if (args.length < metadata.minArgs) {
              throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
            }
            if (args.length > metadata.maxArgs) {
              throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
            }
            return new Promise((resolve, reject) => {
              const wrappedCb = wrappedSendMessageCallback.bind(null, {
                resolve,
                reject
              });
              args.push(wrappedCb);
              apiNamespaceObj.sendMessage(...args);
            });
          };
          const staticWrappers = {
            devtools: {
              network: {
                onRequestFinished: wrapEvent(onRequestFinishedWrappers)
              }
            },
            runtime: {
              onMessage: wrapEvent(onMessageWrappers),
              onMessageExternal: wrapEvent(onMessageWrappers),
              sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                minArgs: 1,
                maxArgs: 3
              })
            },
            tabs: {
              sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                minArgs: 2,
                maxArgs: 3
              })
            }
          };
          const settingMetadata = {
            clear: {
              minArgs: 1,
              maxArgs: 1
            },
            get: {
              minArgs: 1,
              maxArgs: 1
            },
            set: {
              minArgs: 1,
              maxArgs: 1
            }
          };
          apiMetadata.privacy = {
            network: {
              "*": settingMetadata
            },
            services: {
              "*": settingMetadata
            },
            websites: {
              "*": settingMetadata
            }
          };
          return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
        };
        module2.exports = wrapAPIs(chrome);
      } else {
        module2.exports = globalThis.browser;
      }
    });
  })(browserPolyfill);
  var browserPolyfillExports = browserPolyfill.exports;
  const browser = /* @__PURE__ */ getDefaultExportFromCjs(browserPolyfillExports);
  function sendRuntimeMessage(message) {
    return browser.runtime.sendMessage(message);
  }
  function addRuntimeMessageListener(handler) {
    browser.runtime.onMessage.addListener(handler);
    return () => browser.runtime.onMessage.removeListener(handler);
  }
  function isExtensionMessage(value) {
    if (!isRecord(value) || typeof value.type !== "string" || !isRecord(value.payload)) {
      return false;
    }
    switch (value.type) {
      case "CHATGPT_THREAD_CHANGED":
        return typeof value.payload.sourceThreadId === "string" && typeof value.payload.title === "string" && typeof value.payload.url === "string";
      case "SAVE_CHATGPT_MESSAGE":
        return isSaveChatGptPayload(value.payload);
      case "SAVE_CHATGPT_MESSAGE_RESULT":
        return typeof value.payload.sourceThreadId === "string" && typeof value.payload.sourceMessageKey === "string" && typeof value.payload.savedMessageId === "string" && isSaveStatus(value.payload.status);
      case "GET_ACTIVE_CHATGPT_CONTEXT":
        return true;
      case "GET_ACTIVE_SAVE_TARGET":
        return true;
      case "SET_ACTIVE_SAVE_TARGET":
        return typeof value.payload.threadId === "string" || value.payload.threadId === null;
      case "ACTIVE_SAVE_TARGET_CHANGED":
        return (typeof value.payload.threadId === "string" || value.payload.threadId === null) && (typeof value.payload.title === "string" || value.payload.title === null) && (value.payload.source === "chatgpt" || value.payload.source === "notebook" || value.payload.source === null);
      case "INSERT_TEXT_IN_CHATGPT":
        return typeof value.payload.text === "string";
      case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
        return typeof value.payload.sourceThreadId === "string" && typeof value.payload.sourceMessageKey === "string" && typeof value.payload.saved === "boolean";
      case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
        return typeof value.payload.sourceThreadId === "string" && Array.isArray(value.payload.sourceMessageKeys) && value.payload.sourceMessageKeys.every((key) => typeof key === "string");
      default:
        return false;
    }
  }
  function isSaveChatGptPayload(value) {
    return typeof value.sourceThreadId === "string" && typeof value.title === "string" && (typeof value.sourceMessageId === "string" || value.sourceMessageId === null) && typeof value.sourceMessageKey === "string" && typeof value.contentHash === "string" && isMessageRole(value.role) && typeof value.contentMarkdown === "string" && typeof value.contentText === "string" && (value.insertAfterId === void 0 || value.insertAfterId === null || typeof value.insertAfterId === "string");
  }
  function isMessageRole(value) {
    return value === "assistant" || value === "user" || value === "system";
  }
  function isSaveStatus(value) {
    return value === "created" || value === "already_saved" || value === "updated";
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  const COMPOSER_SELECTORS = [
    "textarea#prompt-textarea",
    "#prompt-textarea[contenteditable='true']",
    "[data-testid='composer-text-input'][contenteditable='true']",
    ".ProseMirror[contenteditable='true']",
    "textarea",
    "div[contenteditable='true']"
  ];
  function insertTextIntoChatGptComposer(text) {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return { inserted: false, error: "Nothing to insert." };
    }
    const composer = findChatGptComposer();
    if (!composer) {
      return { inserted: false, error: "Could not find the ChatGPT text box." };
    }
    const textToInsert = getInsertionText(composer, normalizedText);
    if (composer instanceof HTMLTextAreaElement) {
      insertIntoTextarea(composer, textToInsert);
    } else {
      insertIntoContentEditable(composer, textToInsert);
    }
    return { inserted: true };
  }
  function findChatGptComposer(root = document) {
    for (const selector of COMPOSER_SELECTORS) {
      const element = root.querySelector(selector);
      if (element && isVisibleElement(element)) {
        return element;
      }
    }
    return null;
  }
  function getInsertionText(composer, text) {
    const currentText = composer instanceof HTMLTextAreaElement ? composer.value.trim() : (composer.textContent ?? "").trim();
    return currentText ? `

${text}` : text;
  }
  function insertIntoTextarea(textarea, text) {
    textarea.focus();
    const selectionStart = textarea.selectionStart ?? textarea.value.length;
    const selectionEnd = textarea.selectionEnd ?? textarea.value.length;
    textarea.setRangeText(text, selectionStart, selectionEnd, "end");
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  }
  function insertIntoContentEditable(element, text) {
    var _a;
    element.focus();
    ensureSelectionInsideElement(element);
    if ((_a = document.execCommand) == null ? void 0 : _a.call(document, "insertText", false, text)) {
      element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      element.textContent = `${element.textContent ?? ""}${text}`;
    } else {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  }
  function ensureSelectionInsideElement(element) {
    const selection = window.getSelection();
    if ((selection == null ? void 0 : selection.anchorNode) && selection.focusNode && element.contains(selection.anchorNode) && element.contains(selection.focusNode)) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection == null ? void 0 : selection.removeAllRanges();
    selection == null ? void 0 : selection.addRange(range);
  }
  function isVisibleElement(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 || element instanceof HTMLTextAreaElement;
  }
  function normalizeForKey(input) {
    return input.replace(/\s+/g, " ").trim().toLowerCase();
  }
  function stableHash(input) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }
  function sourceMessageKeyFromParts(input) {
    if (input.sourceMessageId) {
      return `source:${input.sourceMessageId}`;
    }
    return `content:${stableHash(`${input.role}:${normalizeForKey(input.contentText)}`)}`;
  }
  function contentHashFromParts(input) {
    return stableHash(`${input.contentMarkdown}
${normalizeForKey(input.contentText)}`);
  }
  const CHATGPT_HOSTS = /* @__PURE__ */ new Set(["chatgpt.com", "chat.openai.com"]);
  function parseChatGptConversationId(input) {
    const url = typeof input === "string" ? safeUrl(input) : input;
    if (!url || !isChatGptUrl(url)) {
      return null;
    }
    const [, firstSegment, secondSegment] = url.pathname.split("/");
    if (firstSegment !== "c" || !secondSegment) {
      return null;
    }
    return decodeURIComponent(secondSegment);
  }
  function isChatGptUrl(input) {
    const url = typeof input === "string" ? safeUrl(input) : input;
    return Boolean(url && CHATGPT_HOSTS.has(url.hostname));
  }
  function safeUrl(input) {
    try {
      return new URL(input);
    } catch {
      return null;
    }
  }
  function markdownToPlainText(markdown) {
    return markdown.replace(
      /```[\s\S]*?```/g,
      (block) => block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "").trim()
    ).replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^\s{0,3}#{1,6}\s+/gm, "").replace(/^\s*[-*]\s+/gm, "").replace(/\s+/g, " ").trim();
  }
  const BLOCK_TAGS = /* @__PURE__ */ new Set([
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "DIV",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "LI",
    "MAIN",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "UL"
  ]);
  function extractMarkdownFromNode(node) {
    return normalizeMarkdown(renderNode(node, { inPre: false, listDepth: 0 }));
  }
  function extractMarkdownFromRange(range) {
    const preElement = getSharedAncestor(range, "pre");
    if (preElement) {
      return codeFence(extractPreformattedText(range.cloneContents()), getCodeLanguage(preElement));
    }
    const codeElement = getSharedAncestor(range, "code");
    if (codeElement) {
      return inlineCode(range.toString());
    }
    return extractMarkdownFromNode(range.cloneContents());
  }
  function renderNode(node, context) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      return renderChildren(node, context);
    }
    if (!(node instanceof HTMLElement)) {
      return "";
    }
    if (node.classList.contains("cgpt-notes-capture") || node.classList.contains("cgpt-notes-selection-popover")) {
      return "";
    }
    const tagName = node.tagName;
    switch (tagName) {
      case "BR":
        return "\n";
      case "PRE": {
        const code = node.querySelector("code");
        const text = extractPreformattedText(code ?? node);
        return `

${codeFence(text, getCodeLanguage(node))}

`;
      }
      case "CODE":
        if (context.inPre) {
          return node.textContent ?? "";
        }
        return inlineCode(node.textContent ?? "");
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const level = Number(tagName.slice(1));
        return `

${"#".repeat(level)} ${renderChildren(node, context).trim()}

`;
      }
      case "BLOCKQUOTE":
        return renderChildren(node, context).trim().split("\n").map((line) => `> ${line}`).join("\n");
      case "UL":
      case "OL":
        return `
${renderChildren(node, { ...context, listDepth: context.listDepth + 1 })}
`;
      case "LI": {
        const indent = "  ".repeat(Math.max(0, context.listDepth - 1));
        return `${indent}- ${renderChildren(node, context).trim()}
`;
      }
      case "STRONG":
      case "B":
        return `**${renderChildren(node, context).trim()}**`;
      case "EM":
      case "I":
        return `_${renderChildren(node, context).trim()}_`;
      case "A": {
        const text = renderChildren(node, context).trim();
        const href = node.getAttribute("href");
        return href && text ? `[${text}](${href})` : text;
      }
      default: {
        const rendered = renderChildren(node, { ...context, inPre: context.inPre || tagName === "PRE" });
        if (BLOCK_TAGS.has(tagName)) {
          return `
${rendered.trim()}
`;
        }
        return rendered;
      }
    }
  }
  function renderChildren(node, context) {
    return Array.from(node.childNodes).map((child) => renderNode(child, context)).join("");
  }
  function normalizeMarkdown(markdown) {
    return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function codeFence(code, language) {
    const fence = "```";
    return `${fence}${language ?? ""}
${code.replace(/\n+$/, "")}
${fence}`;
  }
  function extractPreformattedText(node) {
    let text = "";
    function append(value) {
      text += value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }
    function appendNewline() {
      if (!text.endsWith("\n")) {
        text += "\n";
      }
    }
    function walk(current) {
      if (current.nodeType === Node.TEXT_NODE) {
        append(current.textContent ?? "");
        return;
      }
      if (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        Array.from(current.childNodes).forEach(walk);
        return;
      }
      if (!(current instanceof HTMLElement)) {
        return;
      }
      if (current.classList.contains("cgpt-notes-capture") || current.classList.contains("cgpt-notes-selection-popover")) {
        return;
      }
      if (current.tagName === "BR") {
        appendNewline();
        return;
      }
      const isLineElement = current !== node && isPreformattedLineElement(current);
      if (isLineElement && text) {
        appendNewline();
      }
      Array.from(current.childNodes).forEach(walk);
      if (isLineElement) {
        appendNewline();
      }
    }
    walk(node);
    return text.replace(/\n+$/, "");
  }
  function inlineCode(code) {
    const trimmed = code.replace(/\s+/g, " ").trim();
    if (!trimmed) {
      return "";
    }
    return `\`${trimmed.replace(/`/g, "\\`")}\``;
  }
  function getSharedAncestor(range, selector) {
    const start = getClosestElement(range.startContainer, selector);
    const end = getClosestElement(range.endContainer, selector);
    if (start && start === end) {
      return start;
    }
    return null;
  }
  function getClosestElement(node, selector) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return (element == null ? void 0 : element.closest(selector)) ?? null;
  }
  function getCodeLanguage(element) {
    const code = element.matches("code") ? element : element.querySelector("code");
    const languageClass = Array.from((code == null ? void 0 : code.classList) ?? []).find(
      (className) => className.startsWith("language-")
    );
    return element.getAttribute("data-language") ?? (code == null ? void 0 : code.getAttribute("data-language")) ?? (languageClass == null ? void 0 : languageClass.replace(/^language-/, "")) ?? null;
  }
  function isPreformattedLineElement(element) {
    return BLOCK_TAGS.has(element.tagName) && element.tagName !== "PRE";
  }
  const MESSAGE_CONTAINER_SELECTORS = [
    "[data-message-author-role]",
    "[data-testid^='conversation-turn-']"
  ];
  const ROLE_VALUES = /* @__PURE__ */ new Set(["assistant", "user", "system"]);
  function getCurrentChatGptConversation() {
    const sourceThreadId = parseChatGptConversationId(window.location.href);
    if (!sourceThreadId) {
      return null;
    }
    return {
      sourceThreadId,
      title: document.title.replace(/\s*-\s*ChatGPT\s*$/i, "").trim() || "ChatGPT conversation",
      url: window.location.href
    };
  }
  function findConversationRoot() {
    return document.querySelector("main") ?? document.body;
  }
  function findVisibleMessageContainers(root = document) {
    const containers = MESSAGE_CONTAINER_SELECTORS.flatMap(
      (selector) => Array.from(root.querySelectorAll(selector))
    ).map(resolveMessageContainer).filter((container) => Boolean(container));
    const uniqueContainers = [...new Set(containers)];
    return uniqueContainers.filter((container) => {
      if (!isVisibleEnough(container)) {
        return false;
      }
      return Boolean(getMessageRole(container));
    });
  }
  function extractMessageFromContainer(container) {
    return buildExtractedMessage(container, extractMessageMarkdown(container), "message");
  }
  function extractSelectionFromDocument(selection) {
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const container = findMessageContainerForNode(range.commonAncestorContainer);
    if (!container || !container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      return null;
    }
    const contentMarkdown = extractMarkdownFromRange(range);
    return buildExtractedMessage(container, contentMarkdown, "selection");
  }
  function findMessageContainerForNode(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const selectors = MESSAGE_CONTAINER_SELECTORS.join(",");
    const container = resolveMessageContainer((element == null ? void 0 : element.closest(selectors)) ?? null);
    if (container && getMessageRole(container)) {
      return container;
    }
    const roleElement = (element == null ? void 0 : element.closest("[data-message-author-role]")) ?? null;
    return roleElement && getMessageRole(roleElement) ? roleElement : null;
  }
  function resolveMessageContainer(container) {
    if (!container) {
      return null;
    }
    if (getOwnMessageRole(container)) {
      return container;
    }
    return Array.from(container.querySelectorAll("[data-message-author-role]")).find(
      (element) => Boolean(getOwnMessageRole(element))
    ) ?? null;
  }
  function buildExtractedMessage(container, contentMarkdown, captureMode) {
    const context = getCurrentChatGptConversation();
    const role = getMessageRole(container);
    if (!context || !role) {
      return null;
    }
    const sourceMessageId = getSourceMessageId(container);
    const contentText = markdownToPlainText(contentMarkdown);
    if (!contentText) {
      return null;
    }
    const baseSourceMessageKey = sourceMessageKeyFromParts({
      sourceMessageId,
      role,
      contentText
    });
    const contentHash = contentHashFromParts({ contentMarkdown, contentText });
    const sourceMessageKey = captureMode === "selection" ? `selection:${baseSourceMessageKey}:${contentHash}` : baseSourceMessageKey;
    return {
      container,
      sourceThreadId: context.sourceThreadId,
      title: context.title,
      sourceMessageId,
      sourceMessageKey,
      contentHash,
      role,
      contentMarkdown,
      contentText,
      isStreaming: isMessageStreaming(container)
    };
  }
  function getMessageRole(container) {
    const roleElement = container.matches("[data-message-author-role]") ? container : container.querySelector("[data-message-author-role]");
    return roleElement ? getOwnMessageRole(roleElement) : null;
  }
  function getOwnMessageRole(container) {
    const role = container.getAttribute("data-message-author-role");
    if (role && ROLE_VALUES.has(role) && role !== "note") {
      return role;
    }
    return null;
  }
  function getSourceMessageId(container) {
    const idElement = findSelfOrDescendantWithAttribute(container, "data-message-id") ?? findSelfOrDescendantWithAttribute(container, "data-turn-id") ?? findSelfOrDescendantWithAttribute(container, "data-testid");
    const rawId = (idElement == null ? void 0 : idElement.getAttribute("data-message-id")) ?? (idElement == null ? void 0 : idElement.getAttribute("data-turn-id")) ?? (idElement == null ? void 0 : idElement.getAttribute("data-testid")) ?? container.id;
    return rawId || null;
  }
  function extractMessageMarkdown(container) {
    const clone = container.cloneNode(true);
    clone.querySelectorAll(".cgpt-notes-capture, .cgpt-notes-selection-popover").forEach((element) => {
      element.remove();
    });
    const preferredContent = clone.querySelector(".markdown") ?? clone.querySelector("[data-message-author-role]") ?? clone;
    return extractMarkdownFromNode(preferredContent);
  }
  function isMessageStreaming(container) {
    return Boolean(
      container.matches("[aria-busy='true'], .result-streaming") || container.querySelector("[aria-busy='true'], .result-streaming, [data-testid*='streaming']")
    );
  }
  function findSelfOrDescendantWithAttribute(container, attributeName) {
    if (container.hasAttribute(attributeName)) {
      return container;
    }
    return container.querySelector(`[${attributeName}]`);
  }
  function isVisibleEnough(container) {
    const style = window.getComputedStyle(container);
    return style.display !== "none" && style.visibility !== "hidden";
  }
  const BOUND_ATTRIBUTE = "data-cgpt-notes-bound";
  const ACTION_ATTRIBUTE = "data-cgpt-notes-action";
  const OVERLAY_CLASS = "cgpt-notes-capture";
  const BUTTON_CLASS = "cgpt-notes-save-button";
  const SELECTION_POPOVER_CLASS = "cgpt-notes-selection-popover";
  const EXPORT_LABEL = "Export to ChatGPT Note";
  function startMessageCaptureOverlay() {
    const root = findConversationRoot();
    const selectionButton = createSelectionButton();
    let refreshHandle = null;
    let selectionHandle = null;
    let stopped = false;
    const observer = new MutationObserver(() => {
      scheduleScan();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    const runtimeListener = (message) => {
      if (!isExtensionMessage(message)) {
        return;
      }
      if (message.type === "ACTIVE_SAVE_TARGET_CHANGED") {
        scan();
      }
    };
    browser.runtime.onMessage.addListener(runtimeListener);
    document.addEventListener("click", handleDocumentClick, true);
    document.addEventListener("selectionchange", scheduleSelectionRefresh);
    document.addEventListener("mouseup", scheduleSelectionRefresh);
    document.addEventListener("keyup", scheduleSelectionRefresh);
    const controller2 = {
      scan,
      stop() {
        stopped = true;
        observer.disconnect();
        browser.runtime.onMessage.removeListener(runtimeListener);
        document.removeEventListener("click", handleDocumentClick, true);
        document.removeEventListener("selectionchange", scheduleSelectionRefresh);
        document.removeEventListener("mouseup", scheduleSelectionRefresh);
        document.removeEventListener("keyup", scheduleSelectionRefresh);
        selectionButton.remove();
        if (refreshHandle !== null) {
          window.clearTimeout(refreshHandle);
        }
        if (selectionHandle !== null) {
          window.clearTimeout(selectionHandle);
        }
      }
    };
    scan();
    return controller2;
    function scheduleScan() {
      if (stopped || refreshHandle !== null) {
        return;
      }
      refreshHandle = window.setTimeout(() => {
        refreshHandle = null;
        scan();
      }, 180);
    }
    function scheduleSelectionRefresh() {
      if (stopped || selectionHandle !== null) {
        return;
      }
      selectionHandle = window.setTimeout(() => {
        selectionHandle = null;
        updateSelectionButton(selectionButton);
      }, 80);
    }
    function scan() {
      if (stopped) {
        return;
      }
      const containers = findVisibleMessageContainers(root);
      containers.forEach((container) => {
        if (!container.hasAttribute(BOUND_ATTRIBUTE) || !getMessageButton(container)) {
          attachButton(container);
        }
      });
    }
    function handleDocumentClick(event) {
      var _a;
      const button = (_a = event.target) == null ? void 0 : _a.closest(`.${BUTTON_CLASS}`);
      if (!button) {
        return;
      }
      const action = button.getAttribute(ACTION_ATTRIBUTE);
      if (action !== "export-message" && action !== "export-selection") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) {
        return;
      }
      if (action === "export-selection") {
        void saveSelectedMessage(button);
        return;
      }
      const container = button.closest(`[${BOUND_ATTRIBUTE}]`);
      if (!container) {
        setButtonError(button);
        return;
      }
      void saveContainerMessage(container, button);
    }
  }
  function createSelectionButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${BUTTON_CLASS} ${SELECTION_POPOVER_CLASS}`;
    button.textContent = EXPORT_LABEL;
    button.title = "Export selected text to ChatGPT Notes";
    button.setAttribute("aria-label", "Export selected text to ChatGPT Notes");
    button.setAttribute(ACTION_ATTRIBUTE, "export-selection");
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    document.body.append(button);
    hideSelectionButton(button);
    return button;
  }
  function attachButton(container) {
    container.querySelectorAll(`.${OVERLAY_CLASS}`).forEach((element) => element.remove());
    const wrapper = document.createElement("span");
    const button = document.createElement("button");
    wrapper.className = OVERLAY_CLASS;
    button.type = "button";
    button.className = BUTTON_CLASS;
    button.textContent = EXPORT_LABEL;
    button.title = "Export message to ChatGPT Notes";
    button.setAttribute("aria-label", "Export message to ChatGPT Notes");
    button.setAttribute(ACTION_ATTRIBUTE, "export-message");
    wrapper.append(button);
    container.append(wrapper);
    container.setAttribute(BOUND_ATTRIBUTE, "true");
  }
  async function saveContainerMessage(container, button) {
    const extracted = extractMessageFromContainer(container);
    if (!extracted) {
      setButtonError(button);
      return;
    }
    button.disabled = true;
    button.classList.remove("has-error");
    button.textContent = EXPORT_LABEL;
    let exported = false;
    try {
      await sendRuntimeMessage({
        type: "SAVE_CHATGPT_MESSAGE",
        payload: {
          sourceThreadId: extracted.sourceThreadId,
          title: extracted.title,
          sourceMessageId: extracted.sourceMessageId,
          sourceMessageKey: createExportSourceMessageKey(extracted.sourceMessageKey),
          contentHash: extracted.contentHash,
          role: extracted.role,
          contentMarkdown: extracted.contentMarkdown,
          contentText: extracted.contentText
        }
      });
      exported = true;
    } catch {
      setButtonError(button);
    } finally {
      button.disabled = false;
      if (exported) {
        resetExportButton(button);
      }
    }
  }
  async function saveSelectedMessage(button) {
    const extracted = extractSelectionFromDocument(window.getSelection());
    if (!extracted) {
      hideSelectionButton(button);
      return;
    }
    button.disabled = true;
    button.classList.remove("has-error");
    button.textContent = EXPORT_LABEL;
    let exported = false;
    try {
      await sendRuntimeMessage({
        type: "SAVE_CHATGPT_MESSAGE",
        payload: {
          sourceThreadId: extracted.sourceThreadId,
          title: extracted.title,
          sourceMessageId: extracted.sourceMessageId,
          sourceMessageKey: createExportSourceMessageKey(extracted.sourceMessageKey),
          contentHash: extracted.contentHash,
          role: extracted.role,
          contentMarkdown: extracted.contentMarkdown,
          contentText: extracted.contentText
        }
      });
      exported = true;
      window.setTimeout(() => hideSelectionButton(button), 900);
    } catch {
      setButtonError(button);
    } finally {
      button.disabled = false;
      if (exported) {
        resetExportButton(button);
      }
    }
  }
  function updateSelectionButton(button) {
    const selection = window.getSelection();
    const extracted = extractSelectionFromDocument(selection);
    if (!selection || !extracted) {
      hideSelectionButton(button);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = getUsefulRangeRect(range);
    if (!rect) {
      hideSelectionButton(button);
      return;
    }
    button.classList.remove("is-saved", "has-error");
    button.disabled = false;
    button.textContent = EXPORT_LABEL;
    button.style.left = `${Math.min(window.innerWidth - 16, Math.max(8, rect.left + rect.width / 2))}px`;
    button.style.top = `${Math.max(8, rect.top - 42)}px`;
    button.style.display = "inline-flex";
  }
  function getMessageButton(container) {
    return container.querySelector(`.${BUTTON_CLASS}[${ACTION_ATTRIBUTE}="export-message"]`);
  }
  function getUsefulRangeRect(range) {
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    if (rects[0]) {
      return rects[0];
    }
    const fallback = range.getBoundingClientRect();
    return fallback.width > 0 && fallback.height > 0 ? fallback : null;
  }
  function hideSelectionButton(button) {
    button.style.display = "none";
    button.classList.remove("is-saved", "has-error");
    button.disabled = false;
    button.textContent = EXPORT_LABEL;
  }
  function resetExportButton(button) {
    button.classList.remove("is-saved", "has-error");
    button.textContent = EXPORT_LABEL;
  }
  function setButtonError(button) {
    button.classList.add("has-error");
    button.classList.remove("is-saved");
    button.textContent = EXPORT_LABEL;
    button.disabled = false;
  }
  function createExportSourceMessageKey(baseKey) {
    return `export:${baseKey}:${Date.now().toString(36)}:${createRandomSuffix()}`;
  }
  function createRandomSuffix() {
    var _a, _b;
    return ((_b = (_a = globalThis.crypto) == null ? void 0 : _a.randomUUID) == null ? void 0 : _b.call(_a)) ?? Math.random().toString(36).slice(2);
  }
  let controller = null;
  let lastConversationId = null;
  bootstrap();
  function bootstrap() {
    addRuntimeMessageListener((rawMessage) => {
      if (!isExtensionMessage(rawMessage) || rawMessage.type !== "INSERT_TEXT_IN_CHATGPT") {
        return void 0;
      }
      return insertTextIntoChatGptComposer(rawMessage.payload.text);
    });
    syncConversationState();
    window.setInterval(() => {
      syncConversationState();
    }, 1e3);
  }
  function syncConversationState() {
    const context = getCurrentChatGptConversation();
    if (!context) {
      controller == null ? void 0 : controller.stop();
      controller = null;
      lastConversationId = null;
      return;
    }
    if (context.sourceThreadId === lastConversationId) {
      controller == null ? void 0 : controller.scan();
      return;
    }
    controller == null ? void 0 : controller.stop();
    lastConversationId = context.sourceThreadId;
    controller = startMessageCaptureOverlay();
    void sendRuntimeMessage({
      type: "CHATGPT_THREAD_CHANGED",
      payload: context
    });
  }
})();
//# sourceMappingURL=content.js.map
