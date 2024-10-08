# Demo Map Client for GeospatialAnalyzer API

## General

This is a simple demo map client for the [GeospatialAnalyzer API](https://github.com/geobakery/GeospatialAnalyzer). It provides a Leaflet and OpenStreetMap based map to show some integration examples.

It is built using React, TypeScript, Vite and React Leaflet.

![Screenshot Demo Map Client](src/assets/screenshots/app-screenshot-desktop.png)

### What is working

- Show the BB (hardcoded) from the sample data
- Draw geometries
- Choose interface
- Choose topic(s)
- Selection fields for interface and topics depend on each other
- Set parameters
- Make an API call
- Show response
- Show returned geometry in map

### To do

- Improve geometry handling
- Send all drawn geometries to API
- Add more interfaces and parameters
- Make it mobile friendly
- Fine-tuning in general
- Update topics when GA is ready

### Nice to have

- Introduce a config file
- Docker deployment capability
- Dynamically build UI from API capabilities
- ...

## Development

Prettier, Linter and HMR are configured. Tested in VS Code.

### Install and run

```
pnpm install
pnpm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

## Contribution

You are welcome to co-develop :)

## License

This project is licensed under the [GNU General Public License 3 (GPLv3)](./LICENSE).

For information about third-party component licenses, see the [THIRD-PARTY-LICENSES file](./THIRD-PARTY-LICENSES.md).
