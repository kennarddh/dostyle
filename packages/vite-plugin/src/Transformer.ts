/* eslint-disable security/detect-object-injection */
import { Alias, normalizePath } from 'vite'

import babelCore, { PluginObj } from '@babel/core'
import { dirname, isAbsolute, join } from 'node:path'

import { ILocalTransformedComponent } from '.'
import { FilesTransformedComponents } from './GlobalData'

type Babel = typeof babelCore

const ResolveAlias = (str: string, aliases: Alias[]): string | null => {
	for (const alias of aliases) {
		if (alias.find instanceof RegExp) {
			let replaced = false

			const newStr = str.replace(alias.find, () => {
				replaced = true

				return alias.replacement
			})

			if (replaced) return newStr
		} else if (typeof alias.find === 'string' && str.startsWith(alias.find))
			return str.replace(alias.find, alias.replacement)

		return null
	}

	return null
}

const IsAliasedPath = (path: string) => !path.startsWith('.')

const Transformer =
	(id: string, aliases: Alias[]) =>
	(babel: Babel): PluginObj => {
		// let programPath: babelCore.NodePath<babelCore.types.Program> | null

		return {
			name: 'dostyle:transform',
			visitor: {
				Program: {
					// enter(path) {
					// 	if (path.isProgram()) {
					// 		programPath = path
					// 	}
					// },
					exit(path) {
						if (path.isProgram()) {
							const locals =
								FilesTransformedComponents.get(id)?.locals

							if (!locals) return

							locals.removeOnProgramExit.forEach(path =>
								path.remove()
							)

							locals.removeOnProgramExit.clear()
						}
					},
				},
				JSXElement(babelPath) {
					if (
						babelPath.isJSXElement() &&
						babelPath.node.openingElement.name.type ===
							'JSXIdentifier'
					) {
						const componentName =
							babelPath.node.openingElement.name.name

						if (componentName[0].toLowerCase() === componentName[0])
							return // Not custom react component

						const targetComponentScope =
							babelPath.scope.getBinding(componentName)?.path
								.scope

						if (!targetComponentScope) return

						const targetBinding =
							targetComponentScope.getBinding(componentName)

						let component: ILocalTransformedComponent | null = null

						if (
							targetBinding?.path.parent.type ===
								'ImportDeclaration' &&
							(targetBinding?.path.node.type ===
								'ImportDefaultSpecifier' ||
								targetBinding?.path.node.type ===
									'ImportSpecifier')
						) {
							// External component

							const aliasedImportSource =
								targetBinding.path.parent.source.value

							let importSourceTemp: string | null = null

							if (IsAliasedPath(aliasedImportSource)) {
								importSourceTemp = ResolveAlias(
									aliasedImportSource,
									aliases
								)
							} else {
								importSourceTemp = aliasedImportSource
							}

							const importSource = importSourceTemp as string

							const normalizedImportSource =
								normalizePath(importSource)

							const currentTransformedFileDirectory = dirname(id)

							let importSourceJoinTemp = ''

							if (isAbsolute(normalizedImportSource)) {
								importSourceJoinTemp = normalizedImportSource
							} else {
								importSourceJoinTemp = join(
									currentTransformedFileDirectory,
									normalizedImportSource
								)
							}

							const finalImportSource =
								normalizePath(importSourceJoinTemp)

							const isDefaultExport =
								targetBinding?.path.node.type ===
								'ImportDefaultSpecifier'

							const exportedComponents =
								FilesTransformedComponents.get(
									finalImportSource
								)?.exports

							console.log({
								importSource,
								normalizedImportSource,
								finalImportSource,
								exportedComponents,
								FilesTransformedComponents,
							})

							if (!exportedComponents) return

							const exportedComponent = exportedComponents.find(
								exported => {
									if (isDefaultExport && exported.default)
										return true

									return (
										targetBinding.path.node.type ===
											'ImportSpecifier' &&
										targetBinding.path.node.imported
											.type === 'Identifier' &&
										exported.exportName ===
											targetBinding.path.node.imported
												.name
									)
								}
							)

							const localComponents =
								FilesTransformedComponents.get(
									finalImportSource
								)?.locals.components

							if (!localComponents) return

							const localComponent = localComponents.find(
								component =>
									component.name ===
									exportedComponent?.localName
							)

							if (!localComponent) return

							console.log({
								name: localComponent.element.name,
							})

							component = localComponent
						} else {
							// Local component
							const localComponent =
								FilesTransformedComponents.get(
									id
								)?.locals.components.find(
									component =>
										component.name === componentName &&
										component.scope === targetComponentScope
								)

							if (localComponent) {
								component = localComponent
							}
						}

						if (!component) return

						babelPath.node.openingElement.name.name = component
							?.element.name as string

						const classNameAttributeIfExist =
							babelPath.node.openingElement.attributes.find(
								attribute =>
									attribute.type === 'JSXAttribute' &&
									attribute.name.type === 'JSXIdentifier' &&
									attribute.name.name === 'className'
							)

						if (!classNameAttributeIfExist) {
							babelPath.node.openingElement.attributes.push(
								babel.types.jsxAttribute(
									babel.types.jsxIdentifier('className'),
									babel.types.stringLiteral(
										`${component.classNames.join(' ')}`
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
										} ${component.classNames.join(' ')}`
									)
								)
						}

						if (
							babelPath.node.closingElement &&
							babelPath.node.closingElement.name.type ===
								'JSXIdentifier'
						)
							babelPath.node.closingElement.name.name = component
								?.element.name as string
					}
				},
			},
		}
	}

export default Transformer
