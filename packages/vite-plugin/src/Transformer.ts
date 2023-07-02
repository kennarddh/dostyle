import babelCore, { PluginObj } from '@babel/core'
import { RandomClassName } from '@dostyle/utils'

import { ITransformedComponents } from '.'

type Babel = typeof babelCore

const Transformer =
	(transformedComponents: ITransformedComponents) =>
	(babel: Babel): PluginObj => {
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
				ExportNamedDeclaration(path) {
					if (
						path.isExportNamedDeclaration() &&
						path.node.declaration?.type === 'VariableDeclaration'
					) {
						for (const declaration of path.node.declaration
							.declarations) {
							if (declaration.id.type !== 'Identifier') continue

							transformedComponents.push({
								className: RandomClassName(),
								exportName: declaration.id.name,
							})
						}
					}
				},
				ExportSpecifier(path) {
					if (
						path.isExportSpecifier() &&
						path.node.exported.type === 'Identifier'
					) {
						transformedComponents.push({
							className: RandomClassName(),
							exportName: path.node.exported.name,
						})
					}
				},
				ExportDefaultDeclaration(path) {
					if (
						path.isExportDefaultDeclaration() &&
						path.node.declaration.type === 'Identifier'
					) {
						transformedComponents.push({
							className: RandomClassName(),
							default: true,
						})
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

						if (!importedCreateElementName) {
							const importName = babel.types.importDeclaration(
								[
									babel.types.importSpecifier(
										babel.types.identifier(
											'_createElement'
										),
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

						if (path.parent.type === 'VariableDeclarator')
							path.parent.init = element
					}
				},
			},
		}
	}

export default Transformer
