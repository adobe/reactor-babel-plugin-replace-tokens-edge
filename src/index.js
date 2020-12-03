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

const generate = require('@babel/generator').default;
const addGetSettingsFunctionContent = require('./addGetSettingsFunctionContent');

const getObjectPropertiesNames = (path) =>
  path.inList ? path.container.map((n) => n.key.name || n.key.value) : [];

const getObjectPropertyName = (path) =>
  path.node.key.name || path.node.key.value;

const isSettingsObject = (path) =>
  getObjectPropertyName(path) === 'settings' &&
  (getObjectPropertiesNames(path).includes('modulePath') ||
    getObjectPropertiesNames(path).includes('displayName'));

module.exports = ({ types: t }) => {
  return {
    name: 'replace-turbine-tokens',
    visitor: {
      ObjectProperty(path) {
        if (!isSettingsObject(path)) {
          return;
        }

        const settingsString = generate(path.node.value).code;

        path.replaceWith(
          t.objectProperty(
            t.stringLiteral('getSettings'),
            t.arrowFunctionExpression(
              [t.identifier('context')],
              addGetSettingsFunctionContent(settingsString, t)
            )
          )
        );
      }
    }
  };
};
