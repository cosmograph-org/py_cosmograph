import { Fragment, h, ComponentChild } from './index'

type Props = Record<string, unknown> | null

function jsxFactory(type: any, props: Props, key?: string | number | null): ComponentChild {
  const normalizedProps = { ...(props ?? {}) }
  if (key !== undefined && key !== null) normalizedProps.key = key
  const { children, ...rest } = normalizedProps as { children?: unknown }
  const childArray = Array.isArray(children)
    ? children
    : children !== undefined
      ? [children]
      : []
  return h(type, rest, ...childArray as ComponentChild[])
}

export function jsx(type: any, props: Props, key?: string | number | null): ComponentChild {
  return jsxFactory(type, props, key)
}

export const jsxs = jsx
export function jsxDEV(type: any, props: Props, key?: string | number | null): ComponentChild {
  return jsxFactory(type, props, key)
}

export { Fragment }
