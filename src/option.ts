import { options, OptionDescription }  from 'assemblyscript/cli/asc';
import { JSONSchema7, JSONSchema7TypeName } from 'json-schema';
import { OptionObject } from 'loader-utils';

interface ISchemaOption {
  [key: string]: JSONSchema7;
}

const ascSchemaOptions = Object.entries(options).reduce((ret: ISchemaOption, [ key, item ]: [string, OptionDescription ]): ISchemaOption => {
  // 只检验单个的值，数组不校验
  if (item.type && /[a-z]/.test(item.type)) {
    const schemaType = ((): JSONSchema7TypeName => {
      switch(item.type) {
        case 'b': return 'boolean';
        case 's': return 'string';
        case 'f':
        case 'i': return 'number';
        default: return 'null';
      }
    })();
    Object.assign(ret, {
      [key]: {
        type: schemaType,
        default: item.default,
        description: item.description,
      },
    });
  }
  return ret;
}, {});

export const schemaOptions: JSONSchema7 = {
  type: 'object',
  properties: {
    ...ascSchemaOptions,
    limit: {
      type: [ 'number', 'string' ],
      description: 'Byte limit the size to the wasm file: size <= limit, wasm bundled into js ,or builded into output.wasm',
    },
    name: {
      type: 'string',
    },
    publicPath: {
      type: 'string',
    },
    useInWorker: {
      type: 'boolean',
    },
  },
  additionalProperties: true,
};

export const transOptionToAscOption = (opt: Readonly<OptionObject>): string[] =>
  Object.entries(options).reduce((ret: string[], [ key, item ]): string[] => {
    const value = opt[key];
    if (value && item.type) {
      switch(item.type) {
        case 'b': {
          ret.push(`--${key}`);
          break;
        }
        default: {
          ret.push(`--${key}`, `${value}`);
        }
      }
    }
    return ret;
  }, []);
