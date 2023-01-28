"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.watch = exports.isDeepStrictEqual = exports.path = exports.None = exports.Some = exports.Option = exports.Result = exports.Err = exports.Ok = exports.fs = void 0;
const path_1 = __importDefault(require("path"));
exports.path = path_1.default;
exports.fs = __importStar(require("fs"));
var ts_results_1 = require("ts-results");
Object.defineProperty(exports, "Ok", { enumerable: true, get: function () { return ts_results_1.Ok; } });
Object.defineProperty(exports, "Err", { enumerable: true, get: function () { return ts_results_1.Err; } });
Object.defineProperty(exports, "Result", { enumerable: true, get: function () { return ts_results_1.Result; } });
Object.defineProperty(exports, "Option", { enumerable: true, get: function () { return ts_results_1.Option; } });
Object.defineProperty(exports, "Some", { enumerable: true, get: function () { return ts_results_1.Some; } });
Object.defineProperty(exports, "None", { enumerable: true, get: function () { return ts_results_1.None; } });
var util_1 = require("util");
Object.defineProperty(exports, "isDeepStrictEqual", { enumerable: true, get: function () { return util_1.isDeepStrictEqual; } });
var chokidar_1 = require("chokidar");
Object.defineProperty(exports, "watch", { enumerable: true, get: function () { return chokidar_1.watch; } });
//# sourceMappingURL=utils.js.map