/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const findTokensInString = require('@adobe/reactor-token-scripts-edge/src/findTokens');
const getTokenPattern = require('@adobe/reactor-token-scripts-edge/src/getTokenPattern');
const tokenPattern = getTokenPattern();

const decode = require('./decode');
const escape = (str) => str.replace(/([\""\r\n\t])/g, '\\$1');

module.exports = (settingsString, t) => {
  var dataElementTokens = findTokensInString(`var a = ${settingsString}`)
    .map(decode)
    // Some tokens might be sanitized (reactorXXX) while other provided by user might be not.
    // We need to make sure we have a unique list.
    .filter((value, index, self) => self.indexOf(value) === index);

  const getSettingsFunctionString = `getDataElementValues([${
    dataElementTokens.length ? `'${dataElementTokens.join("','")}'` : ''
  }], context).then(getDataElementValue => (${settingsString}))`;

  const ast = parse(getSettingsFunctionString);

  traverse(ast, {
    StringLiteral: (path) => {
      let stringValue = path.node.value;

      // If the settings object doesn't contain any token, we don't need to do anything.
      if (dataElementTokens.length === 0) {
        return;
      }

      // Is the string a single data element token and nothing else we just
      // return the getDataElementValue result. If string is
      // "some getDataElementValue(reactorXXXX)" we need to transform it to
      // "some " + getDataElementValue("decoded name").
      const pieces = [];

      while ((res = RegExp(tokenPattern).exec(stringValue)) !== null) {
        const tokenStartIndex = stringValue.indexOf(res[0]);
        const stringInFrontOfToken = stringValue.substr(0, tokenStartIndex);

        if (stringInFrontOfToken) {
          pieces.push(`"${escape(stringInFrontOfToken)}"`);
        }

        pieces.push(`getDataElementValue("${escape(decode(res[1]))}")`);

        stringValue = stringValue.substring(tokenStartIndex + res[0].length);
      }

      if (stringValue) {
        pieces.push(`"${escape(stringValue)}"`);
      }

      path.replaceWith(
        parse(`a = ${pieces.join('+')}`).program.body[0].expression.right
      );
      path.skip();
    },

    //This might never happen in reality, but we want to be sure that whereever
    // a `getDataElementValue` is called, we transform that first argument to a decoded token.
    CallExpression: (path) => {
      if (path.node.callee.name === 'getDataElementValue') {
        const tokenNameNode = path.node.arguments[0];

        // If the getDataElementValue argument is a decode string, don't do anything.
        // Otherwise we will explode the stack.
        if (
          tokenNameNode.type === 'StringLiteral' &&
          !tokenNameNode.value.startsWith('reactor')
        ) {
          return;
        }

        // The argument can be Identifier that has a name property
        // or a StringLiteral that has a value property.
        const tokenName = decode(tokenNameNode.name || tokenNameNode.value);

        path.replaceWith(
          t.callExpression(t.identifier('getDataElementValue'), [
            t.stringLiteral(tokenName)
          ])
        );
      }
    }
  });

  return ast.program.body[0].expression;
};
