# Demo map client for GeospatialAnalyzer API

## General

This is a simple demo map client for the [GeospatialAnalyzer API](https://github.com/geobakery/GeospatialAnalyzer). It provides a Leaflet and OpenStreetMap based map to show some integration examples.

It is built using React, TypeScript, Vite and React Leaflet.

### What is working

- Show the BB (hardcoded) from the sample data
- Draw geometries
- Choose interface
- Choose topic(s)
- Set parameters
- Make an API call
- Show response
- Show returned geometry in map

### To do

- Improve geometry handling
- Selection fields depend on each other
- Send all drawn geometries to API
- Add more interfaces, topics and parameters
- Fine-tuning in general

### Nice to have

- Introduce a config file
- Dynamically build UI from API capabilities
- ...

## Development

Prettier, Linter and HMR are configured. Tested in VS Code.

### Install and run

```
pnpm install
pnpm run dev
```

## Contribution

You are welcome to co-develop :)
