

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// See https://caniuse.com/mdn-javascript_builtins_object_assign

// See https://caniuse.com/mdn-javascript_builtins_bigint64array

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = true;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

// Normally we don't log exceptions but instead let them bubble out the top
// level where the embedding environment (e.g. the browser) can handle
// them.
// However under v8 and node we sometimes exit the process direcly in which case
// its up to use us to log the exception before exiting.
// If we fix https://github.com/emscripten-core/emscripten/issues/15080
// this may no longer be needed under node.
function logExceptionOnExit(e) {
  if (e instanceof ExitStatus) return;
  let toLog = e;
  if (e && typeof e == 'object' && e.stack) {
    toLog = [e, e.stack];
  }
  err('exiting due to exception: ' + toLog);
}

if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      const data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    let data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = function readAsync(f, onload, onerror) {
    setTimeout(() => onload(readBinary(f)), 0);
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      logExceptionOnExit(toThrow);
      quit(status);
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;
checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];legacyModuleProp('arguments', 'arguments_');

if (Module['thisProgram']) thisProgram = Module['thisProgram'];legacyModuleProp('thisProgram', 'thisProgram');

if (Module['quit']) quit_ = Module['quit'];legacyModuleProp('quit', 'quit_');

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
legacyModuleProp('read', 'read_');
legacyModuleProp('readAsync', 'readAsync');
legacyModuleProp('readBinary', 'readBinary');
legacyModuleProp('setWindowTitle', 'setWindowTitle');
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

assert(!ENVIRONMENT_IS_WEB, "web environment detected but not enabled at build time.  Add 'web' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_WORKER, "worker environment detected but not enabled at build time.  Add 'worker' to `-sENVIRONMENT` to enable.");

assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add 'node' to `-sENVIRONMENT` to enable.");

// include: support.js


var STACK_ALIGN = 16;
var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': case 'u8': return 1;
    case 'i16': case 'u16': return 2;
    case 'i32': case 'u32': return 4;
    case 'i64': case 'u64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length - 1] === '*') {
        return POINTER_SIZE;
      }
      if (type[0] === 'i') {
        const bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      }
      return 0;
    }
  }
}

// include: runtime_debug.js


function legacyModuleProp(prop, newName) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get: function() {
        abort('Module.' + prop + ' has been replaced with plain ' + newName + ' (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)');
      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort('`Module.' + prop + '` was supplied but `' + prop + '` not included in INCOMING_MODULE_JS_API');
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingGlobal(sym, msg) {
  Object.defineProperty(globalThis, sym, {
    configurable: true,
    get: function() {
      warnOnce('`' + sym + '` is not longer defined by emscripten. ' + msg);
      return undefined;
    }
  });
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');

function missingLibrarySymbol(sym) {
  if (typeof globalThis !== 'undefined' && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get: function() {
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = '`' + sym + '` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line';
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
        var librarySymbol = sym;
        if (!librarySymbol.startsWith('_')) {
          librarySymbol = '$' + sym;
        }
        msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get: function() {
        var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      }
    });
  }
}

// end include: runtime_debug.js
// end include: support.js



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];legacyModuleProp('wasmBinary', 'wasmBinary');
var noExitRuntime = Module['noExitRuntime'] || true;legacyModuleProp('noExitRuntime', 'noExitRuntime');

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// include: runtime_strings.js


// runtime_strings.js: String related runtime functions that are part of both
// MINIMAL_RUNTIME and regular runtime.

var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
 * array that contains uint8 values, returns a copy of that string as a
 * Javascript String object.
 * heapOrArray is either a regular array, or a JavaScript typed array view.
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.  Also, use the length info to avoid running tiny
  // strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation,
  // so that undefined means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = '';
  // If building with TextDecoder, we have already computed the string length
  // above, so test loop end condition against that
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
    var u0 = heapOrArray[idx++];
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }

    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
  return str;
}

/**
 * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
 * emscripten HEAP, returns a copy of that string as a Javascript String object.
 *
 * @param {number} ptr
 * @param {number=} maxBytesToRead - An optional length that specifies the
 *   maximum number of bytes to read. You can omit this parameter to scan the
 *   string until the first \0 byte. If maxBytesToRead is passed, and the string
 *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
 *   string will cut short at that byte index (i.e. maxBytesToRead will not
 *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
 *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
 *   JS JIT optimizations off, so it is worth to consider consistently using one
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

/**
 * Copies the given Javascript String object 'str' to the given byte array at
 * address 'outIdx', encoded in UTF8 form and null-terminated. The copy will
 * require at most str.length*4+1 bytes of space in the HEAP.  Use the function
 * lengthBytesUTF8 to compute the exact number of bytes (excluding null
 * terminator) that this function will write.
 *
 * @param {string} str - The Javascript string to copy.
 * @param {ArrayBufferView|Array<number>} heap - The array to copy to. Each
 *                                               index in this array is assumed
 *                                               to be one 8-byte element.
 * @param {number} outIdx - The starting offset in the array to begin the copying.
 * @param {number} maxBytesToWrite - The maximum number of bytes this function
 *                                   can write to the array.  This count should
 *                                   include the null terminator, i.e. if
 *                                   maxBytesToWrite=1, only the null terminator
 *                                   will be written and nothing else.
 *                                   maxBytesToWrite=0 does not write any bytes
 *                                   to the output, not even the null
 *                                   terminator.
 * @return {number} The number of bytes written, EXCLUDING the null terminator.
 */
function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0))
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

/**
 * Copies the given Javascript String object 'str' to the emscripten HEAP at
 * address 'outPtr', null-terminated and encoded in UTF8 form. The copy will
 * require at most str.length*4+1 bytes of space in the HEAP.
 * Use the function lengthBytesUTF8 to compute the exact number of bytes
 * (excluding null terminator) that this function will write.
 *
 * @return {number} The number of bytes written, EXCLUDING the null terminator.
 */
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

/**
 * Returns the number of bytes the given Javascript string takes if encoded as a
 * UTF8 byte array, EXCLUDING the null terminator byte.
 *
 * @param {string} str - JavaScript string to operator on
 * @return {number} Length, in bytes, of the UTF8 encoded string.
 */
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i); // possibly a lead surrogate
    if (c <= 0x7F) {
      len++;
    } else if (c <= 0x7FF) {
      len += 2;
    } else if (c >= 0xD800 && c <= 0xDFFF) {
      len += 4; ++i;
    } else {
      len += 3;
    }
  }
  return len;
}

// end include: runtime_strings.js
// Memory management

var HEAP,
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module['HEAP8'] = HEAP8 = new Int8Array(b);
  Module['HEAP16'] = HEAP16 = new Int16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

var STACK_SIZE = 65536;
if (Module['STACK_SIZE']) assert(STACK_SIZE === Module['STACK_SIZE'], 'the stack size can no longer be determined at runtime')

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;legacyModuleProp('INITIAL_MEMORY', 'INITIAL_MEMORY');

assert(INITIAL_MEMORY >= STACK_SIZE, 'INITIAL_MEMORY should be larger than STACK_SIZE, was ' + INITIAL_MEMORY + '! (STACK_SIZE=' + STACK_SIZE + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it.
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
assert(INITIAL_MEMORY == 16777216, 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with the (separate) address-zero check
  // below.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x2135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten at ' + ptrToString(max) + ', expected hex dwords 0x89BACDFE and 0x2135467, but received ' + ptrToString(cookie2) + ' ' + ptrToString(cookie1));
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[0] !== 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}

// end include: runtime_stack_check.js
// include: runtime_assertions.js


// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;

function keepRuntimeAlive() {
  return noExitRuntime;
}

function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  
  callRuntimeCallbacks(__ATINIT__);
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // defintion for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// {{MEM_INITIALIZER}}

// include: memoryprofiler.js


// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
var FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

// include: URIUtils.js


// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  return filename.startsWith(dataURIPrefix);
}

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return filename.startsWith('file://');
}

// end include: URIUtils.js
/** @param {boolean=} fixedasm */
function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABzYKAgAAyYAF/AX9gAAF/YAJ/fwBgAX8AYAJ/fwF/YAN/f38Bf2ADf39/AGAAAGAEf39/fwBgBX9/f39/AGAEf39/fwF/YAF8AXxgBn9/f39/fwBgAX0AYAN/fn8BfmADf399AGAFf39/f38Bf2ACfHwBfGABfwF8YAF9AX1gAn99AGABfAF+YAF8AX9gAX4Bf2ADfHx/AXxgAnx/AXxgBn98f39/fwF/YAJ+fwF/YAR/fn5/AGANf39/f39/f39/f39/fwBgCH9/f39/f39/AGAAAX1gAX0Bf2ADf31/AX1gA39/fQF/YAR/f399AGABfwF9YAR/f399AX9gAn98AXxgAn5/AXxgA3x+fgF8YAF8AGACfH8Bf2AHf39/f39/fwF/YAN+f38Bf2ACfn4BfGAEf39+fwF+YAV/f39+fgBgB39/f39/f38AYAR/fn9/AX8CnoeAgAAiA2VudgRleGl0AAMDZW52FV9lbWJpbmRfcmVnaXN0ZXJfZW51bQAIA2VudhtfZW1iaW5kX3JlZ2lzdGVyX2VudW1fdmFsdWUABgNlbnYZX2VtYmluZF9yZWdpc3Rlcl9mdW5jdGlvbgAMA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2NsYXNzAB0DZW52C19fY3hhX3Rocm93AAYDZW52Il9lbWJpbmRfcmVnaXN0ZXJfY2xhc3NfY29uc3RydWN0b3IADANlbnYfX2VtYmluZF9yZWdpc3Rlcl9jbGFzc19mdW5jdGlvbgAeA2Vudg1fZW12YWxfaW5jcmVmAAMDZW52DV9lbXZhbF9kZWNyZWYAAwNlbnYRX2VtdmFsX3Rha2VfdmFsdWUABANlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAIDZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAAJA2VudhhfZW1iaW5kX3JlZ2lzdGVyX2ludGVnZXIACQNlbnYWX2VtYmluZF9yZWdpc3Rlcl9mbG9hdAAGA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcAAgNlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAGA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAIDZW52HF9lbWJpbmRfcmVnaXN0ZXJfbWVtb3J5X3ZpZXcABgNl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0AEgAygC2AEhRyADKALUASFIIAMoAtABIUkgSCBJEIUBIAMgRzYC5AFBwoAEIUogAyBKNgLgAUEUIUsgAyBLNgLcASADKALgASFMIAMoAtwBIU0gTCBNEIcBQYACIU4gAyBOaiFPIE8kAA8LnQgCT38GfiMAIQFBgAIhAiABIAJrIQMgAyQAIAMgADYCUEEAIQQgAyAENgJMQRUhBSADIAU2AkggAyAENgJEQRYhBiADIAY2AkAgAyAENgI8QRchByADIAc2AjggAygCUCEIQTAhCSADIAlqIQogAyAKNgJoIAMgCDYCZBCLAUEYIQsgAyALNgJgEI0BIQwgAyAMNgJcEI4BIQ0gAyANNgJYQRkhDiADIA42AlQQkAEhDxCRASEQEJIBIREQfCESIAMoAmAhEyADIBM2AvABEG0hFCADKAJgIRUgAygCXCEWIAMgFjYCcBB9IRcgAygCXCEYIAMoAlghGSADIBk2AmwQfSEaIAMoAlghGyADKAJkIRwgAygCVCEdIAMgHTYC9AEQfiEeIAMoAlQhHyAPIBAgESASIBQgFSAXIBggGiAbIBwgHiAfEARBMCEgIAMgIGohISADICE2AnQgAygCdCEiIAMgIjYC/AFBGiEjIAMgIzYC+AEgAygC/AEhJCADKAL4ASElICUQlAEgAygCSCEmIAMoAkwhJyADICc2AiwgAyAmNgIoIAMpAyghUCADIFA3A3ggAygCeCEoIAMoAnwhKSADICQ2ApQBQfCBBCEqIAMgKjYCkAEgAyApNgKMASADICg2AogBIAMoApQBISsgAygCkAEhLCADKAKIASEtIAMoAowBIS4gAyAuNgKEASADIC02AoABIAMpA4ABIVEgAyBRNwMIQQghLyADIC9qITAgLCAwEJUBIAMoAkAhMSADKAJEITIgAyAyNgIkIAMgMTYCICADKQMgIVIgAyBSNwOYASADKAKYASEzIAMoApwBITQgAyArNgK0AUHgggQhNSADIDU2ArABIAMgNDYCrAEgAyAzNgKoASADKAK0ASE2IAMoArABITcgAygCqAEhOCADKAKsASE5IAMgOTYCpAEgAyA4NgKgASADKQOgASFTIAMgUzcDACA3IAMQlgEgAygCOCE6IAMoAjwhOyADIDs2AhwgAyA6NgIYIAMpAxghVCADIFQ3A7gBIAMoArgBITwgAygC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AiABLQAAOgAAIAFBAWohASACQQFqIgJBA3FFDQEgAiADSQ0ACwsCQCADQXxxIgRBwABJDQAgAiAEQUBqIgVLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUHAAGohASACQcAAaiICIAVNDQALCyACIARPDQEDQCACIAEoAgA2AgAgAUEEaiEBIAJBBGoiAiAESQ0ADAILAAsCQCADQQRPDQAgACECDAELAkAgA0F8aiIEIABPDQAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCwJAIAIgA08NAANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/cCAQJ/AkAgACABRg0AAkAgASAAIAJqIgNrQQAgAkEBdGtLDQAgACABIAIQ4AMPCyABIABzQQNxIQQCQAJAAkAgACABTw0AAkAgBEUNACAAIQMMAwsCQCAAQQNxDQAgACEDDAILIAAhAwNAIAJFDQQgAyABLQAAOgAAIAFBAWohASACQX9qIQIgA0EBaiIDQQNxRQ0CDAALAAsCQCAEDQACQCADQQNxRQ0AA0AgAkUNBSAAIAJBf2oiAmoiAyABIAJqLQAAOgAAIANBA3ENAAsLIAJBA00NAANAIAAgAkF8aiICaiABIAJqKAIANgIAIAJBA0sNAAsLIAJFDQIDQCAAIAJBf2oiAmogASACai0AADoAACACDQAMAwsACyACQQNNDQADQCADIAEoAgA2AgAgAUEEaiEBIANBBGohAyACQXxqIgJBA0sNAAsLIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAALsgQCBH4CfwJAAkAgAb0iAkIBhiIDUA0AIAEQ4wMhBCAAvSIFQjSIp0H/D3EiBkH/D0YNACAEQv///////////wCDQoGAgICAgID4/wBUDQEL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ATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIFayICQSBJDQAgAa1CgYCAgBB+IQYgAyAFaiEBA0AgASAGNwMYIAEgBjcDECABIAY3AwggASAGNwMAIAFBIGohASACQWBqIgJBH0sNAAsLIAALBABBAQsCAAsEAEEACwIACwIACw0AQciWBRCIBEHMlgULCQBByJYFEIkEC1wBAX8gACAAKAJIIgFBf2ogAXI2AkgCQCAAKAIAIgFBCHFFDQAgACABQSByNgIAQX8PCyAAQgA3AgQgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCEEEACwoAIABBUGpBCkkL5QEBAn8gAkEARyEDAkACQAJAIABBA3FFDQAgAkUNACABQf8BcSEEA0AgAC0AACAERg0CIAJBf2oiAkEARyEDIABBAWoiAEEDcUUNASACDQALCyADRQ0BAkAgAC0AACABQf8BcUYNACACQQRJDQAgAUH/AXFBgYKECGwhBANAIAAoAgAgBHMiA0F/cyADQf/9+3dqcUGAgYKEeHENAiAAQQRqIQAgAkF8aiICQQNLDQALCyACRQ0BCyABQf8BcSEDA0ACQCAALQAAIANHDQAgAA8LIABBAWohACACQX9qIgINAAsLQQALFwEBfyAAQQAgARCOBCICIABrIAEgAhsLBgBB0JYFC48BAgF+AX8CQCAAvSICQjSIp0H/D3EiA0H/D0YNAAJAIAMNAAJAAkAgAEQAAAAAAAAAAGINAEEAIQMMAQsgAEQAAAAAAADwQ6IgARCRBCEAIAEoAgBBQGohAwsgASADNgIAIAAPCyABIANBgnhqNgIAIAJC/////////4eAf4NCgICAgICAgPA/hL8hAAsgAAvOAQEDfwJAAkAgAigCECIDDQBBACEEIAIQjAQNASACKAIQIQMLAkAgAyACKAIUIgVrIAFPDQAgAiAAIAEgAigCJBEFAA8LAkACQCACKAJQQQBODQBBACEDDAELIAEhBANAAkAgBCIDDQBBACEDDAILIAAgA0F/aiIEai0AAEEKRw0ACyAC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IAQgDEECdGooAgAiDkUNASADIAxBA3RqIA4gAiAGEJgEQQEhCyAMQQFqIgxBCkcNAAwKCwALQQEhCyAMQQpPDQgDQCAEIAxBAnRqKAIADQFBASELIAxBAWoiDEEKRg0JDAALAAtBHCEWDAULIAkhFgsgFCAWIA1rIhIgFCASShsiFCAQQf////8Hc0oNAkE9IRYgEyAQIBRqIg8gEyAPShsiDCAOSg0DIABBICAMIA8gERCcBCAAIBggEBCWBCAAQTAgDCAPIBFBgIAEcxCcBCAAQTAgFCASQQAQnAQgACANIBIQlgQgAEEgIAwgDyARQYDAAHMQnAQMAQsLQQAhCwwDC0E9IRYLEJAEIBY2AgALQX8hCwsgB0HQAGokACALCxkAAkAgAC0AAEEgcQ0AIAEgAiAAEJIEGgsLdAEDf0EAIQECQCAAKAIALAAAEI0EDQBBAA8LA0AgACgCACECQX8hAwJAIAFBzJmz5gBLDQBBfyACLAAAQVBqIgMgAUEKbCIBaiADIAFB/////wdzShshAwsgACACQQFqNgIAIAMhASACLAABEI0EDQALIAMLtgQAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAUF3ag4SAAECBQMEBgcICQoLDA0ODxAREgsgAiACKAIAIgFBBGo2AgAgACABKAIANgIADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMA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QTA2AgBBfwtTAQF+AkACQCADQcAAcUUNACABIANBQGqthiECQgAhAQwBCyADRQ0AIAFBwAAgA2utiCACIAOtIgSGhCECIAEgBIYhAQsgACABNwMAIAAgAjcDCAtTAQF+AkACQCADQcAAcUUNACACIANBQGqtiCEBQgAhAgwBCyADRQ0AIAJBwAAgA2uthiABIAOtIgSIhCEBIAIgBIghAgsgACABNwMAIAAgAjcDCAvkAwICfwJ+IwBBIGsiAiQAAkACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98Wg0AIABCPIggAUIEhoQhBAJAIABC//////////8PgyIAQoGAgICAgICACFQNACAEQoGAgICAgICAwAB8IQUMAgsgBEKAgICAgICAgMAAfCEFIABCgICAgICAgIAIUg0BIAUgBEIBg3whBQwBCwJAIABQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURsNACAAQjyIIAFCBIaEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIEIANB/4h/ahCvBCACIAAgBEGB+AAgA2sQsAQgAikDACIEQjyIIAJBCGopAwBCBIaEIQUCQCAEQv//////////D4MgAikDECACQRBqQQhqKQMAhEIAUq2EIgRCgYCAgICAgIAIVA0AIAVCAXwhBQwBCyAEQoCAgICAgICACFINACAFQgGDIAV8IQULIAJBIGokACAFIAFCgICAgICAgICAf4OEvwsgAAJAQQAoAvSbBQ0AQfSbBSAANgIAQQAgATYC+JsFCwsGACAAJAELBAAjAQtBAQF/IABBASAAGyEBAkADQCABEKgEIgANAQJAENUEIgBFDQAgABEHAAwBCwtBBBDOBBD2BEGciAVBKhAFAAsgAAsHACAAEKkEC08BAX8gAUEEIAFBBEsbIQIgAEEBIAAbIQACQANAIAIgABC4BCIBDQECQBDVBCIBRQ0AIAERBwAMAQsLQQQQzgQQ9gRBnIgFQSoQBQALIAELMQEBfyMAQRBrIgIkACACQQA2AgwgAkEMaiAAIAEQqwQaIAIoAgwh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ASACIAMgBCAFIAAoAgAoAhQRDAALIQACQCAAIAEoAgggBRDgBEUNACABIAEgAiADIAQQ6wQLC0YBAX8jAEEQayIDJAAgAyACKAIANgIMAkAgACABIANBDGogACgCACgCEBEFACIARQ0AIAIgAygCDDYCAAsgA0EQaiQAIAALHgACQCAADQBBAA8LIABBmIEFQaiCBUEAEOMEQQBHCwQAIAALDQAgABDzBBogABC2BAsGAEGPgQQLFQAgABC7BCIAQaCHBUEIajYCACAACw0AIAAQ8wQaIAAQtgQLBgBBy4MECxUAIAAQ9gQiAEG0hwVBCGo2AgAgAAsNACAAEPMEGiAAELYECwYAQfqBBAscACAAQbSIBUEIajYCACAAQQRqEP0EGiAAEPMECysBAX8CQCAAEL8ERQ0AIAAoAgAQ/gQiAUEIahD/BEF/Sg0AIAEQtgQLIAALBwAgAEF0agsVAQF/IAAgACgCAEF/aiIBNgIAIAELDQAgABD8BBogABC2BAsKACAAQQRqEIIFCwcAIAAoAgALDQAgABD8BBogABC2BAsEACAACwQAIwALBgAgACQACxIBAn8jACAAa0FwcSIBJAAgAQsEACMACxIAQYCABCQDQQBBD2pBcHEkAgsHACMAIwJrCwQAIwMLBAAjAgu9AgEDfwJAIAANAEEAIQECQEEAKALAigVFDQBBACgCwIoFEI0FIQELAkBBACgC2IsFRQ0AQQAoAtiLBRCNBSABciEBCwJAEIoEKAIAIgBFDQADQEEAIQICQCAAKAJMQQBIDQAgABCFBCECCwJAIAAoAhQgACgCHEYNACAAEI0FIAFyIQELAkAgAkUNACAAEIYECyAAKAI4IgANAAsLEIsEIAEPC0EAIQICQCAAKAJMQQBIDQAgABCFBCECCwJAAkACQCAAKAIUIAAoAhxGDQAgAEEAQQAgACgCJBEFABogACgCFA0AQX8hASACDQEMAgsCQCAAKAIEIgEgACgCCCIDRg0AIAAgASADa6xBASAAKAIoEQ4AGgtBACEBIABBADYCHCAAQgA3AxAgAEIANwIEIAJFDQELIAAQhgQLIAELDQAgASACIAMgABEOAAslAQF+IAAgASACrSADrUIghoQgBBCOBSEFIAVCIIinELMEIAWnCxwAIAAgASACIAOnIANCIIinIASnIARCIIinECALEwAgACABpyABQiCIpyACIAMQIQsL8ouBgAACAEGAgAQLsIkBLSsgICAwWDB4AC0wWCswWCAwWC0weCsweCAweABzYXcAdW5zaWduZWQgc2hvcnQAdW5zaWduZWQgaW50AGluaXQAc2V0AGdldABmbG9hdAB1aW50NjRfdABnZXRTdGF0ZXMAcmVuZGVyRnJhbWVzAGdldFZvaWNlcwB2ZWN0b3IAdW5zaWduZWQgY2hhcgBzdGQ6OmV4Y2VwdGlvbgB0ZXJtaW5hdGVfaGFuZGxlciB1bmV4cGVjdGVkbHkgdGhyZXcgYW4gZXhjZXB0aW9uAG5hbgBub3RlT24AYm9vbABlbXNjcmlwdGVuOjp2YWwAcHVzaF9iYWNrAGJhZF9hcnJheV9uZXdfbGVuZ3RoAHVuc2lnbmVkIGxvbmcAc3RkOjp3c3RyaW5nAHN0ZDo6c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGluZgBub3RlT2ZmAHJlc2l6ZQBXYXZlVHlwZQBzaW5lAGRvdWJsZQB2b2lkAAogb25seSBzaW5lIGFuZCBzYXcgYXJlIHN1cHBvcnRlZAB0ZXJtaW5hdGVfaGFuZGxlciB1bmV4cGVjdGVkbHkgcmV0dXJuZWQAc3RkOjpiYWRfYWxsb2MATkFOAElORgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AdmVjdG9yPGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AdmVjdG9yPGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8Y2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4Ac3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGxvbmc+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4ALgAobnVsbCkAbGliYysrYWJpOiAAOFdhdmVUeXBlAAC8QgEAcQQBALQEAQBYQgEAoEIBAE5TdDNfXzI2dmVjdG9ySWZOU185YWxsb2NhdG9ySWZFRUVFAAhDAQCQBAEAaWlpZgAAAAD4QQEAfAQBAHZpaQD4QQEAoEIBAHZpZgC0BAEAaWkAAAwFAQBOU3QzX18yNnZlY3RvcklpTlNfOWFsbG9jYXRvcklpRUVFRQAIQwEA6AQBAFBOU3QzX18yNnZlY3RvcklmTlNfOWFsbG9jYXRvcklmRUVFRQAAAACMQwEAFAUBAAAAAAC0BAEAUEtOU3QzX18yNnZlY3RvcklmTlNfOWFsbG9jYXRvcklmRUVFRQAAAIxDAQBMBQEAAQAAALQEAQB2AHZpAAAAADwFAQD4QQEAPAUBAKBCAQB2aWlmAAAAAAAAAAAAAAAAAAAAAPhBAQA8BQEAfEIBAKBCAQB2aWlpZgAAAHxCAQB0BQEAaWlpAPQFAQC0BAEAfEIBAE4xMGVtc2NyaXB0ZW4zdmFsRQAACEMBAOAFAQBpaWlpAAAAAAAAAAAAAAAAAAAAABBCAQC0BAEAfEIBAKBCAQBpaWlpZgBQTlN0M19fMjZ2ZWN0b3JJaU5TXzlhbGxvY2F0b3JJaUVFRUUAAIxDAQAmBgEAAAAAAAwFAQBQS05TdDNfXzI2dmVjdG9ySWlOU185YWxsb2NhdG9ySWlFRUVFAAAAjEMBAFwGAQABAAAADAUBAEwGAQD4QQEATAYBAFhCAQB2aWlpAAAAAAAAAAD4QQEATAYBAHxCAQBYQgEAdmlpaWkAAAB8QgEAhAYBAPQFAQAMBQEAfEIBAAAAAAAQQgEADAUBAHxCAQBYQgEAaWlpaWkATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUAAAAACEMBAPYGAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAACEMBAEAHAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJd05TXzExY2hhcl90cmFpdHNJd0VFTlNfOWFsbG9jYXRvckl3RUVFRQAACEMBAIgHAQBOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAAAhDAQDQBwEATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAAAIQwEAHAgBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAACEMBAGgIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAAhDAQCQCAEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAAAIQwEAuAgBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAACEMBAOAIAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAAhDAQAICQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAAAIQwEAMAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQAACEMBAFgJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUAAAhDAQCACQEATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbUVFAAAIQwEAqAkBAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQAACEMBANAJAQBOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUAAAhDAQD4CQEAADj6/kIu5j8wZ8eTV/MuPQEAAAAAAOC/WzBRVVVV1T+QRev////PvxEB8SSzmck/n8gG5XVVxb8AAAAAAADgv3dVVVVVVdU/y/3/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';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(file);
    }
    throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, try to to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == 'function'
    ) {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
          return getBinary(wasmBinaryFile);
      });
    }
  }

  // Otherwise, getBinary should be able to get it synchronously
  return Promise.resolve().then(function() { return getBinary(wasmBinaryFile); });
}

function instantiateSync(file, info) {
  var instance;
  var module;
  var binary;
  try {
    binary = getBinary(file);
    module = new WebAssembly.Module(binary);
    instance = new WebAssembly.Instance(module, info);
  } catch (e) {
    var str = e.toString();
    err('failed to compile wasm module: ' + str);
    if (str.includes('imported Memory') ||
        str.includes('memory import')) {
      err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
    }
    throw e;
  }
  return [instance, module];
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;

    Module['asm'] = exports;

    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateMemoryViews();

    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');

  }
  // wait for the pthread pool (if any)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  // Also pthreads and wasm workers initialize the wasm instance through this path.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
    }
  }

  var result = instantiateSync(wasmBinaryFile, info);
  // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193,
  // the above line no longer optimizes out down to the following line.
  // When the regression is fixed, we can remove this if/else.
  receiveInstance(result[0]);
  return Module['asm']; // exports were assigned here
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};





  /** @constructor */
  function ExitStatus(status) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + status + ')';
      this.status = status;
    }

  function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    }

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
      if (type.endsWith('*')) type = '*';
      switch (type) {
        case 'i1': return HEAP8[((ptr)>>0)];
        case 'i8': return HEAP8[((ptr)>>0)];
        case 'i16': return HEAP16[((ptr)>>1)];
        case 'i32': return HEAP32[((ptr)>>2)];
        case 'i64': return HEAP32[((ptr)>>2)];
        case 'float': return HEAPF32[((ptr)>>2)];
        case 'double': return HEAPF64[((ptr)>>3)];
        case '*': return HEAPU32[((ptr)>>2)];
        default: abort('invalid type for getValue: ' + type);
      }
      return null;
    }

  function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      var chr = array[i];
      if (chr > 0xFF) {
        if (ASSERTIONS) {
          assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
        }
        chr &= 0xFF;
      }
      ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }

  function ptrToString(ptr) {
      assert(typeof ptr === 'number');
      return '0x' + ptr.toString(16).padStart(8, '0');
    }

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
      if (type.endsWith('*')) type = '*';
      switch (type) {
        case 'i1': HEAP8[((ptr)>>0)] = value; break;
        case 'i8': HEAP8[((ptr)>>0)] = value; break;
        case 'i16': HEAP16[((ptr)>>1)] = value; break;
        case 'i32': HEAP32[((ptr)>>2)] = value; break;
        case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); break;
        case 'float': HEAPF32[((ptr)>>2)] = value; break;
        case 'double': HEAPF64[((ptr)>>3)] = value; break;
        case '*': HEAPU32[((ptr)>>2)] = value; break;
        default: abort('invalid type for setValue: ' + type);
      }
    }

  function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }

  var exceptionCaught =  [];
  
  function exception_addRef(info) {
      info.add_ref();
    }
  
  var uncaughtExceptionCount = 0;
  function ___cxa_begin_catch(ptr) {
      var info = new ExceptionInfo(ptr);
      if (!info.get_caught()) {
        info.set_caught(true);
        uncaughtExceptionCount--;
      }
      info.set_rethrown(false);
      exceptionCaught.push(info);
      exception_addRef(info);
      return info.get_exception_ptr();
    }

  var exceptionLast = 0;
  
  /** @constructor */
  function ExceptionInfo(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 24;
  
      this.set_type = function(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      };
  
      this.get_type = function() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      };
  
      this.set_destructor = function(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      };
  
      this.get_destructor = function() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      };
  
      this.set_refcount = function(refcount) {
        HEAP32[((this.ptr)>>2)] = refcount;
      };
  
      this.set_caught = function (caught) {
        caught = caught ? 1 : 0;
        HEAP8[(((this.ptr)+(12))>>0)] = caught;
      };
  
      this.get_caught = function () {
        return HEAP8[(((this.ptr)+(12))>>0)] != 0;
      };
  
      this.set_rethrown = function (rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(((this.ptr)+(13))>>0)] = rethrown;
      };
  
      this.get_rethrown = function () {
        return HEAP8[(((this.ptr)+(13))>>0)] != 0;
      };
  
      // Initialize native structure fields. Should be called once after allocated.
      this.init = function(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
        this.set_refcount(0);
        this.set_caught(false);
        this.set_rethrown(false);
      }
  
      this.add_ref = function() {
        var value = HEAP32[((this.ptr)>>2)];
        HEAP32[((this.ptr)>>2)] = value + 1;
      };
  
      // Returns true if last reference released.
      this.release_ref = function() {
        var prev = HEAP32[((this.ptr)>>2)];
        HEAP32[((this.ptr)>>2)] = prev - 1;
        assert(prev > 0);
        return prev === 1;
      };
  
      this.set_adjusted_ptr = function(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      };
  
      this.get_adjusted_ptr = function() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      };
  
      // Get pointer which is expected to be received by catch clause in C++ code. It may be adjusted
      // when the pointer is casted to some of the exception object base classes (e.g. when virtual
      // inheritance is used). When a pointer is thrown this method should return the thrown pointer
      // itself.
      this.get_exception_ptr = function() {
        // Work around a fastcomp bug, this code is still included for some reason in a build without
        // exceptions support.
        var isPointer = ___cxa_is_pointer_type(this.get_type());
        if (isPointer) {
          return HEAPU32[((this.excPtr)>>2)];
        }
        var adjusted = this.get_adjusted_ptr();
        if (adjusted !== 0) return adjusted;
        return this.excPtr;
      };
    }
  
  function ___resumeException(ptr) {
      if (!exceptionLast) { exceptionLast = ptr; }
      throw ptr;
    }
  
  
  function ___cxa_find_matching_catch_2() {
      var thrown = exceptionLast;
      if (!thrown) {
        // just pass through the null ptr
        setTempRet0(0);
        return 0;
      }
      var info = new ExceptionInfo(thrown);
      info.set_adjusted_ptr(thrown);
      var thrownType = info.get_type();
      if (!thrownType) {
        // just pass through the thrown ptr
        setTempRet0(0);
        return thrown;
      }
  
      // can_catch receives a **, add indirection
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < arguments.length; i++) {
        var caughtType = arguments[i];
        if (caughtType === 0 || caughtType === thrownType) {
          // Catch all clause matched or exactly the same type is caught
          break;
        }
        var adjusted_ptr_addr = info.ptr + 16;
        if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
          setTempRet0(caughtType);
          return thrown;
        }
      }
      setTempRet0(thrownType);
      return thrown;
    }

  
  
  
  
  function ___cxa_find_matching_catch_3() {
      var thrown = exceptionLast;
      if (!thrown) {
        // just pass through the null ptr
        setTempRet0(0);
        return 0;
      }
      var info = new ExceptionInfo(thrown);
      info.set_adjusted_ptr(thrown);
      var thrownType = info.get_type();
      if (!thrownType) {
        // just pass through the thrown ptr
        setTempRet0(0);
        return thrown;
      }
  
      // can_catch receives a **, add indirection
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < arguments.length; i++) {
        var caughtType = arguments[i];
        if (caughtType === 0 || caughtType === thrownType) {
          // Catch all clause matched or exactly the same type is caught
          break;
        }
        var adjusted_ptr_addr = info.ptr + 16;
        if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
          setTempRet0(caughtType);
          return thrown;
        }
      }
      setTempRet0(thrownType);
      return thrown;
    }

  
  
  function ___cxa_throw(ptr, type, destructor) {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = ptr;
      uncaughtExceptionCount++;
      throw ptr;
    }


  function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {}

  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }
  var embind_charCodes = undefined;
  function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  var awaitingDependencies = {};
  
  var registeredTypes = {};
  
  var typeDependencies = {};
  
  var char_0 = 48;
  
  var char_9 = 57;
  function makeLegalFunctionName(name) {
      if (undefined === name) {
        return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return '_' + name;
      }
      return name;
    }
  function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }
  function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
        this.name = errorName;
        this.message = message;
  
        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
          this.stack = this.toString() + '\n' +
              stack.replace(/^Error(:[^\n]*)?\n/, '');
        }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
        if (this.message === undefined) {
          return this.name;
        } else {
          return this.name + ': ' + this.message;
        }
      };
  
      return errorClass;
    }
  var BindingError = undefined;
  function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  
  
  
  var InternalError = undefined;
  function throwInternalError(message) {
      throw new InternalError(message);
    }
  function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach((dt, i) => {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(() => {
            typeConverters[i] = registeredTypes[dt];
            ++registered;
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters);
            }
          });
        }
      });
      if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
      }
    }
  /** @param {Object=} options */
  function registerType(rawType, registeredInstance, options = {}) {
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach((cb) => cb());
      }
    }
  function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
        return false;
      }
      if (!(other instanceof ClassHandle)) {
        return false;
      }
  
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
  
      while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
      }
  
      while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
      }
  
      return leftClass === rightClass && left === right;
    }
  
  function shallowCopyInternalPointer(o) {
      return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType,
      };
    }
  
  function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    }
  
  var finalizationRegistry = false;
  
  function detachFinalizer(handle) {}
  
  function runDestructor($$) {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }
  function releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = 0 === $$.count.value;
      if (toDelete) {
        runDestructor($$);
      }
    }
  
  function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
        return ptr;
      }
      if (undefined === desiredClass.baseClass) {
        return null; // no conversion
      }
  
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
        return null;
      }
      return desiredClass.downcast(rv);
    }
  
  var registeredPointers = {};
  
  function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }
  
  function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    }
  
  var deletionQueue = [];
  function flushPendingDeletes() {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
      }
    }
  
  var delayFunction = undefined;
  
  
  function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    }
  function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    }
  var registeredInstances = {};
  
  function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
          throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
          ptr = class_.upcast(ptr);
          class_ = class_.baseClass;
      }
      return ptr;
    }
  function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }
  
  
  function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, {
        $$: {
            value: record,
        },
      }));
    }
  function RegisteredPointer_fromWireType(ptr) {
      // ptr is a raw pointer (or a raw smartpointer)
  
      // rawPointer is a maybe-null raw pointer
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
        this.destructor(ptr);
        return null;
      }
  
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
        // JS object has been neutered, time to repopulate it
        if (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          return registeredInstance['clone']();
        } else {
          // else, just increment reference count on existing object
          // it already has a reference to the smart pointer
          var rv = registeredInstance['clone']();
          this.destructor(ptr);
          return rv;
        }
      }
  
      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this.pointeeType,
            ptr: rawPointer,
            smartPtrType: this,
            smartPtr: ptr,
          });
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this,
            ptr: ptr,
          });
        }
      }
  
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
      }
  
      var toType;
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } else {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
          rawPointer,
          this.registeredClass,
          toType.registeredClass);
      if (dp === null) {
        return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
          smartPtrType: this,
          smartPtr: ptr,
        });
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
        });
      }
    }
  function attachFinalizer(handle) {
      if ('undefined' === typeof FinalizationRegistry) {
        attachFinalizer = (handle) => handle;
        return handle;
      }
      // If the running environment has a FinalizationRegistry (see
      // https://github.com/tc39/proposal-weakrefs), then attach finalizers
      // for class handles.  We check for the presence of FinalizationRegistry
      // at run-time, not build-time.
      finalizationRegistry = new FinalizationRegistry((info) => {
        console.warn(info.leakWarning.stack.replace(/^Error: /, ''));
        releaseClassHandle(info.$$);
      });
      attachFinalizer = (handle) => {
        var $$ = handle.$$;
        var hasSmartPtr = !!$$.smartPtr;
        if (hasSmartPtr) {
          // We should not call the destructor on raw pointers in case other code expects the pointee to live
          var info = { $$: $$ };
          // Create a warning as an Error instance in advance so that we can store
          // the current stacktrace and point to it when / if a leak is detected.
          // This is more useful than the empty stacktrace of `FinalizationRegistry`
          // callback.
          var cls = $$.ptrType.registeredClass;
          info.leakWarning = new Error("Embind found a leaked C++ instance " + cls.name + " <" + ptrToString($$.ptr) + ">.\n" +
          "We'll free it automatically in this case, but this functionality is not reliable across various environments.\n" +
          "Make sure to invoke .delete() manually once you're done with the instance instead.\n" +
          "Originally allocated"); // `.stack` will add "at ..." after this sentence
          if ('captureStackTrace' in Error) {
            Error.captureStackTrace(info.leakWarning, RegisteredPointer_fromWireType);
          }
          finalizationRegistry.register(handle, info, handle);
        }
        return handle;
      };
      detachFinalizer = (handle) => finalizationRegistry.unregister(handle);
      return attachFinalizer(handle);
    }
  function ClassHandle_clone() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this;
      } else {
        var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
          $$: {
            value: shallowCopyInternalPointer(this.$$),
          }
        }));
  
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone;
      }
    }
  
  
  
  
  function ClassHandle_delete() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
  
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Object already scheduled for deletion');
      }
  
      detachFinalizer(this);
      releaseClassHandle(this.$$);
  
      if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = undefined;
        this.$$.ptr = undefined;
      }
    }
  
  function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }
  
  
  
  function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Object already scheduled for deletion');
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }
  function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    }
  function ClassHandle() {
    }
  
  
  
  function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
        proto[methodName] = function() {
          // TODO This check can be removed in -O3 level "unsafe" optimizations.
          if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
              throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
          }
          return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        // Move the previous function into the overload table.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }
  
  /** @param {number=} numArguments */
  function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
          throwBindingError("Cannot register public name '" + name + "' twice");
        }
  
        // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
        // that routes between the two.
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
        }
        // Add the new function into the overload table.
        Module[name].overloadTable[numArguments] = value;
      }
      else {
        Module[name] = value;
        if (undefined !== numArguments) {
          Module[name].numArguments = numArguments;
        }
      }
    }
  
  
  
  /** @constructor */
  function RegisteredClass(name,
                               constructor,
                               instancePrototype,
                               rawDestructor,
                               baseClass,
                               getActualType,
                               upcast,
                               downcast) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
  
  
  function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    }
  function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
      }
  
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + embindRepr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  
  function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
  
        if (this.isSmartPointer) {
          ptr = this.rawConstructor();
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
          return ptr;
        } else {
          return 0;
        }
      }
  
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + embindRepr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
  
      if (this.isSmartPointer) {
        // TODO: this is not strictly true
        // We could support BY_EMVAL conversions from raw pointers to smart pointers
        // because the smart pointer can hold a reference to the handle
        if (undefined === handle.$$.smartPtr) {
          throwBindingError('Passing raw pointer to smart pointer is illegal');
        }
  
        switch (this.sharingPolicy) {
          case 0: // NONE
            // no upcasting
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
            }
            break;
  
          case 1: // INTRUSIVE
            ptr = handle.$$.smartPtr;
            break;
  
          case 2: // BY_EMVAL
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              var clonedHandle = handle['clone']();
              ptr = this.rawShare(
                ptr,
                Emval.toHandle(function() {
                  clonedHandle['delete']();
                })
              );
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
              }
            }
            break;
  
          default:
            throwBindingError('Unsupporting sharing policy');
        }
      }
      return ptr;
    }
  
  
  function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
      }
  
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + embindRepr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (handle.$$.ptrType.isConst) {
          throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAP32[((pointer)>>2)]);
    }
  
  function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }
  
  function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
        this.rawDestructor(ptr);
      }
    }
  
  function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
        handle['delete']();
      }
    }
  
  function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    }
  /** @constructor
      @param {*=} pointeeType,
      @param {*=} sharingPolicy,
      @param {*=} rawGetPointee,
      @param {*=} rawConstructor,
      @param {*=} rawShare,
      @param {*=} rawDestructor,
       */
  function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,
  
      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
  
      // smart pointer properties
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
  
      if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
          this['toWireType'] = constNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        } else {
          this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        }
      } else {
        this['toWireType'] = genericPointerToWireType;
        // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
        // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
        // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
        //       craftInvokerFunction altogether.
      }
    }
  
  /** @param {number=} numArguments */
  function replacePublicSymbol(name, value, numArguments) {
      if (!Module.hasOwnProperty(name)) {
        throwInternalError('Replacing nonexistant public symbol');
      }
      // If there's an overload table for this symbol, replace the symbol in the overload table instead.
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
      }
      else {
        Module[name] = value;
        Module[name].argCount = numArguments;
      }
    }
  
  
  
  function dynCallLegacy(sig, ptr, args) {
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - dynCall function not found for sig \'' + sig + '\'');
      if (args && args.length) {
        // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
      } else {
        assert(sig.length == 1);
      }
      var f = Module['dynCall_' + sig];
      return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
    }
  
  var wasmTableMirror = [];
  
  function getWasmTableEntry(funcPtr) {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
      return func;
    }
  
  /** @param {Object=} args */
  function dynCall(sig, ptr, args) {
      // Without WASM_BIGINT support we cannot directly call function with i64 as
      // part of thier signature, so we rely the dynCall functions generated by
      // wasm-emscripten-finalize
      if (sig.includes('j')) {
        return dynCallLegacy(sig, ptr, args);
      }
      assert(getWasmTableEntry(ptr), 'missing table entry in dynCall: ' + ptr);
      var rtn = getWasmTableEntry(ptr).apply(null, args);
      return rtn;
    }
  
  function getDynCaller(sig, ptr) {
      assert(sig.includes('j') || sig.includes('p'), 'getDynCaller should only be called with i64 sigs')
      var argCache = [];
      return function() {
        argCache.length = 0;
        Object.assign(argCache, arguments);
        return dynCall(sig, ptr, argCache);
      };
    }
  
  
  function embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
  
      function makeDynCaller() {
        if (signature.includes('j')) {
          return getDynCaller(signature, rawFunction);
        }
        return getWasmTableEntry(rawFunction);
      }
  
      var fp = makeDynCaller();
      if (typeof fp != "function") {
          throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }
  
  
  
  var UnboundTypeError = undefined;
  
  
  function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }
  function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
        if (seen[type]) {
          return;
        }
        if (registeredTypes[type]) {
          return;
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit);
          return;
        }
        unboundTypes.push(type);
        seen[type] = true;
      }
      types.forEach(visit);
  
      throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    }
  
  function __embind_register_class(rawType,
                                     rawPointerType,
                                     rawConstPointerType,
                                     baseClassRawType,
                                     getActualTypeSignature,
                                     getActualType,
                                     upcastSignature,
                                     upcast,
                                     downcastSignature,
                                     downcast,
                                     name,
                                     destructorSignature,
                                     rawDestructor) {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
        upcast = embind__requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
        downcast = embind__requireFunction(downcastSignature, downcast);
      }
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
  
      exposePublicSymbol(legalFunctionName, function() {
        // this code cannot run if baseClassRawType is zero
        throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
      });
  
      whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        function(base) {
          base = base[0];
  
          var baseClass;
          var basePrototype;
          if (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype;
          } else {
            basePrototype = ClassHandle.prototype;
          }
  
          var constructor = createNamedFunction(legalFunctionName, function() {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name);
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " has no accessible constructor");
            }
            var body = registeredClass.constructor_body[arguments.length];
            if (undefined === body) {
              throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
            }
            return body.apply(this, arguments);
          });
  
          var instancePrototype = Object.create(basePrototype, {
            constructor: { value: constructor },
          });
  
          constructor.prototype = instancePrototype;
  
          var registeredClass = new RegisteredClass(name,
                                                    constructor,
                                                    instancePrototype,
                                                    rawDestructor,
                                                    baseClass,
                                                    getActualType,
                                                    upcast,
                                                    downcast);
  
          var referenceConverter = new RegisteredPointer(name,
                                                         registeredClass,
                                                         true,
                                                         false,
                                                         false);
  
          var pointerConverter = new RegisteredPointer(name + '*',
                                                       registeredClass,
                                                       false,
                                                       false,
                                                       false);
  
          var constPointerConverter = new RegisteredPointer(name + ' const*',
                                                            registeredClass,
                                                            false,
                                                            true,
                                                            false);
  
          registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter
          };
  
          replacePublicSymbol(legalFunctionName, constructor);
  
          return [referenceConverter, pointerConverter, constPointerConverter];
        }
      );
    }

  function heap32VectorToArray(count, firstElement) {
      var array = [];
      for (var i = 0; i < count; i++) {
          // TODO(https://github.com/emscripten-core/emscripten/issues/17310):
          // Find a way to hoist the `>> 2` or `>> 3` out of this loop.
          array.push(HEAPU32[(((firstElement)+(i * 4))>>2)]);
      }
      return array;
    }
  
  
  function runDestructors(destructors) {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    }
  
  
  
  
  
  function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError('new_ called with constructor type ' + typeof(constructor) + " which is not a function");
      }
      /*
       * Previously, the following line was just:
       *   function dummy() {};
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even
       * though at creation, the 'dummy' has the correct constructor name.  Thus,
       * objects created with IMVU.new would show up in the debugger as 'dummy',
       * which isn't very helpful.  Using IMVU.createNamedFunction addresses the
       * issue.  Doublely-unfortunately, there's no way to write a test for this
       * behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function(){});
      dummy.prototype = constructor.prototype;
      var obj = new dummy;
  
      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    }
  
  
  function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      var argCount = argTypes.length;
  
      if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
  
      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);
  
      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
  // TODO: This omits argument count check - enable only at -O3 or similar.
  //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
  //       return FUNCTION_TABLE[fn];
  //    }
  
      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = false;
  
      for (var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
          needsDestructorStack = true;
          break;
        }
      }
  
      var returns = (argTypes[0].name !== "void");
  
      var argsList = "";
      var argsListWired = "";
      for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i!==0?", ":"")+"arg"+i;
        argsListWired += (i!==0?", ":"")+"arg"+i+"Wired";
      }
  
      var invokerFnBody =
          "return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n" +
          "if (arguments.length !== "+(argCount - 2)+") {\n" +
              "throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount - 2)+" args!');\n" +
          "}\n";
  
      if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n";
      }
  
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
  
      if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType("+dtorStack+", this);\n";
      }
  
      for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";
        args1.push("argType"+i);
        args2.push(argTypes[i+2]);
      }
  
      if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
  
      invokerFnBody +=
          (returns?"var rv = ":"") + "invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";
  
      if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
      } else {
        for (var i = isClassMethodFunc?1:2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
          var paramName = (i === 1 ? "thisWired" : ("arg"+(i - 2)+"Wired"));
          if (argTypes[i].destructorFunction !== null) {
            invokerFnBody += paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";
            args1.push(paramName+"_dtor");
            args2.push(argTypes[i].destructorFunction);
          }
        }
      }
  
      if (returns) {
        invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
                         "return ret;\n";
      } else {
      }
  
      invokerFnBody += "}\n";
  
      args1.push(invokerFnBody);
  
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }
  function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      var args = [rawConstructor];
      var destructors = [];
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = 'constructor ' + classType.name;
  
        if (undefined === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
          throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount-1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        }
        classType.registeredClass.constructor_body[argCount - 1] = () => {
          throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
        };
  
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
          // Insert empty slot for context type (argTypes[1]).
          argTypes.splice(1, 0, null);
          classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
          return [];
        });
        return [];
      });
    }

  
  
  
  
  
  function __embind_register_class_function(rawClassType,
                                              methodName,
                                              argCount,
                                              rawArgTypesAddr, // [ReturnType, ThisType, Args...]
                                              invokerSignature,
                                              rawInvoker,
                                              context,
                                              isPureVirtual) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
  
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;
  
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)];
        }
  
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
  
        function unboundTypesHandler() {
          throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
        }
  
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
          // This is the first overload to be registered, OR we are replacing a
          // function in the base class with a function in the derived class.
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          // There was an existing function with the same name registered. Set up
          // a function overload routing table.
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }
  
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
          var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
  
          // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
          // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
          if (undefined === proto[methodName].overloadTable) {
            // Set argCount in case an overload is registered later
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }
  
          return [];
        });
        return [];
      });
    }

  var emval_free_list = [];
  
  var emval_handle_array = [{},{value:undefined},{value:null},{value:true},{value:false}];
  function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
        emval_handle_array[handle] = undefined;
        emval_free_list.push(handle);
      }
    }
  
  
  
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
          ++count;
        }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
          return emval_handle_array[i];
        }
      }
      return null;
    }
  function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }
  var Emval = {toValue:(handle) => {
        if (!handle) {
            throwBindingError('Cannot use deleted val. handle = ' + handle);
        }
        return emval_handle_array[handle].value;
      },toHandle:(value) => {
        switch (value) {
          case undefined: return 1;
          case null: return 2;
          case true: return 3;
          case false: return 4;
          default:{
            var handle = emval_free_list.length ?
                emval_free_list.pop() :
                emval_handle_array.length;
  
            emval_handle_array[handle] = {refcount: 1, value: value};
            return handle;
          }
        }
      }};
  
  
  
  function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': function(handle) {
          var rv = Emval.toValue(handle);
          __emval_decref(handle);
          return rv;
        },
        'toWireType': function(destructors, value) {
          return Emval.toHandle(value);
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: null, // This type does not need a destructor
  
        // TODO: do we need a deleteObject here?  write a test where
        // emval is passed into JS via an interface
      });
    }

  
  
  function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
          case 0: return function(pointer) {
              var heap = signed ? HEAP8 : HEAPU8;
              return this['fromWireType'](heap[pointer]);
          };
          case 1: return function(pointer) {
              var heap = signed ? HEAP16 : HEAPU16;
              return this['fromWireType'](heap[pointer >> 1]);
          };
          case 2: return function(pointer) {
              var heap = signed ? HEAP32 : HEAPU32;
              return this['fromWireType'](heap[pointer >> 2]);
          };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }
  
  
  function __embind_register_enum(rawType, name, size, isSigned) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
  
      function ctor() {}
      ctor.values = {};
  
      registerType(rawType, {
        name: name,
        constructor: ctor,
        'fromWireType': function(c) {
          return this.constructor.values[c];
        },
        'toWireType': function(destructors, c) {
          return c.value;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
        destructorFunction: null,
      });
      exposePublicSymbol(name, ctor);
    }

  
  
  
  
  function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
          throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
      }
      return impl;
    }
  function __embind_register_enum_value(rawEnumType, name, enumValue) {
      var enumType = requireRegisteredType(rawEnumType, 'enum');
      name = readLatin1String(name);
  
      var Enum = enumType.constructor;
  
      var Value = Object.create(enumType.constructor.prototype, {
        value: {value: enumValue},
        constructor: {value: createNamedFunction(enumType.name + '_' + name, function() {})},
      });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }

  function embindRepr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }
  
  
  
  function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
           return value;
        },
        'toWireType': function(destructors, value) {
          if (typeof value != "number" && typeof value != "boolean") {
            throw new TypeError('Cannot convert "' + embindRepr(value) + '" to ' + this.name);
          }
          // The VM will perform JS to Wasm value conversion, according to the spec:
          // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
          return value;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': floatReadValueFromPointer(name, shift),
        destructorFunction: null, // This type does not need a destructor
      });
    }

  
  
  
  
  
  
  
  function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
      var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      name = readLatin1String(name);
  
      rawInvoker = embind__requireFunction(signature, rawInvoker);
  
      exposePublicSymbol(name, function() {
        throwUnboundTypeError('Cannot call ' + name + ' due to unbound types', argTypes);
      }, argCount - 1);
  
      whenDependentTypesAreResolved([], argTypes, function(argTypes) {
        var invokerArgsArray = [argTypes[0] /* return value */, null /* no class 'this'*/].concat(argTypes.slice(1) /* actual params */);
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null /* no class 'this'*/, rawInvoker, fn), argCount - 1);
        return [];
      });
    }

  
  
  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }
  
  
  function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come
      // out as 'i32 -1'. Always treat those as max u32.
      if (maxRange === -1) {
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
  
      var fromWireType = (value) => value;
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = (value) => (value << bitshift) >>> bitshift;
      }
  
      var isUnsignedType = (name.includes('unsigned'));
      var checkAssertions = (value, toTypeName) => {
        if (typeof value != "number" && typeof value != "boolean") {
          throw new TypeError('Cannot convert "' + embindRepr(value) + '" to ' + toTypeName);
        }
        if (value < minRange || value > maxRange) {
          throw new TypeError('Passing a number "' + embindRepr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
        }
      }
      var toWireType;
      if (isUnsignedType) {
        toWireType = function(destructors, value) {
          checkAssertions(value, this.name);
          return value >>> 0;
        }
      } else {
        toWireType = function(destructors, value) {
          checkAssertions(value, this.name);
          // The VM will perform JS to Wasm value conversion, according to the spec:
          // https://www.w3.org/TR/wasm-js-api-1/#towebassemblyvalue
          return value;
        }
      }
      registerType(primitiveType, {
        name: name,
        'fromWireType': fromWireType,
        'toWireType': toWireType,
        'argPackAdvance': 8,
        'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
        destructorFunction: null, // This type does not need a destructor
      });
    }

  
  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle]; // in elements
        var data = heap[handle + 1]; // byte offset into emscripten heap
        return new TA(heap.buffer, data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': decodeMemoryView,
        'argPackAdvance': 8,
        'readValueFromPointer': decodeMemoryView,
      }, {
        ignoreDuplicateRegistrations: true,
      });
    }

  
  
  
  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
          var length = HEAPU32[((value)>>2)];
          var payload = value + 4;
  
          var str;
          if (stdStringIsUTF8) {
            var decodeStartPtr = payload;
            // Looping here to support possible embedded '0' bytes
            for (var i = 0; i <= length; ++i) {
              var currentBytePtr = payload + i;
              if (i == length || HEAPU8[currentBytePtr] == 0) {
                var maxRead = currentBytePtr - decodeStartPtr;
                var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                if (str === undefined) {
                  str = stringSegment;
                } else {
                  str += String.fromCharCode(0);
                  str += stringSegment;
                }
                decodeStartPtr = currentBytePtr + 1;
              }
            }
          } else {
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
              a[i] = String.fromCharCode(HEAPU8[payload + i]);
            }
            str = a.join('');
          }
  
          _free(value);
  
          return str;
        },
        'toWireType': function(destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
          }
  
          var length;
          var valueIsOfTypeString = (typeof value == 'string');
  
          if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
            throwBindingError('Cannot pass non-string to std::string');
          }
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            length = lengthBytesUTF8(value);
          } else {
            length = value.length;
          }
  
          // assumes 4-byte alignment
          var base = _malloc(4 + length + 1);
          var ptr = base + 4;
          HEAPU32[((base)>>2)] = length;
          if (stdStringIsUTF8 && valueIsOfTypeString) {
            stringToUTF8(value, ptr, length + 1);
          } else {
            if (valueIsOfTypeString) {
              for (var i = 0; i < length; ++i) {
                var charCode = value.charCodeAt(i);
                if (charCode > 255) {
                  _free(ptr);
                  throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                }
                HEAPU8[ptr + i] = charCode;
              }
            } else {
              for (var i = 0; i < length; ++i) {
                HEAPU8[ptr + i] = value[i];
              }
            }
          }
  
          if (destructors !== null) {
            destructors.push(_free, base);
          }
          return base;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  
  
  
  var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;;
  function UTF16ToString(ptr, maxBytesToRead) {
      assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
      var endPtr = ptr;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // Also, use the length info to avoid running tiny strings through
      // TextDecoder, since .subarray() allocates garbage.
      var idx = endPtr >> 1;
      var maxIdx = idx + maxBytesToRead / 2;
      // If maxBytesToRead is not passed explicitly, it will be undefined, and this
      // will always evaluate to true. This saves on code size.
      while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
      endPtr = idx << 1;
  
      if (endPtr - ptr > 32 && UTF16Decoder)
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  
      // Fallback: decode without UTF16Decoder
      var str = '';
  
      // If maxBytesToRead is not passed explicitly, it will be undefined, and the
      // for-loop's condition will always evaluate to true. The loop is then
      // terminated on the first null char.
      for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
        var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit == 0) break;
        // fromCharCode constructs a character from a UTF-16 code unit, so we can
        // pass the UTF16 string right through.
        str += String.fromCharCode(codeUnit);
      }
  
      return str;
    }
  
  function stringToUTF16(str, outPtr, maxBytesToWrite) {
      assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
      }
      if (maxBytesToWrite < 2) return 0;
      maxBytesToWrite -= 2; // Null terminator.
      var startPtr = outPtr;
      var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
      for (var i = 0; i < numCharsToWrite; ++i) {
        // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        HEAP16[((outPtr)>>1)] = codeUnit;
        outPtr += 2;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP16[((outPtr)>>1)] = 0;
      return outPtr - startPtr;
    }
  
  function lengthBytesUTF16(str) {
      return str.length*2;
    }
  
  function UTF32ToString(ptr, maxBytesToRead) {
      assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
      var i = 0;
  
      var str = '';
      // If maxBytesToRead is not passed explicitly, it will be undefined, and this
      // will always evaluate to true. This saves on code size.
      while (!(i >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
        if (utf32 == 0) break;
        ++i;
        // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        if (utf32 >= 0x10000) {
          var ch = utf32 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        } else {
          str += String.fromCharCode(utf32);
        }
      }
      return str;
    }
  
  function stringToUTF32(str, outPtr, maxBytesToWrite) {
      assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
      }
      if (maxBytesToWrite < 4) return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
          var trailSurrogate = str.charCodeAt(++i);
          codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
        }
        HEAP32[((outPtr)>>2)] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP32[((outPtr)>>2)] = 0;
      return outPtr - startPtr;
    }
  
  function lengthBytesUTF32(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
        len += 4;
      }
  
      return len;
    }
  function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
        getHeap = () => HEAPU16;
        shift = 1;
      } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        getHeap = () => HEAPU32;
        shift = 2;
      }
      registerType(rawType, {
        name: name,
        'fromWireType': function(value) {
          // Code mostly taken from _embind_register_std_string fromWireType
          var length = HEAPU32[value >> 2];
          var HEAP = getHeap();
          var str;
  
          var decodeStartPtr = value + 4;
          // Looping here to support possible embedded '0' bytes
          for (var i = 0; i <= length; ++i) {
            var currentBytePtr = value + 4 + i * charSize;
            if (i == length || HEAP[currentBytePtr >> shift] == 0) {
              var maxReadBytes = currentBytePtr - decodeStartPtr;
              var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
              if (str === undefined) {
                str = stringSegment;
              } else {
                str += String.fromCharCode(0);
                str += stringSegment;
              }
              decodeStartPtr = currentBytePtr + charSize;
            }
          }
  
          _free(value);
  
          return str;
        },
        'toWireType': function(destructors, value) {
          if (!(typeof value == 'string')) {
            throwBindingError('Cannot pass non-string to C++ string type ' + name);
          }
  
          // assumes 4-byte alignment
          var length = lengthBytesUTF(value);
          var ptr = _malloc(4 + length + charSize);
          HEAPU32[ptr >> 2] = length >> shift;
  
          encodeString(value, ptr + 4, length + charSize);
  
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  
  function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }


  function __emval_incref(handle) {
      if (handle > 4) {
        emval_handle_array[handle].refcount += 1;
      }
    }

  
  function __emval_take_value(type, arg) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](arg);
      return Emval.toHandle(v);
    }

  function _abort() {
      abort('native code called abort()');
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  function getHeapMax() {
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      return 2147483648;
    }
  
  function emscripten_realloc_buffer(size) {
      var b = wasmMemory.buffer;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow((size - b.byteLength + 65535) >>> 16); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err('emscripten_realloc_buffer: Attempted to grow heap from ' + b.byteLength  + ' bytes to ' + size + ' bytes, but got error: ' + e);
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    }
  function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err('Cannot enlarge memory, asked to go up to ' + requestedSize + ' bytes, but the limit is ' + maxHeapSize + ' bytes!');
        return false;
      }
  
      let alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err('Failed to grow the heap from ' + oldSize + ' bytes to ' + newSize + ' bytes, not enough memory!');
      return false;
    }

  
  var SYSCALLS = {varargs:undefined,get:function() {
        assert(SYSCALLS.varargs != undefined);
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      }};
  function _proc_exit(code) {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        if (Module['onExit']) Module['onExit'](code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    }
  /** @param {boolean|number=} implicit */
  function exitJS(status, implicit) {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
        err(msg);
      }
  
      _proc_exit(status);
    }
  var _exit = exitJS;

  function _fd_close(fd) {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    }

  function convertI32PairToI53Checked(lo, hi) {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    }
  
  
  
  
  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
      return 70;
    }

  var printCharBuffers = [null,[],[]];
  function printChar(stream, curr) {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    }
  
  function flush_NO_FILESYSTEM() {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    }
  
  
  function _fd_write(fd, iov, iovcnt, pnum) {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    }

embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_ClassHandle();
init_embind();;
init_RegisteredPointer();
UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
init_emval();;
var ASSERTIONS = true;

// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob == 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}
var asmLibraryArg = {
  "__cxa_begin_catch": ___cxa_begin_catch,
  "__cxa_find_matching_catch_2": ___cxa_find_matching_catch_2,
  "__cxa_find_matching_catch_3": ___cxa_find_matching_catch_3,
  "__cxa_throw": ___cxa_throw,
  "__resumeException": ___resumeException,
  "_embind_register_bigint": __embind_register_bigint,
  "_embind_register_bool": __embind_register_bool,
  "_embind_register_class": __embind_register_class,
  "_embind_register_class_constructor": __embind_register_class_constructor,
  "_embind_register_class_function": __embind_register_class_function,
  "_embind_register_emval": __embind_register_emval,
  "_embind_register_enum": __embind_register_enum,
  "_embind_register_enum_value": __embind_register_enum_value,
  "_embind_register_float": __embind_register_float,
  "_embind_register_function": __embind_register_function,
  "_embind_register_integer": __embind_register_integer,
  "_embind_register_memory_view": __embind_register_memory_view,
  "_embind_register_std_string": __embind_register_std_string,
  "_embind_register_std_wstring": __embind_register_std_wstring,
  "_embind_register_void": __embind_register_void,
  "_emval_decref": __emval_decref,
  "_emval_incref": __emval_incref,
  "_emval_take_value": __emval_take_value,
  "abort": _abort,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "exit": _exit,
  "fd_close": _fd_close,
  "fd_seek": _fd_seek,
  "fd_write": _fd_write,
  "invoke_iii": invoke_iii,
  "invoke_v": invoke_v,
  "invoke_vi": invoke_vi,
  "invoke_vii": invoke_vii
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors", asm);

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc", asm);

/** @type {function(...*):?} */
var ___getTypeName = Module["___getTypeName"] = createExportWrapper("__getTypeName", asm);

/** @type {function(...*):?} */
var __embind_initialize_bindings = Module["__embind_initialize_bindings"] = createExportWrapper("_embind_initialize_bindings", asm);

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location", asm);

/** @type {function(...*):?} */
var _fflush = Module["_fflush"] = createExportWrapper("fflush", asm);

/** @type {function(...*):?} */
var _free = Module["_free"] = createExportWrapper("free", asm);

/** @type {function(...*):?} */
var _setThrew = Module["_setThrew"] = createExportWrapper("setThrew", asm);

/** @type {function(...*):?} */
var setTempRet0 = Module["setTempRet0"] = createExportWrapper("setTempRet0", asm);

/** @type {function(...*):?} */
var getTempRet0 = Module["getTempRet0"] = createExportWrapper("getTempRet0", asm);

/** @type {function(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = asm["emscripten_stack_init"]

/** @type {function(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = asm["emscripten_stack_get_free"]

/** @type {function(...*):?} */
var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = asm["emscripten_stack_get_base"]

/** @type {function(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = asm["emscripten_stack_get_end"]

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave", asm);

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore", asm);

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc", asm);

/** @type {function(...*):?} */
var _emscripten_stack_get_current = Module["_emscripten_stack_get_current"] = asm["emscripten_stack_get_current"]

/** @type {function(...*):?} */
var ___cxa_free_exception = Module["___cxa_free_exception"] = createExportWrapper("__cxa_free_exception", asm);

/** @type {function(...*):?} */
var ___cxa_can_catch = Module["___cxa_can_catch"] = createExportWrapper("__cxa_can_catch", asm);

/** @type {function(...*):?} */
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = createExportWrapper("__cxa_is_pointer_type", asm);

/** @type {function(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", asm);


function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)();
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index,a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0) throw e;
    _setThrew(1, 0);
  }
}




// === Auto-generated postamble setup entry stuff ===


var unexportedRuntimeSymbols = [
  'run',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'addOnPreRun',
  'addOnInit',
  'addOnPreMain',
  'addOnExit',
  'addOnPostRun',
  'addRunDependency',
  'removeRunDependency',
  'FS_createFolder',
  'FS_createPath',
  'FS_createDataFile',
  'FS_createPreloadedFile',
  'FS_createLazyFile',
  'FS_createLink',
  'FS_createDevice',
  'FS_unlink',
  'getLEB',
  'getFunctionTables',
  'alignFunctionTables',
  'registerFunctions',
  'prettyPrint',
  'getCompilerSetting',
  'out',
  'err',
  'callMain',
  'abort',
  'keepRuntimeAlive',
  'wasmMemory',
  'stackAlloc',
  'stackSave',
  'stackRestore',
  'getTempRet0',
  'setTempRet0',
  'writeStackCookie',
  'checkStackCookie',
  'intArrayFromBase64',
  'tryParseAsDataURI',
  'ptrToString',
  'zeroMemory',
  'stringToNewUTF8',
  'exitJS',
  'getHeapMax',
  'emscripten_realloc_buffer',
  'ENV',
  'ERRNO_CODES',
  'ERRNO_MESSAGES',
  'setErrNo',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'DNS',
  'getHostByName',
  'Protocols',
  'Sockets',
  'getRandomDevice',
  'warnOnce',
  'traverseStack',
  'UNWIND_CACHE',
  'convertPCtoSourceLocation',
  'readEmAsmArgsArray',
  'readEmAsmArgs',
  'runEmAsmFunction',
  'runMainThreadEmAsm',
  'jstoi_q',
  'jstoi_s',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'dynCallLegacy',
  'getDynCaller',
  'dynCall',
  'handleException',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'safeSetTimeout',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'handleAllocator',
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'freeTableIndexes',
  'functionsInTableMap',
  'getEmptyTableSlot',
  'updateTableMap',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16Decoder',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'writeStringToMemory',
  'writeArrayToMemory',
  'writeAsciiToMemory',
  'SYSCALLS',
  'getSocketFromFD',
  'getSocketAddress',
  'JSEvents',
  'registerKeyEventCallback',
  'specialHTMLTargets',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'demangle',
  'demangleAll',
  'jsStackTrace',
  'stackTrace',
  'ExitStatus',
  'getEnvStrings',
  'checkWasiClock',
  'flush_NO_FILESYSTEM',
  'dlopenMissingError',
  'createDyncallWrapper',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'promiseMap',
  'newNativePromise',
  'getPromise',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'exception_addRef',
  'exception_decRef',
  'getExceptionMessageCommon',
  'incrementExceptionRefcount',
  'decrementExceptionRefcount',
  'getExceptionMessage',
  'Browser',
  'setMainLoop',
  'wget',
  'FS',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  '_setNetworkCallback',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'GL',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  'writeGLArray',
  'AL',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'SDL',
  'SDL_gfx',
  'GLUT',
  'EGL',
  'GLFW_Window',
  'GLFW',
  'GLEW',
  'IDBStore',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'InternalError',
  'BindingError',
  'UnboundTypeError',
  'PureVirtualError',
  'init_embind',
  'throwInternalError',
  'throwBindingError',
  'throwUnboundTypeError',
  'ensureOverloadTable',
  'exposePublicSymbol',
  'replacePublicSymbol',
  'extendError',
  'createNamedFunction',
  'embindRepr',
  'registeredInstances',
  'getBasestPointer',
  'registerInheritedInstance',
  'unregisterInheritedInstance',
  'getInheritedInstance',
  'getInheritedInstanceCount',
  'getLiveInheritedInstances',
  'registeredTypes',
  'awaitingDependencies',
  'typeDependencies',
  'registeredPointers',
  'registerType',
  'whenDependentTypesAreResolved',
  'embind_charCodes',
  'embind_init_charCodes',
  'readLatin1String',
  'getTypeName',
  'heap32VectorToArray',
  'requireRegisteredType',
  'getShiftFromSize',
  'integerReadValueFromPointer',
  'enumReadValueFromPointer',
  'floatReadValueFromPointer',
  'simpleReadValueFromPointer',
  'runDestructors',
  'new_',
  'craftInvokerFunction',
  'embind__requireFunction',
  'tupleRegistrations',
  'structRegistrations',
  'genericPointerToWireType',
  'constNoSmartPtrRawPointerToWireType',
  'nonConstNoSmartPtrRawPointerToWireType',
  'init_RegisteredPointer',
  'RegisteredPointer',
  'RegisteredPointer_getPointee',
  'RegisteredPointer_destructor',
  'RegisteredPointer_deleteObject',
  'RegisteredPointer_fromWireType',
  'runDestructor',
  'releaseClassHandle',
  'finalizationRegistry',
  'detachFinalizer_deps',
  'detachFinalizer',
  'attachFinalizer',
  'makeClassHandle',
  'init_ClassHandle',
  'ClassHandle',
  'ClassHandle_isAliasOf',
  'throwInstanceAlreadyDeleted',
  'ClassHandle_clone',
  'ClassHandle_delete',
  'deletionQueue',
  'ClassHandle_isDeleted',
  'ClassHandle_deleteLater',
  'flushPendingDeletes',
  'delayFunction',
  'setDelayFunction',
  'RegisteredClass',
  'shallowCopyInternalPointer',
  'downcastPointer',
  'upcastPointer',
  'validateThis',
  'char_0',
  'char_9',
  'makeLegalFunctionName',
  'emval_handle_array',
  'emval_free_list',
  'emval_symbols',
  'init_emval',
  'count_emval_handles',
  'get_first_emval',
  'getStringOrSymbol',
  'Emval',
  'emval_newers',
  'craftEmvalAllocator',
  'emval_get_global',
  'emval_lookupTypes',
  'emval_allocateDestructors',
  'emval_methodCallers',
  'emval_addMethodCaller',
  'emval_registeredMethods',
];
unexportedRuntimeSymbols.forEach(unexportedRuntimeSymbol);
var missingLibrarySymbols = [
  'zeroMemory',
  'stringToNewUTF8',
  'setErrNo',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getHostByName',
  'getRandomDevice',
  'traverseStack',
  'convertPCtoSourceLocation',
  'readEmAsmArgs',
  'runEmAsmFunction',
  'runMainThreadEmAsm',
  'jstoi_q',
  'jstoi_s',
  'getExecutableName',
  'listenOnce',
  'autoResumeAudioContext',
  'handleException',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'safeSetTimeout',
  'asmjsMangle',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'handleAllocator',
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertU32PairToI53',
  'getCFunc',
  'ccall',
  'cwrap',
  'uleb128Encode',
  'sigToWasmTypes',
  'generateFuncType',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'addFunction',
  'removeFunction',
  'reallyNegative',
  'unSign',
  'strLen',
  'reSign',
  'formatString',
  'intArrayFromString',
  'AsciiToString',
  'stringToAscii',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'writeStringToMemory',
  'writeArrayToMemory',
  'writeAsciiToMemory',
  'getSocketFromFD',
  'getSocketAddress',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'battery',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'demangle',
  'demangleAll',
  'jsStackTrace',
  'stackTrace',
  'getEnvStrings',
  'checkWasiClock',
  'createDyncallWrapper',
  'setImmediateWrapped',
  'clearImmediateWrapped',
  'polyfillSetImmediate',
  'newNativePromise',
  'getPromise',
  'exception_decRef',
  'getExceptionMessageCommon',
  'incrementExceptionRefcount',
  'decrementExceptionRefcount',
  'getExceptionMessage',
  'setMainLoop',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'heapAccessShiftForWebGLHeap',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  'writeGLArray',
  'SDL_unicode',
  'SDL_ttfContext',
  'SDL_audio',
  'GLFW_Window',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'registerInheritedInstance',
  'unregisterInheritedInstance',
  'validateThis',
  'getStringOrSymbol',
  'craftEmvalAllocator',
  'emval_get_global',
  'emval_lookupTypes',
  'emval_allocateDestructors',
  'emval_addMethodCaller',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)


var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

    stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

run();



/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/* global Module */

// EXPORT_ES6 option does not work as described at
// https://github.com/kripken/emscripten/issues/6284, so we have to
// manually add this by '--post-js' setting when the Emscripten compilation.
export default Module;
