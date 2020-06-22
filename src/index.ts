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
  return await loader.instantiate(${buf.buffer}, imports || {});
};`;

const getFileWasmModule = (fetchUrl: string): string => `
import loader from '${loaderpkg}';
export default async (imports) => {
  return await loader.instantiateStreaming(fetch(${fetchUrl}), imports || {});
}`;

export default (content: loader.LoaderContext): void => {
  const options = loaderUtils.getOptions(content) || {};
  const callback = content.async() as loader.loaderCallback;
  // eslint-disable-next-line
  const buildPath = content._compiler.outputPath;
  const output = path.join(buildPath, `${path.parse(content.resourcePath).name}.wasm`);
  const ascArgv = [
    path.relative(process.cwd(), content.resourcePath),
    '-o', path.relative(process.cwd(), output),
    ...transOptionToAscOption(options),
  ];

  validate(schemaOptions, options, configuration);
  content.addDependency(loaderpkg);

  asc.ready.then(() => {
    asc.main(ascArgv, {
      readFile: (filename: string, baseDir: string): string => {
        const filePath = path.join(baseDir, filename);
        console.log('filePath-read', filePath);
        return fs.readFileSync(filePath).toString();
      },
      writeFile: (filename: string, contents: Uint8Array, baseDir: string): void => {
        const filePath = path.join(baseDir, filename);
        console.log('filePath-write', filePath);
        fs.writeFileSync(filePath, contents);
      },
    }, (err): number => {
      if (err) {
        callback(err);
        return 0;
      }
      const size = fs.statSync(output).size;
      const wasmFile = fs.readFileSync(output);

      // 默认 1000
      const limit = Number(options.limit) || 1000;

      if (size <= limit) {
        callback(null, getInBundleWasmModule(Buffer.from(wasmFile)));
      } else {
        const fileName = loaderUtils.interpolateName(content, typeof options.name === 'string' && options.name
          ? options.name
          : '[name].[hash:7].wasm', {
          context: content.rootContext,
          content: wasmFile,
        });

        content.emitFile(fileName, wasmFile, undefined);

        let fetchUrl = `__webpack_public_path__ + ${JSON.stringify(fileName)}`;
        if (options.publicPath) {
          fetchUrl = JSON.stringify(`${options.publicPath}${fileName}`);
        } else if (options.useInWorker) {
          fetchUrl = `self.location.origin + '/${fileName}'`;
        }

        callback(null, getFileWasmModule(fetchUrl));
      }
      return 0;
    },
    );
  });
};
