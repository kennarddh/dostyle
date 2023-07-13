/* eslint-disable security/detect-object-injection */
import babelCore, { PluginObj } from '@babel/core'
import { RandomClassName } from '@dostyle/utils'

import { FilesTransformedComponents } from './GlobalData'

type Babel = typeof babelCore

const Transformer =
	(id: string, virtualModuleId: string) =>
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
				TaggedTemplateExpression(path) {
					if (!path.isTaggedTemplateExpression()) return

					if (
						path.node.tag.type === 'MemberExpression' &&
						path.node.tag.object.type === 'Identifier' &&
						path.node.tag.property.type === 'Identifier' &&
						path.node.tag.object.name === 'styled'
					) {
						const elementName = path.node.tag.property.name

						const styledScope = path.scope.getBinding('styled')

						if (
							styledScope?.path.node.type ===
								'ImportDefaultSpecifier' &&
							styledScope?.path.parent.type ===
								'ImportDeclaration' &&
							styledScope?.path.parent.source.value ===
								virtualModuleId
						) {
							path.replaceWith(
								babel.types.callExpression(
									babel.types.identifier('styled'),
									[
										babel.types.stringLiteral(elementName),
										babel.types.objectExpression([
											babel.types.objectProperty(
												babel.types.identifier(
													'className'
												),
												babel.types.arrayExpression([
													babel.types.stringLiteral(
														RandomClassName()
													),
												])
											),
										]),
									]
								)
							)
						}
					}
				},
			},
		}
	}

export default Transformer
