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
    if (!isRecord$1(value) || typeof value.type !== "string" || !isRecord$1(value.payload)) {
      return false;
    }
    switch (value.type) {
      case "CHATGPT_THREAD_CHANGED":
        return isOptionalCapturableSource(value.payload.source) && typeof value.payload.sourceThreadId === "string" && typeof value.payload.title === "string" && typeof value.payload.url === "string";
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
        return (typeof value.payload.threadId === "string" || value.payload.threadId === null) && (typeof value.payload.title === "string" || value.payload.title === null) && (value.payload.source === "chatgpt" || value.payload.source === "deepwiki" || value.payload.source === "notebook" || value.payload.source === null);
      case "OPEN_SIDEBAR_WINDOW":
        return true;
      case "INSERT_TEXT_IN_CHATGPT":
        return typeof value.payload.text === "string";
      case "SUBMIT_AI_OPERATION_PACKAGE":
        return isAiOperationPackage(value.payload);
      case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
        return typeof value.payload.sourceThreadId === "string" && typeof value.payload.sourceMessageKey === "string" && typeof value.payload.saved === "boolean";
      case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
        return isOptionalCapturableSource(value.payload.source) && typeof value.payload.sourceThreadId === "string" && Array.isArray(value.payload.sourceMessageKeys) && value.payload.sourceMessageKeys.every((key) => typeof key === "string");
      case "NOTEBOOK_DATA_CHANGED":
        return typeof value.payload.reason === "string";
      case "GET_AUTOSAVE_STATUS":
        return true;
      case "FORCE_AUTOSAVE":
        return true;
      default:
        return false;
    }
  }
  function isSaveChatGptPayload(value) {
    return isOptionalCapturableSource(value.source) && typeof value.sourceThreadId === "string" && typeof value.title === "string" && (typeof value.sourceMessageId === "string" || value.sourceMessageId === null) && typeof value.sourceMessageKey === "string" && typeof value.contentHash === "string" && isMessageRole(value.role) && typeof value.contentMarkdown === "string" && typeof value.contentText === "string" && (value.insertAfterId === void 0 || value.insertAfterId === null || typeof value.insertAfterId === "string");
  }
  function isMessageRole(value) {
    return value === "assistant" || value === "user" || value === "system";
  }
  function isOptionalCapturableSource(value) {
    return value === void 0 || value === "chatgpt" || value === "deepwiki";
  }
  function isSaveStatus(value) {
    return value === "created" || value === "already_saved" || value === "updated";
  }
  function isAiOperationPackage(value) {
    return value.protocolVersion === 1 && typeof value.requestId === "string" && typeof value.sourceThreadId === "string" && typeof value.sourceTitle === "string" && Array.isArray(value.operations) && value.operations.length > 0;
  }
  function isRecord$1(value) {
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
  function createId(prefix) {
    var _a, _b;
    const randomId = (_b = (_a = globalThis.crypto) == null ? void 0 : _a.randomUUID) == null ? void 0 : _b.call(_a);
    if (randomId) {
      return `${prefix}_${randomId}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
  const CHATGPT_HOSTS = /* @__PURE__ */ new Set(["chatgpt.com", "chat.openai.com"]);
  const DEEPWIKI_HOSTS = /* @__PURE__ */ new Set(["deepwiki.com", "www.deepwiki.com"]);
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
  function parseDeepWikiPageIdentity(input) {
    const url = typeof input === "string" ? safeUrl(input) : input;
    if (!url || !isDeepWikiUrl(url)) {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (segments.length === 0) {
      return null;
    }
    if (segments[0] === "search") {
      const searchId = segments[1] || "search";
      return {
        sourceThreadId: `deepwiki:search:${searchId}`,
        route: segments.slice(1).join("/") || "search",
        fallbackTitle: titleFromSlug(searchId) || "DeepWiki search"
      };
    }
    if (segments[0].startsWith("_") || segments[0] === "api") {
      return null;
    }
    const [owner, repo, ...routeParts] = segments;
    if (!owner || !repo) {
      return null;
    }
    return {
      sourceThreadId: `deepwiki:${owner}/${repo}`,
      owner,
      repo,
      route: routeParts.join("/") || "overview",
      fallbackTitle: `${owner}/${repo} DeepWiki`
    };
  }
  function isDeepWikiUrl(input) {
    const url = typeof input === "string" ? safeUrl(input) : input;
    return Boolean(url && DEEPWIKI_HOSTS.has(url.hostname));
  }
  function titleFromSlug(slug) {
    return slug.replace(/_[0-9a-f-]{20,}$/i, "").replace(/[-_]+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  function safeUrl(input) {
    try {
      return new URL(input);
    } catch {
      return null;
    }
  }
  const SECTION_BOUNDARY_MARKER = "cgpt-notes-section-boundary";
  function markdownToPlainText(markdown) {
    return markdown.replace(getSectionBoundaryLinePattern("gm"), "").replace(
      /```[\s\S]*?```/g,
      (block) => block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "").trim()
    ).replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/^\s{0,3}#{1,6}\s+/gm, "").replace(/^\s*[-*]\s+/gm, "").replace(/\s+/g, " ").trim();
  }
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function getSectionBoundaryLinePattern(flags = "") {
    return new RegExp(`^\\s*<!--\\s*${escapeRegExp(SECTION_BOUNDARY_MARKER)}(?::[1-6])?\\s*-->\\s*$`, flags);
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
    return normalizeMarkdown$1(renderNode(node, { inPre: false, listDepth: 0 }));
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
      case "TABLE":
        return `

${renderTable(node, context)}

`;
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
  function normalizeMarkdown$1(markdown) {
    return convertTabDelimitedTablesOutsideCode(markdown).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  function renderTable(table, context) {
    const rows = Array.from(table.querySelectorAll("tr")).map(
      (row) => Array.from(row.children).filter((cell) => cell instanceof HTMLElement && (cell.tagName === "TH" || cell.tagName === "TD")).map((cell) => normalizeTableCell(renderChildren(cell, context)))
    ).filter((row) => row.length > 0);
    return renderMarkdownTable(rows);
  }
  function convertTabDelimitedTablesOutsideCode(markdown) {
    const parts = [];
    const codeBlockPattern = /```[\s\S]*?```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockPattern.exec(markdown)) !== null) {
      parts.push(convertTabDelimitedTables(markdown.slice(lastIndex, match.index)));
      parts.push(match[0]);
      lastIndex = match.index + match[0].length;
    }
    parts.push(convertTabDelimitedTables(markdown.slice(lastIndex)));
    return parts.join("");
  }
  function convertTabDelimitedTables(markdown) {
    const lines = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const convertedLines = [];
    let index = 0;
    while (index < lines.length) {
      if (!isTabDelimitedTableLine(lines[index])) {
        convertedLines.push(lines[index]);
        index += 1;
        continue;
      }
      const tableLines = [];
      while (index < lines.length && isTabDelimitedTableLine(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      if (tableLines.length < 2) {
        convertedLines.push(...tableLines);
        continue;
      }
      convertedLines.push(renderMarkdownTable(tableLines.map((line) => line.split("	").map(normalizeTableCell))));
    }
    return convertedLines.join("\n");
  }
  function isTabDelimitedTableLine(line) {
    const cells = line.split("	");
    return cells.length > 1 && cells.filter((cell) => cell.trim()).length > 1;
  }
  function renderMarkdownTable(rows) {
    if (rows.length === 0) {
      return "";
    }
    const columnCount = Math.max(...rows.map((row) => row.length));
    const normalizedRows = rows.map((row) => padTableRow(row, columnCount));
    const [header, ...body] = normalizedRows;
    const separator = Array.from({ length: columnCount }, () => "---");
    return [header, separator, ...body].map((row) => `| ${row.map(escapeMarkdownTableCell).join(" | ")} |`).join("\n");
  }
  function padTableRow(row, columnCount) {
    return [...row, ...Array.from({ length: Math.max(0, columnCount - row.length) }, () => "")];
  }
  function normalizeTableCell(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  function escapeMarkdownTableCell(value) {
    return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
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
  const TEMPORARY_THREAD_STORAGE_KEY = "chatgpt-notes-temporary-thread-id";
  const ROLE_VALUES = /* @__PURE__ */ new Set(["assistant", "user", "system"]);
  function getCurrentChatGptConversation() {
    const sourceThreadId = parseChatGptConversationId(window.location.href) ?? getTemporaryChatGptThreadId();
    if (!sourceThreadId) {
      return null;
    }
    return {
      source: "chatgpt",
      sourceThreadId,
      title: document.title.replace(/\s*-\s*ChatGPT\s*$/i, "").trim() || "ChatGPT conversation",
      url: window.location.href
    };
  }
  function getTemporaryChatGptThreadId() {
    var _a, _b;
    if (!isChatGptUrl(window.location.href)) {
      return null;
    }
    try {
      const existing = window.sessionStorage.getItem(TEMPORARY_THREAD_STORAGE_KEY);
      if (existing) {
        return existing;
      }
      const next = `temporary:${((_b = (_a = globalThis.crypto) == null ? void 0 : _a.randomUUID) == null ? void 0 : _b.call(_a)) ?? createTemporaryThreadSuffix()}`;
      window.sessionStorage.setItem(TEMPORARY_THREAD_STORAGE_KEY, next);
      return next;
    } catch {
      return `temporary:${createTemporaryThreadSuffix()}`;
    }
  }
  function createTemporaryThreadSuffix() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  function findConversationRoot$1() {
    return document.querySelector("main") ?? document.body;
  }
  function findVisibleMessageContainers$1(root = document) {
    const containers = MESSAGE_CONTAINER_SELECTORS.flatMap(
      (selector) => Array.from(root.querySelectorAll(selector))
    ).map(resolveMessageContainer).filter((container) => Boolean(container));
    const uniqueContainers = [...new Set(containers)];
    return uniqueContainers.filter((container) => {
      if (!isVisibleEnough$1(container)) {
        return false;
      }
      return Boolean(getMessageRole(container));
    });
  }
  function extractMessageFromContainer$1(container) {
    return buildExtractedMessage$1(container, extractMessageMarkdown(container), "message");
  }
  function extractSelectionFromDocument$1(selection) {
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const container = findMessageContainerForNode(range.commonAncestorContainer);
    if (!container || !container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      return null;
    }
    const contentMarkdown = extractMarkdownFromRange(range);
    return buildExtractedMessage$1(container, contentMarkdown, "selection");
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
  function buildExtractedMessage$1(container, contentMarkdown, captureMode) {
    const context = getCurrentChatGptConversation();
    const role = getMessageRole(container);
    if (!context || !role) {
      return null;
    }
    const sourceMessageId = getSourceMessageId$1(container);
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
      source: "chatgpt",
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
  const chatGptCaptureAdapter = {
    source: "chatgpt",
    labels: {
      exportMessage: "Export to ChatGPT Note",
      exportSelection: "Export selected text to ChatGPT Notes"
    },
    supportsAiOperations: true,
    getCurrentContext: getCurrentChatGptConversation,
    findConversationRoot: findConversationRoot$1,
    findVisibleMessageContainers: findVisibleMessageContainers$1,
    extractMessageFromContainer: extractMessageFromContainer$1,
    extractSelectionFromDocument: extractSelectionFromDocument$1
  };
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
  function getSourceMessageId$1(container) {
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
  function isVisibleEnough$1(container) {
    const style = window.getComputedStyle(container);
    return style.display !== "none" && style.visibility !== "hidden";
  }
  const CONTENT_SELECTORS = [
    ".prose-custom",
    ".prose",
    "article",
    "[role='main']",
    "main"
  ];
  const HEADING_SELECTOR = "h1, h2, h3, [data-header='true']";
  const SEARCH_SECTION_HEADING_PATTERN = /^(read path|notes|answer|response|overview)$/i;
  const OVERLAY_SELECTORS = ".cgpt-notes-capture, .cgpt-notes-selection-popover";
  const SOURCE_REFERENCE_PATTERN = /^(?:[\w@.-]+\/)*[\w@.-]+\.[A-Za-z0-9]+:\d+(?:-\d+)?$/;
  const deepWikiCaptureAdapter = {
    source: "deepwiki",
    labels: {
      exportMessage: "Export to ChatGPT Note",
      exportSelection: "Export selected text to ChatGPT Notes"
    },
    getCurrentContext: getCurrentDeepWikiContext,
    findConversationRoot,
    findVisibleMessageContainers,
    extractMessageFromContainer,
    extractSelectionFromDocument
  };
  function getCurrentDeepWikiContext() {
    const identity = parseDeepWikiPageIdentity(window.location.href);
    if (!identity) {
      return null;
    }
    return {
      source: "deepwiki",
      sourceThreadId: identity.sourceThreadId,
      title: getDeepWikiTitle(identity.fallbackTitle),
      url: window.location.href
    };
  }
  function findConversationRoot() {
    return document.body;
  }
  function findVisibleMessageContainers(root = document) {
    const contentRoot = findContentRoot(root);
    if (!contentRoot || !isVisibleEnough(contentRoot)) {
      return [];
    }
    const headings = Array.from(contentRoot.querySelectorAll(HEADING_SELECTOR)).filter((heading) => {
      var _a;
      return isVisibleEnough(heading) && Boolean((_a = heading.textContent) == null ? void 0 : _a.trim());
    }).filter((heading) => isLikelyContentHeading(heading, contentRoot)).filter((heading, index, headings2) => headings2.findIndex((candidate) => candidate === heading) === index);
    if (window.location.pathname.startsWith("/search/")) {
      return [contentRoot, ...headings.filter((heading) => heading !== contentRoot)];
    }
    if (headings.length > 0) {
      return headings;
    }
    return [contentRoot];
  }
  function extractMessageFromContainer(container) {
    return buildExtractedMessage(container, extractSectionMarkdown(container), "message");
  }
  function extractSelectionFromDocument(selection) {
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const contentRoot = findSelectionContentRoot(range) ?? findContentRoot();
    if (!contentRoot || !contentRoot.contains(range.commonAncestorContainer)) {
      return null;
    }
    const container = findSectionContainerForNode(range.commonAncestorContainer, contentRoot) ?? contentRoot;
    if (!contentRoot.contains(range.startContainer) || !contentRoot.contains(range.endContainer)) {
      return null;
    }
    return buildExtractedMessage(container, extractSelectionMarkdown(range), "selection");
  }
  function buildExtractedMessage(container, contentMarkdown, captureMode) {
    const context = getCurrentDeepWikiContext();
    const contentText = markdownToPlainText(contentMarkdown);
    if (!context || !contentText) {
      return null;
    }
    const sourceMessageId = getSourceMessageId(container);
    const baseSourceMessageKey = sourceMessageKeyFromParts({
      sourceMessageId,
      role: "assistant",
      contentText
    });
    const contentHash = contentHashFromParts({ contentMarkdown, contentText });
    const sourceMessageKey = captureMode === "selection" ? `selection:${baseSourceMessageKey}:${contentHash}` : baseSourceMessageKey;
    return {
      source: "deepwiki",
      container,
      sourceThreadId: context.sourceThreadId,
      title: context.title,
      sourceMessageId,
      sourceMessageKey,
      contentHash,
      role: "assistant",
      contentMarkdown,
      contentText,
      isStreaming: false
    };
  }
  function findContentRoot(root = document) {
    const searchAnswerRoot = findSearchAnswerRoot(root);
    if (searchAnswerRoot) {
      return searchAnswerRoot;
    }
    let bestCandidate = null;
    let bestScore = 0;
    for (const selector of CONTENT_SELECTORS) {
      const candidates = Array.from(root.querySelectorAll(selector));
      for (const candidate of candidates) {
        const score = scoreContentRootCandidate(candidate);
        if (score > bestScore) {
          bestCandidate = candidate;
          bestScore = score;
        }
      }
    }
    return bestCandidate ?? (hasMeaningfulText(document.body) ? document.body : null);
  }
  function findSearchAnswerRoot(root) {
    if (!window.location.pathname.startsWith("/search/")) {
      return null;
    }
    const headings = Array.from(root.querySelectorAll("h1, h2, h3")).filter((heading) => isVisibleEnough(heading)).filter((heading) => SEARCH_SECTION_HEADING_PATTERN.test(getNormalizedElementText(heading)));
    if (headings.length === 0) {
      return null;
    }
    const firstHeading = headings[0];
    const contentAncestor = findReadableAncestor(firstHeading);
    if (contentAncestor) {
      return contentAncestor;
    }
    return firstHeading.parentElement;
  }
  function findReadableAncestor(element) {
    let current = element.parentElement;
    while (current && current !== document.body) {
      const text = getNormalizedElementText(current);
      const hasReadableBlocks = current.querySelectorAll("p, li, pre, table, h1, h2, h3").length >= 2;
      const hasControls = current.querySelectorAll("textarea, input, button").length > 0;
      if (text.length > 80 && hasReadableBlocks && !hasControls) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }
  function scoreContentRootCandidate(element) {
    if (!isVisibleEnough(element) || !hasMeaningfulText(element)) {
      return 0;
    }
    const textLength = Math.min(getNormalizedElementText(element).length, 5e3);
    const readableBlockCount = element.querySelectorAll("p, li, pre, table, h1, h2, h3").length;
    const formControlCount = element.querySelectorAll("textarea, input, button").length;
    const navigationPenalty = element.matches("nav, header, footer, aside") ? 2e3 : 0;
    return textLength + readableBlockCount * 80 - formControlCount * 120 - navigationPenalty;
  }
  function isLikelyContentHeading(heading, contentRoot) {
    if (contentRoot === document.body && heading.closest("nav, header, footer, aside")) {
      return false;
    }
    if (!window.location.pathname.startsWith("/search/")) {
      return true;
    }
    return SEARCH_SECTION_HEADING_PATTERN.test(getNormalizedElementText(heading));
  }
  function findSelectionContentRoot(range) {
    const element = getElementForNode(range.commonAncestorContainer);
    let current = element;
    while (current && current !== document.body) {
      if (isUsableSelectionRoot(current) && current.contains(range.startContainer) && current.contains(range.endContainer)) {
        return current;
      }
      current = current.parentElement;
    }
    return document.body.contains(range.startContainer) && document.body.contains(range.endContainer) ? document.body : null;
  }
  function isUsableSelectionRoot(element) {
    if (!isVisibleEnough(element) || !hasMeaningfulText(element)) {
      return false;
    }
    if (element.matches("script, style, textarea, input, button, form, nav, header, footer, aside")) {
      return false;
    }
    return true;
  }
  function findSectionContainerForNode(node, contentRoot = findContentRoot()) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!contentRoot || !element || !contentRoot.contains(element)) {
      return null;
    }
    const ownHeading = element.closest(HEADING_SELECTOR);
    if (ownHeading && contentRoot.contains(ownHeading)) {
      return ownHeading;
    }
    let current = element;
    while (current && current !== contentRoot) {
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling instanceof HTMLElement && matchesHeading(sibling)) {
          return sibling;
        }
        const nestedHeadings = Array.from(sibling.querySelectorAll(HEADING_SELECTOR));
        const nestedHeading = nestedHeadings.reverse().find((heading) => isVisibleEnough(heading));
        if (nestedHeading) {
          return nestedHeading;
        }
        sibling = sibling.previousElementSibling;
      }
      current = current.parentElement;
    }
    return null;
  }
  function extractSectionMarkdown(container) {
    var _a;
    const fragment = document.createDocumentFragment();
    if (matchesHeading(container)) {
      collectHeadingSection(container).forEach((node) => {
        fragment.append(node.cloneNode(true));
      });
    } else {
      fragment.append(container.cloneNode(true));
    }
    (_a = fragment.querySelectorAll) == null ? void 0 : _a.call(fragment, OVERLAY_SELECTORS).forEach((element) => element.remove());
    moveDeepWikiSourceReferencesOutOfProse(fragment);
    return cleanDeepWikiMarkdown(extractMarkdownFromNode(fragment));
  }
  function extractSelectionMarkdown(range) {
    const fragment = range.cloneContents();
    moveDeepWikiSourceReferencesOutOfProse(fragment);
    return cleanDeepWikiMarkdown(extractMarkdownFromNode(fragment));
  }
  function moveDeepWikiSourceReferencesOutOfProse(root) {
    var _a;
    (_a = root.querySelectorAll) == null ? void 0 : _a.call(root, "p, li").forEach((block) => {
      if (!(block instanceof HTMLElement)) {
        return;
      }
      const references = [];
      block.querySelectorAll("a").forEach((link) => {
        const label = getNormalizedElementText(link);
        if (!SOURCE_REFERENCE_PATTERN.test(label)) {
          return;
        }
        references.push(label);
        link.remove();
      });
      if (references.length === 0) {
        return;
      }
      appendSourceReferenceBlock(block, references);
    });
  }
  function appendSourceReferenceBlock(block, references) {
    const sources = document.createElement(block.tagName === "LI" ? "div" : "p");
    const label = document.createElement("strong");
    const uniqueReferences = [...new Set(references)];
    label.textContent = "Sources:";
    sources.append(label, document.createTextNode(` ${uniqueReferences.join(", ")}`));
    if (block.tagName === "LI") {
      block.append(sources);
      return;
    }
    block.after(sources);
  }
  function cleanDeepWikiMarkdown(markdown) {
    return markdown.split(/(```[\s\S]*?```)/g).map((part) => part.startsWith("```") ? part : cleanDeepWikiMarkdownText(part)).join("").replace(/\n{3,}/g, "\n\n").trim();
  }
  function cleanDeepWikiMarkdownText(markdown) {
    return markdown.replace(/[ \t]*\n[ \t]*([.,;:!?])/g, "$1").replace(/([^\n])\n(?!\n|#{1,6}\s|- |\d+\. |> |\|)/g, "$1 ").replace(/(\S)[ \t]{2,}(\S)/g, "$1 $2").replace(/[ \t]+([.,;:!?])/g, "$1");
  }
  function collectHeadingSection(heading) {
    const level = getHeadingLevel(heading);
    const nodes = [heading];
    let sibling = heading.nextElementSibling;
    while (sibling instanceof HTMLElement) {
      if (matchesHeading(sibling) && getHeadingLevel(sibling) <= level) {
        break;
      }
      nodes.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    return nodes;
  }
  function getSourceMessageId(container) {
    const identity = parseDeepWikiPageIdentity(window.location.href);
    if (!identity) {
      return null;
    }
    const route = identity.route || "overview";
    const headingId = getHeadingId(container);
    return headingId ? `${identity.sourceThreadId}:${route}#${headingId}` : `${identity.sourceThreadId}:${route}`;
  }
  function getHeadingId(container) {
    const rawId = container.id || container.textContent;
    const value = rawId == null ? void 0 : rawId.trim();
    if (!value || value === "true") {
      return null;
    }
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }
  function getDeepWikiTitle(fallbackTitle) {
    var _a, _b;
    const heading = (_a = findContentRoot()) == null ? void 0 : _a.querySelector("h1, h2");
    const headingText = (_b = heading == null ? void 0 : heading.textContent) == null ? void 0 : _b.trim();
    const documentTitle = document.title.replace(/\s*\|\s*DeepWiki\s*$/i, "").trim();
    return headingText || documentTitle || fallbackTitle;
  }
  function matchesHeading(element) {
    return element.matches(HEADING_SELECTOR);
  }
  function getHeadingLevel(element) {
    if (/^H[1-6]$/.test(element.tagName)) {
      return Number(element.tagName.slice(1));
    }
    return 2;
  }
  function hasMeaningfulText(element) {
    return Boolean(getNormalizedElementText(element));
  }
  function getElementForNode(node) {
    if (node instanceof HTMLElement) {
      return node;
    }
    return node.parentElement;
  }
  function getNormalizedElementText(element) {
    var _a;
    return ((_a = element.textContent) == null ? void 0 : _a.replace(/\s+/g, " ").trim()) ?? "";
  }
  function isVisibleEnough(element) {
    if (element.closest("[hidden], [aria-hidden='true']")) {
      return false;
    }
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }
  const AI_OPERATIONS_BLOCK_LANGUAGE = "cgpt-notes-ops";
  const MAX_AI_OPERATION_COUNT = 30;
  const MAX_AI_OPERATION_MARKDOWN_LENGTH = 8e4;
  function parseAiOperationPackagesFromMarkdown(markdown, context) {
    return extractAiOperationBlocks(markdown).map((block) => parseAiOperationPackageText(block, context)).filter((item) => item !== null);
  }
  function parseAiOperationPackageText(text, context) {
    try {
      return normalizeAiOperationPackage(JSON.parse(text), context);
    } catch {
      return null;
    }
  }
  function extractAiOperationBlocks(markdown) {
    const blocks = [];
    const pattern = /```([^\n`]*)\n([\s\S]*?)```/g;
    let match = pattern.exec(markdown);
    while (match) {
      if (match[1].trim().toLowerCase() === AI_OPERATIONS_BLOCK_LANGUAGE) {
        blocks.push(match[2].trim());
      }
      match = pattern.exec(markdown);
    }
    return blocks;
  }
  function normalizeAiOperationPackage(value, context) {
    if (!isRecord(value)) {
      return null;
    }
    const operations = Array.isArray(value.operations) ? value.operations.map(normalizeAiOperation).filter((operation) => Boolean(operation)) : [];
    if (operations.length === 0 || operations.length > MAX_AI_OPERATION_COUNT) {
      return null;
    }
    return {
      protocolVersion: 1,
      requestId: typeof value.requestId === "string" && value.requestId.trim() ? value.requestId.trim() : createId("ai-request"),
      sourceThreadId: getString(value.sourceThreadId) ?? context.sourceThreadId,
      sourceTitle: getString(value.sourceTitle) ?? context.sourceTitle,
      operations
    };
  }
  function normalizeAiOperation(value) {
    if (!isRecord(value) || typeof value.type !== "string") {
      return null;
    }
    switch (value.type) {
      case "create_note": {
        const threadId = getString(value.threadId);
        const contentMarkdown = getMarkdown(value.contentMarkdown);
        if (!threadId || contentMarkdown === null) {
          return null;
        }
        return {
          type: "create_note",
          threadId,
          contentMarkdown,
          title: getNullableString(value.title),
          ...value.afterMessageId === void 0 ? {} : { afterMessageId: getNullableString(value.afterMessageId) }
        };
      }
      case "update_note": {
        const threadId = getString(value.threadId);
        const messageId = getString(value.messageId);
        const contentMarkdown = getMarkdown(value.contentMarkdown);
        return threadId && messageId && contentMarkdown !== null ? {
          type: "update_note",
          threadId,
          messageId,
          contentMarkdown,
          title: getNullableString(value.title),
          expectedContentHash: getNullableString(value.expectedContentHash)
        } : null;
      }
      case "delete_note": {
        const threadId = getString(value.threadId);
        const messageId = getString(value.messageId);
        return threadId && messageId ? {
          type: "delete_note",
          threadId,
          messageId,
          expectedContentHash: getNullableString(value.expectedContentHash)
        } : null;
      }
      case "move_note": {
        const threadId = getString(value.threadId);
        const messageId = getString(value.messageId);
        const afterMessageId = getNullableString(value.afterMessageId);
        return threadId && messageId ? { type: "move_note", threadId, messageId, afterMessageId } : null;
      }
      case "merge_notes": {
        const threadId = getString(value.threadId);
        const messageIds = getStringArray(value.messageIds);
        return threadId && messageIds.length >= 2 ? { type: "merge_notes", threadId, messageIds } : null;
      }
      case "create_notebook": {
        const title = getString(value.title);
        return title ? { type: "create_notebook", title, folderId: getNullableString(value.folderId) } : null;
      }
      case "rename_notebook": {
        const threadId = getString(value.threadId);
        const title = getString(value.title);
        return threadId && title ? { type: "rename_notebook", threadId, title } : null;
      }
      case "delete_notebook": {
        const threadId = getString(value.threadId);
        return threadId ? { type: "delete_notebook", threadId } : null;
      }
      case "move_notebook_to_folder": {
        const threadId = getString(value.threadId);
        return threadId ? { type: "move_notebook_to_folder", threadId, folderId: getNullableString(value.folderId) } : null;
      }
      case "create_folder": {
        const title = getString(value.title);
        return title ? { type: "create_folder", title } : null;
      }
      case "rename_folder": {
        const folderId = getString(value.folderId);
        const title = getString(value.title);
        return folderId && title ? { type: "rename_folder", folderId, title } : null;
      }
      default:
        return null;
    }
  }
  function normalizeMarkdown(markdown) {
    return markdown.replace(/\r\n/g, "\n").trim();
  }
  function getMarkdown(value) {
    if (typeof value !== "string" || value.length > MAX_AI_OPERATION_MARKDOWN_LENGTH) {
      return null;
    }
    return normalizeMarkdown(value);
  }
  function getString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }
  function getNullableString(value) {
    return value === null || value === void 0 ? null : getString(value);
  }
  function getStringArray(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
  }
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  const BOUND_ATTRIBUTE = "data-cgpt-notes-bound";
  const ACTION_ATTRIBUTE = "data-cgpt-notes-action";
  const OVERLAY_CLASS = "cgpt-notes-capture";
  const BUTTON_CLASS = "cgpt-notes-save-button";
  const BUTTON_ICON_CLASS = "cgpt-notes-save-button-icon";
  const AI_OPS_BUTTON_CLASS = "cgpt-notes-ai-ops-button";
  const SELECTION_POPOVER_CLASS = "cgpt-notes-selection-popover";
  const AI_OPS_LABEL = "Review note changes";
  function startMessageCaptureOverlay(adapter) {
    const root = adapter.findConversationRoot();
    const selectionButton = createSelectionButton(adapter);
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
        updateSelectionButton(selectionButton, adapter);
      }, 80);
    }
    function scan() {
      if (stopped) {
        return;
      }
      const containers = adapter.findVisibleMessageContainers(root);
      containers.forEach((container) => {
        if (!container.hasAttribute(BOUND_ATTRIBUTE) || !getMessageButton(container) || hasAiOperationPackage(container, adapter) && !getAiOperationsButton(container)) {
          attachButton(container, adapter);
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
      if (action !== "export-message" && action !== "export-selection" && action !== "review-ai-ops") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (button.disabled) {
        return;
      }
      if (action === "export-selection") {
        void saveSelectedMessage(button, adapter);
        return;
      }
      const container = button.closest(`[${BOUND_ATTRIBUTE}]`);
      if (!container) {
        setButtonError(button, adapter);
        return;
      }
      if (action === "review-ai-ops") {
        void reviewAiOperations(container, button, adapter);
        return;
      }
      void saveContainerMessage(container, button, adapter);
    }
  }
  function createSelectionButton(adapter) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${BUTTON_CLASS} ${SELECTION_POPOVER_CLASS}`;
    setButtonContent(button, adapter);
    button.title = adapter.labels.exportSelection;
    button.setAttribute("aria-label", adapter.labels.exportSelection);
    button.setAttribute(ACTION_ATTRIBUTE, "export-selection");
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    document.body.append(button);
    hideSelectionButton(button, adapter);
    return button;
  }
  function attachButton(container, adapter) {
    container.querySelectorAll(`.${OVERLAY_CLASS}`).forEach((element) => element.remove());
    const wrapper = document.createElement("span");
    const button = document.createElement("button");
    wrapper.className = OVERLAY_CLASS;
    button.type = "button";
    button.className = BUTTON_CLASS;
    setButtonContent(button, adapter);
    button.title = adapter.labels.exportMessage;
    button.setAttribute("aria-label", adapter.labels.exportMessage);
    button.setAttribute(ACTION_ATTRIBUTE, "export-message");
    wrapper.append(button);
    const aiOpsButton = createAiOperationsButton(container, adapter);
    if (aiOpsButton) {
      wrapper.append(aiOpsButton);
    }
    container.append(wrapper);
    container.setAttribute(BOUND_ATTRIBUTE, "true");
  }
  function createAiOperationsButton(container, adapter) {
    if (!adapter.supportsAiOperations || !hasAiOperationPackage(container, adapter)) {
      return null;
    }
    const extracted = adapter.extractMessageFromContainer(container);
    if (!extracted || extracted.role !== "assistant") {
      return null;
    }
    const packages = parseAiOperationPackagesFromMarkdown(extracted.contentMarkdown, {
      sourceThreadId: extracted.sourceThreadId,
      sourceTitle: extracted.title
    });
    if (packages.length === 0) {
      return null;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = `${BUTTON_CLASS} ${AI_OPS_BUTTON_CLASS}`;
    button.textContent = AI_OPS_LABEL;
    button.title = "Review ChatGPT note changes";
    button.setAttribute("aria-label", "Review ChatGPT note changes");
    button.setAttribute(ACTION_ATTRIBUTE, "review-ai-ops");
    return button;
  }
  function hasAiOperationPackage(container, adapter) {
    if (!adapter.supportsAiOperations) {
      return false;
    }
    const extracted = adapter.extractMessageFromContainer(container);
    if (!extracted || extracted.role !== "assistant") {
      return false;
    }
    return parseAiOperationPackagesFromMarkdown(extracted.contentMarkdown, {
      sourceThreadId: extracted.sourceThreadId,
      sourceTitle: extracted.title
    }).length > 0;
  }
  async function saveContainerMessage(container, button, adapter) {
    const extracted = adapter.extractMessageFromContainer(container);
    if (!extracted) {
      setButtonError(button, adapter);
      return;
    }
    button.disabled = true;
    button.classList.remove("has-error");
    setButtonContent(button, adapter);
    let exported = false;
    try {
      await sendRuntimeMessage({
        type: "SAVE_CHATGPT_MESSAGE",
        payload: {
          sourceThreadId: extracted.sourceThreadId,
          source: extracted.source,
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
      setButtonError(button, adapter);
    } finally {
      button.disabled = false;
      if (exported) {
        resetExportButton(button, adapter);
      }
    }
  }
  async function saveSelectedMessage(button, adapter) {
    const extracted = adapter.extractSelectionFromDocument(window.getSelection());
    if (!extracted) {
      hideSelectionButton(button, adapter);
      return;
    }
    button.disabled = true;
    button.classList.remove("has-error");
    setButtonContent(button, adapter);
    let exported = false;
    try {
      await sendRuntimeMessage({
        type: "SAVE_CHATGPT_MESSAGE",
        payload: {
          sourceThreadId: extracted.sourceThreadId,
          source: extracted.source,
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
      window.setTimeout(() => hideSelectionButton(button, adapter), 900);
    } catch {
      setButtonError(button, adapter);
    } finally {
      button.disabled = false;
      if (exported) {
        resetExportButton(button, adapter);
      }
    }
  }
  async function reviewAiOperations(container, button, adapter) {
    const extracted = adapter.extractMessageFromContainer(container);
    if (!extracted) {
      setButtonError(button, adapter);
      return;
    }
    const [operationPackage] = parseAiOperationPackagesFromMarkdown(extracted.contentMarkdown, {
      sourceThreadId: extracted.sourceThreadId,
      sourceTitle: extracted.title
    });
    if (!operationPackage) {
      setButtonError(button, adapter);
      return;
    }
    button.disabled = true;
    button.classList.remove("has-error");
    let queued = false;
    try {
      const response = await sendRuntimeMessage({
        type: "SUBMIT_AI_OPERATION_PACKAGE",
        payload: operationPackage
      });
      queued = response.queued;
      if (!response.queued) {
        setButtonError(button, adapter);
      }
    } catch {
      setButtonError(button, adapter);
    } finally {
      button.disabled = false;
      if (queued) {
        button.classList.add("is-saved");
      }
    }
  }
  function updateSelectionButton(button, adapter) {
    const selection = window.getSelection();
    const extracted = adapter.extractSelectionFromDocument(selection);
    if (!selection || !extracted) {
      hideSelectionButton(button, adapter);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = getUsefulRangeRect(range);
    if (!rect) {
      hideSelectionButton(button, adapter);
      return;
    }
    button.classList.remove("is-saved", "has-error");
    button.disabled = false;
    setButtonContent(button, adapter);
    button.style.left = `${Math.min(window.innerWidth - 16, Math.max(8, rect.left + rect.width / 2))}px`;
    button.style.top = `${Math.max(8, rect.top - 42)}px`;
    button.style.display = "inline-flex";
  }
  function getMessageButton(container) {
    return container.querySelector(`.${BUTTON_CLASS}[${ACTION_ATTRIBUTE}="export-message"]`);
  }
  function getAiOperationsButton(container) {
    return container.querySelector(`.${BUTTON_CLASS}[${ACTION_ATTRIBUTE}="review-ai-ops"]`);
  }
  function getUsefulRangeRect(range) {
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    if (rects[0]) {
      return rects[0];
    }
    const fallback = range.getBoundingClientRect();
    return fallback.width > 0 && fallback.height > 0 ? fallback : null;
  }
  function hideSelectionButton(button, adapter) {
    button.style.display = "none";
    button.classList.remove("is-saved", "has-error");
    button.disabled = false;
    button.textContent = adapter.labels.exportMessage;
  }
  function resetExportButton(button, adapter) {
    button.classList.remove("is-saved", "has-error");
    setButtonContent(button, adapter);
  }
  function setButtonError(button, adapter) {
    button.classList.add("has-error");
    button.classList.remove("is-saved");
    setButtonContent(button, adapter);
    button.disabled = false;
  }
  function setButtonContent(button, adapter) {
    if (button.getAttribute(ACTION_ATTRIBUTE) === "review-ai-ops") {
      button.textContent = AI_OPS_LABEL;
      return;
    }
    button.replaceChildren();
    const icon = document.createElement("img");
    icon.className = BUTTON_ICON_CLASS;
    icon.src = browser.runtime.getURL("icon.png");
    icon.alt = "";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = adapter.labels.exportMessage;
    button.append(icon, label);
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
  let lastSource = null;
  if (!window.__chatGptNotesContentScriptStarted) {
    window.__chatGptNotesContentScriptStarted = true;
    bootstrap();
  }
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
    const adapter = getCurrentAdapter();
    const context = (adapter == null ? void 0 : adapter.getCurrentContext()) ?? null;
    if (!context) {
      controller == null ? void 0 : controller.stop();
      controller = null;
      lastConversationId = null;
      lastSource = null;
      return;
    }
    if (context.source === lastSource && context.sourceThreadId === lastConversationId) {
      controller == null ? void 0 : controller.scan();
      return;
    }
    controller == null ? void 0 : controller.stop();
    lastSource = context.source;
    lastConversationId = context.sourceThreadId;
    controller = startMessageCaptureOverlay(adapter);
    void sendRuntimeMessage({
      type: "CHATGPT_THREAD_CHANGED",
      payload: context
    });
  }
  function getCurrentAdapter() {
    const chatGptContext = chatGptCaptureAdapter.getCurrentContext();
    if (chatGptContext) {
      return chatGptCaptureAdapter;
    }
    const deepWikiContext = deepWikiCaptureAdapter.getCurrentContext();
    return deepWikiContext ? deepWikiCaptureAdapter : null;
  }
})();
//# sourceMappingURL=content.js.map
