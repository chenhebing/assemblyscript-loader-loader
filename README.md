assemblyscript-loader-loader
=================

Loader for webpack to compile typescript with [AssemblyScript](https://github.com/AssemblyScript/assemblyscript) and bundle it to wasm or bytes string

## Install

```bash
$ yarn add assemblyscript-loader-loader --dev
```

## Usage

**webpack.config.js**

```js
{
  test: /\.tsx?$/,
  loader: 'assemblyscript-loader-loader',
  include: /assemblyscript/,
  exclude: /node_modules/,
  options: {
    limit: 1000,
    optimize: true,
    noAssert: true,
    importMemory: true,
    runtime: 'none',
    useInWorker: true,
  }
}
```

**file.js**

```js
import asmPromise from "./assemblyscript/test.ts";
const imports = { env: {}};
asmPromise(imports).then(function(asmModule){
  // you can use the wasm exports
})
```

Ths usage of imports can refer to [@assemblyscript/loader](https://www.assemblyscript.org/loader.html)

## Options
[The loader supports some of the assemblyscript options here](https://www.assemblyscript.org/compiler.html)

### custom options

|Name|Type|Default|Description|
|:---:|:-----:|:-----:|:----------|
|**`limit`**|`string \| number`|`1000`|Byte limit of the wasm file. If the size is smaller then limit value, the wasm will bundled into js, or the wasm file will build into dist.|
|**`name`**|`string`|`[name].[hash:7].wasm`|Configure a custom filename template for your file.|
|**`publicPath`**|`string`|`__webpack_public_path__`|Configure a custom public path for your file.|
|**`useInWorker`**|`boolean`| `undefined` |If the wasm is used in web worker, you should set useInWorker to `true`. Loader will set publicPath to current origin. If production mode and development mode are different, you need set publicPath at production mode.|

## Thanks to the authors of assemblyscript-typescript-loader and assemblyscript-wasm-loader for their contributions.
