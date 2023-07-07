/* eslint-disable security/detect-object-injection */
import { PluginObj } from '@babel/core'
import { RandomClassName } from '@dostyle/utils'

import { IRules } from '.'
import { FilesTransformedComponents } from './GlobalData'

const PreTransformer = (id: string) => (): PluginObj => {
	// let programPath: babelCore.NodePath<babelCore.types.Program> | null

	return {
		name: 'dostyle:pretransform',
		visitor: {
			Program: {
				// enter(path) {
				// if (path.isProgram()) {
				// programPath = path
				// }
				// },
			},
			ExportNamedDeclaration(path) {
				if (
					path.isExportNamedDeclaration() &&
					path.node.declaration?.type === 'VariableDeclaration'
				) {
					for (const declaration of path.node.declaration
						.declarations) {
						if (declaration.id.type !== 'Identifier') continue

						// console.log({ id, name: declaration.id.name })
						FilesTransformedComponents.get(id)?.exports.push({
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
					FilesTransformedComponents.get(id)?.exports.push({
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
					FilesTransformedComponents.get(id)?.exports.push({
						default: true,
						exportName: path.node.declaration.name,
						localName: path.node.declaration.name,
					})

					const componentBinding = path?.scope.getBinding(
						path.node.declaration.name
					)

					if (
						componentBinding &&
						componentBinding.path.node.type ===
							'VariableDeclarator' &&
						componentBinding.path.node.init?.type ===
							'TaggedTemplateExpression' &&
						componentBinding.path.node.init?.type ===
							'TaggedTemplateExpression' &&
						componentBinding.path.node.init.tag.type ===
							'MemberExpression' &&
						componentBinding.path.node.init.tag.object.type ===
							'Identifier' &&
						componentBinding.path.node.init.tag.object.name ===
							'styled'
					) {
						const styledBinding = path.scope.getBinding('styled')

						if (
							styledBinding?.path.parentPath &&
							styledBinding.path.parent.type ===
								'ImportDeclaration' &&
							styledBinding.path.parent.source.type ===
								'StringLiteral' &&
							styledBinding.path.parent.source.value ===
								'@dostyle/react'
						) {
							// Valid dostyle styled export

							const locals =
								FilesTransformedComponents.get(id)?.locals

							if (locals) {
								locals.removeOnProgramExit.add(path)
							}
						}
					}
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
							styledBinding?.path.parentPath &&
							styledBinding.path.parent.type ===
								'ImportDeclaration' &&
							styledBinding.path.parent.source.type ===
								'StringLiteral' &&
							styledBinding.path.parent.source.value ===
								'@dostyle/react'
						)
					)
						return // Make sure styled is imported from @dostyle/react

					const locals = FilesTransformedComponents.get(id)?.locals

					if (locals) {
						locals.removeOnProgramExit.add(
							styledBinding.path.parentPath
						)
					}

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

					FilesTransformedComponents.get(id)?.locals.components.push({
						classNames: [className],
						name:
							path.parent.type === 'VariableDeclarator' &&
							path.parent.id.type === 'Identifier'
								? path.parent.id.name
								: null,
						scope: path.scope,
						element: {
							name: elementName,
							rules,
						},
					})

					if (path.parent.type === 'VariableDeclarator')
						FilesTransformedComponents.get(
							id
						)?.locals.removeOnProgramExit.add(path.parentPath)
				}
			},
		},
	}
}

export default PreTransformer
