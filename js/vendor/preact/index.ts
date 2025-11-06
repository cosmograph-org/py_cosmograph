/* eslint-disable @typescript-eslint/no-explicit-any */
export type ComponentChild = VNode<any> | string | number | bigint | boolean | null | undefined;
export type ComponentChildren = ComponentChild | ComponentChild[];
export type ComponentType<P = {}> = (props: P & { children?: ComponentChildren }) => ComponentChild;

export interface VNode<P = any> {
  type: string | ComponentType<P> | typeof Fragment;
  props: (P & { children?: ComponentChildren }) | null;
  key?: string | number | null;
}

interface EffectState {
  deps?: any[];
  cleanup?: (() => void) | void;
  effect?: () => void | (() => void);
  scheduled?: boolean;
}

interface ComponentInstance {
  hooks: any[];
  path: string;
  root: Root;
  vnode?: ComponentChild;
}

interface Root {
  container: Element;
  vnode: ComponentChild | null;
  prevInstances: Map<string, ComponentInstance>;
  instances: Map<string, ComponentInstance>;
  scheduled?: boolean;
}

const roots = new Map<Element, Root>();
let currentRoot: Root | null = null;
let currentInstance: ComponentInstance | null = null;
let hookIndex = 0;

const pendingEffects: Array<{ instance: ComponentInstance; hookIndex: number }> = [];

export const Fragment = Symbol('Fragment');

export function h(type: VNode['type'], props: Record<string, any> | null, ...children: ComponentChild[]): VNode<any> {
  const normalizedProps: Record<string, any> | null = props ? { ...props } : {};
  if (children.length > 0) {
    normalizedProps!.children = children;
  }
  return { type, props: normalizedProps, key: normalizedProps?.key ?? null };
}

export function render(vnode: ComponentChild, container: Element, _root?: VNode | null): VNode | null {
  if (vnode == null) {
    unmountRoot(container);
    return null;
  }

  const root = roots.get(container) ?? createRoot(container);
  const prevInstances = root.instances;
  root.prevInstances = prevInstances;
  root.instances = new Map();
  currentRoot = root;
  const dom = createDom(vnode, root, '0');

  container.replaceChildren(dom);
  root.vnode = vnode;
  commitEffects();
  cleanupOrphanedInstances(root);
  roots.set(container, root);
  return (vnode as VNode) ?? null;
}

function createRoot(container: Element): Root {
  return {
    container,
    vnode: null,
    prevInstances: new Map(),
    instances: new Map(),
  };
}

function unmountRoot(container: Element): void {
  const root = roots.get(container);
  if (!root) return;
  runInstanceCleanup(root);
  container.replaceChildren();
  roots.delete(container);
}

function runInstanceCleanup(root: Root): void {
  root.instances.forEach(instance => {
    cleanupInstance(instance);
  });
  root.prevInstances.forEach(instance => {
    if (!root.instances.has(instance.path)) cleanupInstance(instance);
  });
  root.instances.clear();
  root.prevInstances.clear();
}

function cleanupOrphanedInstances(root: Root): void {
  root.prevInstances.forEach((instance, key) => {
    if (!root.instances.has(key)) {
      cleanupInstance(instance);
    }
  });
  root.prevInstances.clear();
}

function cleanupInstance(instance: ComponentInstance): void {
  instance.hooks.forEach((hook) => {
    if (hook && typeof hook.cleanup === 'function') {
      try {
        hook.cleanup();
      } catch (error) {
        console.error('Error while running cleanup:', error);
      }
    }
  });
}

function createDom(node: ComponentChild, root: Root, path: string): Node {
  if (node === null || node === undefined || node === false || node === true) {
    return document.createTextNode('');
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
    return document.createTextNode(String(node));
  }

  if (Array.isArray(node)) {
    const fragment = document.createDocumentFragment();
    node.forEach((child, index) => {
      const childNode = createDom(child, root, `${path}.${index}`);
      fragment.appendChild(childNode);
    });
    return fragment;
  }

  const vnode = node as VNode;
  const { type, props } = vnode;

  if (type === Fragment) {
    const fragment = document.createDocumentFragment();
    const children = normalizeChildren(props?.children);
    children.forEach((child, index) => {
      fragment.appendChild(createDom(child, root, `${path}.${index}`));
    });
    return fragment;
  }

  if (typeof type === 'function') {
    return renderComponent(type as ComponentType<any>, props ?? {}, root, path);
  }

  const element = document.createElement(type as string);
  applyProps(element, props ?? {});
  const children = normalizeChildren(props?.children);
  children.forEach((child, index) => {
    element.appendChild(createDom(child, root, `${path}.${index}`));
  });
  return element;
}

function normalizeChildren(children: ComponentChildren | undefined): ComponentChild[] {
  if (children === undefined || children === null) return [];
  return Array.isArray(children) ? children : [children];
}

function applyProps(element: Element, props: Record<string, any>): void {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children' || key === 'key') return;
    if (key === 'className') {
      element.setAttribute('class', value ?? '');
      return;
    }
    if (key === 'ref') {
      if (typeof value === 'function') value(element);
      else if (value && typeof value === 'object') value.current = element;
      return;
    }
    if (key === 'style' && value && typeof value === 'object') {
      Object.assign((element as HTMLElement).style, value);
      return;
    }
    if ((key === 'value' || key === 'checked') && 'value' in element) {
      (element as any)[key] = value;
      return;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value as EventListener);
      return;
    }
    if (value === false || value === null || value === undefined) return;
    element.setAttribute(key, value);
  });
}

function renderComponent(type: ComponentType<any>, props: Record<string, any>, root: Root, path: string): Node {
  const prevInstance = root.prevInstances.get(path);
  const instance: ComponentInstance = prevInstance ?? { hooks: [], path, root };
  instance.root = root;
  instance.path = path;
  root.instances.set(path, instance);

  currentInstance = instance;
  currentRoot = root;
  hookIndex = 0;

  const output = type({ ...props, children: props.children });
  instance.vnode = output;
  return createDom(output, root, `${path}.0`);
}

function commitEffects(): void {
  while (pendingEffects.length > 0) {
    const { instance, hookIndex: index } = pendingEffects.shift()!;
    const hook = instance.hooks[index] as EffectState | undefined;
    if (!hook || !hook.scheduled) continue;
    hook.scheduled = false;
    if (hook.cleanup && typeof hook.cleanup === 'function') {
      try {
        hook.cleanup();
      } catch (error) {
        console.error('Error while running cleanup:', error);
      }
    }
    if (typeof hook.effect === 'function') {
      const cleanup = hook.effect();
      hook.cleanup = cleanup ?? undefined;
    }
  }
}

function scheduleRender(root: Root): void {
  if (root.scheduled) return;
  root.scheduled = true;
  Promise.resolve().then(() => {
    root.scheduled = false;
    if (root.vnode !== null) {
      render(root.vnode, root.container);
    }
  });
}

export function useState<S>(initial: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void] {
  if (!currentInstance) throw new Error('useState must be called within a component');
  const instance = currentInstance;
  const index = hookIndex++;
  if (instance.hooks[index] === undefined) {
    instance.hooks[index] = typeof initial === 'function' ? (initial as () => S)() : initial;
  }
  const setState = (value: S | ((prev: S) => S)) => {
    const prev = instance.hooks[index] as S;
    const next = typeof value === 'function' ? (value as (prev: S) => S)(prev) : value;
    if (Object.is(prev, next)) return;
    instance.hooks[index] = next;
    scheduleRender(instance.root);
  };
  return [instance.hooks[index] as S, setState];
}

export function useRef<T>(initial: T): { current: T } {
  if (!currentInstance) throw new Error('useRef must be called within a component');
  const instance = currentInstance;
  const index = hookIndex++;
  if (!instance.hooks[index]) {
    instance.hooks[index] = { current: initial };
  }
  return instance.hooks[index];
}

export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  if (!currentInstance || !currentRoot) throw new Error('useEffect must be called within a component');
  const instance = currentInstance;
  const index = hookIndex++;
  const previous: EffectState | undefined = instance.hooks[index];

  let shouldRun = true;
  if (previous && deps && previous.deps) {
    shouldRun = deps.length !== previous.deps.length || deps.some((dep, i) => !Object.is(dep, previous.deps![i]));
  } else if (previous && !deps) {
    shouldRun = true;
  }

  const state: EffectState = previous ?? {};
  state.deps = deps;
  state.effect = effect;

  if (shouldRun) {
    state.scheduled = true;
    pendingEffects.push({ instance, hookIndex: index });
  }

  instance.hooks[index] = state;
}

export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  const [memoized, setMemoized] = useState(() => callback);
  useEffect(() => {
    setMemoized(() => callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return memoized;
}

export function useMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<{ value: T; deps: any[] } | null>(null);
  if (!ref.current || deps.length !== ref.current.deps.length || deps.some((dep, i) => !Object.is(dep, ref.current!.deps[i]))) {
    ref.current = { value: factory(), deps: [...deps] };
  }
  return ref.current.value;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
