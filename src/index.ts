import { loader } from 'webpack';
import { fs } from 'memfs';
import path from 'path';
import asc from 'assemblyscript/cli/asc';
import loaderUtils from 'loader-utils';
import validate from 'schema-utils';
import { schemaOptions, transOptionToAscOption } from './option';

const loaderpkg = '@assemblyscript/loader';
const configuration = {
  name: 'assemblyscript-loader-loader',
};

const getInBundleWasmModule = (buf: Buffer): string => `
import loader from '${loaderpkg}';
export default async (imports) => {
  const buffer = new ArrayBuffer(${buf.length});
  const uint8 = new Uint8Array(buffer);
  uint8.set([${buf.join(',')}]);
  return await loader.instantiate(buffer, imports || {});
};`;

const getFileWasmModule = (fetchUrl: string): string => `
import loader from '${loaderpkg}';
export default async (imports) => {
  return await loader.instantiateStreaming(fetch(${fetchUrl}), imports || {});
}`;

export default function assemblyscriptLoader(this: loader.LoaderContext): void {
  const options = loaderUtils.getOptions(this) || {};
  const callback = this.async() as loader.loaderCallback;
  // eslint-disable-next-line
  const buildPath = this._compiler.outputPath;
  const outputPath = path.join(buildPath, `${path.parse(this.resourcePath).name}.wasm`);
  const ascArgv = [
    path.relative(process.cwd(), this.resourcePath),
    '-o', path.relative(process.cwd(), outputPath),
    ...transOptionToAscOption(options),
  ];

  validate(schemaOptions, options, configuration);
  this.addDependency(loaderpkg);

  asc.ready.then(() => {
    asc.main(ascArgv, {
      writeFile: (filename: string, contents: Uint8Array): void => {
        const dirPath = path.dirname(outputPath);
        if(!fs.existsSync(dirPath)) fs.mkdirpSync(dirPath);
        fs.writeFileSync(outputPath, contents);
      },
    }, (err): number => {
      if (err) {
        callback(err);
        return 0;
      }
      const size = fs.statSync(outputPath).size;
      const wasmFile = fs.readFileSync(outputPath);

      // 默认 1000
      const limit = Number(options.limit) || 1000;

      if (size <= limit) {
        callback(null, getInBundleWasmModule(Buffer.from(wasmFile)));
      } else {
        const fileName = loaderUtils.interpolateName(this, typeof options.name === 'string' && options.name
          ? options.name
          : '[name].[hash:7].wasm', {
          context: this.rootContext,
          content: wasmFile,
        });

        let fetchUrl = `__webpack_public_path__ + ${JSON.stringify(fileName)}`;
        if (options.publicPath && typeof options.publicPath === 'string') {
          fetchUrl = JSON.stringify(path.posix.join(options.publicPath, fileName));
        } else if (options.useInWorker) {
          fetchUrl = `self.location.origin + '/${fileName}'`;
        }

        this.emitFile(fileName, wasmFile, undefined);

        callback(null, getFileWasmModule(fetchUrl));
      }
      return 0;
    },
    );
  });
};
