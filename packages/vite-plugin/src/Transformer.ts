import babelCore, { PluginObj } from '@babel/core'

type Babel = typeof babelCore

const Transformer = (babel: Babel): PluginObj => {
	return {
		name: 'dostyle', // this is optional
		visitor: {
			TaggedTemplateExpression(path) {
				if (
					path.isTaggedTemplateExpression() &&
					path.node.tag.type === 'MemberExpression' &&
					path.node.tag.object.type === 'Identifier' &&
					path.node.tag.property.type === 'Identifier' &&
					path.node.tag.object.name === 'styled'
				) {
					const element = path.node.tag.property.name
				}
			},
		},
	}
}

export default Transformer
