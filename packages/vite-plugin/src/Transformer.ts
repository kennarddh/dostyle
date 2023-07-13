/* eslint-disable security/detect-object-injection */
import babelCore, { PluginObj } from '@babel/core'
import { RandomClassName } from '@dostyle/utils'

import { FilesSelectors } from './GlobalData'

type Babel = typeof babelCore

const Transformer =
	(id: string, virtualModuleId: string, cssFileId: string) =>
	(babel: Babel): PluginObj => {
		// let programPath: babelCore.NodePath<babelCore.types.Program> | null

		return {
			name: 'dostyle:transform',
			visitor: {
				TaggedTemplateExpression(path) {
					if (!path.isTaggedTemplateExpression()) return

					if (
						path.node.tag.type === 'MemberExpression' &&
						path.node.tag.object.type === 'Identifier' &&
						path.node.tag.property.type === 'Identifier' &&
						path.node.quasi.type === 'TemplateLiteral' &&
						path.node.tag.object.name === 'styled'
					) {
						const styledScope = path.scope.getBinding('styled')

						if (
							styledScope?.path.node.type ===
								'ImportDefaultSpecifier' &&
							styledScope?.path.parent.type ===
								'ImportDeclaration' &&
							styledScope?.path.parent.source.value ===
								virtualModuleId
						) {
							const className = RandomClassName()

							const elementName = path.node.tag.property.name
							const rawRules = path.node.quasi.quasis
								.map(
									quasi =>
										quasi.value.cooked ?? quasi.value.raw
								)
								.join('')

							const rulesEntries = rawRules
								.split(';')
								.filter(rule => rule.trim() !== '')
								.map(rule =>
									rule.split(':').map(part => part.trim())
								)

							FilesSelectors[cssFileId].push({
								selectors: [`.${className}`],
								rulesEntries,
							})

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
														className
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
