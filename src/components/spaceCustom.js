// Placeholder implementation for custom space logic.
// Individual spaces can extend this by replacing the exported function
// with their own implementation when needed.

const noop = () => {};

export default function setupSpaceCustom() {
  return {
    noDollhouseOccluders: false,
    handleChangeTourPoint: noop,
    update: noop,
    onLoad: noop,
    render: noop,
  };
}

