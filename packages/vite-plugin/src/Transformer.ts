import babelCore, { PluginObj } from '@babel/core'

const Transformer = (babel: typeof babelCore): PluginObj => {
	return {
		name: 'dostyle', // this is optional
		visitor: {
			TaggedTemplateExpression(path) {
				if (
					path.isTaggedTemplateExpression() &&
					path.node.tag.type === 'MemberExpression' &&
					path.node.tag.object.type === 'Identifier' &&
					path.node.tag.property.type === 'Identifier' &&
					path.node.tag.object.name === 'styled' &&
					path.node.tag.property.name === 'p'
				) {
					path.node.tag.property.name = 'h1'
				}
			},
		},
	}
}

export default Transformer
