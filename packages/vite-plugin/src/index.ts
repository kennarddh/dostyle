/* eslint-disable security/detect-object-injection */
import { Plugin, ResolvedConfig } from 'vite'

import babelCore, { BabelFileResult, transformSync } from '@babel/core'
import { Scope } from '@babel/traverse'

import { FilesTransformedComponents } from './GlobalData'
import PreTransformer from './PreTransformer'
import Transformer from './Transformer'

export interface IDoStyleOptions {
	extensions?: string[]
	moduleRoot?: string | string[]
}

export type IExportTransformedComponent = {
	exportName: string
	localName: string
} & ({ default: true } | { default?: never })

export interface ILocalTransformedComponent {
	classNames: string[]
	name: string | null
	scope: Scope
	element: {
		name: string
		rules: IRules
	}
}
export interface ITransformedComponents {
	exports: IExportTransformedComponent[]
	locals: {
		components: ILocalTransformedComponent[]
		removeOnProgramExit: Set<babelCore.NodePath>
	}
}

export type IFilesTransformedComponents = Map<string, ITransformedComponents>

export type IRules = Record<string, string>

const DoStyle = ({
	extensions = ['jsx', 'tsx'],
}: IDoStyleOptions = {}): Plugin => {
	let config: ResolvedConfig | null = null

	const virtualModuleId = 'virtual:do-style-react'
	const resolvedVirtualModuleId = '\0' + virtualModuleId

	return {
		name: 'do-style',
		enforce: 'pre',
		configResolved(configResolved) {
			config = configResolved
		},
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					import {
						createElement,
					} from 'react'
				
				    const ComponentFactory = element => () => () => {
						return createElement(
							element
						)
					}

					const styled = new Proxy({}, {
						get(_, prop) {
							return ComponentFactory(prop);
						},
					});

					export default styled
				`
			}
		},
		transform(src, id) {
			if (!extensions.some(ext => id.endsWith(ext))) return

			console.log('transform', id)

			if (!FilesTransformedComponents.has(id))
				FilesTransformedComponents.set(id, {
					exports: [],
					locals: {
						components: [],
						removeOnProgramExit: new Set(),
					},
				})

			const result = transformSync(src, {
				configFile: false,
				filename: id,
				presets: ['@babel/preset-typescript'],
				plugins: [
					PreTransformer(),
					// Transformer(id, config?.resolve?.alias ?? []),
				],
			}) as BabelFileResult // => { code, map, ast }

			// console.log(id, '\n', src, '\n\n', result.code, '\n\n\n')

			return {
				code: result.code as string,
				map: result.map,
			}
		},
	}
}

export default DoStyle
