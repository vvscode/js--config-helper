const _ = require('lodash');

const objectWithKeySorted = object =>
  Object.keys(object)
    .sort()
    .reduce((acc, key) => {
      acc[key] = object[key];
      return acc;
    }, {});

const getRequestKeys = obj =>
  objectWithKeySorted(
    Object.keys(obj).reduce((acc, key) => {
      acc[key] = _.camelCase(key);
      if (_.isObject(obj[key])) {
        Object.assign(acc, getRequestKeys(obj[key]));
      }
      return acc;
    }, {}),
  );

const removeDummyWrappers = (obj, list = []) => {
  if (!_.isObject(obj)) {
    return [obj, list];
  }
  const keys = _.keys(obj);
  const firstKey = keys[0];
  if (keys.length === 1 && _.isObject(obj[firstKey])) {
    return removeDummyWrappers(obj[firstKey], [...list, firstKey]);
  }
  return [obj, list];
};

module.exports = (requestOptions, responseBody) => {
  const url = requestOptions.url.replace(/https?:\/\/[^/]+/, '${config.host}');
  const name = requestOptions.url.replace(/https?:\/\/[^/]+/, '');
  const esbRequestExample = JSON.stringify(requestOptions.body, null, 2);
  const esbResponseExample = JSON.stringify(responseBody);
  const requestKeysConvertionDict = JSON.stringify(
    getRequestKeys(requestOptions.body),
    null,
    2,
  );
  const responseKeysConvertionDict = JSON.stringify(
    getRequestKeys(responseBody),
    null,
    2,
  );

  const [, requestWrappers] = removeDummyWrappers(requestOptions.body);
  const [, responseWrappers] = removeDummyWrappers(responseBody);

  const requestWrapper =
    requestWrappers.length === 0
      ? 'obj => obj'
      : 'obj => ' +
        (() => {
          let body = '(obj)';
          _.forEach(requestWrappers, key => {
            body = body.replace('obj', `{ ${key}:  obj  }`);
          });
          return body;
        })();

  const responseUnwrapper =
    responseWrappers.length === 0
      ? 'obj => obj'
      : `obj => obj.${responseWrappers.join('.')}`;

  return `
  export default (config: IEsbDeclarationConfig): IEsbDefinition => ({
    name: '${name}',
    method: 'post',
    url: '${url}',
    defaultKey: config.API_KEY,
    description: 'Looking for information =(',
    esbRequestExample: ${esbRequestExample},
    esbResponseExample: ${esbResponseExample},
  
    requestWrapper: ${requestWrapper},
    responseUnwrapper: ${responseUnwrapper},
  
    requestKeysConvertionDict: ${requestKeysConvertionDict},
    responseKeysConvertionDict: ${responseKeysConvertionDict},
  });
  
  `.trim();
};
