import { ValueNode } from '@shopify/prettier-plugin-liquid/dist/parser/stage-2-ast';
import {
  LiquidHtmlNodeTypes as NodeTypes,
  LiquidHtmlNodeOfType as NodeOfType,
  Severity,
  SourceCodeType,
  LiquidCheckDefinition,
} from '../../types';
import { isAttr, isNodeOfType, isValuedHtmlAttribute, ValuedHtmlAttribute } from '../utils';

type TextNode = NodeOfType<NodeTypes.TextNode>;

function isPreload(attr: ValuedHtmlAttribute): boolean {
  return (
    isAttr(attr, 'rel') &&
    attr.value.some((node) => node.type === NodeTypes.TextNode && node.value === 'preload')
  );
}

export const AssetPreload: LiquidCheckDefinition = {
  meta: {
    code: 'AssetPreload',
    name: 'Prevent Manual Preloading of Assets',
    docs: {
      description:
        'This check is aimed at discouraging the manual preloading of assets and encourages the use of appropriate Shopify filters.',
      url: 'https://shopify.dev/docs/themes/tools/theme-check/checks/asset-preload',
      recommended: true,
    },
    type: SourceCodeType.LiquidHtml,
    severity: Severity.WARNING,
    schema: {},
    targets: [],
  },

  create(context) {
    return {
      async HtmlVoidElement(node: NodeOfType<NodeTypes.HtmlVoidElement>) {
        const preloadLinkAttr = node.attributes.find(
          (attr) => isValuedHtmlAttribute(attr) && isPreload(attr),
        ) as ValuedHtmlAttribute | undefined;

        if (preloadLinkAttr) {
          const asAttr: ValuedHtmlAttribute | undefined = node.attributes
            .filter(isValuedHtmlAttribute)
            .find((attr) => isAttr(attr, 'as'));

          const assetType = asAttr?.value.find((node): node is TextNode =>
            isNodeOfType(NodeTypes.TextNode, node),
          )?.value;

          let message = '';

          if (assetType === 'style') {
            message =
              'For better performance, prefer using the preload argument of the stylesheet_tag filter';
          } else if (assetType === 'image') {
            message =
              'For better performance, prefer using the preload argument of the image_tag filter';
          } else {
            message = 'For better performance, prefer using the preload_tag filter';
          }

          context.report({
            message,
            startIndex: node.position.start,
            endIndex: node.position.end,
          });
        }
      },
    };
  },
};
