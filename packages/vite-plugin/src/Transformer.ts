import babelCore, { PluginObj } from '@babel/core'

type Babel = typeof babelCore

const Transformer = (babel: Babel): PluginObj => {
	let program: babelCore.types.Program
	let importedCreateElementName: string | null = null

	return {
		name: 'dostyle', // this is optional
		visitor: {
			Program(path) {
				if (path.isProgram()) {
					program = path.node
				}
			},
			ImportSpecifier(path) {
				if (
					path.isImportSpecifier() &&
					path.node.imported.type === 'Identifier' &&
					path.node.imported.name === 'createElement' &&
					path.parent.type === 'ImportDeclaration' &&
					path.parent.source.type === 'StringLiteral' &&
					path.parent.source.value === 'react'
				) {
					importedCreateElementName = path.node.local.name
				}
			},
			TaggedTemplateExpression(path) {
				if (
					path.isTaggedTemplateExpression() &&
					path.node.tag.type === 'MemberExpression' &&
					path.node.tag.object.type === 'Identifier' &&
					path.node.tag.property.type === 'Identifier' &&
					path.node.tag.object.name === 'styled'
				) {
					const elementName = path.node.tag.property.name

					if (!importedCreateElementName) {
						const importName = babel.types.importDeclaration(
							[
								babel.types.importSpecifier(
									babel.types.identifier('_createElement'),
									babel.types.identifier('createElement')
								),
							],
							babel.types.stringLiteral('react')
						)

						importedCreateElementName = '_createElement'

						program.body.unshift(importName)
					}

					const element = babel.template.expression
						.ast`() => ${importedCreateElementName}('${elementName}')`

					if (path.parent.type === 'VariableDeclarator') {
						path.parent.init = element
					}
				}
			},
		},
	}
}

export default Transformer
