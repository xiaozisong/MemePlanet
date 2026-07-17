import React from 'react';

/**
 * Mock react-native-svg for jest — 所有 SVG 元素返回占位空元素。
 */

type Props = { children?: React.ReactNode; [k: string]: unknown };

function makeSvg(tag: string): React.FC<Props> {
  return (props: Props) => {
    const { children, ...rest } = props;
    return React.createElement(tag, rest as Record<string, unknown>, children);
  };
}

export const Svg = makeSvg('Svg');
export const SvgXml = makeSvg('SvgXml');
export const Path = makeSvg('Path');
export const Circle = makeSvg('Circle');
export const Rect = makeSvg('Rect');
export const G = makeSvg('G');
export const Line = makeSvg('Line');
export const ClipPath = makeSvg('ClipPath');
export const Defs = makeSvg('Defs');

/** default export 必须是组件（不能是对象），否则 import Svg from 'react-native-svg' 会拿错 */
export default Svg;
