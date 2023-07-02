import babelCore, { PluginObj } from '@babel/core'
import { RandomClassName } from '@dostyle/utils'

import { IRules, ITransformedComponents } from '.'

type Babel = typeof babelCore

const Transformer =
	(transformedComponents: ITransformedComponents) =>
	(babel: Babel): PluginObj => {
		let programPath: babelCore.NodePath<babelCore.types.Program> | null
		return {
			name: 'dostyle', // this is optional
			visitor: {
				Program(path) {
					if (path.isProgram()) {
						programPath = path
					}
				},
				ExportNamedDeclaration(path) {
					if (
						path.isExportNamedDeclaration() &&
						path.node.declaration?.type === 'VariableDeclaration'
					) {
						for (const declaration of path.node.declaration
							.declarations) {
							if (declaration.id.type !== 'Identifier') continue

							transformedComponents.exports.push({
								exportName: declaration.id.name,
								localName: declaration.id.name,
							})
						}
					}
				},
				ExportSpecifier(path) {
					if (
						path.isExportSpecifier() &&
						path.node.exported.type === 'Identifier'
					) {
						transformedComponents.exports.push({
							exportName: path.node.exported.name,
							localName: path.node.local.name,
						})
					}
				},
				ExportDefaultDeclaration(path) {
					if (
						path.isExportDefaultDeclaration() &&
						path.node.declaration.type === 'Identifier'
					) {
						transformedComponents.exports.push({
							default: true,
							exportName: path.node.declaration.name,
							localName: path.node.declaration.name,
						})
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
						const styledBinding = path.scope.getBinding('styled')

						if (
							!(
								styledBinding?.path.parent.type ===
									'ImportDeclaration' &&
								styledBinding.path.parent.source.type ===
									'StringLiteral' &&
								styledBinding.path.parent.source.value ===
									'@dostyle/react'
							)
						)
							return // Make sure styled is imported from @dostyle/react

						const elementName = path.node.tag.property.name

						const className = RandomClassName()

						const strings = path.node.quasi.quasis.map(
							quasi => quasi.value.cooked
						)
						// const interpolations =  path.node.quasi.expressions.map(quasi=>quasi.value.cooked)

						const cssString = strings.join('')
						const rulesArray = cssString
							.trim()
							.split(';')
							.filter(rule => rule !== '')
							.map(rule =>
								rule
									.trim()
									.split(':')
									.map(part => part.trim())
							)

						const rules: IRules = Object.fromEntries(rulesArray)

						transformedComponents.locals.push({
							className,
							name:
								path.parent.type === 'VariableDeclarator' &&
								path.parent.id.type === 'Identifier'
									? path.parent.id.name
									: null,
							element: {
								name: elementName,
								rules,
							},
						})

						if (path.parent.type === 'VariableDeclarator')
							path.parentPath.remove()
					}
				},
			},
		}
	}

export default Transformer
