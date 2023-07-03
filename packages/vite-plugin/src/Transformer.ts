/* eslint-disable security/detect-object-injection */
import babelCore, { PluginObj } from '@babel/core'
import { HypenCaseToCamelCase, RandomClassName } from '@dostyle/utils'

import { IRules } from '.'
import { FilesTransformedComponents } from './GlobalData'

type Babel = typeof babelCore

const Transformer =
	(id: string) =>
	(babel: Babel): PluginObj => {
		// let programPath: babelCore.NodePath<babelCore.types.Program> | null

		const removeOnProgramExit: babelCore.NodePath[] = []

		return {
			name: 'dostyle', // this is optional
			visitor: {
				Program: {
					// enter(path) {
					// 	if (path.isProgram()) {
					// 		programPath = path
					// 	}
					// },
					exit(path) {
						if (path.isProgram()) {
							removeOnProgramExit.forEach(path => path.remove())
						}
					},
				},
				ExportNamedDeclaration(path) {
					if (
						path.isExportNamedDeclaration() &&
						path.node.declaration?.type === 'VariableDeclaration'
					) {
						for (const declaration of path.node.declaration
							.declarations) {
							if (declaration.id.type !== 'Identifier') continue

							FilesTransformedComponents[id].exports.push({
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
						FilesTransformedComponents[id].exports.push({
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
						FilesTransformedComponents[id].exports.push({
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

						FilesTransformedComponents[id].locals.push({
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
							removeOnProgramExit.push(path.parentPath)
					}
				},
				JSXElement(path) {
					if (
						path.isJSXElement() &&
						path.node.openingElement.name.type === 'JSXIdentifier'
					) {
						const componentName = path.node.openingElement.name.name

						if (componentName[0].toLowerCase() === componentName[0])
							return // Not custom react component

						const targetComponentScope =
							path.scope.getBinding(componentName)?.path.scope

						if (!targetComponentScope) return

						const localComponent = FilesTransformedComponents[
							id
						].locals.find(
							component =>
								component.name === componentName &&
								component.scope === targetComponentScope
						)

						if (!localComponent) return

						path.node.openingElement.name.name = localComponent
							?.element.name as string

						path.node.openingElement.attributes.push(
							babel.types.jsxAttribute(
								babel.types.jsxIdentifier('style'),
								babel.types.jsxExpressionContainer(
									babel.types.objectExpression(
										Object.entries(
											localComponent.element.rules
										).map(rule =>
											babel.types.objectProperty(
												babel.types.identifier(
													`'${HypenCaseToCamelCase(
														rule[0]
													)}'`
												),
												babel.types.stringLiteral(
													rule[1]
												)
											)
										)
									)
								)
							)
						)

						const classNameAttributeIfExist =
							path.node.openingElement.attributes.find(
								attribute =>
									attribute.type === 'JSXAttribute' &&
									attribute.name.type === 'JSXIdentifier' &&
									attribute.name.name === 'className'
							)

						if (!classNameAttributeIfExist) {
							path.node.openingElement.attributes.push(
								babel.types.jsxAttribute(
									babel.types.jsxIdentifier('className'),
									babel.types.stringLiteral(
										`${localComponent.classNames.join(' ')}`
									)
								)
							)
						} else if (
							classNameAttributeIfExist.type === 'JSXAttribute' &&
							classNameAttributeIfExist?.value?.type ===
								'StringLiteral'
						) {
							classNameAttributeIfExist.value =
								babel.types.jsxExpressionContainer(
									babel.types.stringLiteral(
										`${
											classNameAttributeIfExist.value
												.value
										} ${localComponent.classNames.join(
											' '
										)}`
									)
								)
						}

						if (
							path.node.closingElement &&
							path.node.closingElement.name.type ===
								'JSXIdentifier'
						)
							path.node.closingElement.name.name = localComponent
								?.element.name as string
					}
				},
			},
		}
	}

export default Transformer
