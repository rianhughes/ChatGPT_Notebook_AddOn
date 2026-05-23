var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function() {
  "use strict";
  var _a;
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
  function isCapturableSourceUrl(input) {
    return isChatGptUrl(input) || parseDeepWikiPageIdentity(input) !== null;
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
  const CHATGPT_MATCH_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];
  const CAPTURABLE_MATCH_PATTERNS = [...CHATGPT_MATCH_PATTERNS, "https://deepwiki.com/*"];
  async function getActiveChatGptContext() {
    var _a2;
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!(tab == null ? void 0 : tab.url)) {
      return null;
    }
    const sourceThreadId = parseChatGptConversationId(tab.url);
    if (sourceThreadId) {
      return {
        source: "chatgpt",
        sourceThreadId,
        title: tab.title || "Untitled ChatGPT conversation",
        url: tab.url
      };
    }
    const deepWikiIdentity = parseDeepWikiPageIdentity(tab.url);
    if (!deepWikiIdentity) {
      return null;
    }
    return {
      source: "deepwiki",
      sourceThreadId: deepWikiIdentity.sourceThreadId,
      title: ((_a2 = tab.title) == null ? void 0 : _a2.replace(/\s*\|\s*DeepWiki\s*$/i, "").trim()) || deepWikiIdentity.fallbackTitle,
      url: tab.url
    };
  }
  async function ensureActiveCapturableContentScript() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab) {
      return;
    }
    await ensureChatGptContentScript(tab);
  }
  async function broadcastToChatGptTabs(message) {
    const tabs = await browser.tabs.query({ url: CAPTURABLE_MATCH_PATTERNS });
    await Promise.all(
      tabs.map(async (tab) => {
        if (!tab.id) {
          return;
        }
        try {
          await browser.tabs.sendMessage(tab.id, message);
        } catch {
        }
      })
    );
  }
  async function sendMessageToActiveChatGptTab(message) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!(tab == null ? void 0 : tab.id) || !tab.url || !isChatGptUrl(tab.url)) {
      return null;
    }
    try {
      return await browser.tabs.sendMessage(tab.id, message);
    } catch {
      return null;
    }
  }
  async function ensureChatGptContentScript(tab) {
    var _a2;
    if (!tab.id || !tab.url || !isCapturableSourceUrl(tab.url)) {
      return;
    }
    const scripting = browser.scripting;
    if (!(scripting == null ? void 0 : scripting.executeScript)) {
      return;
    }
    try {
      await ((_a2 = scripting.insertCSS) == null ? void 0 : _a2.call(scripting, {
        target: { tabId: tab.id },
        files: ["injected.css"]
      }));
    } catch {
    }
    await scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  }
  function isExtensionMessage(value) {
    if (!isRecord(value) || typeof value.type !== "string" || !isRecord(value.payload)) {
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
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  var dexie_min = { exports: {} };
  (function(module, exports) {
    ((e, t) => {
      module.exports = t();
    })(commonjsGlobal, function() {
      var B = function(e2, t2) {
        return (B = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? function(e3, t3) {
          e3.__proto__ = t3;
        } : function(e3, t3) {
          for (var n2 in t3) Object.prototype.hasOwnProperty.call(t3, n2) && (e3[n2] = t3[n2]);
        }))(e2, t2);
      };
      var _ = function() {
        return (_ = Object.assign || function(e2) {
          for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var o2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, o2) && (e2[o2] = t2[o2]);
          return e2;
        }).apply(this, arguments);
      };
      function R(e2, t2, n2) {
        for (var r2, o2 = 0, i2 = t2.length; o2 < i2; o2++) !r2 && o2 in t2 || ((r2 = r2 || Array.prototype.slice.call(t2, 0, o2))[o2] = t2[o2]);
        return e2.concat(r2 || Array.prototype.slice.call(t2));
      }
      var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : commonjsGlobal, O = Object.keys, x = Array.isArray;
      function a(t2, n2) {
        return "object" == typeof n2 && O(n2).forEach(function(e2) {
          t2[e2] = n2[e2];
        }), t2;
      }
      "undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
      var F = Object.getPrototypeOf, N = {}.hasOwnProperty;
      function m(e2, t2) {
        return N.call(e2, t2);
      }
      function M(t2, n2) {
        "function" == typeof n2 && (n2 = n2(F(t2))), ("undefined" == typeof Reflect ? O : Reflect.ownKeys)(n2).forEach(function(e2) {
          u(t2, e2, n2[e2]);
        });
      }
      var L = Object.defineProperty;
      function u(e2, t2, n2, r2) {
        L(e2, t2, a(n2 && m(n2, "get") && "function" == typeof n2.get ? { get: n2.get, set: n2.set, configurable: true } : { value: n2, configurable: true, writable: true }, r2));
      }
      function U(t2) {
        return { from: function(e2) {
          return t2.prototype = Object.create(e2.prototype), u(t2.prototype, "constructor", t2), { extend: M.bind(null, t2.prototype) };
        } };
      }
      var z = Object.getOwnPropertyDescriptor;
      var V = [].slice;
      function W(e2, t2, n2) {
        return V.call(e2, t2, n2);
      }
      function Y(e2, t2) {
        return t2(e2);
      }
      function $(e2) {
        if (!e2) throw new Error("Assertion Failed");
      }
      function Q(e2) {
        f.setImmediate ? setImmediate(e2) : setTimeout(e2, 0);
      }
      function c(e2, t2) {
        if ("string" == typeof t2 && m(e2, t2)) return e2[t2];
        if (!t2) return e2;
        if ("string" != typeof t2) {
          for (var n2 = [], r2 = 0, o2 = t2.length; r2 < o2; ++r2) {
            var i2 = c(e2, t2[r2]);
            n2.push(i2);
          }
          return n2;
        }
        var a2, u2 = t2.indexOf(".");
        return -1 === u2 || null == (a2 = e2[t2.substr(0, u2)]) ? void 0 : c(a2, t2.substr(u2 + 1));
      }
      function b(e2, t2, n2) {
        if (e2 && void 0 !== t2 && !("isFrozen" in Object && Object.isFrozen(e2))) if ("string" != typeof t2 && "length" in t2) {
          $("string" != typeof n2 && "length" in n2);
          for (var r2 = 0, o2 = t2.length; r2 < o2; ++r2) b(e2, t2[r2], n2[r2]);
        } else {
          var i2, a2, u2 = t2.indexOf(".");
          -1 !== u2 ? (i2 = t2.substr(0, u2), "" === (u2 = t2.substr(u2 + 1)) ? void 0 === n2 ? x(e2) && !isNaN(parseInt(i2)) ? e2.splice(i2, 1) : delete e2[i2] : e2[i2] = n2 : b(a2 = (a2 = e2[i2]) && m(e2, i2) ? a2 : e2[i2] = {}, u2, n2)) : void 0 === n2 ? x(e2) && !isNaN(parseInt(t2)) ? e2.splice(t2, 1) : delete e2[t2] : e2[t2] = n2;
        }
      }
      function G(e2) {
        var t2, n2 = {};
        for (t2 in e2) m(e2, t2) && (n2[t2] = e2[t2]);
        return n2;
      }
      var X = [].concat;
      function H(e2) {
        return X.apply([], e2);
      }
      var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(H([8, 16, 32, 64].map(function(t2) {
        return ["Int", "Uint", "Float"].map(function(e2) {
          return e2 + t2 + "Array";
        });
      }))).filter(function(e2) {
        return f[e2];
      }), J = new Set(e.map(function(e2) {
        return f[e2];
      }));
      var Z = null;
      function ee(e2) {
        Z = /* @__PURE__ */ new WeakMap();
        e2 = function e3(t2) {
          if (!t2 || "object" != typeof t2) return t2;
          var n2 = Z.get(t2);
          if (n2) return n2;
          if (x(t2)) {
            n2 = [], Z.set(t2, n2);
            for (var r2 = 0, o2 = t2.length; r2 < o2; ++r2) n2.push(e3(t2[r2]));
          } else if (J.has(t2.constructor)) n2 = t2;
          else {
            var i2, a2 = F(t2);
            for (i2 in n2 = a2 === Object.prototype ? {} : Object.create(a2), Z.set(t2, n2), t2) m(t2, i2) && (n2[i2] = e3(t2[i2]));
          }
          return n2;
        }(e2);
        return Z = null, e2;
      }
      var te = {}.toString;
      function ne(e2) {
        return te.call(e2).slice(8, -1);
      }
      var re = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", oe = "symbol" == typeof re ? function(e2) {
        var t2;
        return null != e2 && (t2 = e2[re]) && t2.apply(e2);
      } : function() {
        return null;
      };
      function ie(e2, t2) {
        t2 = e2.indexOf(t2);
        0 <= t2 && e2.splice(t2, 1);
      }
      var ae = {};
      function n(e2) {
        var t2, n2, r2, o2;
        if (1 === arguments.length) {
          if (x(e2)) return e2.slice();
          if (this === ae && "string" == typeof e2) return [e2];
          if (o2 = oe(e2)) for (n2 = []; !(r2 = o2.next()).done; ) n2.push(r2.value);
          else {
            if (null == e2) return [e2];
            if ("number" != typeof (t2 = e2.length)) return [e2];
            for (n2 = new Array(t2); t2--; ) n2[t2] = e2[t2];
          }
        } else for (t2 = arguments.length, n2 = new Array(t2); t2--; ) n2[t2] = arguments[t2];
        return n2;
      }
      var ue = "undefined" != typeof Symbol ? function(e2) {
        return "AsyncFunction" === e2[Symbol.toStringTag];
      } : function() {
        return false;
      }, e = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"], t = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"].concat(e), se = { VersionChanged: "Database version changed by other database connection", DatabaseClosed: "Database has been closed", Abort: "Transaction aborted", TransactionInactive: "Transaction has already completed or failed", MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb" };
      function ce(e2, t2) {
        this.name = e2, this.message = t2;
      }
      function le(e2, t2) {
        return e2 + ". Errors: " + Object.keys(t2).map(function(e3) {
          return t2[e3].toString();
        }).filter(function(e3, t3, n2) {
          return n2.indexOf(e3) === t3;
        }).join("\n");
      }
      function fe(e2, t2, n2, r2) {
        this.failures = t2, this.failedKeys = r2, this.successCount = n2, this.message = le(e2, t2);
      }
      function he(e2, t2) {
        this.name = "BulkError", this.failures = Object.keys(t2).map(function(e3) {
          return t2[e3];
        }), this.failuresByPos = t2, this.message = le(e2, this.failures);
      }
      U(ce).from(Error).extend({ toString: function() {
        return this.name + ": " + this.message;
      } }), U(fe).from(ce), U(he).from(ce);
      var de = t.reduce(function(e2, t2) {
        return e2[t2] = t2 + "Error", e2;
      }, {}), pe = ce, k = t.reduce(function(e2, n2) {
        var r2 = n2 + "Error";
        function t2(e3, t3) {
          this.name = r2, e3 ? "string" == typeof e3 ? (this.message = "".concat(e3).concat(t3 ? "\n " + t3 : ""), this.inner = t3 || null) : "object" == typeof e3 && (this.message = "".concat(e3.name, " ").concat(e3.message), this.inner = e3) : (this.message = se[n2] || r2, this.inner = null);
        }
        return U(t2).from(pe), e2[n2] = t2, e2;
      }, {}), ye = (k.Syntax = SyntaxError, k.Type = TypeError, k.Range = RangeError, e.reduce(function(e2, t2) {
        return e2[t2 + "Error"] = k[t2], e2;
      }, {}));
      e = t.reduce(function(e2, t2) {
        return -1 === ["Syntax", "Type", "Range"].indexOf(t2) && (e2[t2 + "Error"] = k[t2]), e2;
      }, {});
      function g() {
      }
      function ve(e2) {
        return e2;
      }
      function me(t2, n2) {
        return null == t2 || t2 === ve ? n2 : function(e2) {
          return n2(t2(e2));
        };
      }
      function be(e2, t2) {
        return function() {
          e2.apply(this, arguments), t2.apply(this, arguments);
        };
      }
      function ge(o2, i2) {
        return o2 === g ? i2 : function() {
          var e2 = o2.apply(this, arguments), t2 = (void 0 !== e2 && (arguments[0] = e2), this.onsuccess), n2 = this.onerror, r2 = (this.onsuccess = null, this.onerror = null, i2.apply(this, arguments));
          return t2 && (this.onsuccess = this.onsuccess ? be(t2, this.onsuccess) : t2), n2 && (this.onerror = this.onerror ? be(n2, this.onerror) : n2), void 0 !== r2 ? r2 : e2;
        };
      }
      function we(n2, r2) {
        return n2 === g ? r2 : function() {
          n2.apply(this, arguments);
          var e2 = this.onsuccess, t2 = this.onerror;
          this.onsuccess = this.onerror = null, r2.apply(this, arguments), e2 && (this.onsuccess = this.onsuccess ? be(e2, this.onsuccess) : e2), t2 && (this.onerror = this.onerror ? be(t2, this.onerror) : t2);
        };
      }
      function _e(o2, i2) {
        return o2 === g ? i2 : function(e2) {
          var t2 = o2.apply(this, arguments), e2 = (a(e2, t2), this.onsuccess), n2 = this.onerror, r2 = (this.onsuccess = null, this.onerror = null, i2.apply(this, arguments));
          return e2 && (this.onsuccess = this.onsuccess ? be(e2, this.onsuccess) : e2), n2 && (this.onerror = this.onerror ? be(n2, this.onerror) : n2), void 0 === t2 ? void 0 === r2 ? void 0 : r2 : a(t2, r2);
        };
      }
      function xe(e2, t2) {
        return e2 === g ? t2 : function() {
          return false !== t2.apply(this, arguments) && e2.apply(this, arguments);
        };
      }
      function ke(o2, i2) {
        return o2 === g ? i2 : function() {
          var e2 = o2.apply(this, arguments);
          if (e2 && "function" == typeof e2.then) {
            for (var t2 = this, n2 = arguments.length, r2 = new Array(n2); n2--; ) r2[n2] = arguments[n2];
            return e2.then(function() {
              return i2.apply(t2, r2);
            });
          }
          return i2.apply(this, arguments);
        };
      }
      e.ModifyError = fe, e.DexieError = ce, e.BulkError = he;
      var l = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
      function Oe(e2) {
        l = e2;
      }
      var Pe = {}, Ke = 100, Ee = "undefined" == typeof Promise ? [] : (t = Promise.resolve(), "undefined" != typeof crypto && crypto.subtle ? [Ee = crypto.subtle.digest("SHA-512", new Uint8Array([0])), F(Ee), t] : [t, F(t), t]), t = Ee[0], Se = Ee[1], Se = Se && Se.then, Ae = t && t.constructor, Ce = !!Ee[2];
      var je = function(e2, t2) {
        Re.push([e2, t2]), Ie && (queueMicrotask(Ye), Ie = false);
      }, Te = true, Ie = true, qe = [], De = [], Be = ve, s = { id: "global", global: true, ref: 0, unhandleds: [], onunhandled: g, pgp: false, env: {}, finalize: g }, P = s, Re = [], Fe = 0, Ne = [];
      function K(e2) {
        if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
        this._listeners = [], this._lib = false;
        var t2 = this._PSD = P;
        if ("function" != typeof e2) {
          if (e2 !== Pe) throw new TypeError("Not a function");
          this._state = arguments[1], this._value = arguments[2], false === this._state && Ue(this, this._value);
        } else this._state = null, this._value = null, ++t2.ref, function t3(r2, e3) {
          try {
            e3(function(n2) {
              if (null === r2._state) {
                if (n2 === r2) throw new TypeError("A promise cannot be resolved with itself.");
                var e4 = r2._lib && $e();
                n2 && "function" == typeof n2.then ? t3(r2, function(e5, t4) {
                  n2 instanceof K ? n2._then(e5, t4) : n2.then(e5, t4);
                }) : (r2._state = true, r2._value = n2, ze(r2)), e4 && Qe();
              }
            }, Ue.bind(null, r2));
          } catch (e4) {
            Ue(r2, e4);
          }
        }(this, e2);
      }
      var Me = { get: function() {
        var u2 = P, t2 = et;
        function e2(n2, r2) {
          var o2 = this, i2 = !u2.global && (u2 !== P || t2 !== et), a2 = i2 && !w(), e3 = new K(function(e4, t3) {
            Ve(o2, new Le(ut(n2, u2, i2, a2), ut(r2, u2, i2, a2), e4, t3, u2));
          });
          return this._consoleTask && (e3._consoleTask = this._consoleTask), e3;
        }
        return e2.prototype = Pe, e2;
      }, set: function(e2) {
        u(this, "then", e2 && e2.prototype === Pe ? Me : { get: function() {
          return e2;
        }, set: Me.set });
      } };
      function Le(e2, t2, n2, r2, o2) {
        this.onFulfilled = "function" == typeof e2 ? e2 : null, this.onRejected = "function" == typeof t2 ? t2 : null, this.resolve = n2, this.reject = r2, this.psd = o2;
      }
      function Ue(e2, t2) {
        var n2, r2;
        De.push(t2), null === e2._state && (n2 = e2._lib && $e(), t2 = Be(t2), e2._state = false, e2._value = t2, r2 = e2, qe.some(function(e3) {
          return e3._value === r2._value;
        }) || qe.push(r2), ze(e2), n2) && Qe();
      }
      function ze(e2) {
        var t2 = e2._listeners;
        e2._listeners = [];
        for (var n2 = 0, r2 = t2.length; n2 < r2; ++n2) Ve(e2, t2[n2]);
        var o2 = e2._PSD;
        --o2.ref || o2.finalize(), 0 === Fe && (++Fe, je(function() {
          0 == --Fe && Ge();
        }, []));
      }
      function Ve(e2, t2) {
        if (null === e2._state) e2._listeners.push(t2);
        else {
          var n2 = e2._state ? t2.onFulfilled : t2.onRejected;
          if (null === n2) return (e2._state ? t2.resolve : t2.reject)(e2._value);
          ++t2.psd.ref, ++Fe, je(We, [n2, e2, t2]);
        }
      }
      function We(e2, t2, n2) {
        try {
          var r2, o2 = t2._value;
          !t2._state && De.length && (De = []), r2 = l && t2._consoleTask ? t2._consoleTask.run(function() {
            return e2(o2);
          }) : e2(o2), t2._state || -1 !== De.indexOf(o2) || ((e3) => {
            for (var t3 = qe.length; t3; ) if (qe[--t3]._value === e3._value) return qe.splice(t3, 1);
          })(t2), n2.resolve(r2);
        } catch (e3) {
          n2.reject(e3);
        } finally {
          0 == --Fe && Ge(), --n2.psd.ref || n2.psd.finalize();
        }
      }
      function Ye() {
        at(s, function() {
          $e() && Qe();
        });
      }
      function $e() {
        var e2 = Te;
        return Ie = Te = false, e2;
      }
      function Qe() {
        var e2, t2, n2;
        do {
          for (; 0 < Re.length; ) for (e2 = Re, Re = [], n2 = e2.length, t2 = 0; t2 < n2; ++t2) {
            var r2 = e2[t2];
            r2[0].apply(null, r2[1]);
          }
        } while (0 < Re.length);
        Ie = Te = true;
      }
      function Ge() {
        for (var e2 = qe, t2 = (qe = [], e2.forEach(function(e3) {
          e3._PSD.onunhandled.call(null, e3._value, e3);
        }), Ne.slice(0)), n2 = t2.length; n2; ) t2[--n2]();
      }
      function Xe(e2) {
        return new K(Pe, false, e2);
      }
      function E(n2, r2) {
        var o2 = P;
        return function() {
          var e2 = $e(), t2 = P;
          try {
            return h(o2, true), n2.apply(this, arguments);
          } catch (e3) {
            r2 && r2(e3);
          } finally {
            h(t2, false), e2 && Qe();
          }
        };
      }
      M(K.prototype, { then: Me, _then: function(e2, t2) {
        Ve(this, new Le(null, null, e2, t2, P));
      }, catch: function(e2) {
        var t2, n2;
        return 1 === arguments.length ? this.then(null, e2) : (t2 = e2, n2 = arguments[1], "function" == typeof t2 ? this.then(null, function(e3) {
          return (e3 instanceof t2 ? n2 : Xe)(e3);
        }) : this.then(null, function(e3) {
          return (e3 && e3.name === t2 ? n2 : Xe)(e3);
        }));
      }, finally: function(t2) {
        return this.then(function(e2) {
          return K.resolve(t2()).then(function() {
            return e2;
          });
        }, function(e2) {
          return K.resolve(t2()).then(function() {
            return Xe(e2);
          });
        });
      }, timeout: function(r2, o2) {
        var i2 = this;
        return r2 < 1 / 0 ? new K(function(e2, t2) {
          var n2 = setTimeout(function() {
            return t2(new k.Timeout(o2));
          }, r2);
          i2.then(e2, t2).finally(clearTimeout.bind(null, n2));
        }) : this;
      } }), "undefined" != typeof Symbol && Symbol.toStringTag && u(K.prototype, Symbol.toStringTag, "Dexie.Promise"), s.env = it(), M(K, { all: function() {
        var i2 = n.apply(null, arguments).map(rt);
        return new K(function(n2, r2) {
          0 === i2.length && n2([]);
          var o2 = i2.length;
          i2.forEach(function(e2, t2) {
            return K.resolve(e2).then(function(e3) {
              i2[t2] = e3, --o2 || n2(i2);
            }, r2);
          });
        });
      }, resolve: function(n2) {
        return n2 instanceof K ? n2 : n2 && "function" == typeof n2.then ? new K(function(e2, t2) {
          n2.then(e2, t2);
        }) : new K(Pe, true, n2);
      }, reject: Xe, race: function() {
        var e2 = n.apply(null, arguments).map(rt);
        return new K(function(t2, n2) {
          e2.map(function(e3) {
            return K.resolve(e3).then(t2, n2);
          });
        });
      }, PSD: { get: function() {
        return P;
      }, set: function(e2) {
        return P = e2;
      } }, totalEchoes: { get: function() {
        return et;
      } }, newPSD: v, usePSD: at, scheduler: { get: function() {
        return je;
      }, set: function(e2) {
        je = e2;
      } }, rejectionMapper: { get: function() {
        return Be;
      }, set: function(e2) {
        Be = e2;
      } }, follow: function(o2, n2) {
        return new K(function(e2, t2) {
          return v(function(n3, r2) {
            var e3 = P;
            e3.unhandleds = [], e3.onunhandled = r2, e3.finalize = be(function() {
              var t3, e4 = this;
              t3 = function() {
                0 === e4.unhandleds.length ? n3() : r2(e4.unhandleds[0]);
              }, Ne.push(function e5() {
                t3(), Ne.splice(Ne.indexOf(e5), 1);
              }), ++Fe, je(function() {
                0 == --Fe && Ge();
              }, []);
            }, e3.finalize), o2();
          }, n2, e2, t2);
        });
      } }), Ae && (Ae.allSettled && u(K, "allSettled", function() {
        var e2 = n.apply(null, arguments).map(rt);
        return new K(function(n2) {
          0 === e2.length && n2([]);
          var r2 = e2.length, o2 = new Array(r2);
          e2.forEach(function(e3, t2) {
            return K.resolve(e3).then(function(e4) {
              return o2[t2] = { status: "fulfilled", value: e4 };
            }, function(e4) {
              return o2[t2] = { status: "rejected", reason: e4 };
            }).then(function() {
              return --r2 || n2(o2);
            });
          });
        });
      }), Ae.any && "undefined" != typeof AggregateError && u(K, "any", function() {
        var e2 = n.apply(null, arguments).map(rt);
        return new K(function(n2, r2) {
          0 === e2.length && r2(new AggregateError([]));
          var o2 = e2.length, i2 = new Array(o2);
          e2.forEach(function(e3, t2) {
            return K.resolve(e3).then(function(e4) {
              return n2(e4);
            }, function(e4) {
              i2[t2] = e4, --o2 || r2(new AggregateError(i2));
            });
          });
        });
      }), Ae.withResolvers) && (K.withResolvers = Ae.withResolvers);
      var i = { awaits: 0, echoes: 0, id: 0 }, He = 0, Je = [], Ze = 0, et = 0, tt = 0;
      function v(e2, t2, n2, r2) {
        var o2 = P, i2 = Object.create(o2), t2 = (i2.parent = o2, i2.ref = 0, i2.global = false, i2.id = ++tt, s.env, i2.env = Ce ? { Promise: K, PromiseProp: { value: K, configurable: true, writable: true }, all: K.all, race: K.race, allSettled: K.allSettled, any: K.any, resolve: K.resolve, reject: K.reject } : {}, t2 && a(i2, t2), ++o2.ref, i2.finalize = function() {
          --this.parent.ref || this.parent.finalize();
        }, at(i2, e2, n2, r2));
        return 0 === i2.ref && i2.finalize(), t2;
      }
      function nt() {
        return i.id || (i.id = ++He), ++i.awaits, i.echoes += Ke, i.id;
      }
      function w() {
        return !!i.awaits && (0 == --i.awaits && (i.id = 0), i.echoes = i.awaits * Ke, true);
      }
      function rt(e2) {
        return i.echoes && e2 && e2.constructor === Ae ? (nt(), e2.then(function(e3) {
          return w(), e3;
        }, function(e3) {
          return w(), S(e3);
        })) : e2;
      }
      function ot() {
        var e2 = Je[Je.length - 1];
        Je.pop(), h(e2, false);
      }
      function h(e2, t2) {
        var n2, r2, o2 = P;
        (t2 ? !i.echoes || Ze++ && e2 === P : !Ze || --Ze && e2 === P) || queueMicrotask(t2 ? (function(e3) {
          ++et, i.echoes && 0 != --i.echoes || (i.echoes = i.awaits = i.id = 0), Je.push(P), h(e3, true);
        }).bind(null, e2) : ot), e2 !== P && (P = e2, o2 === s && (s.env = it()), Ce) && (n2 = s.env.Promise, r2 = e2.env, o2.global || e2.global) && (Object.defineProperty(f, "Promise", r2.PromiseProp), n2.all = r2.all, n2.race = r2.race, n2.resolve = r2.resolve, n2.reject = r2.reject, r2.allSettled && (n2.allSettled = r2.allSettled), r2.any) && (n2.any = r2.any);
      }
      function it() {
        var e2 = f.Promise;
        return Ce ? { Promise: e2, PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"), all: e2.all, race: e2.race, allSettled: e2.allSettled, any: e2.any, resolve: e2.resolve, reject: e2.reject } : {};
      }
      function at(e2, t2, n2, r2, o2) {
        var i2 = P;
        try {
          return h(e2, true), t2(n2, r2, o2);
        } finally {
          h(i2, false);
        }
      }
      function ut(t2, n2, r2, o2) {
        return "function" != typeof t2 ? t2 : function() {
          var e2 = P;
          r2 && nt(), h(n2, true);
          try {
            return t2.apply(this, arguments);
          } finally {
            h(e2, false), o2 && queueMicrotask(w);
          }
        };
      }
      function st(e2) {
        Promise === Ae && 0 === i.echoes ? 0 === Ze ? e2() : enqueueNativeMicroTask(e2) : setTimeout(e2, 0);
      }
      -1 === ("" + Se).indexOf("[native code]") && (nt = w = g);
      var S = K.reject;
      var ct = String.fromCharCode(65535), A = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", lt = "String expected.", ft = "__dbnames", ht = "readonly", dt = "readwrite";
      function pt(e2, t2) {
        return e2 ? t2 ? function() {
          return e2.apply(this, arguments) && t2.apply(this, arguments);
        } : e2 : t2;
      }
      var yt = { type: 3, lower: -1 / 0, lowerOpen: false, upper: [[]], upperOpen: false };
      function vt(t2) {
        return "string" != typeof t2 || /\./.test(t2) ? function(e2) {
          return e2;
        } : function(e2) {
          return void 0 === e2[t2] && t2 in e2 && delete (e2 = ee(e2))[t2], e2;
        };
      }
      function mt() {
        throw k.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
      }
      function C(e2, t2) {
        try {
          var n2 = bt(e2), r2 = bt(t2);
          if (n2 !== r2) return "Array" === n2 ? 1 : "Array" === r2 ? -1 : "binary" === n2 ? 1 : "binary" === r2 ? -1 : "string" === n2 ? 1 : "string" === r2 ? -1 : "Date" === n2 ? 1 : "Date" !== r2 ? NaN : -1;
          switch (n2) {
            case "number":
            case "Date":
            case "string":
              return t2 < e2 ? 1 : e2 < t2 ? -1 : 0;
            case "binary":
              for (var o2 = gt(e2), i2 = gt(t2), a2 = o2.length, u2 = i2.length, s2 = a2 < u2 ? a2 : u2, c2 = 0; c2 < s2; ++c2) if (o2[c2] !== i2[c2]) return o2[c2] < i2[c2] ? -1 : 1;
              return a2 === u2 ? 0 : a2 < u2 ? -1 : 1;
            case "Array":
              for (var l2 = e2, f2 = t2, h2 = l2.length, d2 = f2.length, p2 = h2 < d2 ? h2 : d2, y2 = 0; y2 < p2; ++y2) {
                var v2 = C(l2[y2], f2[y2]);
                if (0 !== v2) return v2;
              }
              return h2 === d2 ? 0 : h2 < d2 ? -1 : 1;
          }
        } catch (e3) {
        }
        return NaN;
      }
      function bt(e2) {
        var t2 = typeof e2;
        return "object" == t2 && (ArrayBuffer.isView(e2) || "ArrayBuffer" === (t2 = ne(e2))) ? "binary" : t2;
      }
      function gt(e2) {
        return e2 instanceof Uint8Array ? e2 : ArrayBuffer.isView(e2) ? new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength) : new Uint8Array(e2);
      }
      function wt(t2, n2, r2) {
        var e2 = t2.schema.yProps;
        return e2 ? (n2 && 0 < r2.numFailures && (n2 = n2.filter(function(e3, t3) {
          return !r2.failures[t3];
        })), Promise.all(e2.map(function(e3) {
          e3 = e3.updatesTable;
          return n2 ? t2.db.table(e3).where("k").anyOf(n2).delete() : t2.db.table(e3).clear();
        })).then(function() {
          return r2;
        })) : r2;
      }
      xt.prototype.execute = function(e2) {
        var t2 = this["@@propmod"];
        if (void 0 !== t2.add) {
          var n2 = t2.add;
          if (x(n2)) return R(R([], x(e2) ? e2 : [], true), n2).sort();
          if ("number" == typeof n2) return (Number(e2) || 0) + n2;
          if ("bigint" == typeof n2) try {
            return BigInt(e2) + n2;
          } catch (e3) {
            return BigInt(0) + n2;
          }
          throw new TypeError("Invalid term ".concat(n2));
        }
        if (void 0 !== t2.remove) {
          var r2 = t2.remove;
          if (x(r2)) return x(e2) ? e2.filter(function(e3) {
            return !r2.includes(e3);
          }).sort() : [];
          if ("number" == typeof r2) return Number(e2) - r2;
          if ("bigint" == typeof r2) try {
            return BigInt(e2) - r2;
          } catch (e3) {
            return BigInt(0) - r2;
          }
          throw new TypeError("Invalid subtrahend ".concat(r2));
        }
        n2 = null == (n2 = t2.replacePrefix) ? void 0 : n2[0];
        return n2 && "string" == typeof e2 && e2.startsWith(n2) ? t2.replacePrefix[1] + e2.substring(n2.length) : e2;
      };
      var _t = xt;
      function xt(e2) {
        this["@@propmod"] = e2;
      }
      function kt(e2, t2) {
        for (var n2 = O(t2), r2 = n2.length, o2 = false, i2 = 0; i2 < r2; ++i2) {
          var a2 = n2[i2], u2 = t2[a2], s2 = c(e2, a2);
          u2 instanceof _t ? (b(e2, a2, u2.execute(s2)), o2 = true) : s2 !== u2 && (b(e2, a2, u2), o2 = true);
        }
        return o2;
      }
      r.prototype._trans = function(e2, r2, t2) {
        var n2 = this._tx || P.trans, o2 = this.name, i2 = l && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e2 ? "read" : "write", " ").concat(this.name));
        function a2(e3, t3, n3) {
          if (n3.schema[o2]) return r2(n3.idbtrans, n3);
          throw new k.NotFound("Table " + o2 + " not part of transaction");
        }
        var u2 = $e();
        try {
          var s2 = n2 && n2.db._novip === this.db._novip ? n2 === P.trans ? n2._promise(e2, a2, t2) : v(function() {
            return n2._promise(e2, a2, t2);
          }, { trans: n2, transless: P.transless || P }) : function t3(n3, r3, o3, i3) {
            if (n3.idbdb && (n3._state.openComplete || P.letThrough || n3._vip)) {
              var a3 = n3._createTransaction(r3, o3, n3._dbSchema);
              try {
                a3.create(), n3._state.PR1398_maxLoop = 3;
              } catch (e3) {
                return e3.name === de.InvalidState && n3.isOpen() && 0 < --n3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n3.close({ disableAutoOpen: false }), n3.open().then(function() {
                  return t3(n3, r3, o3, i3);
                })) : S(e3);
              }
              return a3._promise(r3, function(e3, t4) {
                return v(function() {
                  return P.trans = a3, i3(e3, t4, a3);
                });
              }).then(function(e3) {
                if ("readwrite" === r3) try {
                  a3.idbtrans.commit();
                } catch (e4) {
                }
                return "readonly" === r3 ? e3 : a3._completion.then(function() {
                  return e3;
                });
              });
            }
            if (n3._state.openComplete) return S(new k.DatabaseClosed(n3._state.dbOpenError));
            if (!n3._state.isBeingOpened) {
              if (!n3._state.autoOpen) return S(new k.DatabaseClosed());
              n3.open().catch(g);
            }
            return n3._state.dbReadyPromise.then(function() {
              return t3(n3, r3, o3, i3);
            });
          }(this.db, e2, [this.name], a2);
          return i2 && (s2._consoleTask = i2, s2 = s2.catch(function(e3) {
            return console.trace(e3), S(e3);
          })), s2;
        } finally {
          u2 && Qe();
        }
      }, r.prototype.get = function(t2, e2) {
        var n2 = this;
        return t2 && t2.constructor === Object ? this.where(t2).first(e2) : null == t2 ? S(new k.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e3) {
          return n2.core.get({ trans: e3, key: t2 }).then(function(e4) {
            return n2.hook.reading.fire(e4);
          });
        }).then(e2);
      }, r.prototype.where = function(i2) {
        if ("string" == typeof i2) return new this.db.WhereClause(this, i2);
        if (x(i2)) return new this.db.WhereClause(this, "[".concat(i2.join("+"), "]"));
        var n2 = O(i2);
        if (1 === n2.length) return this.where(n2[0]).equals(i2[n2[0]]);
        var e2 = this.schema.indexes.concat(this.schema.primKey).filter(function(t3) {
          if (t3.compound && n2.every(function(e4) {
            return 0 <= t3.keyPath.indexOf(e4);
          })) {
            for (var e3 = 0; e3 < n2.length; ++e3) if (-1 === n2.indexOf(t3.keyPath[e3])) return false;
            return true;
          }
          return false;
        }).sort(function(e3, t3) {
          return e3.keyPath.length - t3.keyPath.length;
        })[0];
        if (e2 && this.db._maxKey !== ct) return t2 = e2.keyPath.slice(0, n2.length), this.where(t2).equals(t2.map(function(e3) {
          return i2[e3];
        }));
        !e2 && l && console.warn("The query ".concat(JSON.stringify(i2), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n2.join("+"), "]"));
        var a2 = this.schema.idxByName;
        function u2(e3, t3) {
          return 0 === C(e3, t3);
        }
        var t2 = n2.reduce(function(e3, t3) {
          var n3 = e3[0], e3 = e3[1], r3 = a2[t3], o2 = i2[t3];
          return [n3 || r3, n3 || !r3 ? pt(e3, r3 && r3.multi ? function(e4) {
            e4 = c(e4, t3);
            return x(e4) && e4.some(function(e5) {
              return u2(o2, e5);
            });
          } : function(e4) {
            return u2(o2, c(e4, t3));
          }) : e3];
        }, [null, null]), r2 = t2[0], t2 = t2[1];
        return r2 ? this.where(r2.name).equals(i2[r2.keyPath]).filter(t2) : e2 ? this.filter(t2) : this.where(n2).equals("");
      }, r.prototype.filter = function(e2) {
        return this.toCollection().and(e2);
      }, r.prototype.count = function(e2) {
        return this.toCollection().count(e2);
      }, r.prototype.offset = function(e2) {
        return this.toCollection().offset(e2);
      }, r.prototype.limit = function(e2) {
        return this.toCollection().limit(e2);
      }, r.prototype.each = function(e2) {
        return this.toCollection().each(e2);
      }, r.prototype.toArray = function(e2) {
        return this.toCollection().toArray(e2);
      }, r.prototype.toCollection = function() {
        return new this.db.Collection(new this.db.WhereClause(this));
      }, r.prototype.orderBy = function(e2) {
        return new this.db.Collection(new this.db.WhereClause(this, x(e2) ? "[".concat(e2.join("+"), "]") : e2));
      }, r.prototype.reverse = function() {
        return this.toCollection().reverse();
      }, r.prototype.mapToClass = function(r2) {
        for (var i2 = this.db, a2 = this.name, o2 = ((this.schema.mappedClass = r2).prototype instanceof mt && (r2 = ((e3) => {
          var t3 = o3, n2 = e3;
          if ("function" != typeof n2 && null !== n2) throw new TypeError("Class extends value " + String(n2) + " is not a constructor or null");
          function r3() {
            this.constructor = t3;
          }
          function o3() {
            return null !== e3 && e3.apply(this, arguments) || this;
          }
          return B(t3, n2), t3.prototype = null === n2 ? Object.create(n2) : (r3.prototype = n2.prototype, new r3()), Object.defineProperty(o3.prototype, "db", { get: function() {
            return i2;
          }, enumerable: false, configurable: true }), o3.prototype.table = function() {
            return a2;
          }, o3;
        })(r2)), /* @__PURE__ */ new Set()), e2 = r2.prototype; e2; e2 = F(e2)) Object.getOwnPropertyNames(e2).forEach(function(e3) {
          return o2.add(e3);
        });
        function t2(e3) {
          if (!e3) return e3;
          var t3, n2 = Object.create(r2.prototype);
          for (t3 in e3) if (!o2.has(t3)) try {
            n2[t3] = e3[t3];
          } catch (e4) {
          }
          return n2;
        }
        return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = t2, this.hook("reading", t2), r2;
      }, r.prototype.defineClass = function() {
        return this.mapToClass(function(e2) {
          a(this, e2);
        });
      }, r.prototype.add = function(t2, n2) {
        var r2 = this, e2 = this.schema.primKey, o2 = e2.auto, i2 = e2.keyPath, a2 = t2;
        return i2 && o2 && (a2 = vt(i2)(t2)), this._trans("readwrite", function(e3) {
          return r2.core.mutate({ trans: e3, type: "add", keys: null != n2 ? [n2] : null, values: [a2] });
        }).then(function(e3) {
          return e3.numFailures ? K.reject(e3.failures[0]) : e3.lastResult;
        }).then(function(e3) {
          if (i2) try {
            b(t2, i2, e3);
          } catch (e4) {
          }
          return e3;
        });
      }, r.prototype.upsert = function(r2, o2) {
        var i2 = this, a2 = this.schema.primKey.keyPath;
        return this._trans("readwrite", function(n2) {
          return i2.core.get({ trans: n2, key: r2 }).then(function(t2) {
            var e2 = null != t2 ? t2 : {};
            return kt(e2, o2), a2 && b(e2, a2, r2), i2.core.mutate({ trans: n2, type: "put", values: [e2], keys: [r2], upsert: true, updates: { keys: [r2], changeSpecs: [o2] } }).then(function(e3) {
              return e3.numFailures ? K.reject(e3.failures[0]) : !!t2;
            });
          });
        });
      }, r.prototype.update = function(e2, t2) {
        return "object" != typeof e2 || x(e2) ? this.where(":id").equals(e2).modify(t2) : void 0 === (e2 = c(e2, this.schema.primKey.keyPath)) ? S(new k.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e2).modify(t2);
      }, r.prototype.put = function(t2, n2) {
        var r2 = this, e2 = this.schema.primKey, o2 = e2.auto, i2 = e2.keyPath, a2 = t2;
        return i2 && o2 && (a2 = vt(i2)(t2)), this._trans("readwrite", function(e3) {
          return r2.core.mutate({ trans: e3, type: "put", values: [a2], keys: null != n2 ? [n2] : null });
        }).then(function(e3) {
          return e3.numFailures ? K.reject(e3.failures[0]) : e3.lastResult;
        }).then(function(e3) {
          if (i2) try {
            b(t2, i2, e3);
          } catch (e4) {
          }
          return e3;
        });
      }, r.prototype.delete = function(t2) {
        var n2 = this;
        return this._trans("readwrite", function(e2) {
          return n2.core.mutate({ trans: e2, type: "delete", keys: [t2] }).then(function(e3) {
            return wt(n2, [t2], e3);
          }).then(function(e3) {
            return e3.numFailures ? K.reject(e3.failures[0]) : void 0;
          });
        });
      }, r.prototype.clear = function() {
        var t2 = this;
        return this._trans("readwrite", function(e2) {
          return t2.core.mutate({ trans: e2, type: "deleteRange", range: yt }).then(function(e3) {
            return wt(t2, null, e3);
          });
        }).then(function(e2) {
          return e2.numFailures ? K.reject(e2.failures[0]) : void 0;
        });
      }, r.prototype.bulkGet = function(t2) {
        var n2 = this;
        return this._trans("readonly", function(e2) {
          return n2.core.getMany({ keys: t2, trans: e2 }).then(function(e3) {
            return e3.map(function(e4) {
              return n2.hook.reading.fire(e4);
            });
          });
        });
      }, r.prototype.bulkAdd = function(o2, e2, t2) {
        var i2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
        return this._trans("readwrite", function(e3) {
          var t3 = i2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
          if (t3 && a2) throw new k.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
          if (a2 && a2.length !== o2.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
          var r2 = o2.length, n2 = t3 && n2 ? o2.map(vt(t3)) : o2;
          return i2.core.mutate({ trans: e3, type: "add", keys: a2, values: n2, wantResults: u2 }).then(function(e4) {
            var t4 = e4.numFailures, n3 = e4.failures;
            if (0 === t4) return u2 ? e4.results : e4.lastResult;
            throw new he("".concat(i2.name, ".bulkAdd(): ").concat(t4, " of ").concat(r2, " operations failed"), n3);
          });
        });
      }, r.prototype.bulkPut = function(o2, e2, t2) {
        var i2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
        return this._trans("readwrite", function(e3) {
          var t3 = i2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
          if (t3 && a2) throw new k.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
          if (a2 && a2.length !== o2.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
          var r2 = o2.length, n2 = t3 && n2 ? o2.map(vt(t3)) : o2;
          return i2.core.mutate({ trans: e3, type: "put", keys: a2, values: n2, wantResults: u2 }).then(function(e4) {
            var t4 = e4.numFailures, n3 = e4.failures;
            if (0 === t4) return u2 ? e4.results : e4.lastResult;
            throw new he("".concat(i2.name, ".bulkPut(): ").concat(t4, " of ").concat(r2, " operations failed"), n3);
          });
        });
      }, r.prototype.bulkUpdate = function(t2) {
        var h2 = this, n2 = this.core, r2 = t2.map(function(e2) {
          return e2.key;
        }), o2 = t2.map(function(e2) {
          return e2.changes;
        }), d2 = [];
        return this._trans("readwrite", function(e2) {
          return n2.getMany({ trans: e2, keys: r2, cache: "clone" }).then(function(c2) {
            var l2 = [], f2 = [], s2 = (t2.forEach(function(e3, t3) {
              var n3 = e3.key, r3 = e3.changes, o3 = c2[t3];
              if (o3) {
                for (var i2 = 0, a2 = Object.keys(r3); i2 < a2.length; i2++) {
                  var u2 = a2[i2], s3 = r3[u2];
                  if (u2 === h2.schema.primKey.keyPath) {
                    if (0 !== C(s3, n3)) throw new k.Constraint("Cannot update primary key in bulkUpdate()");
                  } else b(o3, u2, s3);
                }
                d2.push(t3), l2.push(n3), f2.push(o3);
              }
            }), l2.length);
            return n2.mutate({ trans: e2, type: "put", keys: l2, values: f2, updates: { keys: r2, changeSpecs: o2 } }).then(function(e3) {
              var t3 = e3.numFailures, n3 = e3.failures;
              if (0 === t3) return s2;
              for (var r3 = 0, o3 = Object.keys(n3); r3 < o3.length; r3++) {
                var i2, a2 = o3[r3], u2 = d2[Number(a2)];
                null != u2 && (i2 = n3[a2], delete n3[a2], n3[u2] = i2);
              }
              throw new he("".concat(h2.name, ".bulkUpdate(): ").concat(t3, " of ").concat(s2, " operations failed"), n3);
            });
          });
        });
      }, r.prototype.bulkDelete = function(t2) {
        var r2 = this, o2 = t2.length;
        return this._trans("readwrite", function(e2) {
          return r2.core.mutate({ trans: e2, type: "delete", keys: t2 }).then(function(e3) {
            return wt(r2, t2, e3);
          });
        }).then(function(e2) {
          var t3 = e2.numFailures, n2 = e2.failures;
          if (0 === t3) return e2.lastResult;
          throw new he("".concat(r2.name, ".bulkDelete(): ").concat(t3, " of ").concat(o2, " operations failed"), n2);
        });
      };
      var Ot = r;
      function r() {
      }
      function Pt(o2) {
        function t2(e3, t3) {
          if (t3) {
            for (var n3 = arguments.length, r2 = new Array(n3 - 1); --n3; ) r2[n3 - 1] = arguments[n3];
            return a2[e3].subscribe.apply(null, r2), o2;
          }
          if ("string" == typeof e3) return a2[e3];
        }
        var a2 = {};
        t2.addEventType = u2;
        for (var e2 = 1, n2 = arguments.length; e2 < n2; ++e2) u2(arguments[e2]);
        return t2;
        function u2(e3, n3, r2) {
          var o3, i2;
          if ("object" != typeof e3) return n3 = n3 || xe, i2 = { subscribers: [], fire: r2 = r2 || g, subscribe: function(e4) {
            -1 === i2.subscribers.indexOf(e4) && (i2.subscribers.push(e4), i2.fire = n3(i2.fire, e4));
          }, unsubscribe: function(t3) {
            i2.subscribers = i2.subscribers.filter(function(e4) {
              return e4 !== t3;
            }), i2.fire = i2.subscribers.reduce(n3, r2);
          } }, a2[e3] = t2[e3] = i2;
          O(o3 = e3).forEach(function(e4) {
            var t3 = o3[e4];
            if (x(t3)) u2(e4, o3[e4][0], o3[e4][1]);
            else {
              if ("asap" !== t3) throw new k.InvalidArgument("Invalid event config");
              var n4 = u2(e4, ve, function() {
                for (var e5 = arguments.length, t4 = new Array(e5); e5--; ) t4[e5] = arguments[e5];
                n4.subscribers.forEach(function(e6) {
                  Q(function() {
                    e6.apply(null, t4);
                  });
                });
              });
            }
          });
        }
      }
      function Kt(e2, t2) {
        return U(t2).from({ prototype: e2 }), t2;
      }
      function Et(e2, t2) {
        return !(e2.filter || e2.algorithm || e2.or) && (t2 ? e2.justLimit : !e2.replayFilter);
      }
      function St(e2, t2) {
        e2.filter = pt(e2.filter, t2);
      }
      function At(e2, t2, n2) {
        var r2 = e2.replayFilter;
        e2.replayFilter = r2 ? function() {
          return pt(r2(), t2());
        } : t2, e2.justLimit = n2 && !r2;
      }
      function Ct(e2, t2) {
        if (e2.isPrimKey) return t2.primaryKey;
        var n2 = t2.getIndexByKeyPath(e2.index);
        if (n2) return n2;
        throw new k.Schema("KeyPath " + e2.index + " on object store " + t2.name + " is not indexed");
      }
      function jt(e2, t2, n2) {
        var r2 = Ct(e2, t2.schema);
        return t2.openCursor({ trans: n2, values: !e2.keysOnly, reverse: "prev" === e2.dir, unique: !!e2.unique, query: { index: r2, range: e2.range } });
      }
      function Tt(e2, i2, t2, n2) {
        var a2, r2, u2 = e2.replayFilter ? pt(e2.filter, e2.replayFilter()) : e2.filter;
        return e2.or ? (a2 = {}, r2 = function(e3, t3, n3) {
          var r3, o2;
          u2 && !u2(t3, n3, function(e4) {
            return t3.stop(e4);
          }, function(e4) {
            return t3.fail(e4);
          }) || ("[object ArrayBuffer]" === (o2 = "" + (r3 = t3.primaryKey)) && (o2 = "" + new Uint8Array(r3)), m(a2, o2)) || (a2[o2] = true, i2(e3, t3, n3));
        }, Promise.all([e2.or._iterate(r2, t2), It(jt(e2, n2, t2), e2.algorithm, r2, !e2.keysOnly && e2.valueMapper)])) : It(jt(e2, n2, t2), pt(e2.algorithm, u2), i2, !e2.keysOnly && e2.valueMapper);
      }
      function It(e2, r2, o2, i2) {
        var a2 = E(i2 ? function(e3, t2, n2) {
          return o2(i2(e3), t2, n2);
        } : o2);
        return e2.then(function(n2) {
          if (n2) return n2.start(function() {
            var t2 = function() {
              return n2.continue();
            };
            r2 && !r2(n2, function(e3) {
              return t2 = e3;
            }, function(e3) {
              n2.stop(e3), t2 = g;
            }, function(e3) {
              n2.fail(e3), t2 = g;
            }) || a2(n2.value, n2, function(e3) {
              return t2 = e3;
            }), t2();
          });
        });
      }
      o.prototype._read = function(e2, t2) {
        var n2 = this._ctx;
        return n2.error ? n2.table._trans(null, S.bind(null, n2.error)) : n2.table._trans("readonly", e2).then(t2);
      }, o.prototype._write = function(e2) {
        var t2 = this._ctx;
        return t2.error ? t2.table._trans(null, S.bind(null, t2.error)) : t2.table._trans("readwrite", e2, "locked");
      }, o.prototype._addAlgorithm = function(e2) {
        var t2 = this._ctx;
        t2.algorithm = pt(t2.algorithm, e2);
      }, o.prototype._iterate = function(e2, t2) {
        return Tt(this._ctx, e2, t2, this._ctx.table.core);
      }, o.prototype.clone = function(e2) {
        var t2 = Object.create(this.constructor.prototype), n2 = Object.create(this._ctx);
        return e2 && a(n2, e2), t2._ctx = n2, t2;
      }, o.prototype.raw = function() {
        return this._ctx.valueMapper = null, this;
      }, o.prototype.each = function(t2) {
        var n2 = this._ctx;
        return this._read(function(e2) {
          return Tt(n2, t2, e2, n2.table.core);
        });
      }, o.prototype.count = function(e2) {
        var o2 = this;
        return this._read(function(e3) {
          var t2, n2 = o2._ctx, r2 = n2.table.core;
          return Et(n2, true) ? r2.count({ trans: e3, query: { index: Ct(n2, r2.schema), range: n2.range } }).then(function(e4) {
            return Math.min(e4, n2.limit);
          }) : (t2 = 0, Tt(n2, function() {
            return ++t2, false;
          }, e3, r2).then(function() {
            return t2;
          }));
        }).then(e2);
      }, o.prototype.sortBy = function(e2, t2) {
        var n2 = e2.split(".").reverse(), r2 = n2[0], o2 = n2.length - 1;
        function i2(e3, t3) {
          return t3 ? i2(e3[n2[t3]], t3 - 1) : e3[r2];
        }
        var a2 = "next" === this._ctx.dir ? 1 : -1;
        function u2(e3, t3) {
          return C(i2(e3, o2), i2(t3, o2)) * a2;
        }
        return this.toArray(function(e3) {
          return e3.sort(u2);
        }).then(t2);
      }, o.prototype.toArray = function(e2) {
        var i2 = this;
        return this._read(function(e3) {
          var t2, n2, r2, o2 = i2._ctx;
          return Et(o2, true) && 0 < o2.limit ? (t2 = o2.valueMapper, n2 = Ct(o2, o2.table.core.schema), o2.table.core.query({ trans: e3, limit: o2.limit, values: true, direction: "prev" === o2.dir ? "prev" : void 0, query: { index: n2, range: o2.range } }).then(function(e4) {
            e4 = e4.result;
            return t2 ? e4.map(t2) : e4;
          })) : (r2 = [], Tt(o2, function(e4) {
            return r2.push(e4);
          }, e3, o2.table.core).then(function() {
            return r2;
          }));
        }, e2);
      }, o.prototype.offset = function(t2) {
        var e2 = this._ctx;
        return t2 <= 0 || (e2.offset += t2, Et(e2) ? At(e2, function() {
          var n2 = t2;
          return function(e3, t3) {
            return 0 === n2 || (1 === n2 ? --n2 : t3(function() {
              e3.advance(n2), n2 = 0;
            }), false);
          };
        }) : At(e2, function() {
          var e3 = t2;
          return function() {
            return --e3 < 0;
          };
        })), this;
      }, o.prototype.limit = function(e2) {
        return this._ctx.limit = Math.min(this._ctx.limit, e2), At(this._ctx, function() {
          var r2 = e2;
          return function(e3, t2, n2) {
            return --r2 <= 0 && t2(n2), 0 <= r2;
          };
        }, true), this;
      }, o.prototype.until = function(r2, o2) {
        return St(this._ctx, function(e2, t2, n2) {
          return !r2(e2.value) || (t2(n2), o2);
        }), this;
      }, o.prototype.first = function(e2) {
        return this.limit(1).toArray(function(e3) {
          return e3[0];
        }).then(e2);
      }, o.prototype.last = function(e2) {
        return this.reverse().first(e2);
      }, o.prototype.filter = function(t2) {
        var e2;
        return St(this._ctx, function(e3) {
          return t2(e3.value);
        }), (e2 = this._ctx).isMatch = pt(e2.isMatch, t2), this;
      }, o.prototype.and = function(e2) {
        return this.filter(e2);
      }, o.prototype.or = function(e2) {
        return new this.db.WhereClause(this._ctx.table, e2, this);
      }, o.prototype.reverse = function() {
        return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
      }, o.prototype.desc = function() {
        return this.reverse();
      }, o.prototype.eachKey = function(n2) {
        var e2 = this._ctx;
        return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
          n2(t2.key, t2);
        });
      }, o.prototype.eachUniqueKey = function(e2) {
        return this._ctx.unique = "unique", this.eachKey(e2);
      }, o.prototype.eachPrimaryKey = function(n2) {
        var e2 = this._ctx;
        return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
          n2(t2.primaryKey, t2);
        });
      }, o.prototype.keys = function(e2) {
        var t2 = this._ctx, n2 = (t2.keysOnly = !t2.isMatch, []);
        return this.each(function(e3, t3) {
          n2.push(t3.key);
        }).then(function() {
          return n2;
        }).then(e2);
      }, o.prototype.primaryKeys = function(e2) {
        var n2 = this._ctx;
        if (Et(n2, true) && 0 < n2.limit) return this._read(function(e3) {
          var t2 = Ct(n2, n2.table.core.schema);
          return n2.table.core.query({ trans: e3, values: false, limit: n2.limit, direction: "prev" === n2.dir ? "prev" : void 0, query: { index: t2, range: n2.range } });
        }).then(function(e3) {
          return e3.result;
        }).then(e2);
        n2.keysOnly = !n2.isMatch;
        var r2 = [];
        return this.each(function(e3, t2) {
          r2.push(t2.primaryKey);
        }).then(function() {
          return r2;
        }).then(e2);
      }, o.prototype.uniqueKeys = function(e2) {
        return this._ctx.unique = "unique", this.keys(e2);
      }, o.prototype.firstKey = function(e2) {
        return this.limit(1).keys(function(e3) {
          return e3[0];
        }).then(e2);
      }, o.prototype.lastKey = function(e2) {
        return this.reverse().firstKey(e2);
      }, o.prototype.distinct = function() {
        var n2, e2 = this._ctx, e2 = e2.index && e2.table.schema.idxByName[e2.index];
        return e2 && e2.multi && (n2 = {}, St(this._ctx, function(e3) {
          var e3 = e3.primaryKey.toString(), t2 = m(n2, e3);
          return n2[e3] = true, !t2;
        })), this;
      }, o.prototype.modify = function(x2) {
        var n2 = this, k2 = this._ctx;
        return this._write(function(p2) {
          function y2(e3, t3) {
            var n3 = t3.failures;
            u2 += e3 - t3.numFailures;
            for (var r2 = 0, o2 = O(n3); r2 < o2.length; r2++) {
              var i2 = o2[r2];
              a2.push(n3[i2]);
            }
          }
          var v2 = "function" == typeof x2 ? x2 : function(e3) {
            return kt(e3, x2);
          }, m2 = k2.table.core, e2 = m2.schema.primaryKey, b2 = e2.outbound, g2 = e2.extractKey, w2 = 200, e2 = n2.db._options.modifyChunkSize, a2 = (e2 && (w2 = "object" == typeof e2 ? e2[m2.name] || e2["*"] || 200 : e2), []), u2 = 0, t2 = [], _2 = x2 === Dt;
          return n2.clone().primaryKeys().then(function(f2) {
            function h2(s2) {
              var c2 = Math.min(w2, f2.length - s2), l2 = f2.slice(s2, s2 + c2);
              return (_2 ? Promise.resolve([]) : m2.getMany({ trans: p2, keys: l2, cache: "immutable" })).then(function(e3) {
                var n3 = [], t3 = [], r2 = b2 ? [] : null, o2 = _2 ? l2 : [];
                if (!_2) for (var i2 = 0; i2 < c2; ++i2) {
                  var a3 = e3[i2], u3 = { value: ee(a3), primKey: f2[s2 + i2] };
                  false !== v2.call(u3, u3.value, u3) && (null == u3.value ? o2.push(f2[s2 + i2]) : b2 || 0 === C(g2(a3), g2(u3.value)) ? (t3.push(u3.value), b2 && r2.push(f2[s2 + i2])) : (o2.push(f2[s2 + i2]), n3.push(u3.value)));
                }
                return Promise.resolve(0 < n3.length && m2.mutate({ trans: p2, type: "add", values: n3 }).then(function(e4) {
                  for (var t4 in e4.failures) o2.splice(parseInt(t4), 1);
                  y2(n3.length, e4);
                })).then(function() {
                  return (0 < t3.length || d2 && "object" == typeof x2) && m2.mutate({ trans: p2, type: "put", keys: r2, values: t3, criteria: d2, changeSpec: "function" != typeof x2 && x2, isAdditionalChunk: 0 < s2 }).then(function(e4) {
                    return y2(t3.length, e4);
                  });
                }).then(function() {
                  return (0 < o2.length || d2 && _2) && m2.mutate({ trans: p2, type: "delete", keys: o2, criteria: d2, isAdditionalChunk: 0 < s2 }).then(function(e4) {
                    return wt(k2.table, o2, e4);
                  }).then(function(e4) {
                    return y2(o2.length, e4);
                  });
                }).then(function() {
                  return f2.length > s2 + c2 && h2(s2 + w2);
                });
              });
            }
            var d2 = Et(k2) && k2.limit === 1 / 0 && ("function" != typeof x2 || _2) && { index: k2.index, range: k2.range };
            return h2(0).then(function() {
              if (0 < a2.length) throw new fe("Error modifying one or more objects", a2, u2, t2);
              return f2.length;
            });
          });
        });
      }, o.prototype.delete = function() {
        var o2 = this._ctx, n2 = o2.range;
        return !Et(o2) || o2.table.schema.yProps || !o2.isPrimKey && 3 !== n2.type ? this.modify(Dt) : this._write(function(e2) {
          var t2 = o2.table.core.schema.primaryKey, r2 = n2;
          return o2.table.core.count({ trans: e2, query: { index: t2, range: r2 } }).then(function(n3) {
            return o2.table.core.mutate({ trans: e2, type: "deleteRange", range: r2 }).then(function(e3) {
              var t3 = e3.failures, e3 = e3.numFailures;
              if (e3) throw new fe("Could not delete some values", Object.keys(t3).map(function(e4) {
                return t3[e4];
              }), n3 - e3);
              return n3 - e3;
            });
          });
        });
      };
      var qt = o;
      function o() {
      }
      var Dt = function(e2, t2) {
        return t2.value = null;
      };
      function Bt(e2, t2) {
        return e2 < t2 ? -1 : e2 === t2 ? 0 : 1;
      }
      function Rt(e2, t2) {
        return t2 < e2 ? -1 : e2 === t2 ? 0 : 1;
      }
      function j(e2, t2, n2) {
        e2 = e2 instanceof Lt ? new e2.Collection(e2) : e2;
        return e2._ctx.error = new (n2 || TypeError)(t2), e2;
      }
      function Ft(e2) {
        return new e2.Collection(e2, function() {
          return Mt("");
        }).limit(0);
      }
      function Nt(e2, s2, n2, r2) {
        var o2, c2, l2, f2, h2, d2, p2, y2 = n2.length;
        if (!n2.every(function(e3) {
          return "string" == typeof e3;
        })) return j(e2, lt);
        function t2(e3) {
          o2 = "next" === e3 ? function(e4) {
            return e4.toUpperCase();
          } : function(e4) {
            return e4.toLowerCase();
          }, c2 = "next" === e3 ? function(e4) {
            return e4.toLowerCase();
          } : function(e4) {
            return e4.toUpperCase();
          }, l2 = "next" === e3 ? Bt : Rt;
          var t3 = n2.map(function(e4) {
            return { lower: c2(e4), upper: o2(e4) };
          }).sort(function(e4, t4) {
            return l2(e4.lower, t4.lower);
          });
          f2 = t3.map(function(e4) {
            return e4.upper;
          }), h2 = t3.map(function(e4) {
            return e4.lower;
          }), p2 = "next" === (d2 = e3) ? "" : r2;
        }
        t2("next");
        var e2 = new e2.Collection(e2, function() {
          return T(f2[0], h2[y2 - 1] + r2);
        }), v2 = (e2._ondirectionchange = function(e3) {
          t2(e3);
        }, 0);
        return e2._addAlgorithm(function(e3, t3, n3) {
          var r3 = e3.key;
          if ("string" == typeof r3) {
            var o3 = c2(r3);
            if (s2(o3, h2, v2)) return true;
            for (var i2 = null, a2 = v2; a2 < y2; ++a2) {
              var u2 = ((e4, t4, n4, r4, o4, i3) => {
                for (var a3 = Math.min(e4.length, r4.length), u3 = -1, s3 = 0; s3 < a3; ++s3) {
                  var c3 = t4[s3];
                  if (c3 !== r4[s3]) return o4(e4[s3], n4[s3]) < 0 ? e4.substr(0, s3) + n4[s3] + n4.substr(s3 + 1) : o4(e4[s3], r4[s3]) < 0 ? e4.substr(0, s3) + r4[s3] + n4.substr(s3 + 1) : 0 <= u3 ? e4.substr(0, u3) + t4[u3] + n4.substr(u3 + 1) : null;
                  o4(e4[s3], c3) < 0 && (u3 = s3);
                }
                return a3 < r4.length && "next" === i3 ? e4 + n4.substr(e4.length) : a3 < e4.length && "prev" === i3 ? e4.substr(0, n4.length) : u3 < 0 ? null : e4.substr(0, u3) + r4[u3] + n4.substr(u3 + 1);
              })(r3, o3, f2[a2], h2[a2], l2, d2);
              null === u2 && null === i2 ? v2 = a2 + 1 : (null === i2 || 0 < l2(i2, u2)) && (i2 = u2);
            }
            t3(null !== i2 ? function() {
              e3.continue(i2 + p2);
            } : n3);
          }
          return false;
        }), e2;
      }
      function T(e2, t2, n2, r2) {
        return { type: 2, lower: e2, upper: t2, lowerOpen: n2, upperOpen: r2 };
      }
      function Mt(e2) {
        return { type: 1, lower: e2, upper: e2 };
      }
      Object.defineProperty(d.prototype, "Collection", { get: function() {
        return this._ctx.table.db.Collection;
      }, enumerable: false, configurable: true }), d.prototype.between = function(e2, t2, n2, r2) {
        n2 = false !== n2, r2 = true === r2;
        try {
          return 0 < this._cmp(e2, t2) || 0 === this._cmp(e2, t2) && (n2 || r2) && (!n2 || !r2) ? Ft(this) : new this.Collection(this, function() {
            return T(e2, t2, !n2, !r2);
          });
        } catch (e3) {
          return j(this, A);
        }
      }, d.prototype.equals = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return Mt(e2);
        });
      }, d.prototype.above = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(e2, void 0, true);
        });
      }, d.prototype.aboveOrEqual = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(e2, void 0, false);
        });
      }, d.prototype.below = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(void 0, e2, false, true);
        });
      }, d.prototype.belowOrEqual = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(void 0, e2);
        });
      }, d.prototype.startsWith = function(e2) {
        return "string" != typeof e2 ? j(this, lt) : this.between(e2, e2 + ct, true, true);
      }, d.prototype.startsWithIgnoreCase = function(e2) {
        return "" === e2 ? this.startsWith(e2) : Nt(this, function(e3, t2) {
          return 0 === e3.indexOf(t2[0]);
        }, [e2], ct);
      }, d.prototype.equalsIgnoreCase = function(e2) {
        return Nt(this, function(e3, t2) {
          return e3 === t2[0];
        }, [e2], "");
      }, d.prototype.anyOfIgnoreCase = function() {
        var e2 = n.apply(ae, arguments);
        return 0 === e2.length ? Ft(this) : Nt(this, function(e3, t2) {
          return -1 !== t2.indexOf(e3);
        }, e2, "");
      }, d.prototype.startsWithAnyOfIgnoreCase = function() {
        var e2 = n.apply(ae, arguments);
        return 0 === e2.length ? Ft(this) : Nt(this, function(t2, e3) {
          return e3.some(function(e4) {
            return 0 === t2.indexOf(e4);
          });
        }, e2, ct);
      }, d.prototype.anyOf = function() {
        var e2, o2, t2 = this, i2 = n.apply(ae, arguments), a2 = this._cmp;
        try {
          i2.sort(a2);
        } catch (e3) {
          return j(this, A);
        }
        return 0 === i2.length ? Ft(this) : ((e2 = new this.Collection(this, function() {
          return T(i2[0], i2[i2.length - 1]);
        }))._ondirectionchange = function(e3) {
          a2 = "next" === e3 ? t2._ascending : t2._descending, i2.sort(a2);
        }, o2 = 0, e2._addAlgorithm(function(e3, t3, n2) {
          for (var r2 = e3.key; 0 < a2(r2, i2[o2]); ) if (++o2 === i2.length) return t3(n2), false;
          return 0 === a2(r2, i2[o2]) || (t3(function() {
            e3.continue(i2[o2]);
          }), false);
        }), e2);
      }, d.prototype.notEqual = function(e2) {
        return this.inAnyRange([[-1 / 0, e2], [e2, this.db._maxKey]], { includeLowers: false, includeUppers: false });
      }, d.prototype.noneOf = function() {
        var e2 = n.apply(ae, arguments);
        if (0 === e2.length) return new this.Collection(this);
        try {
          e2.sort(this._ascending);
        } catch (e3) {
          return j(this, A);
        }
        var t2 = e2.reduce(function(e3, t3) {
          return e3 ? e3.concat([[e3[e3.length - 1][1], t3]]) : [[-1 / 0, t3]];
        }, null);
        return t2.push([e2[e2.length - 1], this.db._maxKey]), this.inAnyRange(t2, { includeLowers: false, includeUppers: false });
      }, d.prototype.inAnyRange = function(e2, t2) {
        var i2 = this, a2 = this._cmp, u2 = this._ascending, n2 = this._descending, s2 = this._min, c2 = this._max;
        if (0 === e2.length) return Ft(this);
        if (!e2.every(function(e3) {
          return void 0 !== e3[0] && void 0 !== e3[1] && u2(e3[0], e3[1]) <= 0;
        })) return j(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", k.InvalidArgument);
        var r2 = !t2 || false !== t2.includeLowers, o2 = t2 && true === t2.includeUppers;
        var l2, f2 = u2;
        function h2(e3, t3) {
          return f2(e3[0], t3[0]);
        }
        try {
          (l2 = e2.reduce(function(e3, t3) {
            for (var n3 = 0, r3 = e3.length; n3 < r3; ++n3) {
              var o3 = e3[n3];
              if (a2(t3[0], o3[1]) < 0 && 0 < a2(t3[1], o3[0])) {
                o3[0] = s2(o3[0], t3[0]), o3[1] = c2(o3[1], t3[1]);
                break;
              }
            }
            return n3 === r3 && e3.push(t3), e3;
          }, [])).sort(h2);
        } catch (e3) {
          return j(this, A);
        }
        var d2 = 0, p2 = o2 ? function(e3) {
          return 0 < u2(e3, l2[d2][1]);
        } : function(e3) {
          return 0 <= u2(e3, l2[d2][1]);
        }, y2 = r2 ? function(e3) {
          return 0 < n2(e3, l2[d2][0]);
        } : function(e3) {
          return 0 <= n2(e3, l2[d2][0]);
        };
        var v2 = p2, t2 = new this.Collection(this, function() {
          return T(l2[0][0], l2[l2.length - 1][1], !r2, !o2);
        });
        return t2._ondirectionchange = function(e3) {
          f2 = "next" === e3 ? (v2 = p2, u2) : (v2 = y2, n2), l2.sort(h2);
        }, t2._addAlgorithm(function(e3, t3, n3) {
          for (var r3, o3 = e3.key; v2(o3); ) if (++d2 === l2.length) return t3(n3), false;
          return !p2(r3 = o3) && !y2(r3) || (0 === i2._cmp(o3, l2[d2][1]) || 0 === i2._cmp(o3, l2[d2][0]) || t3(function() {
            f2 === u2 ? e3.continue(l2[d2][0]) : e3.continue(l2[d2][1]);
          }), false);
        }), t2;
      }, d.prototype.startsWithAnyOf = function() {
        var e2 = n.apply(ae, arguments);
        return e2.every(function(e3) {
          return "string" == typeof e3;
        }) ? 0 === e2.length ? Ft(this) : this.inAnyRange(e2.map(function(e3) {
          return [e3, e3 + ct];
        })) : j(this, "startsWithAnyOf() only works with strings");
      };
      var Lt = d;
      function d() {
      }
      function I(t2) {
        return E(function(e2) {
          return Ut(e2), t2(e2.target.error), false;
        });
      }
      function Ut(e2) {
        e2.stopPropagation && e2.stopPropagation(), e2.preventDefault && e2.preventDefault();
      }
      var zt = "storagemutated", Vt = "x-storagemutated-1", Wt = Pt(null, zt), Yt = (p.prototype._lock = function() {
        return $(!P.global), ++this._reculock, 1 !== this._reculock || P.global || (P.lockOwnerFor = this), this;
      }, p.prototype._unlock = function() {
        if ($(!P.global), 0 == --this._reculock) for (P.global || (P.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked(); ) {
          var e2 = this._blockedFuncs.shift();
          try {
            at(e2[1], e2[0]);
          } catch (e3) {
          }
        }
        return this;
      }, p.prototype._locked = function() {
        return this._reculock && P.lockOwnerFor !== this;
      }, p.prototype.create = function(t2) {
        var n2 = this;
        if (this.mode) {
          var e2 = this.db.idbdb, r2 = this.db._state.dbOpenError;
          if ($(!this.idbtrans), !t2 && !e2) switch (r2 && r2.name) {
            case "DatabaseClosedError":
              throw new k.DatabaseClosed(r2);
            case "MissingAPIError":
              throw new k.MissingAPI(r2.message, r2);
            default:
              throw new k.OpenFailed(r2);
          }
          if (!this.active) throw new k.TransactionInactive();
          $(null === this._completion._state), (t2 = this.idbtrans = t2 || (this.db.core || e2).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = E(function(e3) {
            Ut(e3), n2._reject(t2.error);
          }), t2.onabort = E(function(e3) {
            Ut(e3), n2.active && n2._reject(new k.Abort(t2.error)), n2.active = false, n2.on("abort").fire(e3);
          }), t2.oncomplete = E(function() {
            n2.active = false, n2._resolve(), "mutatedParts" in t2 && Wt.storagemutated.fire(t2.mutatedParts);
          });
        }
        return this;
      }, p.prototype._promise = function(n2, r2, o2) {
        var e2, i2 = this;
        return "readwrite" === n2 && "readwrite" !== this.mode ? S(new k.ReadOnly("Transaction is readonly")) : this.active ? this._locked() ? new K(function(e3, t2) {
          i2._blockedFuncs.push([function() {
            i2._promise(n2, r2, o2).then(e3, t2);
          }, P]);
        }) : o2 ? v(function() {
          var e3 = new K(function(e4, t2) {
            i2._lock();
            var n3 = r2(e4, t2, i2);
            n3 && n3.then && n3.then(e4, t2);
          });
          return e3.finally(function() {
            return i2._unlock();
          }), e3._lib = true, e3;
        }) : ((e2 = new K(function(e3, t2) {
          var n3 = r2(e3, t2, i2);
          n3 && n3.then && n3.then(e3, t2);
        }))._lib = true, e2) : S(new k.TransactionInactive());
      }, p.prototype._root = function() {
        return this.parent ? this.parent._root() : this;
      }, p.prototype.waitFor = function(e2) {
        var t2, r2 = this._root(), o2 = K.resolve(e2), i2 = (r2._waitingFor ? r2._waitingFor = r2._waitingFor.then(function() {
          return o2;
        }) : (r2._waitingFor = o2, r2._waitingQueue = [], t2 = r2.idbtrans.objectStore(r2.storeNames[0]), function e3() {
          for (++r2._spinCount; r2._waitingQueue.length; ) r2._waitingQueue.shift()();
          r2._waitingFor && (t2.get(-1 / 0).onsuccess = e3);
        }()), r2._waitingFor);
        return new K(function(t3, n2) {
          o2.then(function(e3) {
            return r2._waitingQueue.push(E(t3.bind(null, e3)));
          }, function(e3) {
            return r2._waitingQueue.push(E(n2.bind(null, e3)));
          }).finally(function() {
            r2._waitingFor === i2 && (r2._waitingFor = null);
          });
        });
      }, p.prototype.abort = function() {
        this.active && (this.active = false, this.idbtrans && this.idbtrans.abort(), this._reject(new k.Abort()));
      }, p.prototype.table = function(e2) {
        var t2 = this._memoizedTables || (this._memoizedTables = {});
        if (m(t2, e2)) return t2[e2];
        var n2 = this.schema[e2];
        if (n2) return (n2 = new this.db.Table(e2, n2, this)).core = this.db.core.table(e2), t2[e2] = n2;
        throw new k.NotFound("Table " + e2 + " not part of transaction");
      }, p);
      function p() {
      }
      function $t(e2, t2, n2, r2, o2, i2, a2, u2) {
        return { name: e2, keyPath: t2, unique: n2, multi: r2, auto: o2, compound: i2, src: (n2 && !a2 ? "&" : "") + (r2 ? "*" : "") + (o2 ? "++" : "") + Qt(t2), type: u2 };
      }
      function Qt(e2) {
        return "string" == typeof e2 ? e2 : e2 ? "[" + [].join.call(e2, "+") + "]" : "";
      }
      function Gt(e2, t2, n2) {
        return { name: e2, primKey: t2, indexes: n2, mappedClass: null, idxByName: (r2 = function(e3) {
          return [e3.name, e3];
        }, n2.reduce(function(e3, t3, n3) {
          t3 = r2(t3, n3);
          return t3 && (e3[t3[0]] = t3[1]), e3;
        }, {})) };
        var r2;
      }
      var Xt = function(e2) {
        try {
          return e2.only([[]]), Xt = function() {
            return [[]];
          }, [[]];
        } catch (e3) {
          return Xt = function() {
            return ct;
          }, ct;
        }
      };
      function Ht(t2) {
        return null == t2 ? function() {
        } : "string" == typeof t2 ? 1 === (n2 = t2).split(".").length ? function(e2) {
          return e2[n2];
        } : function(e2) {
          return c(e2, n2);
        } : function(e2) {
          return c(e2, t2);
        };
        var n2;
      }
      function Jt(e2) {
        return [].slice.call(e2);
      }
      var Zt = 0;
      function en(e2) {
        return null == e2 ? ":id" : "string" == typeof e2 ? e2 : "[".concat(e2.join("+"), "]");
      }
      function tn(e2, o2, t2) {
        function _2(e3) {
          if (3 === e3.type) return null;
          if (4 === e3.type) throw new Error("Cannot convert never type to IDBKeyRange");
          var t3 = e3.lower, n3 = e3.upper, r3 = e3.lowerOpen, e3 = e3.upperOpen;
          return void 0 === t3 ? void 0 === n3 ? null : o2.upperBound(n3, !!e3) : void 0 === n3 ? o2.lowerBound(t3, !!r3) : o2.bound(t3, n3, !!r3, !!e3);
        }
        function n2(e3) {
          var p2, y2, w2 = e3.name;
          return { name: w2, schema: e3, mutate: function(e4) {
            var y3 = e4.trans, v2 = e4.type, m2 = e4.keys, b2 = e4.values, g2 = e4.range;
            return new Promise(function(t3, e5) {
              t3 = E(t3);
              var n3 = y3.objectStore(w2), r3 = null == n3.keyPath, o3 = "put" === v2 || "add" === v2;
              if (!o3 && "delete" !== v2 && "deleteRange" !== v2) throw new Error("Invalid operation type: " + v2);
              var i3, a3 = (m2 || b2 || { length: 1 }).length;
              if (m2 && b2 && m2.length !== b2.length) throw new Error("Given keys array must have same length as given values array.");
              if (0 === a3) return t3({ numFailures: 0, failures: {}, results: [], lastResult: void 0 });
              function u3(e6) {
                ++l2, Ut(e6);
              }
              var s3 = [], c3 = [], l2 = 0;
              if ("deleteRange" === v2) {
                if (4 === g2.type) return t3({ numFailures: l2, failures: c3, results: [], lastResult: void 0 });
                3 === g2.type ? s3.push(i3 = n3.clear()) : s3.push(i3 = n3.delete(_2(g2)));
              } else {
                var r3 = o3 ? r3 ? [b2, m2] : [b2, null] : [m2, null], f2 = r3[0], h2 = r3[1];
                if (o3) for (var d2 = 0; d2 < a3; ++d2) s3.push(i3 = h2 && void 0 !== h2[d2] ? n3[v2](f2[d2], h2[d2]) : n3[v2](f2[d2])), i3.onerror = u3;
                else for (d2 = 0; d2 < a3; ++d2) s3.push(i3 = n3[v2](f2[d2])), i3.onerror = u3;
              }
              function p3(e6) {
                e6 = e6.target.result, s3.forEach(function(e7, t4) {
                  return null != e7.error && (c3[t4] = e7.error);
                }), t3({ numFailures: l2, failures: c3, results: "delete" === v2 ? m2 : s3.map(function(e7) {
                  return e7.result;
                }), lastResult: e6 });
              }
              i3.onerror = function(e6) {
                u3(e6), p3(e6);
              }, i3.onsuccess = p3;
            });
          }, getMany: function(e4) {
            var f2 = e4.trans, h2 = e4.keys;
            return new Promise(function(t3, e5) {
              t3 = E(t3);
              for (var n3, r3 = f2.objectStore(w2), o3 = h2.length, i3 = new Array(o3), a3 = 0, u3 = 0, s3 = function(e6) {
                e6 = e6.target;
                i3[e6._pos] = e6.result, ++u3 === a3 && t3(i3);
              }, c3 = I(e5), l2 = 0; l2 < o3; ++l2) null != h2[l2] && ((n3 = r3.get(h2[l2]))._pos = l2, n3.onsuccess = s3, n3.onerror = c3, ++a3);
              0 === a3 && t3(i3);
            });
          }, get: function(e4) {
            var r3 = e4.trans, o3 = e4.key;
            return new Promise(function(t3, e5) {
              t3 = E(t3);
              var n3 = r3.objectStore(w2).get(o3);
              n3.onsuccess = function(e6) {
                return t3(e6.target.result);
              }, n3.onerror = I(e5);
            });
          }, query: (p2 = a2, y2 = u2, function(d2) {
            return new Promise(function(t3, e4) {
              t3 = E(t3);
              var n3, r3, o3, i3, a3 = d2.trans, u3 = d2.values, s3 = d2.limit, c3 = d2.query, l2 = null != (l2 = d2.direction) ? l2 : "next", f2 = s3 === 1 / 0 ? void 0 : s3, h2 = c3.index, c3 = c3.range, a3 = a3.objectStore(w2), a3 = h2.isPrimaryKey ? a3 : a3.index(h2.name), h2 = _2(c3);
              if (0 === s3) return t3({ result: [] });
              y2 ? (c3 = { query: h2, count: f2, direction: l2 }, (n3 = u3 ? a3.getAll(c3) : a3.getAllKeys(c3)).onsuccess = function(e5) {
                return t3({ result: e5.target.result });
              }, n3.onerror = I(e4)) : p2 && "next" === l2 ? ((n3 = u3 ? a3.getAll(h2, f2) : a3.getAllKeys(h2, f2)).onsuccess = function(e5) {
                return t3({ result: e5.target.result });
              }, n3.onerror = I(e4)) : (r3 = 0, o3 = !u3 && "openKeyCursor" in a3 ? a3.openKeyCursor(h2, l2) : a3.openCursor(h2, l2), i3 = [], o3.onsuccess = function() {
                var e5 = o3.result;
                return !e5 || (i3.push(u3 ? e5.value : e5.primaryKey), ++r3 === s3) ? t3({ result: i3 }) : void e5.continue();
              }, o3.onerror = I(e4));
            });
          }), openCursor: function(e4) {
            var c3 = e4.trans, i3 = e4.values, a3 = e4.query, u3 = e4.reverse, l2 = e4.unique;
            return new Promise(function(t3, n3) {
              t3 = E(t3);
              var e5 = a3.index, r3 = a3.range, o3 = c3.objectStore(w2), o3 = e5.isPrimaryKey ? o3 : o3.index(e5.name), e5 = u3 ? l2 ? "prevunique" : "prev" : l2 ? "nextunique" : "next", s3 = !i3 && "openKeyCursor" in o3 ? o3.openKeyCursor(_2(r3), e5) : o3.openCursor(_2(r3), e5);
              s3.onerror = I(n3), s3.onsuccess = E(function(e6) {
                var r4, o4, i4, a4, u4 = s3.result;
                u4 ? (u4.___id = ++Zt, u4.done = false, r4 = u4.continue.bind(u4), o4 = (o4 = u4.continuePrimaryKey) && o4.bind(u4), i4 = u4.advance.bind(u4), a4 = function() {
                  throw new Error("Cursor not stopped");
                }, u4.trans = c3, u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = function() {
                  throw new Error("Cursor not started");
                }, u4.fail = E(n3), u4.next = function() {
                  var e7 = this, t4 = 1;
                  return this.start(function() {
                    return t4-- ? e7.continue() : e7.stop();
                  }).then(function() {
                    return e7;
                  });
                }, u4.start = function(e7) {
                  function t4() {
                    if (s3.result) try {
                      e7();
                    } catch (e8) {
                      u4.fail(e8);
                    }
                    else u4.done = true, u4.start = function() {
                      throw new Error("Cursor behind last entry");
                    }, u4.stop();
                  }
                  var n4 = new Promise(function(t5, e8) {
                    t5 = E(t5), s3.onerror = I(e8), u4.fail = e8, u4.stop = function(e9) {
                      u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = a4, t5(e9);
                    };
                  });
                  return s3.onsuccess = E(function(e8) {
                    s3.onsuccess = t4, t4();
                  }), u4.continue = r4, u4.continuePrimaryKey = o4, u4.advance = i4, t4(), n4;
                }, t3(u4)) : t3(null);
              }, n3);
            });
          }, count: function(e4) {
            var t3 = e4.query, o3 = e4.trans, i3 = t3.index, a3 = t3.range;
            return new Promise(function(t4, e5) {
              var n3 = o3.objectStore(w2), n3 = i3.isPrimaryKey ? n3 : n3.index(i3.name), r3 = _2(a3), r3 = r3 ? n3.count(r3) : n3.count();
              r3.onsuccess = E(function(e6) {
                return t4(e6.target.result);
              }), r3.onerror = I(e5);
            });
          } };
        }
        r2 = t2, i2 = Jt((t2 = e2).objectStoreNames), s2 = 0 < i2.length ? r2.objectStore(i2[0]) : {};
        var r2, t2 = { schema: { name: t2.name, tables: i2.map(function(e3) {
          return r2.objectStore(e3);
        }).map(function(t3) {
          var e3 = t3.keyPath, n3 = t3.autoIncrement, r3 = x(e3), o3 = {}, r3 = { name: t3.name, primaryKey: { name: null, isPrimaryKey: true, outbound: null == e3, compound: r3, keyPath: e3, autoIncrement: n3, unique: true, extractKey: Ht(e3) }, indexes: Jt(t3.indexNames).map(function(e4) {
            return t3.index(e4);
          }).map(function(e4) {
            var t4 = e4.name, n4 = e4.unique, r4 = e4.multiEntry, e4 = e4.keyPath, t4 = { name: t4, compound: x(e4), keyPath: e4, unique: n4, multiEntry: r4, extractKey: Ht(e4) };
            return o3[en(e4)] = t4;
          }), getIndexByKeyPath: function(e4) {
            return o3[en(e4)];
          } };
          return o3[":id"] = r3.primaryKey, null != e3 && (o3[en(e3)] = r3.primaryKey), r3;
        }) }, hasGetAll: 0 < i2.length && "getAll" in s2 && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604), hasIdb3Features: "getAllRecords" in s2 }, i2 = t2.schema, a2 = t2.hasGetAll, u2 = t2.hasIdb3Features, s2 = i2.tables.map(n2), c2 = {};
        return s2.forEach(function(e3) {
          return c2[e3.name] = e3;
        }), { stack: "dbcore", transaction: e2.transaction.bind(e2), table: function(e3) {
          if (c2[e3]) return c2[e3];
          throw new Error("Table '".concat(e3, "' not found"));
        }, MIN_KEY: -1 / 0, MAX_KEY: Xt(o2), schema: i2 };
      }
      function nn(e2, t2, n2, r2) {
        n2 = n2.IDBKeyRange;
        return t2 = tn(t2, n2, r2), { dbcore: e2.dbcore.reduce(function(e3, t3) {
          t3 = t3.create;
          return _(_({}, e3), t3(e3));
        }, t2) };
      }
      function rn(n2, e2) {
        var t2 = e2.db, t2 = nn(n2._middlewares, t2, n2._deps, e2);
        n2.core = t2.dbcore, n2.tables.forEach(function(e3) {
          var t3 = e3.name;
          n2.core.schema.tables.some(function(e4) {
            return e4.name === t3;
          }) && (e3.core = n2.core.table(t3), n2[t3] instanceof n2.Table) && (n2[t3].core = e3.core);
        });
      }
      function on(o2, e2, t2, i2) {
        t2.forEach(function(n2) {
          var r2 = i2[n2];
          e2.forEach(function(e3) {
            var t3 = function e4(t4, n3) {
              return z(t4, n3) || (t4 = F(t4)) && e4(t4, n3);
            }(e3, n2);
            (!t3 || "value" in t3 && void 0 === t3.value) && (e3 === o2.Transaction.prototype || e3 instanceof o2.Transaction ? u(e3, n2, { get: function() {
              return this.table(n2);
            }, set: function(e4) {
              L(this, n2, { value: e4, writable: true, configurable: true, enumerable: true });
            } }) : e3[n2] = new o2.Table(n2, r2));
          });
        });
      }
      function an(n2, e2) {
        e2.forEach(function(e3) {
          for (var t2 in e3) e3[t2] instanceof n2.Table && delete e3[t2];
        });
      }
      function un(e2, t2) {
        return e2._cfg.version - t2._cfg.version;
      }
      function sn(n2, r2, o2, e2) {
        var i2 = n2._dbSchema, a2 = (o2.objectStoreNames.contains("$meta") && !i2.$meta && (i2.$meta = Gt("$meta", vn("")[0], []), n2._storeNames.push("$meta")), n2._createTransaction("readwrite", n2._storeNames, i2)), u2 = (a2.create(o2), a2._completion.catch(e2), a2._reject.bind(a2)), s2 = P.transless || P;
        v(function() {
          if (P.trans = a2, P.transless = s2, 0 !== r2) return rn(n2, o2), t2 = r2, ((e3 = a2).storeNames.includes("$meta") ? e3.table("$meta").get("version").then(function(e4) {
            return null != e4 ? e4 : t2;
          }) : K.resolve(t2)).then(function(e4) {
            var s3 = n2, c2 = e4, l2 = a2, f2 = o2, t3 = [], e4 = s3._versions, h2 = s3._dbSchema = pn(0, s3.idbdb, f2);
            return 0 === (e4 = e4.filter(function(e5) {
              return e5._cfg.version >= c2;
            })).length ? K.resolve() : (e4.forEach(function(u3) {
              t3.push(function() {
                var t4, n3, r3, o3 = h2, e5 = u3._cfg.dbschema, i3 = (yn(s3, o3, f2), yn(s3, e5, f2), h2 = s3._dbSchema = e5, ln(o3, e5)), a3 = (i3.add.forEach(function(e6) {
                  fn(f2, e6[0], e6[1].primKey, e6[1].indexes);
                }), i3.change.forEach(function(e6) {
                  if (e6.recreate) throw new k.Upgrade("Not yet support for changing primary key");
                  var t5 = f2.objectStore(e6.name);
                  e6.add.forEach(function(e7) {
                    return dn(t5, e7);
                  }), e6.change.forEach(function(e7) {
                    t5.deleteIndex(e7.name), dn(t5, e7);
                  }), e6.del.forEach(function(e7) {
                    return t5.deleteIndex(e7);
                  });
                }), u3._cfg.contentUpgrade);
                if (a3 && u3._cfg.version > c2) return rn(s3, f2), l2._memoizedTables = {}, t4 = G(e5), i3.del.forEach(function(e6) {
                  t4[e6] = o3[e6];
                }), an(s3, [s3.Transaction.prototype]), on(s3, [s3.Transaction.prototype], O(t4), t4), l2.schema = t4, (n3 = ue(a3)) && nt(), e5 = K.follow(function() {
                  var e6;
                  (r3 = a3(l2)) && n3 && (e6 = w.bind(null, null), r3.then(e6, e6));
                }), r3 && "function" == typeof r3.then ? K.resolve(r3) : e5.then(function() {
                  return r3;
                });
              }), t3.push(function(e5) {
                var t4, n3, r3 = u3._cfg.dbschema;
                t4 = r3, n3 = e5, [].slice.call(n3.db.objectStoreNames).forEach(function(e6) {
                  return null == t4[e6] && n3.db.deleteObjectStore(e6);
                }), an(s3, [s3.Transaction.prototype]), on(s3, [s3.Transaction.prototype], s3._storeNames, s3._dbSchema), l2.schema = s3._dbSchema;
              }), t3.push(function(e5) {
                s3.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s3.idbdb.version / 10) === u3._cfg.version ? (s3.idbdb.deleteObjectStore("$meta"), delete s3._dbSchema.$meta, s3._storeNames = s3._storeNames.filter(function(e6) {
                  return "$meta" !== e6;
                })) : e5.objectStore("$meta").put(u3._cfg.version, "version"));
              });
            }), function e5() {
              return t3.length ? K.resolve(t3.shift()(l2.idbtrans)).then(e5) : K.resolve();
            }().then(function() {
              hn(h2, f2);
            }));
          }).catch(u2);
          var e3, t2;
          O(i2).forEach(function(e4) {
            fn(o2, e4, i2[e4].primKey, i2[e4].indexes);
          }), rn(n2, o2), K.follow(function() {
            return n2.on.populate.fire(a2);
          }).catch(u2);
        });
      }
      function cn(e2, r2) {
        hn(e2._dbSchema, r2), r2.db.version % 10 != 0 || r2.objectStoreNames.contains("$meta") || r2.db.createObjectStore("$meta").add(Math.ceil(r2.db.version / 10 - 1), "version");
        var t2 = pn(0, e2.idbdb, r2);
        yn(e2, e2._dbSchema, r2);
        for (var n2 = 0, o2 = ln(t2, e2._dbSchema).change; n2 < o2.length; n2++) {
          var i2 = ((t3) => {
            if (t3.change.length || t3.recreate) return console.warn("Unable to patch indexes of table ".concat(t3.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
            var n3 = r2.objectStore(t3.name);
            t3.add.forEach(function(e3) {
              l && console.debug("Dexie upgrade patch: Creating missing index ".concat(t3.name, ".").concat(e3.src)), dn(n3, e3);
            });
          })(o2[n2]);
          if ("object" == typeof i2) return i2.value;
        }
      }
      function ln(e2, t2) {
        var n2, r2 = { del: [], add: [], change: [] };
        for (n2 in e2) t2[n2] || r2.del.push(n2);
        for (n2 in t2) {
          var o2 = e2[n2], i2 = t2[n2];
          if (o2) {
            var a2 = { name: n2, def: i2, recreate: false, del: [], add: [], change: [] };
            if ("" + (o2.primKey.keyPath || "") != "" + (i2.primKey.keyPath || "") || o2.primKey.auto !== i2.primKey.auto) a2.recreate = true, r2.change.push(a2);
            else {
              var u2 = o2.idxByName, s2 = i2.idxByName, c2 = void 0;
              for (c2 in u2) s2[c2] || a2.del.push(c2);
              for (c2 in s2) {
                var l2 = u2[c2], f2 = s2[c2];
                l2 ? l2.src !== f2.src && a2.change.push(f2) : a2.add.push(f2);
              }
              (0 < a2.del.length || 0 < a2.add.length || 0 < a2.change.length) && r2.change.push(a2);
            }
          } else r2.add.push([n2, i2]);
        }
        return r2;
      }
      function fn(e2, t2, n2, r2) {
        var o2 = e2.db.createObjectStore(t2, n2.keyPath ? { keyPath: n2.keyPath, autoIncrement: n2.auto } : { autoIncrement: n2.auto });
        r2.forEach(function(e3) {
          return dn(o2, e3);
        });
      }
      function hn(t2, n2) {
        O(t2).forEach(function(e2) {
          n2.db.objectStoreNames.contains(e2) || (l && console.debug("Dexie: Creating missing table", e2), fn(n2, e2, t2[e2].primKey, t2[e2].indexes));
        });
      }
      function dn(e2, t2) {
        e2.createIndex(t2.name, t2.keyPath, { unique: t2.unique, multiEntry: t2.multi });
      }
      function pn(e2, t2, u2) {
        var s2 = {};
        return W(t2.objectStoreNames, 0).forEach(function(e3) {
          for (var t3 = u2.objectStore(e3), n2 = $t(Qt(a2 = t3.keyPath), a2 || "", true, false, !!t3.autoIncrement, a2 && "string" != typeof a2, true), r2 = [], o2 = 0; o2 < t3.indexNames.length; ++o2) {
            var i2 = t3.index(t3.indexNames[o2]), a2 = i2.keyPath, i2 = $t(i2.name, a2, !!i2.unique, !!i2.multiEntry, false, a2 && "string" != typeof a2, false);
            r2.push(i2);
          }
          s2[e3] = Gt(e3, n2, r2);
        }), s2;
      }
      function yn(e2, t2, n2) {
        for (var r2 = n2.db.objectStoreNames, o2 = 0; o2 < r2.length; ++o2) {
          var i2 = r2[o2], a2 = n2.objectStore(i2);
          e2._hasGetAll = "getAll" in a2;
          for (var u2 = 0; u2 < a2.indexNames.length; ++u2) {
            var s2, c2 = a2.indexNames[u2], l2 = a2.index(c2).keyPath, l2 = "string" == typeof l2 ? l2 : "[" + W(l2).join("+") + "]";
            t2[i2] && (s2 = t2[i2].idxByName[l2]) && (s2.name = c2, delete t2[i2].idxByName[l2], t2[i2].idxByName[c2] = s2);
          }
        }
        "undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e2._hasGetAll = false);
      }
      function vn(e2) {
        return e2.split(",").map(function(e3, t2) {
          var n2 = e3.split(":"), r2 = null == (r2 = n2[1]) ? void 0 : r2.trim(), n2 = (e3 = n2[0].trim()).replace(/([&*]|\+\+)/g, ""), o2 = /^\[/.test(n2) ? n2.match(/^\[(.*)\]$/)[1].split("+") : n2;
          return $t(n2, o2 || null, /\&/.test(e3), /\*/.test(e3), /\+\+/.test(e3), x(o2), 0 === t2, r2);
        });
      }
      bn.prototype._createTableSchema = Gt, bn.prototype._parseIndexSyntax = vn, bn.prototype._parseStoresSpec = function(r2, o2) {
        var i2 = this;
        O(r2).forEach(function(e2) {
          if (null !== r2[e2]) {
            var t2 = i2._parseIndexSyntax(r2[e2]), n2 = t2.shift();
            if (!n2) throw new k.Schema("Invalid schema for table " + e2 + ": " + r2[e2]);
            if (n2.unique = true, n2.multi) throw new k.Schema("Primary key cannot be multiEntry*");
            t2.forEach(function(e3) {
              if (e3.auto) throw new k.Schema("Only primary key can be marked as autoIncrement (++)");
              if (!e3.keyPath) throw new k.Schema("Index must have a name and cannot be an empty string");
            });
            n2 = i2._createTableSchema(e2, n2, t2);
            o2[e2] = n2;
          }
        });
      }, bn.prototype.stores = function(e2) {
        var t2 = this.db, e2 = (this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e2) : e2, t2._versions), n2 = {}, r2 = {};
        return e2.forEach(function(e3) {
          a(n2, e3._cfg.storesSource), r2 = e3._cfg.dbschema = {}, e3._parseStoresSpec(n2, r2);
        }), t2._dbSchema = r2, an(t2, [t2._allTables, t2, t2.Transaction.prototype]), on(t2, [t2._allTables, t2, t2.Transaction.prototype, this._cfg.tables], O(r2), r2), t2._storeNames = O(r2), this;
      }, bn.prototype.upgrade = function(e2) {
        return this._cfg.contentUpgrade = ke(this._cfg.contentUpgrade || g, e2), this;
      };
      var mn = bn;
      function bn() {
      }
      var gn = (() => {
        var o2, i2, t2;
        return "undefined" != typeof FinalizationRegistry && "undefined" != typeof WeakRef ? (o2 = /* @__PURE__ */ new Set(), i2 = new FinalizationRegistry(function(e2) {
          o2.delete(e2);
        }), { toArray: function() {
          return Array.from(o2).map(function(e2) {
            return e2.deref();
          }).filter(function(e2) {
            return void 0 !== e2;
          });
        }, add: function(e2) {
          var t3 = new WeakRef(e2._novip);
          o2.add(t3), i2.register(e2._novip, t3, t3), o2.size > e2._options.maxConnections && (t3 = o2.values().next().value, o2.delete(t3), i2.unregister(t3));
        }, remove: function(e2) {
          if (e2) for (var t3 = o2.values(), n2 = t3.next(); !n2.done; ) {
            var r2 = n2.value;
            if (r2.deref() === e2._novip) return o2.delete(r2), void i2.unregister(r2);
            n2 = t3.next();
          }
        } }) : (t2 = [], { toArray: function() {
          return t2;
        }, add: function(e2) {
          t2.push(e2._novip);
        }, remove: function(e2) {
          e2 && -1 !== (e2 = t2.indexOf(e2._novip)) && t2.splice(e2, 1);
        } });
      })();
      function wn(e2, t2) {
        var n2 = e2._dbNamesDB;
        return n2 || (n2 = e2._dbNamesDB = new y(ft, { addons: [], indexedDB: e2, IDBKeyRange: t2 })).version(1).stores({ dbnames: "name" }), n2.table("dbnames");
      }
      function _n(e2) {
        return e2 && "function" == typeof e2.databases;
      }
      function xn(e2) {
        return v(function() {
          return P.letThrough = true, e2();
        });
      }
      function kn(e2) {
        return !("from" in e2);
      }
      var q = function(e2, t2) {
        var n2;
        if (!this) return n2 = new q(), e2 && "d" in e2 && a(n2, e2), n2;
        a(this, arguments.length ? { d: 1, from: e2, to: 1 < arguments.length ? t2 : e2 } : { d: 0 });
      };
      function On(e2, t2, n2) {
        var r2 = C(t2, n2);
        if (!isNaN(r2)) {
          if (0 < r2) throw RangeError();
          if (kn(e2)) return a(e2, { from: t2, to: n2, d: 1 });
          var r2 = e2.l, o2 = e2.r;
          if (C(n2, e2.from) < 0) return r2 ? On(r2, t2, n2) : e2.l = { from: t2, to: n2, d: 1, l: null, r: null }, Sn(e2);
          if (0 < C(t2, e2.to)) return o2 ? On(o2, t2, n2) : e2.r = { from: t2, to: n2, d: 1, l: null, r: null }, Sn(e2);
          C(t2, e2.from) < 0 && (e2.from = t2, e2.l = null, e2.d = o2 ? o2.d + 1 : 1), 0 < C(n2, e2.to) && (e2.to = n2, e2.r = null, e2.d = e2.l ? e2.l.d + 1 : 1);
          t2 = !e2.r;
          r2 && !e2.l && Pn(e2, r2), o2 && t2 && Pn(e2, o2);
        }
      }
      function Pn(e2, t2) {
        kn(t2) || function e3(t3, n2) {
          var r2 = n2.from, o2 = n2.l, i2 = n2.r;
          On(t3, r2, n2.to), o2 && e3(t3, o2), i2 && e3(t3, i2);
        }(e2, t2);
      }
      function Kn(e2, t2) {
        var n2 = En(t2), r2 = n2.next();
        if (!r2.done) for (var o2 = r2.value, i2 = En(e2), a2 = i2.next(o2.from), u2 = a2.value; !r2.done && !a2.done; ) {
          if (C(u2.from, o2.to) <= 0 && 0 <= C(u2.to, o2.from)) return true;
          C(o2.from, u2.from) < 0 ? o2 = (r2 = n2.next(u2.from)).value : u2 = (a2 = i2.next(o2.from)).value;
        }
        return false;
      }
      function En(e2) {
        var n2 = kn(e2) ? null : { s: 0, n: e2 };
        return { next: function(e3) {
          for (var t2 = 0 < arguments.length; n2; ) switch (n2.s) {
            case 0:
              if (n2.s = 1, t2) for (; n2.n.l && C(e3, n2.n.from) < 0; ) n2 = { up: n2, n: n2.n.l, s: 1 };
              else for (; n2.n.l; ) n2 = { up: n2, n: n2.n.l, s: 1 };
            case 1:
              if (n2.s = 2, !t2 || C(e3, n2.n.to) <= 0) return { value: n2.n, done: false };
            case 2:
              if (n2.n.r) {
                n2.s = 3, n2 = { up: n2, n: n2.n.r, s: 0 };
                continue;
              }
            case 3:
              n2 = n2.up;
          }
          return { done: true };
        } };
      }
      function Sn(e2) {
        var t2, n2, r2, o2 = ((null == (o2 = e2.r) ? void 0 : o2.d) || 0) - ((null == (o2 = e2.l) ? void 0 : o2.d) || 0), o2 = 1 < o2 ? "r" : o2 < -1 ? "l" : "";
        o2 && (t2 = "r" == o2 ? "l" : "r", n2 = _({}, e2), r2 = e2[o2], e2.from = r2.from, e2.to = r2.to, e2[o2] = r2[o2], n2[o2] = r2[t2], (e2[t2] = n2).d = An(n2)), e2.d = An(e2);
      }
      function An(e2) {
        var t2 = e2.r, e2 = e2.l;
        return (t2 ? e2 ? Math.max(t2.d, e2.d) : t2.d : e2 ? e2.d : 0) + 1;
      }
      function Cn(t2, n2) {
        return O(n2).forEach(function(e2) {
          t2[e2] ? Pn(t2[e2], n2[e2]) : t2[e2] = function e3(t3) {
            var n3, r2, o2 = {};
            for (n3 in t3) m(t3, n3) && (r2 = t3[n3], o2[n3] = !r2 || "object" != typeof r2 || J.has(r2.constructor) ? r2 : e3(r2));
            return o2;
          }(n2[e2]);
        }), t2;
      }
      function jn(t2, n2) {
        return t2.all || n2.all || Object.keys(t2).some(function(e2) {
          return n2[e2] && Kn(n2[e2], t2[e2]);
        });
      }
      M(q.prototype, ((t = { add: function(e2) {
        return Pn(this, e2), this;
      }, addKey: function(e2) {
        return On(this, e2, e2), this;
      }, addKeys: function(e2) {
        var t2 = this;
        return e2.forEach(function(e3) {
          return On(t2, e3, e3);
        }), this;
      }, hasKey: function(e2) {
        var t2 = En(this).next(e2).value;
        return t2 && C(t2.from, e2) <= 0 && 0 <= C(t2.to, e2);
      } })[re] = function() {
        return En(this);
      }, t));
      var Tn = {}, In = {}, qn = false;
      function Dn(e2) {
        Cn(In, e2), qn || (qn = true, setTimeout(function() {
          qn = false, Bn(In, !(In = {}));
        }, 0));
      }
      function Bn(e2, t2) {
        void 0 === t2 && (t2 = false);
        var n2 = /* @__PURE__ */ new Set();
        if (e2.all) for (var r2 = 0, o2 = Object.values(Tn); r2 < o2.length; r2++) Rn(u2 = o2[r2], e2, n2, t2);
        else for (var i2 in e2) {
          var a2, u2, i2 = /^idb\:\/\/(.*)\/(.*)\//.exec(i2);
          i2 && (a2 = i2[1], i2 = i2[2], u2 = Tn["idb://".concat(a2, "/").concat(i2)]) && Rn(u2, e2, n2, t2);
        }
        n2.forEach(function(e3) {
          return e3();
        });
      }
      function Rn(e2, t2, n2, r2) {
        for (var o2 = [], i2 = 0, a2 = Object.entries(e2.queries.query); i2 < a2.length; i2++) {
          for (var u2 = a2[i2], s2 = u2[0], c2 = [], l2 = 0, f2 = u2[1]; l2 < f2.length; l2++) {
            var h2 = f2[l2];
            jn(t2, h2.obsSet) ? h2.subscribers.forEach(function(e3) {
              return n2.add(e3);
            }) : r2 && c2.push(h2);
          }
          r2 && o2.push([s2, c2]);
        }
        if (r2) for (var d2 = 0, p2 = o2; d2 < p2.length; d2++) {
          var y2 = p2[d2], s2 = y2[0], c2 = y2[1];
          e2.queries.query[s2] = c2;
        }
      }
      function Fn(h2) {
        var d2 = h2._state, r2 = h2._deps.indexedDB;
        if (d2.isBeingOpened || h2.idbdb) return d2.dbReadyPromise.then(function() {
          return d2.dbOpenError ? S(d2.dbOpenError) : h2;
        });
        d2.isBeingOpened = true, d2.dbOpenError = null, d2.openComplete = false;
        var t2 = d2.openCanceller, p2 = Math.round(10 * h2.verno), y2 = false;
        function e2() {
          if (d2.openCanceller !== t2) throw new k.DatabaseClosed("db.open() was cancelled");
        }
        function v2() {
          return new K(function(c2, n3) {
            if (e2(), !r2) throw new k.MissingAPI();
            var l2 = h2.name, f2 = d2.autoSchema || !p2 ? r2.open(l2) : r2.open(l2, p2);
            if (!f2) throw new k.MissingAPI();
            f2.onerror = I(n3), f2.onblocked = E(h2._fireOnBlocked), f2.onupgradeneeded = E(function(e3) {
              var t3;
              m2 = f2.transaction, d2.autoSchema && !h2._options.allowEmptyDB ? (f2.onerror = Ut, m2.abort(), f2.result.close(), (t3 = r2.deleteDatabase(l2)).onsuccess = t3.onerror = E(function() {
                n3(new k.NoSuchDatabase("Database ".concat(l2, " doesnt exist")));
              })) : (m2.onerror = I(n3), t3 = e3.oldVersion > Math.pow(2, 62) ? 0 : e3.oldVersion, b2 = t3 < 1, h2.idbdb = f2.result, y2 && cn(h2, m2), sn(h2, t3 / 10, m2, n3));
            }, n3), f2.onsuccess = E(function() {
              m2 = null;
              var e3, t3, n4, r3, o3, i2, a2 = h2.idbdb = f2.result, u2 = W(a2.objectStoreNames);
              if (0 < u2.length) try {
                var s2 = a2.transaction(1 === (o3 = u2).length ? o3[0] : o3, "readonly");
                if (d2.autoSchema) i2 = a2, r3 = s2, (n4 = h2).verno = i2.version / 10, r3 = n4._dbSchema = pn(0, i2, r3), n4._storeNames = W(i2.objectStoreNames, 0), on(n4, [n4._allTables], O(r3), r3);
                else if (yn(h2, h2._dbSchema, s2), t3 = s2, ((t3 = ln(pn(0, (e3 = h2).idbdb, t3), e3._dbSchema)).add.length || t3.change.some(function(e4) {
                  return e4.add.length || e4.change.length;
                })) && !y2) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), a2.close(), p2 = a2.version + 1, y2 = true, c2(v2());
                rn(h2, s2);
              } catch (e4) {
              }
              gn.add(h2), a2.onversionchange = E(function(e4) {
                d2.vcFired = true, h2.on("versionchange").fire(e4);
              }), a2.onclose = E(function() {
                h2.close({ disableAutoOpen: false });
              }), b2 && (u2 = h2._deps, o3 = l2, _n(i2 = u2.indexedDB) || o3 === ft || wn(i2, u2.IDBKeyRange).put({ name: o3 }).catch(g)), c2();
            }, n3);
          }).catch(function(e3) {
            switch (null == e3 ? void 0 : e3.name) {
              case "UnknownError":
                if (0 < d2.PR1398_maxLoop) return d2.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), v2();
                break;
              case "VersionError":
                if (0 < p2) return p2 = 0, v2();
            }
            return K.reject(e3);
          });
        }
        var n2, o2 = d2.dbReadyResolve, m2 = null, b2 = false;
        return K.race([t2, ("undefined" == typeof navigator ? K.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e3) {
          function t3() {
            return indexedDB.databases().finally(e3);
          }
          n2 = setInterval(t3, 100), t3();
        }).finally(function() {
          return clearInterval(n2);
        }) : Promise.resolve()).then(v2)]).then(function() {
          return e2(), d2.onReadyBeingFired = [], K.resolve(xn(function() {
            return h2.on.ready.fire(h2.vip);
          })).then(function e3() {
            var t3;
            if (0 < d2.onReadyBeingFired.length) return t3 = d2.onReadyBeingFired.reduce(ke, g), d2.onReadyBeingFired = [], K.resolve(xn(function() {
              return t3(h2.vip);
            })).then(e3);
          });
        }).finally(function() {
          d2.openCanceller === t2 && (d2.onReadyBeingFired = null, d2.isBeingOpened = false);
        }).catch(function(e3) {
          d2.dbOpenError = e3;
          try {
            m2 && m2.abort();
          } catch (e4) {
          }
          return t2 === d2.openCanceller && h2._close(), S(e3);
        }).finally(function() {
          d2.openComplete = true, o2();
        }).then(function() {
          var n3;
          return b2 && (n3 = {}, h2.tables.forEach(function(t3) {
            t3.schema.indexes.forEach(function(e3) {
              e3.name && (n3["idb://".concat(h2.name, "/").concat(t3.name, "/").concat(e3.name)] = new q(-1 / 0, [[[]]]));
            }), n3["idb://".concat(h2.name, "/").concat(t3.name, "/")] = n3["idb://".concat(h2.name, "/").concat(t3.name, "/:dels")] = new q(-1 / 0, [[[]]]);
          }), Wt(zt).fire(n3), Bn(n3, true)), h2;
        });
      }
      function Nn(t2) {
        function e2(e3) {
          return t2.next(e3);
        }
        var r2 = n2(e2), o2 = n2(function(e3) {
          return t2.throw(e3);
        });
        function n2(n3) {
          return function(e3) {
            var e3 = n3(e3), t3 = e3.value;
            return e3.done ? t3 : t3 && "function" == typeof t3.then ? t3.then(r2, o2) : x(t3) ? Promise.all(t3).then(r2, o2) : r2(t3);
          };
        }
        return n2(e2)();
      }
      function Mn(e2, t2, n2) {
        for (var r2 = x(e2) ? e2.slice() : [e2], o2 = 0; o2 < n2; ++o2) r2.push(t2);
        return r2;
      }
      var Ln = { stack: "dbcore", name: "VirtualIndexMiddleware", level: 1, create: function(l2) {
        return _(_({}, l2), { table: function(e2) {
          var i2 = l2.table(e2), e2 = i2.schema, u2 = {}, s2 = [];
          function c2(e3, t3, n3) {
            var r3 = en(e3), o3 = u2[r3] = u2[r3] || [], i3 = null == e3 ? 0 : "string" == typeof e3 ? 1 : e3.length, a3 = 0 < t3, r3 = _(_({}, n3), { name: a3 ? "".concat(r3, "(virtual-from:").concat(n3.name, ")") : n3.name, lowLevelIndex: n3, isVirtual: a3, keyTail: t3, keyLength: i3, extractKey: Ht(e3), unique: !a3 && n3.unique });
            return o3.push(r3), r3.isPrimaryKey || s2.push(r3), 1 < i3 && c2(2 === i3 ? e3[0] : e3.slice(0, i3 - 1), t3 + 1, n3), o3.sort(function(e4, t4) {
              return e4.keyTail - t4.keyTail;
            }), r3;
          }
          var t2 = c2(e2.primaryKey.keyPath, 0, e2.primaryKey);
          u2[":id"] = [t2];
          for (var n2 = 0, r2 = e2.indexes; n2 < r2.length; n2++) {
            var o2 = r2[n2];
            c2(o2.keyPath, 0, o2);
          }
          function a2(e3) {
            var t3, n3 = e3.query.index;
            return n3.isVirtual ? _(_({}, e3), { query: { index: n3.lowLevelIndex, range: (t3 = e3.query.range, n3 = n3.keyTail, { type: 1 === t3.type ? 2 : t3.type, lower: Mn(t3.lower, t3.lowerOpen ? l2.MAX_KEY : l2.MIN_KEY, n3), lowerOpen: true, upper: Mn(t3.upper, t3.upperOpen ? l2.MIN_KEY : l2.MAX_KEY, n3), upperOpen: true }) } }) : e3;
          }
          return _(_({}, i2), { schema: _(_({}, e2), { primaryKey: t2, indexes: s2, getIndexByKeyPath: function(e3) {
            return (e3 = u2[en(e3)]) && e3[0];
          } }), count: function(e3) {
            return i2.count(a2(e3));
          }, query: function(e3) {
            return i2.query(a2(e3));
          }, openCursor: function(t3) {
            var e3 = t3.query.index, r3 = e3.keyTail, o3 = e3.keyLength;
            return e3.isVirtual ? i2.openCursor(a2(t3)).then(function(e4) {
              return e4 && n3(e4);
            }) : i2.openCursor(t3);
            function n3(n4) {
              return Object.create(n4, { continue: { value: function(e4) {
                null != e4 ? n4.continue(Mn(e4, t3.reverse ? l2.MAX_KEY : l2.MIN_KEY, r3)) : t3.unique ? n4.continue(n4.key.slice(0, o3).concat(t3.reverse ? l2.MIN_KEY : l2.MAX_KEY, r3)) : n4.continue();
              } }, continuePrimaryKey: { value: function(e4, t4) {
                n4.continuePrimaryKey(Mn(e4, l2.MAX_KEY, r3), t4);
              } }, primaryKey: { get: function() {
                return n4.primaryKey;
              } }, key: { get: function() {
                var e4 = n4.key;
                return 1 === o3 ? e4[0] : e4.slice(0, o3);
              } }, value: { get: function() {
                return n4.value;
              } } });
            }
          } });
        } });
      } };
      function Un(o2, i2, a2, u2) {
        return a2 = a2 || {}, u2 = u2 || "", O(o2).forEach(function(e2) {
          var t2, n2, r2;
          m(i2, e2) ? (t2 = o2[e2], n2 = i2[e2], "object" == typeof t2 && "object" == typeof n2 && t2 && n2 ? (r2 = ne(t2)) !== ne(n2) ? a2[u2 + e2] = i2[e2] : "Object" === r2 ? Un(t2, n2, a2, u2 + e2 + ".") : t2 !== n2 && (a2[u2 + e2] = i2[e2]) : t2 !== n2 && (a2[u2 + e2] = i2[e2])) : a2[u2 + e2] = void 0;
        }), O(i2).forEach(function(e2) {
          m(o2, e2) || (a2[u2 + e2] = i2[e2]);
        }), a2;
      }
      function zn(e2, t2) {
        return "delete" === t2.type ? t2.keys : t2.keys || t2.values.map(e2.extractKey);
      }
      var Vn = { stack: "dbcore", name: "HooksMiddleware", level: 2, create: function(e2) {
        return _(_({}, e2), { table: function(r2) {
          var y2 = e2.table(r2), v2 = y2.schema.primaryKey;
          return _(_({}, y2), { mutate: function(e3) {
            var t2 = P.trans, n2 = t2.table(r2).hook, h2 = n2.deleting, d2 = n2.creating, p2 = n2.updating;
            switch (e3.type) {
              case "add":
                if (d2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "put":
                if (d2.fire === g && p2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "delete":
                if (h2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "deleteRange":
                if (h2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return function n3(r3, o2, i2) {
                    return y2.query({ trans: r3, values: false, query: { index: v2, range: o2 }, limit: i2 }).then(function(e4) {
                      var t3 = e4.result;
                      return a2({ type: "delete", keys: t3, trans: r3 }).then(function(e5) {
                        return 0 < e5.numFailures ? Promise.reject(e5.failures[0]) : t3.length < i2 ? { failures: [], numFailures: 0, lastResult: void 0 } : n3(r3, _(_({}, o2), { lower: t3[t3.length - 1], lowerOpen: true }), i2);
                      });
                    });
                  }(e3.trans, e3.range, 1e4);
                }, true);
            }
            return y2.mutate(e3);
            function a2(c2) {
              var e4, t3, n3, l2 = P.trans, f2 = c2.keys || zn(v2, c2);
              if (f2) return "delete" !== (c2 = "add" === c2.type || "put" === c2.type ? _(_({}, c2), { keys: f2 }) : _({}, c2)).type && (c2.values = R([], c2.values)), c2.keys && (c2.keys = R([], c2.keys)), e4 = y2, n3 = f2, ("add" === (t3 = c2).type ? Promise.resolve([]) : e4.getMany({ trans: t3.trans, keys: n3, cache: "immutable" })).then(function(u2) {
                var s2 = f2.map(function(e5, t4) {
                  var n4, r3, o2, i2 = u2[t4], a3 = { onerror: null, onsuccess: null };
                  return "delete" === c2.type ? h2.fire.call(a3, e5, i2, l2) : "add" === c2.type || void 0 === i2 ? (n4 = d2.fire.call(a3, e5, c2.values[t4], l2), null == e5 && null != n4 && (c2.keys[t4] = e5 = n4, v2.outbound || b(c2.values[t4], v2.keyPath, e5))) : (n4 = Un(i2, c2.values[t4]), (r3 = p2.fire.call(a3, n4, e5, i2, l2)) && (o2 = c2.values[t4], Object.keys(r3).forEach(function(e6) {
                    m(o2, e6) ? o2[e6] = r3[e6] : b(o2, e6, r3[e6]);
                  }))), a3;
                });
                return y2.mutate(c2).then(function(e5) {
                  for (var t4 = e5.failures, n4 = e5.results, r3 = e5.numFailures, e5 = e5.lastResult, o2 = 0; o2 < f2.length; ++o2) {
                    var i2 = (n4 || f2)[o2], a3 = s2[o2];
                    null == i2 ? a3.onerror && a3.onerror(t4[o2]) : a3.onsuccess && a3.onsuccess("put" === c2.type && u2[o2] ? c2.values[o2] : i2);
                  }
                  return { failures: t4, results: n4, numFailures: r3, lastResult: e5 };
                }).catch(function(t4) {
                  return s2.forEach(function(e5) {
                    return e5.onerror && e5.onerror(t4);
                  }), Promise.reject(t4);
                });
              });
              throw new Error("Keys missing");
            }
          } });
        } });
      } };
      function Wn(e2, t2, n2) {
        try {
          if (!t2) return null;
          if (t2.keys.length < e2.length) return null;
          for (var r2 = [], o2 = 0, i2 = 0; o2 < t2.keys.length && i2 < e2.length; ++o2) 0 === C(t2.keys[o2], e2[i2]) && (r2.push(n2 ? ee(t2.values[o2]) : t2.values[o2]), ++i2);
          return r2.length === e2.length ? r2 : null;
        } catch (e3) {
          return null;
        }
      }
      var Yn = { stack: "dbcore", level: -1, create: function(t2) {
        return { table: function(e2) {
          var n2 = t2.table(e2);
          return _(_({}, n2), { getMany: function(t3) {
            var e3;
            return t3.cache ? (e3 = Wn(t3.keys, t3.trans._cache, "clone" === t3.cache)) ? K.resolve(e3) : n2.getMany(t3).then(function(e4) {
              return t3.trans._cache = { keys: t3.keys, values: "clone" === t3.cache ? ee(e4) : e4 }, e4;
            }) : n2.getMany(t3);
          }, mutate: function(e3) {
            return "add" !== e3.type && (e3.trans._cache = null), n2.mutate(e3);
          } });
        } };
      } };
      function $n(e2, t2) {
        return "readonly" === e2.trans.mode && !!e2.subscr && !e2.trans.explicit && "disabled" !== e2.trans.db._options.cache && !t2.schema.primaryKey.outbound;
      }
      function Qn(e2, t2) {
        switch (e2) {
          case "query":
            return t2.values && !t2.unique;
          case "get":
          case "getMany":
          case "count":
          case "openCursor":
            return false;
        }
      }
      var Gn = { stack: "dbcore", level: 0, name: "Observability", create: function(b2) {
        var g2 = b2.schema.name, w2 = new q(b2.MIN_KEY, b2.MAX_KEY);
        return _(_({}, b2), { transaction: function(e2, t2, n2) {
          if (P.subscr && "readonly" !== t2) throw new k.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(P.querier));
          return b2.transaction(e2, t2, n2);
        }, table: function(d2) {
          function e2(e3) {
            var t3, e3 = e3.query;
            return [t3 = e3.index, new q(null != (t3 = (e3 = e3.range).lower) ? t3 : b2.MIN_KEY, null != (t3 = e3.upper) ? t3 : b2.MAX_KEY)];
          }
          var p2 = b2.table(d2), y2 = p2.schema, v2 = y2.primaryKey, t2 = y2.indexes, c2 = v2.extractKey, l2 = v2.outbound, m2 = v2.autoIncrement && t2.filter(function(e3) {
            return e3.compound && e3.keyPath.includes(v2.keyPath);
          }), n2 = _(_({}, p2), { mutate: function(a2) {
            function u2(e4) {
              return e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4), n3[e4] || (n3[e4] = new q());
            }
            var e3, i2, s2, t3 = a2.trans, n3 = a2.mutatedParts || (a2.mutatedParts = {}), r2 = u2(""), o2 = u2(":dels"), c3 = a2.type, l3 = "deleteRange" === a2.type ? [a2.range] : "delete" === a2.type ? [a2.keys] : a2.values.length < 50 ? [zn(v2, a2).filter(function(e4) {
              return e4;
            }), a2.values] : [], f3 = l3[0], l3 = l3[1], h2 = a2.trans._cache;
            return x(f3) ? (r2.addKeys(f3), (c3 = "delete" === c3 || f3.length === l3.length ? Wn(f3, h2) : null) || o2.addKeys(f3), (c3 || l3) && (e3 = u2, i2 = c3, s2 = l3, y2.indexes.forEach(function(t4) {
              var n4 = e3(t4.name || "");
              function r3(e4) {
                return null != e4 ? t4.extractKey(e4) : null;
              }
              function o3(e4) {
                t4.multiEntry && x(e4) ? e4.forEach(function(e5) {
                  return n4.addKey(e5);
                }) : n4.addKey(e4);
              }
              (i2 || s2).forEach(function(e4, t5) {
                var n5 = i2 && r3(i2[t5]), t5 = s2 && r3(s2[t5]);
                0 !== C(n5, t5) && (null != n5 && o3(n5), null != t5) && o3(t5);
              });
            }))) : f3 ? (l3 = { from: null != (h2 = f3.lower) ? h2 : b2.MIN_KEY, to: null != (c3 = f3.upper) ? c3 : b2.MAX_KEY }, o2.add(l3), r2.add(l3)) : (r2.add(w2), o2.add(w2), y2.indexes.forEach(function(e4) {
              return u2(e4.name).add(w2);
            })), p2.mutate(a2).then(function(i3) {
              return !f3 || "add" !== a2.type && "put" !== a2.type || (r2.addKeys(i3.results), m2 && m2.forEach(function(t4) {
                for (var e4 = a2.values.map(function(e5) {
                  return t4.extractKey(e5);
                }), n4 = t4.keyPath.findIndex(function(e5) {
                  return e5 === v2.keyPath;
                }), r3 = 0, o3 = i3.results.length; r3 < o3; ++r3) e4[r3][n4] = i3.results[r3];
                u2(t4.name).addKeys(e4);
              })), t3.mutatedParts = Cn(t3.mutatedParts || {}, n3), i3;
            });
          } }), f2 = { get: function(e3) {
            return [v2, new q(e3.key)];
          }, getMany: function(e3) {
            return [v2, new q().addKeys(e3.keys)];
          }, count: e2, query: e2, openCursor: e2 };
          return O(f2).forEach(function(s2) {
            n2[s2] = function(o2) {
              var e3 = P.subscr, t3 = !!e3, n3 = $n(P, p2) && Qn(s2, o2) ? o2.obsSet = {} : e3;
              if (t3) {
                var i2, e3 = function(e4) {
                  e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4);
                  return n3[e4] || (n3[e4] = new q());
                }, a2 = e3(""), u2 = e3(":dels"), t3 = f2[s2](o2), r2 = t3[0], t3 = t3[1];
                if (("query" === s2 && r2.isPrimaryKey && !o2.values ? u2 : e3(r2.name || "")).add(t3), !r2.isPrimaryKey) {
                  if ("count" !== s2) return i2 = "query" === s2 && l2 && o2.values && p2.query(_(_({}, o2), { values: false })), p2[s2].apply(this, arguments).then(function(t4) {
                    if ("query" === s2) {
                      if (l2 && o2.values) return i2.then(function(e5) {
                        e5 = e5.result;
                        return a2.addKeys(e5), t4;
                      });
                      var e4 = o2.values ? t4.result.map(c2) : t4.result;
                      (o2.values ? a2 : u2).addKeys(e4);
                    } else {
                      var n4, r3;
                      if ("openCursor" === s2) return r3 = o2.values, (n4 = t4) && Object.create(n4, { key: { get: function() {
                        return u2.addKey(n4.primaryKey), n4.key;
                      } }, primaryKey: { get: function() {
                        var e5 = n4.primaryKey;
                        return u2.addKey(e5), e5;
                      } }, value: { get: function() {
                        return r3 && a2.addKey(n4.primaryKey), n4.value;
                      } } });
                    }
                    return t4;
                  });
                  u2.add(w2);
                }
              }
              return p2[s2].apply(this, arguments);
            };
          }), n2;
        } });
      } };
      function Xn(e2, t2, n2) {
        var r2;
        return 0 === n2.numFailures ? t2 : "deleteRange" === t2.type || (r2 = t2.keys ? t2.keys.length : "values" in t2 && t2.values ? t2.values.length : 1, n2.numFailures === r2) ? null : (r2 = _({}, t2), x(r2.keys) && (r2.keys = r2.keys.filter(function(e3, t3) {
          return !(t3 in n2.failures);
        })), "values" in r2 && x(r2.values) && (r2.values = r2.values.filter(function(e3, t3) {
          return !(t3 in n2.failures);
        })), r2);
      }
      function Hn(e2, t2) {
        return n2 = e2, (void 0 === (r2 = t2).lower || (r2.lowerOpen ? 0 < C(n2, r2.lower) : 0 <= C(n2, r2.lower))) && (n2 = e2, void 0 === (r2 = t2).upper || (r2.upperOpen ? C(n2, r2.upper) < 0 : C(n2, r2.upper) <= 0));
        var n2, r2;
      }
      function Jn(e2, d2, t2, n2, r2, o2) {
        var i2, p2, y2, v2, m2, a2, u2;
        return !t2 || 0 === t2.length || (i2 = d2.query.index, p2 = i2.multiEntry, y2 = d2.query.range, v2 = n2.schema.primaryKey.extractKey, m2 = i2.extractKey, a2 = (i2.lowLevelIndex || i2).extractKey, (n2 = t2.reduce(function(e3, t3) {
          var n3 = e3, r3 = [];
          if ("add" === t3.type || "put" === t3.type) for (var o3 = new q(), i3 = t3.values.length - 1; 0 <= i3; --i3) {
            var a3, u3 = t3.values[i3], s2 = v2(u3);
            !o3.hasKey(s2) && (a3 = m2(u3), p2 && x(a3) ? a3.some(function(e4) {
              return Hn(e4, y2);
            }) : Hn(a3, y2)) && (o3.addKey(s2), r3.push(u3));
          }
          switch (t3.type) {
            case "add":
              var c2 = new q().addKeys(d2.values ? e3.map(function(e4) {
                return v2(e4);
              }) : e3), n3 = e3.concat(d2.values ? r3.filter(function(e4) {
                e4 = v2(e4);
                return !c2.hasKey(e4) && (c2.addKey(e4), true);
              }) : r3.map(function(e4) {
                return v2(e4);
              }).filter(function(e4) {
                return !c2.hasKey(e4) && (c2.addKey(e4), true);
              }));
              break;
            case "put":
              var l2 = new q().addKeys(t3.values.map(function(e4) {
                return v2(e4);
              }));
              n3 = e3.filter(function(e4) {
                return !l2.hasKey(d2.values ? v2(e4) : e4);
              }).concat(d2.values ? r3 : r3.map(function(e4) {
                return v2(e4);
              }));
              break;
            case "delete":
              var f2 = new q().addKeys(t3.keys);
              n3 = e3.filter(function(e4) {
                return !f2.hasKey(d2.values ? v2(e4) : e4);
              });
              break;
            case "deleteRange":
              var h2 = t3.range;
              n3 = e3.filter(function(e4) {
                return !Hn(v2(e4), h2);
              });
          }
          return n3;
        }, e2)) === e2) ? e2 : (u2 = function(e3, t3) {
          return C(a2(e3), a2(t3)) || C(v2(e3), v2(t3));
        }, n2.sort("prev" === d2.direction || "prevunique" === d2.direction ? function(e3, t3) {
          return u2(t3, e3);
        } : u2), d2.limit && d2.limit < 1 / 0 && (n2.length > d2.limit ? n2.length = d2.limit : e2.length === d2.limit && n2.length < d2.limit && (r2.dirty = true)), o2 ? Object.freeze(n2) : n2);
      }
      function Zn(e2, t2) {
        return 0 === C(e2.lower, t2.lower) && 0 === C(e2.upper, t2.upper) && !!e2.lowerOpen == !!t2.lowerOpen && !!e2.upperOpen == !!t2.upperOpen;
      }
      function er(e2, t2) {
        return ((e3, t3, n2, r2) => {
          if (void 0 === e3) return void 0 !== t3 ? -1 : 0;
          if (void 0 === t3) return 1;
          if (0 === (e3 = C(e3, t3))) {
            if (n2 && r2) return 0;
            if (n2) return 1;
            if (r2) return -1;
          }
          return e3;
        })(e2.lower, t2.lower, e2.lowerOpen, t2.lowerOpen) <= 0 && 0 <= ((e3, t3, n2, r2) => {
          if (void 0 === e3) return void 0 !== t3 ? 1 : 0;
          if (void 0 === t3) return -1;
          if (0 === (e3 = C(e3, t3))) {
            if (n2 && r2) return 0;
            if (n2) return -1;
            if (r2) return 1;
          }
          return e3;
        })(e2.upper, t2.upper, e2.upperOpen, t2.upperOpen);
      }
      function tr(n2, r2, o2, e2) {
        n2.subscribers.add(o2), e2.addEventListener("abort", function() {
          var e3, t2;
          n2.subscribers.delete(o2), 0 === n2.subscribers.size && (e3 = n2, t2 = r2, setTimeout(function() {
            0 === e3.subscribers.size && ie(t2, e3);
          }, 3e3));
        });
      }
      var nr = { stack: "dbcore", level: 0, name: "Cache", create: function(k2) {
        var O2 = k2.schema.name;
        return _(_({}, k2), { transaction: function(g2, w2, e2) {
          var _2, t2, x2 = k2.transaction(g2, w2, e2);
          return "readwrite" === w2 && (e2 = (_2 = new AbortController()).signal, x2.addEventListener("abort", (t2 = function(b2) {
            return function() {
              if (_2.abort(), "readwrite" === w2) {
                for (var t3 = /* @__PURE__ */ new Set(), e3 = 0, n2 = g2; e3 < n2.length; e3++) {
                  var r2 = n2[e3], o2 = Tn["idb://".concat(O2, "/").concat(r2)];
                  if (o2) {
                    var i2 = k2.table(r2), a2 = o2.optimisticOps.filter(function(e4) {
                      return e4.trans === x2;
                    });
                    if (x2._explicit && b2 && x2.mutatedParts) for (var u2 = 0, s2 = Object.values(o2.queries.query); u2 < s2.length; u2++) for (var c2 = 0, l2 = (d2 = s2[u2]).slice(); c2 < l2.length; c2++) jn((p2 = l2[c2]).obsSet, x2.mutatedParts) && (ie(d2, p2), p2.subscribers.forEach(function(e4) {
                      return t3.add(e4);
                    }));
                    else if (0 < a2.length) {
                      o2.optimisticOps = o2.optimisticOps.filter(function(e4) {
                        return e4.trans !== x2;
                      });
                      for (var f2 = 0, h2 = Object.values(o2.queries.query); f2 < h2.length; f2++) for (var d2, p2, y2, v2 = 0, m2 = (d2 = h2[f2]).slice(); v2 < m2.length; v2++) null != (p2 = m2[v2]).res && x2.mutatedParts && (b2 && !p2.dirty ? (y2 = Object.isFrozen(p2.res), y2 = Jn(p2.res, p2.req, a2, i2, p2, y2), p2.dirty ? (ie(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      })) : y2 !== p2.res && (p2.res = y2, p2.promise = K.resolve({ result: y2 }))) : (p2.dirty && ie(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      })));
                    }
                  }
                }
                t3.forEach(function(e4) {
                  return e4();
                });
              }
            };
          })(false), { signal: e2 }), x2.addEventListener("error", t2(false), { signal: e2 }), x2.addEventListener("complete", t2(true), { signal: e2 })), x2;
        }, table: function(s2) {
          var c2 = k2.table(s2), o2 = c2.schema.primaryKey;
          return _(_({}, c2), { mutate: function(t2) {
            var n2, e2 = P.trans;
            return !o2.outbound && "disabled" !== e2.db._options.cache && !e2.explicit && "readwrite" === e2.idbtrans.mode && (n2 = Tn["idb://".concat(O2, "/").concat(s2)]) ? (e2 = c2.mutate(t2), "add" !== t2.type && "put" !== t2.type || !(50 <= t2.values.length || zn(o2, t2).some(function(e3) {
              return null == e3;
            })) ? (n2.optimisticOps.push(t2), t2.mutatedParts && Dn(t2.mutatedParts), e2.then(function(e3) {
              0 < e3.numFailures && (ie(n2.optimisticOps, t2), (e3 = Xn(0, t2, e3)) && n2.optimisticOps.push(e3), t2.mutatedParts) && Dn(t2.mutatedParts);
            }), e2.catch(function() {
              ie(n2.optimisticOps, t2), t2.mutatedParts && Dn(t2.mutatedParts);
            })) : e2.then(function(r2) {
              var e3 = Xn(0, _(_({}, t2), { values: t2.values.map(function(e4, t3) {
                var n3;
                return r2.failures[t3] ? e4 : (b(n3 = null != (n3 = o2.keyPath) && n3.includes(".") ? ee(e4) : _({}, e4), o2.keyPath, r2.results[t3]), n3);
              }) }), r2);
              n2.optimisticOps.push(e3), queueMicrotask(function() {
                return t2.mutatedParts && Dn(t2.mutatedParts);
              });
            }), e2) : c2.mutate(t2);
          }, query: function(t2) {
            var o3, e2, n2, r2, i2, a2, u2;
            return $n(P, c2) && Qn("query", t2) ? (o3 = "immutable" === (null == (n2 = P.trans) ? void 0 : n2.db._options.cache), e2 = (n2 = P).requery, n2 = n2.signal, a2 = ((e3, t3, n3, r3) => {
              var o4 = Tn["idb://".concat(e3, "/").concat(t3)];
              if (!o4) return [];
              if (!(e3 = o4.queries[n3])) return [null, false, o4, null];
              var i3 = e3[(r3.query ? r3.query.index.name : null) || ""];
              if (!i3) return [null, false, o4, null];
              switch (n3) {
                case "query":
                  var a3 = null != (u3 = r3.direction) ? u3 : "next", u3 = i3.find(function(e4) {
                    var t4;
                    return e4.req.limit === r3.limit && e4.req.values === r3.values && (null != (t4 = e4.req.direction) ? t4 : "next") === a3 && Zn(e4.req.query.range, r3.query.range);
                  });
                  return u3 ? [u3, true, o4, i3] : [i3.find(function(e4) {
                    var t4;
                    return ("limit" in e4.req ? e4.req.limit : 1 / 0) >= r3.limit && (null != (t4 = e4.req.direction) ? t4 : "next") === a3 && (!r3.values || e4.req.values) && er(e4.req.query.range, r3.query.range);
                  }), false, o4, i3];
                case "count":
                  u3 = i3.find(function(e4) {
                    return Zn(e4.req.query.range, r3.query.range);
                  });
                  return [u3, !!u3, o4, i3];
              }
            })(O2, s2, "query", t2), u2 = a2[0], r2 = a2[2], i2 = a2[3], u2 && a2[1] ? u2.obsSet = t2.obsSet : (a2 = c2.query(t2).then(function(e3) {
              var t3 = e3.result;
              if (u2 && (u2.res = t3), o3) {
                for (var n3 = 0, r3 = t3.length; n3 < r3; ++n3) Object.freeze(t3[n3]);
                Object.freeze(t3);
              } else e3.result = ee(t3);
              return e3;
            }).catch(function(e3) {
              return i2 && u2 && ie(i2, u2), Promise.reject(e3);
            }), u2 = { obsSet: t2.obsSet, promise: a2, subscribers: /* @__PURE__ */ new Set(), type: "query", req: t2, dirty: false }, i2 ? i2.push(u2) : (i2 = [u2], (r2 = r2 || (Tn["idb://".concat(O2, "/").concat(s2)] = { queries: { query: {}, count: {} }, objs: /* @__PURE__ */ new Map(), optimisticOps: [], unsignaledParts: {} })).queries.query[t2.query.index.name || ""] = i2)), tr(u2, i2, e2, n2), u2.promise.then(function(e3) {
              return { result: Jn(e3.result, t2, null == r2 ? void 0 : r2.optimisticOps, c2, u2, o3) };
            })) : c2.query(t2);
          } });
        } });
      } };
      function rr(e2, r2) {
        return new Proxy(e2, { get: function(e3, t2, n2) {
          return "db" === t2 ? r2 : Reflect.get(e3, t2, n2);
        } });
      }
      D.prototype.version = function(t2) {
        if (isNaN(t2) || t2 < 0.1) throw new k.Type("Given version is not a positive number");
        if (t2 = Math.round(10 * t2) / 10, this.idbdb || this._state.isBeingOpened) throw new k.Schema("Cannot add version when database is open");
        this.verno = Math.max(this.verno, t2);
        var e2 = this._versions, n2 = e2.filter(function(e3) {
          return e3._cfg.version === t2;
        })[0];
        return n2 || (n2 = new this.Version(t2), e2.push(n2), e2.sort(un), n2.stores({}), this._state.autoSchema = false), n2;
      }, D.prototype._whenReady = function(e2) {
        var n2 = this;
        return this.idbdb && (this._state.openComplete || P.letThrough || this._vip) ? e2() : new K(function(e3, t2) {
          if (n2._state.openComplete) return t2(new k.DatabaseClosed(n2._state.dbOpenError));
          if (!n2._state.isBeingOpened) {
            if (!n2._state.autoOpen) return void t2(new k.DatabaseClosed());
            n2.open().catch(g);
          }
          n2._state.dbReadyPromise.then(e3, t2);
        }).then(e2);
      }, D.prototype.use = function(e2) {
        var t2 = e2.stack, n2 = e2.create, r2 = e2.level, e2 = e2.name, o2 = (e2 && this.unuse({ stack: t2, name: e2 }), this._middlewares[t2] || (this._middlewares[t2] = []));
        return o2.push({ stack: t2, create: n2, level: null == r2 ? 10 : r2, name: e2 }), o2.sort(function(e3, t3) {
          return e3.level - t3.level;
        }), this;
      }, D.prototype.unuse = function(e2) {
        var t2 = e2.stack, n2 = e2.name, r2 = e2.create;
        return t2 && this._middlewares[t2] && (this._middlewares[t2] = this._middlewares[t2].filter(function(e3) {
          return r2 ? e3.create !== r2 : !!n2 && e3.name !== n2;
        })), this;
      }, D.prototype.open = function() {
        var e2 = this;
        return at(s, function() {
          return Fn(e2);
        });
      }, D.prototype._close = function() {
        this.on.close.fire(new CustomEvent("close"));
        var n2 = this._state;
        if (gn.remove(this), this.idbdb) {
          try {
            this.idbdb.close();
          } catch (e2) {
          }
          this.idbdb = null;
        }
        n2.isBeingOpened || (n2.dbReadyPromise = new K(function(e2) {
          n2.dbReadyResolve = e2;
        }), n2.openCanceller = new K(function(e2, t2) {
          n2.cancelOpen = t2;
        }));
      }, D.prototype.close = function(e2) {
        var e2 = (void 0 === e2 ? { disableAutoOpen: true } : e2).disableAutoOpen, t2 = this._state;
        e2 ? (t2.isBeingOpened && t2.cancelOpen(new k.DatabaseClosed()), this._close(), t2.autoOpen = false, t2.dbOpenError = new k.DatabaseClosed()) : (this._close(), t2.autoOpen = this._options.autoOpen || t2.isBeingOpened, t2.openComplete = false, t2.dbOpenError = null);
      }, D.prototype.delete = function(n2) {
        var o2 = this, i2 = (void 0 === n2 && (n2 = { disableAutoOpen: true }), 0 < arguments.length && "object" != typeof arguments[0]), a2 = this._state;
        return new K(function(r2, t2) {
          function e2() {
            o2.close(n2);
            var e3 = o2._deps.indexedDB.deleteDatabase(o2.name);
            e3.onsuccess = E(function() {
              var e4, t3, n3;
              e4 = o2._deps, t3 = o2.name, _n(n3 = e4.indexedDB) || t3 === ft || wn(n3, e4.IDBKeyRange).delete(t3).catch(g), r2();
            }), e3.onerror = I(t2), e3.onblocked = o2._fireOnBlocked;
          }
          if (i2) throw new k.InvalidArgument("Invalid closeOptions argument to db.delete()");
          a2.isBeingOpened ? a2.dbReadyPromise.then(e2) : e2();
        });
      }, D.prototype.backendDB = function() {
        return this.idbdb;
      }, D.prototype.isOpen = function() {
        return null !== this.idbdb;
      }, D.prototype.hasBeenClosed = function() {
        var e2 = this._state.dbOpenError;
        return e2 && "DatabaseClosed" === e2.name;
      }, D.prototype.hasFailed = function() {
        return null !== this._state.dbOpenError;
      }, D.prototype.dynamicallyOpened = function() {
        return this._state.autoSchema;
      }, Object.defineProperty(D.prototype, "tables", { get: function() {
        var t2 = this;
        return O(this._allTables).map(function(e2) {
          return t2._allTables[e2];
        });
      }, enumerable: false, configurable: true }), D.prototype.transaction = function() {
        var e2 = (function(e3, t2, n2) {
          var r2 = arguments.length;
          if (r2 < 2) throw new k.InvalidArgument("Too few arguments");
          for (var o2 = new Array(r2 - 1); --r2; ) o2[r2 - 1] = arguments[r2];
          return n2 = o2.pop(), [e3, H(o2), n2];
        }).apply(this, arguments);
        return this._transaction.apply(this, e2);
      }, D.prototype._transaction = function(e2, t2, n2) {
        var r2, o2, i2 = this, a2 = P.trans, u2 = (a2 && a2.db === this && -1 === e2.indexOf("!") || (a2 = null), -1 !== e2.indexOf("?"));
        e2 = e2.replace("!", "").replace("?", "");
        try {
          if (o2 = t2.map(function(e3) {
            e3 = e3 instanceof i2.Table ? e3.name : e3;
            if ("string" != typeof e3) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
            return e3;
          }), "r" == e2 || e2 === ht) r2 = ht;
          else {
            if ("rw" != e2 && e2 != dt) throw new k.InvalidArgument("Invalid transaction mode: " + e2);
            r2 = dt;
          }
          if (a2) {
            if (a2.mode === ht && r2 === dt) {
              if (!u2) throw new k.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
              a2 = null;
            }
            a2 && o2.forEach(function(e3) {
              if (a2 && -1 === a2.storeNames.indexOf(e3)) {
                if (!u2) throw new k.SubTransaction("Table " + e3 + " not included in parent transaction.");
                a2 = null;
              }
            }), u2 && a2 && !a2.active && (a2 = null);
          }
        } catch (n3) {
          return a2 ? a2._promise(null, function(e3, t3) {
            t3(n3);
          }) : S(n3);
        }
        var s2 = (function o3(i3, a3, u3, s3, c2) {
          return K.resolve().then(function() {
            var e3 = P.transless || P, t3 = i3._createTransaction(a3, u3, i3._dbSchema, s3), e3 = (t3.explicit = true, { trans: t3, transless: e3 });
            if (s3) t3.idbtrans = s3.idbtrans;
            else try {
              t3.create(), t3.idbtrans._explicit = true, i3._state.PR1398_maxLoop = 3;
            } catch (e4) {
              return e4.name === de.InvalidState && i3.isOpen() && 0 < --i3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), i3.close({ disableAutoOpen: false }), i3.open().then(function() {
                return o3(i3, a3, u3, null, c2);
              })) : S(e4);
            }
            var n3, r3 = ue(c2), e3 = (r3 && nt(), K.follow(function() {
              var e4;
              (n3 = c2.call(t3, t3)) && (r3 ? (e4 = w.bind(null, null), n3.then(e4, e4)) : "function" == typeof n3.next && "function" == typeof n3.throw && (n3 = Nn(n3)));
            }, e3));
            return (n3 && "function" == typeof n3.then ? K.resolve(n3).then(function(e4) {
              return t3.active ? e4 : S(new k.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
            }) : e3.then(function() {
              return n3;
            })).then(function(e4) {
              return s3 && t3._resolve(), t3._completion.then(function() {
                return e4;
              });
            }).catch(function(e4) {
              return t3._reject(e4), S(e4);
            });
          });
        }).bind(null, this, r2, o2, a2, n2);
        return a2 ? a2._promise(r2, s2, "lock") : P.trans ? at(P.transless, function() {
          return i2._whenReady(s2);
        }) : this._whenReady(s2);
      }, D.prototype.table = function(e2) {
        if (m(this._allTables, e2)) return this._allTables[e2];
        throw new k.InvalidTable("Table ".concat(e2, " does not exist"));
      };
      var y = D;
      function D(e2, t2) {
        var i2, r2, a2, n2, o2, u2 = this, s2 = (this._middlewares = {}, this.verno = 0, D.dependencies), s2 = (this._options = t2 = _({ addons: D.addons, autoOpen: true, indexedDB: s2.indexedDB, IDBKeyRange: s2.IDBKeyRange, cache: "cloned", maxConnections: 1e3 }, t2), this._deps = { indexedDB: t2.indexedDB, IDBKeyRange: t2.IDBKeyRange }, t2.addons), c2 = (this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this, { dbOpenError: null, isBeingOpened: false, onReadyBeingFired: null, openComplete: false, dbReadyResolve: g, dbReadyPromise: null, cancelOpen: g, openCanceller: null, autoSchema: true, PR1398_maxLoop: 3, autoOpen: t2.autoOpen }), l2 = (c2.dbReadyPromise = new K(function(e3) {
          c2.dbReadyResolve = e3;
        }), c2.openCanceller = new K(function(e3, t3) {
          c2.cancelOpen = t3;
        }), this._state = c2, this.name = e2, this.on = Pt(this, "populate", "blocked", "versionchange", "close", { ready: [ke, g] }), this.once = function(n3, r3) {
          var o3 = function() {
            for (var e3 = [], t3 = 0; t3 < arguments.length; t3++) e3[t3] = arguments[t3];
            u2.on(n3).unsubscribe(o3), r3.apply(u2, e3);
          };
          return u2.on(n3, o3);
        }, this.on.ready.subscribe = Y(this.on.ready.subscribe, function(o3) {
          return function(n3, r3) {
            D.vip(function() {
              var t3, e3 = u2._state;
              e3.openComplete ? (e3.dbOpenError || K.resolve().then(n3), r3 && o3(n3)) : e3.onReadyBeingFired ? (e3.onReadyBeingFired.push(n3), r3 && o3(n3)) : (o3(n3), t3 = u2, r3 || o3(function e4() {
                t3.on.ready.unsubscribe(n3), t3.on.ready.unsubscribe(e4);
              }));
            });
          };
        }), this.Collection = (i2 = this, Kt(qt.prototype, function(e3, t3) {
          this.db = i2;
          var n3 = yt, r3 = null;
          if (t3) try {
            n3 = t3();
          } catch (e4) {
            r3 = e4;
          }
          var t3 = e3._ctx, e3 = t3.table, o3 = e3.hook.reading.fire;
          this._ctx = { table: e3, index: t3.index, isPrimKey: !t3.index || e3.schema.primKey.keyPath && t3.index === e3.schema.primKey.name, range: n3, keysOnly: false, dir: "next", unique: "", algorithm: null, filter: null, replayFilter: null, justLimit: true, isMatch: null, offset: 0, limit: 1 / 0, error: r3, or: t3.or, valueMapper: o3 !== ve ? o3 : null };
        })), this.Table = (r2 = this, Kt(Ot.prototype, function(e3, t3, n3) {
          this.db = r2, this._tx = n3, this.name = e3, this.schema = t3, this.hook = r2._allTables[e3] ? r2._allTables[e3].hook : Pt(null, { creating: [ge, g], reading: [me, ve], updating: [_e, g], deleting: [we, g] });
        })), this.Transaction = (a2 = this, Kt(Yt.prototype, function(e3, t3, n3, r3, o3) {
          var i3 = this;
          "readonly" !== e3 && t3.forEach(function(e4) {
            e4 = null == (e4 = n3[e4]) ? void 0 : e4.yProps;
            e4 && (t3 = t3.concat(e4.map(function(e5) {
              return e5.updatesTable;
            })));
          }), this.db = a2, this.mode = e3, this.storeNames = t3, this.schema = n3, this.chromeTransactionDurability = r3, this.idbtrans = null, this.on = Pt(this, "complete", "error", "abort"), this.parent = o3 || null, this.active = true, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new K(function(e4, t4) {
            i3._resolve = e4, i3._reject = t4;
          }), this._completion.then(function() {
            i3.active = false, i3.on.complete.fire();
          }, function(e4) {
            var t4 = i3.active;
            return i3.active = false, i3.on.error.fire(e4), i3.parent ? i3.parent._reject(e4) : t4 && i3.idbtrans && i3.idbtrans.abort(), S(e4);
          });
        })), this.Version = (n2 = this, Kt(mn.prototype, function(e3) {
          this.db = n2, this._cfg = { version: e3, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };
        })), this.WhereClause = (o2 = this, Kt(Lt.prototype, function(e3, t3, n3) {
          if (this.db = o2, this._ctx = { table: e3, index: ":id" === t3 ? null : t3, or: n3 }, this._cmp = this._ascending = C, this._descending = function(e4, t4) {
            return C(t4, e4);
          }, this._max = function(e4, t4) {
            return 0 < C(e4, t4) ? e4 : t4;
          }, this._min = function(e4, t4) {
            return C(e4, t4) < 0 ? e4 : t4;
          }, this._IDBKeyRange = o2._deps.IDBKeyRange, !this._IDBKeyRange) throw new k.MissingAPI();
        })), this.on("versionchange", function(e3) {
          0 < e3.newVersion ? console.warn("Another connection wants to upgrade database '".concat(u2.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(u2.name, "'. Closing db now to resume the delete request.")), u2.close({ disableAutoOpen: false });
        }), this.on("blocked", function(e3) {
          !e3.newVersion || e3.newVersion < e3.oldVersion ? console.warn("Dexie.delete('".concat(u2.name, "') was blocked")) : console.warn("Upgrade '".concat(u2.name, "' blocked by other connection holding version ").concat(e3.oldVersion / 10));
        }), this._maxKey = Xt(t2.IDBKeyRange), this._createTransaction = function(e3, t3, n3, r3) {
          return new u2.Transaction(e3, t3, n3, u2._options.chromeTransactionDurability, r3);
        }, this._fireOnBlocked = function(t3) {
          u2.on("blocked").fire(t3), gn.toArray().filter(function(e3) {
            return e3.name === u2.name && e3 !== u2 && !e3._state.vcFired;
          }).map(function(e3) {
            return e3.on("versionchange").fire(t3);
          });
        }, this.use(Yn), this.use(nr), this.use(Gn), this.use(Ln), this.use(Vn), new Proxy(this, { get: function(e3, t3, n3) {
          var r3;
          return "_vip" === t3 || ("table" === t3 ? function(e4) {
            return rr(u2.table(e4), l2);
          } : (r3 = Reflect.get(e3, t3, n3)) instanceof Ot ? rr(r3, l2) : "tables" === t3 ? r3.map(function(e4) {
            return rr(e4, l2);
          }) : "_createTransaction" === t3 ? function() {
            return rr(r3.apply(this, arguments), l2);
          } : r3);
        } }));
        this.vip = l2, s2.forEach(function(e3) {
          return e3(u2);
        });
      }
      var or, Se = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", ir = (ar.prototype.subscribe = function(e2, t2, n2) {
        return this._subscribe(e2 && "function" != typeof e2 ? e2 : { next: e2, error: t2, complete: n2 });
      }, ar.prototype[Se] = function() {
        return this;
      }, ar);
      function ar(e2) {
        this._subscribe = e2;
      }
      try {
        or = { indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB, IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange };
      } catch (e2) {
        or = { indexedDB: null, IDBKeyRange: null };
      }
      function ur(d2) {
        var p2, y2 = false, e2 = new ir(function(r2) {
          var o2 = ue(d2);
          var i2, a2 = false, u2 = {}, s2 = {}, e3 = { get closed() {
            return a2;
          }, unsubscribe: function() {
            a2 || (a2 = true, i2 && i2.abort(), c2 && Wt.storagemutated.unsubscribe(h2));
          } }, c2 = (r2.start && r2.start(e3), false), l2 = function() {
            return st(t2);
          };
          function f2() {
            return jn(s2, u2);
          }
          var h2 = function(e4) {
            Cn(u2, e4), f2() && l2();
          }, t2 = function() {
            var t3, n2, e4;
            !a2 && or.indexedDB && (u2 = {}, t3 = {}, i2 && i2.abort(), i2 = new AbortController(), e4 = ((e5) => {
              var t4 = $e();
              try {
                o2 && nt();
                var n3 = v(d2, e5);
                return n3 = o2 ? n3.finally(w) : n3;
              } finally {
                t4 && Qe();
              }
            })(n2 = { subscr: t3, signal: i2.signal, requery: l2, querier: d2, trans: null }), c2 || (Wt(zt, h2), c2 = true), Promise.resolve(e4).then(function(e5) {
              y2 = true, p2 = e5, a2 || n2.signal.aborted || (f2() || (s2 = t3, f2()) ? l2() : (u2 = {}, st(function() {
                return !a2 && r2.next && r2.next(e5);
              })));
            }, function(e5) {
              y2 = false, ["DatabaseClosedError", "AbortError"].includes(null == e5 ? void 0 : e5.name) || a2 || st(function() {
                a2 || r2.error && r2.error(e5);
              });
            }));
          };
          return setTimeout(l2, 0), e3;
        });
        return e2.hasValue = function() {
          return y2;
        }, e2.getValue = function() {
          return p2;
        }, e2;
      }
      var sr = y;
      function cr(e2) {
        var t2 = fr;
        try {
          fr = true, Wt.storagemutated.fire(e2), Bn(e2, true);
        } finally {
          fr = t2;
        }
      }
      M(sr, _(_({}, e), { delete: function(e2) {
        return new sr(e2, { addons: [] }).delete();
      }, exists: function(e2) {
        return new sr(e2, { addons: [] }).open().then(function(e3) {
          return e3.close(), true;
        }).catch("NoSuchDatabaseError", function() {
          return false;
        });
      }, getDatabaseNames: function(e2) {
        try {
          return t2 = sr.dependencies, n2 = t2.indexedDB, t2 = t2.IDBKeyRange, (_n(n2) ? Promise.resolve(n2.databases()).then(function(e3) {
            return e3.map(function(e4) {
              return e4.name;
            }).filter(function(e4) {
              return e4 !== ft;
            });
          }) : wn(n2, t2).toCollection().primaryKeys()).then(e2);
        } catch (e3) {
          return S(new k.MissingAPI());
        }
        var t2, n2;
      }, defineClass: function() {
        return function(e2) {
          a(this, e2);
        };
      }, ignoreTransaction: function(e2) {
        return P.trans ? at(P.transless || s, e2) : e2();
      }, vip: xn, async: function(t2) {
        return function() {
          try {
            var e2 = Nn(t2.apply(this, arguments));
            return e2 && "function" == typeof e2.then ? e2 : K.resolve(e2);
          } catch (e3) {
            return S(e3);
          }
        };
      }, spawn: function(e2, t2, n2) {
        try {
          var r2 = Nn(e2.apply(n2, t2 || []));
          return r2 && "function" == typeof r2.then ? r2 : K.resolve(r2);
        } catch (e3) {
          return S(e3);
        }
      }, currentTransaction: { get: function() {
        return P.trans || null;
      } }, waitFor: function(e2, t2) {
        e2 = K.resolve("function" == typeof e2 ? sr.ignoreTransaction(e2) : e2).timeout(t2 || 6e4);
        return P.trans ? P.trans.waitFor(e2) : e2;
      }, Promise: K, debug: { get: function() {
        return l;
      }, set: function(e2) {
        Oe(e2);
      } }, derive: U, extend: a, props: M, override: Y, Events: Pt, on: Wt, liveQuery: ur, extendObservabilitySet: Cn, getByKeyPath: c, setByKeyPath: b, delByKeyPath: function(t2, e2) {
        "string" == typeof e2 ? b(t2, e2, void 0) : "length" in e2 && [].map.call(e2, function(e3) {
          b(t2, e3, void 0);
        });
      }, shallowClone: G, deepClone: ee, getObjectDiff: Un, cmp: C, asap: Q, minKey: -1 / 0, addons: [], connections: { get: gn.toArray }, errnames: de, dependencies: or, cache: Tn, semVer: "4.4.2", version: "4.4.2".split(".").map(function(e2) {
        return parseInt(e2);
      }).reduce(function(e2, t2, n2) {
        return e2 + t2 / Math.pow(10, 2 * n2);
      }) })), sr.maxKey = Xt(sr.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Wt(zt, function(e2) {
        fr || (e2 = new CustomEvent(Vt, { detail: e2 }), fr = true, dispatchEvent(e2), fr = false);
      }), addEventListener(Vt, function(e2) {
        e2 = e2.detail;
        fr || cr(e2);
      }));
      var lr, fr = false, hr = function() {
      };
      return "undefined" != typeof BroadcastChannel && ((hr = function() {
        (lr = new BroadcastChannel(Vt)).onmessage = function(e2) {
          return e2.data && cr(e2.data);
        };
      })(), "function" == typeof lr.unref && lr.unref(), Wt(zt, function(e2) {
        fr || lr.postMessage(e2);
      })), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e2) {
        if (!y.disableBfCache && e2.persisted) {
          l && console.debug("Dexie: handling persisted pagehide"), null != lr && lr.close();
          for (var t2 = 0, n2 = gn.toArray(); t2 < n2.length; t2++) n2[t2].close({ disableAutoOpen: false });
        }
      }), addEventListener("pageshow", function(e2) {
        !y.disableBfCache && e2.persisted && (l && console.debug("Dexie: handling persisted pageshow"), hr(), cr({ all: new q(-1 / 0, [[]]) }));
      })), K.rejectionMapper = function(e2, t2) {
        return !e2 || e2 instanceof ce || e2 instanceof TypeError || e2 instanceof SyntaxError || !e2.name || !ye[e2.name] ? e2 : (t2 = new ye[e2.name](t2 || e2.message, e2), "stack" in e2 && u(t2, "stack", { get: function() {
          return this.inner.stack;
        } }), t2);
      }, Oe(l), _(y, Object.freeze({ __proto__: null, DEFAULT_MAX_CONNECTIONS: 1e3, Dexie: y, Entity: mt, PropModification: _t, RangeSet: q, add: function(e2) {
        return new _t({ add: e2 });
      }, cmp: C, default: y, liveQuery: ur, mergeRanges: Pn, rangesOverlap: Kn, remove: function(e2) {
        return new _t({ remove: e2 });
      }, replacePrefix: function(e2, t2) {
        return new _t({ replacePrefix: [e2, t2] });
      } }), { default: y }), y;
    });
  })(dexie_min);
  var dexie_minExports = dexie_min.exports;
  const _Dexie = /* @__PURE__ */ getDefaultExportFromCjs(dexie_minExports);
  const DexieSymbol = Symbol.for("Dexie");
  const Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = _Dexie);
  if (_Dexie.semVer !== Dexie.semVer) {
    throw new Error(`Two different versions of Dexie loaded in the same app: ${_Dexie.semVer} and ${Dexie.semVer}`);
  }
  const {
    liveQuery,
    mergeRanges,
    rangesOverlap,
    RangeSet,
    cmp,
    Entity,
    PropModification,
    replacePrefix,
    add,
    remove,
    DexieYProvider
  } = Dexie;
  class NotesDatabase extends Dexie {
    constructor() {
      super("chatgpt-notes-sidebar");
      __publicField(this, "threads");
      __publicField(this, "messages");
      __publicField(this, "settings");
      __publicField(this, "folders");
      __publicField(this, "aiOperationProposals");
      __publicField(this, "assets");
      __publicField(this, "storedBackups");
      this.version(7).stores({
        threads: "&id, &[source+sourceThreadId], folderId, updatedAt",
        messages: "&id, threadId, &[threadId+sourceMessageKey], sourceMessageId, [threadId+sortOrder], sortOrder, updatedAt",
        settings: "&key, updatedAt",
        folders: "&id, sortOrder, updatedAt",
        aiOperationProposals: "&id, sourceThreadId, createdAt, updatedAt",
        assets: "&id, threadId, messageId, contentHash, updatedAt",
        storedBackups: "&id, kind, backupDate, updatedAt"
      });
    }
  }
  const notesDb = new NotesDatabase();
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
  function contentHashFromParts(input) {
    return stableHash(`${input.contentMarkdown}
${normalizeForKey(input.contentText)}`);
  }
  function createId(prefix) {
    var _a2, _b;
    const randomId = (_b = (_a2 = globalThis.crypto) == null ? void 0 : _a2.randomUUID) == null ? void 0 : _b.call(_a2);
    if (randomId) {
      return `${prefix}_${randomId}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
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
  function getMessagesInOrder(_thread, messages) {
    if (messages.length === 0) {
      return [];
    }
    return [...messages].sort(compareMessagesBySortOrder);
  }
  function renumberMessages(messages) {
    return messages.map((message, index) => ({
      ...message,
      sortOrder: index
    }));
  }
  function insertMessageAfter(orderedMessages, message, afterMessageId) {
    const withoutMessage = orderedMessages.filter((item) => item.id !== message.id);
    const insertIndex = getInsertIndexAfter(withoutMessage, afterMessageId);
    return renumberMessages([
      ...withoutMessage.slice(0, insertIndex),
      message,
      ...withoutMessage.slice(insertIndex)
    ]);
  }
  function getInsertIndexAfter(orderedMessages, afterMessageId) {
    if (afterMessageId === null) {
      return 0;
    }
    const afterIndex = orderedMessages.findIndex((message) => message.id === afterMessageId);
    if (afterIndex === -1) {
      throw new Error(`Missing target message ${afterMessageId}`);
    }
    return afterIndex + 1;
  }
  function compareMessagesBySortOrder(left, right) {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return compareMessagesByCreatedAt(left, right);
  }
  function compareMessagesByCreatedAt(left, right) {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt - right.createdAt;
    }
    return left.id.localeCompare(right.id);
  }
  async function getNotebookBackupSnapshot() {
    const [folders, threads, messages, settings, aiOperationProposals, assets] = await Promise.all([
      notesDb.folders.toArray(),
      notesDb.threads.toArray(),
      notesDb.messages.toArray(),
      notesDb.settings.toArray(),
      notesDb.aiOperationProposals.toArray(),
      notesDb.assets.toArray()
    ]);
    return {
      folders: sortFolders(folders),
      threads: sortThreads(threads),
      messages,
      settings,
      aiOperationProposals: aiOperationProposals.sort((left, right) => left.createdAt - right.createdAt),
      assets
    };
  }
  async function recordNotebookDataMutation() {
    return notesDb.transaction("rw", notesDb.settings, async () => {
      const currentRevision = await getNumericSettingInTransaction("dataRevision");
      const nextRevision = currentRevision + 1;
      await notesDb.settings.put({
        key: "dataRevision",
        value: String(nextRevision),
        updatedAt: Date.now()
      });
      await notesDb.settings.delete("lastBackupError");
      return nextRevision;
    });
  }
  async function getNotebookAutosaveMetadata() {
    var _a2, _b, _c, _d, _e;
    const settings = await notesDb.settings.bulkGet([
      "dataRevision",
      "lastBackupRevision",
      "lastBackupAt",
      "lastBackupError",
      "lastDailyBackupDate"
    ]);
    return {
      dataRevision: toSettingNumber((_a2 = settings[0]) == null ? void 0 : _a2.value),
      lastBackupRevision: toSettingNumber((_b = settings[1]) == null ? void 0 : _b.value),
      lastBackupAt: ((_c = settings[2]) == null ? void 0 : _c.value) ?? null,
      lastBackupError: ((_d = settings[3]) == null ? void 0 : _d.value) ?? null,
      lastDailyBackupDate: ((_e = settings[4]) == null ? void 0 : _e.value) ?? null
    };
  }
  async function markNotebookBackupSucceeded(input) {
    const timestamp = Date.now();
    await notesDb.transaction("rw", notesDb.settings, async () => {
      await notesDb.settings.bulkPut([
        {
          key: "lastBackupRevision",
          value: String(input.revision),
          updatedAt: timestamp
        },
        {
          key: "lastBackupAt",
          value: input.backedUpAt,
          updatedAt: timestamp
        },
        {
          key: "lastDailyBackupDate",
          value: input.dailyBackupDate,
          updatedAt: timestamp
        }
      ]);
      await notesDb.settings.delete("lastBackupError");
    });
  }
  async function markNotebookBackupFailed(error) {
    await notesDb.settings.put({
      key: "lastBackupError",
      value: error,
      updatedAt: Date.now()
    });
  }
  async function saveStoredNotebookBackup(input) {
    const existing = await notesDb.storedBackups.get(input.id);
    const timestamp = Date.now();
    const storedBackup = {
      ...input,
      createdAt: (existing == null ? void 0 : existing.createdAt) ?? timestamp,
      updatedAt: timestamp
    };
    await notesDb.storedBackups.put(storedBackup);
    return storedBackup;
  }
  async function deleteStoredDailyBackupsBefore(cutoffDate) {
    const expired = await notesDb.storedBackups.where("kind").equals("daily").filter((backup) => backup.backupDate !== null && backup.backupDate < cutoffDate).primaryKeys();
    if (expired.length > 0) {
      await notesDb.storedBackups.bulkDelete(expired);
    }
  }
  async function saveAiOperationProposal(operationPackage) {
    const timestamp = Date.now();
    const proposal = {
      id: createId("ai-proposal"),
      sourceThreadId: operationPackage.sourceThreadId,
      sourceTitle: operationPackage.sourceTitle,
      package: operationPackage,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await notesDb.aiOperationProposals.add(proposal);
    return proposal;
  }
  async function getThreadBySource(sourceThreadId, source = "chatgpt") {
    return await notesDb.threads.where("[source+sourceThreadId]").equals([source, sourceThreadId]).first() ?? null;
  }
  async function getActiveSaveTargetThread() {
    const setting = await notesDb.settings.get("activeSaveTargetThreadId");
    if (!(setting == null ? void 0 : setting.value)) {
      return null;
    }
    const thread = await notesDb.threads.get(setting.value);
    if (!thread) {
      await notesDb.settings.delete("activeSaveTargetThreadId");
      return null;
    }
    return thread;
  }
  async function setActiveSaveTargetThread(threadId) {
    return notesDb.transaction("rw", notesDb.threads, notesDb.settings, async () => {
      const timestamp = Date.now();
      if (!threadId) {
        await notesDb.settings.bulkPut([
          {
            key: "activeSaveTargetThreadId",
            value: null,
            updatedAt: timestamp
          },
          {
            key: "activeSaveTargetMessageId",
            value: null,
            updatedAt: timestamp
          }
        ]);
        return null;
      }
      const thread = await notesDb.threads.get(threadId);
      if (!thread) {
        throw new Error(`Missing save target thread ${threadId}`);
      }
      await notesDb.settings.bulkPut([
        {
          key: "activeSaveTargetThreadId",
          value: threadId,
          updatedAt: timestamp
        },
        {
          key: "activeSaveTargetMessageId",
          value: null,
          updatedAt: timestamp
        }
      ]);
      return thread;
    });
  }
  async function appendSavedMessageFromChatGpt(input) {
    return notesDb.transaction("rw", notesDb.threads, notesDb.messages, notesDb.settings, async () => {
      const source = input.source ?? "chatgpt";
      const thread = await getSaveTargetThreadInTransaction({
        source,
        sourceThreadId: input.sourceThreadId,
        title: input.title
      });
      const existing = await notesDb.messages.where("[threadId+sourceMessageKey]").equals([thread.id, input.sourceMessageKey]).first();
      const timestamp = Date.now();
      if (existing) {
        if (existing.contentHash !== input.contentHash) {
          const updatedMessage = {
            ...existing,
            contentHash: input.contentHash,
            contentMarkdown: input.contentMarkdown,
            contentText: input.contentText,
            updatedAt: timestamp
          };
          const updatedThread2 = {
            ...thread,
            title: thread.source === source ? input.title || thread.title : thread.title,
            updatedAt: timestamp
          };
          await notesDb.messages.put(updatedMessage);
          await notesDb.threads.put(updatedThread2);
          return { thread: updatedThread2, message: updatedMessage, status: "updated" };
        }
        return { thread, message: existing, status: "already_saved" };
      }
      const activeSaveTargetMessage = await getActiveSaveTargetMessageInTransaction(thread.id);
      if (activeSaveTargetMessage) {
        const updatedMessage = appendExportToMessage(activeSaveTargetMessage, input, timestamp);
        const updatedThread2 = {
          ...thread,
          updatedAt: timestamp
        };
        await notesDb.messages.put(updatedMessage);
        await notesDb.threads.put(updatedThread2);
        return { thread: updatedThread2, message: updatedMessage, status: "updated" };
      }
      const message = createSavedMessage(
        thread.id,
        {
          sourceMessageId: input.sourceMessageId,
          sourceMessageKey: input.sourceMessageKey,
          contentHash: input.contentHash,
          role: input.role,
          contentMarkdown: input.contentMarkdown,
          contentText: input.contentText
        },
        timestamp
      );
      if (input.insertAfterId) {
        const inserted = await insertMessageAfterInTransaction(thread, input.insertAfterId, message, timestamp);
        if (inserted) {
          return { thread: inserted, message, status: "created" };
        }
      }
      const updatedThread = await appendMessageInTransaction(thread, message, timestamp);
      return { thread: updatedThread, message, status: "created" };
    });
  }
  async function isSourceMessageSaved(threadId, sourceMessageKey) {
    const message = await notesDb.messages.where("[threadId+sourceMessageKey]").equals([threadId, sourceMessageKey]).first();
    return Boolean(message);
  }
  async function getSavedStateForVisibleMessages(sourceThreadId, sourceMessageKeys, source = "chatgpt") {
    const states = Object.fromEntries(sourceMessageKeys.map((key) => [key, false]));
    const thread = await getActiveSaveTargetThread() ?? await getThreadBySource(sourceThreadId, source);
    if (!thread || sourceMessageKeys.length === 0) {
      return states;
    }
    await Promise.all(
      sourceMessageKeys.map(async (sourceMessageKey) => {
        states[sourceMessageKey] = await isSourceMessageSaved(thread.id, sourceMessageKey);
      })
    );
    return states;
  }
  async function getSaveTargetThreadInTransaction(input) {
    const setting = await notesDb.settings.get("activeSaveTargetThreadId");
    if (setting == null ? void 0 : setting.value) {
      const activeThread = await notesDb.threads.get(setting.value);
      if (activeThread) {
        return activeThread;
      }
      await notesDb.settings.delete("activeSaveTargetThreadId");
    }
    return getOrCreateThreadInTransaction(input);
  }
  async function getActiveSaveTargetMessageInTransaction(threadId) {
    const setting = await notesDb.settings.get("activeSaveTargetMessageId");
    if (!(setting == null ? void 0 : setting.value)) {
      return null;
    }
    const message = await notesDb.messages.get(setting.value);
    if (!message) {
      await notesDb.settings.delete("activeSaveTargetMessageId");
      return null;
    }
    if (message.threadId !== threadId) {
      await notesDb.settings.delete("activeSaveTargetMessageId");
      return null;
    }
    return message;
  }
  function appendExportToMessage(message, input, timestamp) {
    const currentMarkdown = (message.contentMarkdown || message.contentText).replace(/\r\n/g, "\n").trim();
    const exportedMarkdown = input.contentMarkdown.replace(/\r\n/g, "\n").trim();
    const contentMarkdown = [currentMarkdown, exportedMarkdown].filter(Boolean).join("\n\n");
    const contentText = markdownToPlainText(contentMarkdown);
    return {
      ...message,
      contentMarkdown,
      contentText,
      contentHash: contentHashFromParts({ contentMarkdown, contentText }),
      updatedAt: timestamp
    };
  }
  async function getOrCreateThreadInTransaction(input) {
    const source = input.source ?? "chatgpt";
    const existing = await notesDb.threads.where("[source+sourceThreadId]").equals([source, input.sourceThreadId]).first();
    if (existing) {
      if (input.title && existing.title !== input.title) {
        const updated = { ...existing, title: input.title, updatedAt: Date.now() };
        await notesDb.threads.put(updated);
        return updated;
      }
      return existing;
    }
    const timestamp = Date.now();
    const thread = {
      id: createId("thread"),
      source,
      sourceThreadId: input.sourceThreadId,
      title: input.title || getDefaultSourceThreadTitle(source),
      folderId: null,
      messageCount: 0,
      sortOrder: await getNextThreadSortOrderInTransaction(),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await notesDb.threads.add(thread);
    return thread;
  }
  function getDefaultSourceThreadTitle(source) {
    return source === "deepwiki" ? "Untitled DeepWiki page" : "Untitled ChatGPT conversation";
  }
  async function getNextThreadSortOrderInTransaction() {
    const threads = await notesDb.threads.toArray();
    if (threads.length === 0) {
      return 0;
    }
    return Math.min(...threads.map(getThreadSortOrder)) - 1;
  }
  function sortThreads(threads) {
    return [...threads].sort((left, right) => {
      const leftSortOrder = getThreadSortOrder(left);
      const rightSortOrder = getThreadSortOrder(right);
      if (leftSortOrder !== rightSortOrder) {
        return leftSortOrder - rightSortOrder;
      }
      return right.updatedAt - left.updatedAt;
    });
  }
  function sortFolders(folders) {
    return [...folders].sort((left, right) => {
      const leftSortOrder = getFolderSortOrder(left);
      const rightSortOrder = getFolderSortOrder(right);
      if (leftSortOrder !== rightSortOrder) {
        return leftSortOrder - rightSortOrder;
      }
      return right.updatedAt - left.updatedAt;
    });
  }
  function getThreadSortOrder(thread) {
    return typeof thread.sortOrder === "number" ? thread.sortOrder : -thread.updatedAt;
  }
  function getFolderSortOrder(folder) {
    return typeof folder.sortOrder === "number" ? folder.sortOrder : -folder.updatedAt;
  }
  async function getNumericSettingInTransaction(key) {
    const setting = await notesDb.settings.get(key);
    return toSettingNumber(setting == null ? void 0 : setting.value);
  }
  function toSettingNumber(value) {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  async function appendMessageInTransaction(thread, message, timestamp) {
    const messages = getMessagesInOrder(thread, await notesDb.messages.where("threadId").equals(thread.id).toArray());
    const updatedMessages = renumberMessages([...messages, message]);
    const updatedThread = {
      ...thread,
      messageCount: updatedMessages.length,
      updatedAt: timestamp
    };
    const storedMessage = updatedMessages.find((item) => item.id === message.id);
    if (storedMessage) {
      Object.assign(message, storedMessage);
    }
    await notesDb.messages.bulkPut(updatedMessages);
    await notesDb.threads.put(updatedThread);
    return updatedThread;
  }
  async function insertMessageAfterInTransaction(thread, afterMessageId, message, timestamp) {
    const after = await notesDb.messages.get(afterMessageId);
    if (!after || after.threadId !== thread.id) {
      return null;
    }
    const messages = getMessagesInOrder(thread, await notesDb.messages.where("threadId").equals(thread.id).toArray());
    const updatedMessages = insertMessageAfter(messages, message, afterMessageId);
    const updatedThread = {
      ...thread,
      messageCount: updatedMessages.length,
      updatedAt: timestamp
    };
    const storedMessage = updatedMessages.find((item) => item.id === message.id);
    if (storedMessage) {
      Object.assign(message, storedMessage);
    }
    await notesDb.messages.bulkPut(updatedMessages);
    await notesDb.threads.put(updatedThread);
    return updatedThread;
  }
  function createSavedMessage(threadId, input, timestamp) {
    return {
      id: input.id ?? createId("message"),
      threadId,
      sourceMessageId: input.sourceMessageId,
      sourceMessageKey: input.sourceMessageKey,
      contentHash: input.contentHash,
      role: input.role,
      title: normalizeMessageTitle(input.title) || getDefaultMessageTitle(input.contentMarkdown || input.contentText),
      contentMarkdown: input.contentMarkdown,
      contentText: input.contentText,
      sortOrder: 0,
      createdAt: input.createdAt ?? timestamp,
      updatedAt: input.updatedAt ?? timestamp
    };
  }
  function normalizeMessageTitle(title) {
    return (title ?? "").replace(/\s+/g, " ").trim();
  }
  function getDefaultMessageTitle(markdown) {
    var _a2;
    const firstLine = (_a2 = markdown.replace(/\r\n/g, "\n").split("\n").find((line) => line.trim().length > 0)) == null ? void 0 : _a2.trim();
    if (!firstLine) {
      return "Empty note";
    }
    return markdownToPlainText(firstLine) || firstLine || "Empty note";
  }
  function createChromeSidebarAdapter() {
    const sidePanel = browser.sidePanel;
    let nativeActionToggleEnabled = false;
    return {
      async initialize() {
        if (sidePanel == null ? void 0 : sidePanel.setPanelBehavior) {
          await sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
          nativeActionToggleEnabled = true;
        }
      },
      async openForCurrentWindow(context) {
        await openSidePanel(sidePanel, context);
      },
      async toggleForCurrentWindow(context) {
        if (nativeActionToggleEnabled) {
          return;
        }
        await openSidePanel(sidePanel, context);
      }
    };
  }
  async function openSidePanel(sidePanel, context) {
    var _a2;
    const openOptions = getOpenOptions(context);
    if (!openOptions) {
      return;
    }
    await ((_a2 = sidePanel == null ? void 0 : sidePanel.open) == null ? void 0 : _a2.call(sidePanel, openOptions));
  }
  function getOpenOptions(context) {
    if (typeof (context == null ? void 0 : context.windowId) === "number") {
      return { windowId: context.windowId };
    }
    if (typeof (context == null ? void 0 : context.tabId) === "number") {
      return { tabId: context.tabId };
    }
    return null;
  }
  function createSidebarAdapter() {
    {
      return createChromeSidebarAdapter();
    }
  }
  const BACKUP_APP_ID = "chatgpt-notes-sidebar";
  const BACKUP_VERSION = 1;
  async function createNotebookBackupData(snapshot, options = {}) {
    const assets = await Promise.all(
      snapshot.assets.map(async (asset) => ({
        id: asset.id,
        threadId: asset.threadId,
        messageId: asset.messageId,
        kind: asset.kind,
        mimeType: asset.mimeType,
        filename: asset.filename,
        altText: asset.altText,
        byteSize: asset.byteSize,
        width: asset.width,
        height: asset.height,
        contentHash: asset.contentHash,
        contentBase64: await blobToBase64(asset.blob),
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      }))
    );
    return {
      app: BACKUP_APP_ID,
      backupVersion: BACKUP_VERSION,
      exportedAt: toIsoString(options.now ?? Date.now()),
      dataRevision: options.dataRevision ?? getSnapshotDataRevision(snapshot),
      counts: {
        folders: snapshot.folders.length,
        threads: snapshot.threads.length,
        messages: snapshot.messages.length,
        settings: snapshot.settings.length,
        aiOperationProposals: snapshot.aiOperationProposals.length,
        assets: snapshot.assets.length
      },
      folders: snapshot.folders,
      threads: snapshot.threads,
      messages: snapshot.messages,
      settings: snapshot.settings,
      aiOperationProposals: snapshot.aiOperationProposals,
      assets
    };
  }
  async function blobToBase64(blob) {
    const bytes = new Uint8Array(await blobToArrayBuffer(blob));
    let binary = "";
    for (let index = 0; index < bytes.length; index += 32768) {
      binary += String.fromCharCode(...bytes.slice(index, index + 32768));
    }
    return btoa(binary);
  }
  function blobToArrayBuffer(blob) {
    if (typeof blob.arrayBuffer === "function") {
      return blob.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error("Could not read backup asset."));
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
          return;
        }
        reject(new Error("Could not read backup asset."));
      };
      reader.readAsArrayBuffer(blob);
    });
  }
  function toIsoString(value) {
    return new Date(value).toISOString();
  }
  function getSnapshotDataRevision(snapshot) {
    var _a2;
    const revision = Number(((_a2 = snapshot.settings.find((setting) => setting.key === "dataRevision")) == null ? void 0 : _a2.value) ?? 0);
    return Number.isFinite(revision) ? revision : 0;
  }
  const BACKUP_DOWNLOAD_DIRECTORY = "ChatGPT Notebook Backups";
  async function writeBackupFilesToDownloads(files) {
    const downloadsApi = browser.downloads;
    if (!(downloadsApi == null ? void 0 : downloadsApi.download)) {
      throw new Error("Automatic backup downloads are unavailable.");
    }
    for (const file of files) {
      const downloadUrl = createJsonDownloadUrl(file.contents);
      await downloadsApi.download({
        url: downloadUrl.url,
        filename: `${BACKUP_DOWNLOAD_DIRECTORY}/${file.filename}`,
        saveAs: false,
        conflictAction: "overwrite"
      });
      downloadUrl.revoke();
    }
  }
  function createJsonDownloadUrl(contents) {
    if (typeof URL.createObjectURL === "function") {
      const blob = new Blob([contents], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      return {
        url,
        revoke: () => {
          globalThis.setTimeout(() => URL.revokeObjectURL(url), 6e4);
        }
      };
    }
    return {
      url: `data:application/json;charset=utf-8,${encodeURIComponent(contents)}`,
      revoke: () => void 0
    };
  }
  const AUTOSAVE_DELAY_MS = 1500;
  const BACKUP_RETENTION_DAYS = 7;
  const LATEST_BACKUP_ID = "autosave:latest";
  let autosaveTimer = null;
  let writeInProgress = false;
  let dirtyWhileWriting = false;
  let transientState = null;
  async function noteNotebookDataChanged() {
    await recordNotebookDataMutation();
    transientState = "pending";
    scheduleAutosave();
  }
  async function forceNotebookAutosave() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;
    }
    await flushAutosave();
    return getAutosaveStatus();
  }
  async function getAutosaveStatus() {
    const metadata = await getNotebookAutosaveMetadata();
    const state = getAutosaveState(metadata);
    return {
      state,
      dataRevision: metadata.dataRevision,
      lastBackupRevision: metadata.lastBackupRevision,
      lastBackupAt: metadata.lastBackupAt,
      lastBackupError: metadata.lastBackupError
    };
  }
  function scheduleAutosave(delayMs = AUTOSAVE_DELAY_MS) {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      void flushAutosave();
    }, delayMs);
  }
  async function flushAutosave() {
    if (writeInProgress) {
      dirtyWhileWriting = true;
      return;
    }
    writeInProgress = true;
    transientState = "saving";
    try {
      const metadata = await getNotebookAutosaveMetadata();
      if (metadata.dataRevision <= metadata.lastBackupRevision) {
        transientState = null;
        return;
      }
      const snapshot = await getNotebookBackupSnapshot();
      const backupData = await createNotebookBackupData(snapshot, { dataRevision: metadata.dataRevision });
      const contents = `${JSON.stringify(backupData, null, 2)}
`;
      const backupDate = backupData.exportedAt.slice(0, 10);
      const latestFilename = "chatgpt-notes-autobackup-latest.json";
      const dailyFilename = `chatgpt-notes-autobackup-${backupDate}.json`;
      await saveStoredNotebookBackup({
        id: LATEST_BACKUP_ID,
        kind: "latest",
        backupDate: null,
        contents,
        filename: latestFilename,
        dataRevision: backupData.dataRevision,
        exportedAt: backupData.exportedAt
      });
      await saveStoredNotebookBackup({
        id: `autosave:daily:${backupDate}`,
        kind: "daily",
        backupDate,
        contents,
        filename: dailyFilename,
        dataRevision: backupData.dataRevision,
        exportedAt: backupData.exportedAt
      });
      await writeBackupFilesToDownloads([
        { filename: latestFilename, contents },
        { filename: dailyFilename, contents }
      ]);
      await cleanupOldDailyBackups(backupDate);
      await markNotebookBackupSucceeded({
        revision: metadata.dataRevision,
        backedUpAt: backupData.exportedAt,
        dailyBackupDate: backupDate
      });
      transientState = null;
    } catch (error) {
      transientState = "error";
      await markNotebookBackupFailed(error instanceof Error ? error.message : "Autosave backup failed.");
    } finally {
      writeInProgress = false;
      const metadata = await getNotebookAutosaveMetadata();
      if (dirtyWhileWriting || metadata.dataRevision > metadata.lastBackupRevision) {
        dirtyWhileWriting = false;
        transientState = "pending";
        scheduleAutosave();
      }
    }
  }
  function getAutosaveState(metadata) {
    if (transientState === "saving") {
      return "saving";
    }
    if (metadata.lastBackupError && metadata.dataRevision > metadata.lastBackupRevision) {
      return "error";
    }
    if (transientState === "pending" || metadata.dataRevision > metadata.lastBackupRevision) {
      return "pending";
    }
    return "idle";
  }
  async function cleanupOldDailyBackups(currentDate) {
    const cutoff = /* @__PURE__ */ new Date(`${currentDate}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - BACKUP_RETENTION_DAYS + 1);
    try {
      await deleteStoredDailyBackupsBefore(cutoff.toISOString().slice(0, 10));
    } catch {
    }
  }
  const SIDEBAR_PAGE = "sidebar.html";
  const SIDEBAR_WINDOW_WIDTH = 460;
  const SIDEBAR_WINDOW_HEIGHT = 760;
  let detachedSidebarWindowId = null;
  function initializeDetachedSidebarWindowTracking() {
    browser.windows.onRemoved.addListener((windowId) => {
      if (windowId === detachedSidebarWindowId) {
        detachedSidebarWindowId = null;
      }
    });
  }
  async function openDetachedSidebarWindow() {
    const sidebarUrl = browser.runtime.getURL(SIDEBAR_PAGE);
    if (typeof detachedSidebarWindowId === "number") {
      try {
        await browser.windows.update(detachedSidebarWindowId, { focused: true });
        return;
      } catch {
        detachedSidebarWindowId = null;
      }
    }
    if (await focusExistingDetachedSidebarWindow(sidebarUrl)) {
      return;
    }
    const createdWindow = await browser.windows.create({
      focused: true,
      height: SIDEBAR_WINDOW_HEIGHT,
      type: "popup",
      url: sidebarUrl,
      width: SIDEBAR_WINDOW_WIDTH
    });
    detachedSidebarWindowId = typeof createdWindow.id === "number" ? createdWindow.id : null;
  }
  async function focusExistingDetachedSidebarWindow(sidebarUrl) {
    try {
      const popupWindows = await browser.windows.getAll({ populate: true, windowTypes: ["popup"] });
      const existingWindow = popupWindows.find(
        (popupWindow) => {
          var _a2;
          return (_a2 = popupWindow.tabs) == null ? void 0 : _a2.some((tab) => tab.url === sidebarUrl);
        }
      );
      if (typeof (existingWindow == null ? void 0 : existingWindow.id) !== "number") {
        return false;
      }
      detachedSidebarWindowId = existingWindow.id;
      await browser.windows.update(existingWindow.id, { focused: true });
      return true;
    } catch {
      detachedSidebarWindowId = null;
      return false;
    }
  }
  const sidebarAdapter = createSidebarAdapter();
  void sidebarAdapter.initialize();
  initializeDetachedSidebarWindowTracking();
  const actionApi = browser.action ?? browser.browserAction;
  (_a = actionApi == null ? void 0 : actionApi.onClicked) == null ? void 0 : _a.addListener((tab) => {
    void openSidebarFromActionClick(tab);
  });
  browser.runtime.onMessage.addListener((rawMessage) => {
    if (!isExtensionMessage(rawMessage)) {
      return void 0;
    }
    return handleMessage(rawMessage);
  });
  async function handleMessage(message) {
    switch (message.type) {
      case "SAVE_CHATGPT_MESSAGE": {
        const result = await appendSavedMessageFromChatGpt(message.payload);
        await noteNotebookDataChanged();
        const response = {
          sourceThreadId: message.payload.sourceThreadId,
          sourceMessageKey: message.payload.sourceMessageKey,
          savedMessageId: result.message.id,
          status: result.status
        };
        await broadcastToChatGptTabs({
          type: "SOURCE_MESSAGE_SAVED_STATE_CHANGED",
          payload: {
            sourceThreadId: message.payload.sourceThreadId,
            sourceMessageKey: message.payload.sourceMessageKey,
            saved: true
          }
        });
        return response;
      }
      case "REQUEST_SAVED_STATE_FOR_VISIBLE_MESSAGES":
        return getSavedStateForVisibleMessages(
          message.payload.sourceThreadId,
          message.payload.sourceMessageKeys,
          message.payload.source === "deepwiki" ? "deepwiki" : "chatgpt"
        );
      case "GET_ACTIVE_CHATGPT_CONTEXT":
        await ensureActiveCapturableContentScript();
        return getActiveChatGptContext();
      case "GET_ACTIVE_SAVE_TARGET":
        return getActiveSaveTargetThread();
      case "SET_ACTIVE_SAVE_TARGET": {
        const thread = await setActiveSaveTargetThread(message.payload.threadId);
        await noteNotebookDataChanged();
        await broadcastToChatGptTabs({
          type: "ACTIVE_SAVE_TARGET_CHANGED",
          payload: {
            threadId: (thread == null ? void 0 : thread.id) ?? null,
            title: (thread == null ? void 0 : thread.title) ?? null,
            source: (thread == null ? void 0 : thread.source) ?? null
          }
        });
        return thread;
      }
      case "INSERT_TEXT_IN_CHATGPT": {
        const response = await sendMessageToActiveChatGptTab(message);
        return response ?? {
          inserted: false,
          error: "Open a ChatGPT tab before inserting notes."
        };
      }
      case "SUBMIT_AI_OPERATION_PACKAGE": {
        try {
          const proposal = await saveAiOperationProposal(message.payload);
          await noteNotebookDataChanged();
          try {
            await openDetachedSidebarWindow();
          } catch {
            await sidebarAdapter.openForCurrentWindow({});
          }
          return {
            queued: true,
            proposalId: proposal.id
          };
        } catch {
          return {
            queued: false,
            error: "Could not queue ChatGPT note changes."
          };
        }
      }
      case "OPEN_SIDEBAR_WINDOW": {
        try {
          await openDetachedSidebarWindow();
          return { opened: true };
        } catch {
          return {
            opened: false,
            error: "Could not open notes window."
          };
        }
      }
      case "NOTEBOOK_DATA_CHANGED":
        await noteNotebookDataChanged();
        return getAutosaveStatus();
      case "GET_AUTOSAVE_STATUS":
        return getAutosaveStatus();
      case "FORCE_AUTOSAVE":
        return forceNotebookAutosave();
      case "CHATGPT_THREAD_CHANGED":
      case "SAVE_CHATGPT_MESSAGE_RESULT":
      case "ACTIVE_SAVE_TARGET_CHANGED":
      case "SOURCE_MESSAGE_SAVED_STATE_CHANGED":
        return void 0;
      default:
        return void 0;
    }
  }
  async function openSidebarFromActionClick(tab) {
    try {
      await sidebarAdapter.toggleForCurrentWindow({
        windowId: tab == null ? void 0 : tab.windowId,
        tabId: tab == null ? void 0 : tab.id
      });
    } catch {
    }
    if (tab) {
      try {
        await ensureChatGptContentScript(tab);
      } catch {
      }
    }
  }
})();
//# sourceMappingURL=background.js.map
