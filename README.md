# reactor-babel-plugin-replace-tokens-edge

Babel plugin that will replace data element tokens (eg: getDataElementValue(reactorXXX)) with valid JavaScript.

There is an intermediate step that needs to take place before the plugin can be executed. The data element tokens need to be converted to a function call. Example: If you have the token `{{name}}` in your code, then it needs to become `getDataElementValue(reactorXXX)`. Notice there are no quotes surrounding the name. This is because if the replacement takes place inside a code surrounded by quotes, a JS error will be thrown by Babel. Also the token name needs to be hex encoded so that no character will make the function call invalid. Then the babel plugin can be executed. It will take care of adding quotes around the name. In our debug command we use `sed` to make this transformation. If you use webpack, you need to do the replacement before the babel plugin is executed.

## Install

You can install dependencies by running:

```bash
npm install
```

## Testing

You have a container fixture located in the folder `test/fixtures/container.js`. You can change the content of the fixture in order to see new results.

You can run:

```bash
npm run debug
```

and you will see the result with plugin changes applied in stdout.

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
