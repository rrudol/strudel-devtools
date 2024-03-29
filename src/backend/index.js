import { init, TYPES } from '../core/actions';
import { initEventsBackend } from './events';
import { Highlighter } from './highlighter';
import { stringify } from 'flatted/esm';

const hook = window.__STRUDEL_DEVTOOLS_GLOBAL_HOOK__;
let uid = 0;

export function initBackend () {
  if (hook.Strudel) {
    connect();
  } else {
    hook.once('init', connect);
  }

  window.addEventListener('message', (e) => {
    if (e.source === window && e.data.action) {
      switch (e.data.action) {
        case TYPES.SELECT_COMPONENT:
          const selectedInstance =  window.__STRUDEL_DEVTOOLS_INSTANCE_MAP__.get(e.data.id).__strudel__;
          const instanceDetails = adaptInstanceDetails(selectedInstance);

          window.postMessage({
            action: TYPES.SELECTED_COMPONENT_DATA,
            data: stringify(instanceDetails),
          }, '*');
          break;
        case TYPES.SCROLL_INTO_VIEW:
          window.__STRUDEL_DEVTOOLS_INSTANCE_MAP__.get(e.data.id).scrollIntoView();
          break;
        case TYPES.HIGHLIGHT_COMPONENT:
          const component = window.__STRUDEL_DEVTOOLS_INSTANCE_MAP__.get(e.data.id);
          Highlighter.attach(component);
          break;
        case TYPES.REMOVE_HIGHLIGHT:
          Highlighter.detach();
          break;
        default:
          return;
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    window.postMessage({
      action: TYPES.BEFORE_WINDOW_UNLOAD,
    }, '*');
  });
}

const walk = (node, fn) => {
  if (node.childNodes) {
    for (let i = 0, l = node.childNodes.length; i < l; i++) {
      const child = node.childNodes[i];
      const stop = fn(child);
      if (!stop) {
        walk(child, fn);
      }
    }
  }
}

const getInstanceDetails = (instance) => ({
  name: instance.constructor.name,
  selector: instance.__proto__._selector
});

const adaptInstanceDetails = instance => {
  const reservedKeys = [
    'name', 'selector', '$data', '$element', '__STRUDEL_DEVTOOLS_UID__'
  ];
  const adapted = {
    info: {
      name: instance.constructor.name,
      selector: instance.__proto__._selector,
    },
    dataAttrs: instance.$data,
    properties: {},
    elements: {},
  };

  Object.keys(instance).forEach((property) => {
    if (instance[property] && instance[property].constructor && instance[property].constructor.name === 'Element' &&
        property !== '$element') {
      adapted.elements[property] = instance[property];
    } else if (!reservedKeys.includes(property)) {
      adapted.properties[property] = instance[property];
    }
  });

  return adapted;
};

const scan = () => {
  var components = [];

  walk(document, function (node) {
    if (node.__strudel__) {
      const id = ++uid;
      const instance = node.__strudel__;
      instance.__STRUDEL_DEVTOOLS_UID__ = id;
      window.__STRUDEL_DEVTOOLS_INSTANCE_MAP__.set(id, node);

      components.push({
        id: id,
        strudelProps: getInstanceDetails(node.__strudel__)
      });
    }

    return !node.childNodes;
  });

  initEventsBackend(hook.Strudel);

  window.postMessage({
    action: TYPES.INIT,
    version: hook.Strudel.version,
    components,
  }, '*');
}

const connect = () => {
  window.__STRUDEL_DEVTOOLS_INSTANCE_MAP__ = new Map();
  document.addEventListener('strudel:loaded', scan);
  uid = 0;
  scan();
}

initBackend();
