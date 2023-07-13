/* eslint-disable security/detect-object-injection */
import { FilterPattern, Plugin, createFilter, normalizePath } from 'vite'

import { BabelFileResult, transformSync } from '@babel/core'

import { FilesSelectors } from './GlobalData'
import PreTransformer from './PreTransformer'
import Transformer from './Transformer'

export interface IDoStyleOptions {
	include?: FilterPattern
	exclude?: FilterPattern
}

export type IRulesEntries = string[][]

export type ISelector = {
	selectors: string[]
	rulesEntries: IRulesEntries
}

export type IFilesSelectors = Record<string, ISelector[]>

const UrlToId = (url: string) => {
	const splited = url.split('?', 1)

	return splited[0]
}

const DoStyle = ({
	include = '**/*.[jt]sx',
	exclude = [],
}: IDoStyleOptions = {}): Plugin => {
	// let config: ResolvedConfig | null = null

	const filter = createFilter(include, exclude)

	const virtualModuleId = 'virtual:do-style-react'
	const resolvedVirtualModuleId = '\0' + virtualModuleId

	return {
		name: 'do-style',
		enforce: 'post',
		// configResolved(configResolved) {
		// 	config = configResolved
		// },
		resolveId(url) {
			const id = UrlToId(url)

			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			} else if (id.endsWith('_do_style.css')) return url
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
					import {
						createElement,
					} from 'react'
				
				    const styled = (element, { className: doStyleClassName }) => ({ children, className }) => {
						const parsedChildren = Array.isArray(children)
							? children
							: [children]

						return createElement(
							element,
							{ className: doStyleClassName.join(' ') + (className ? ' ' + className: '') },
							...parsedChildren
						)
					}

					export default styled
				`
			} else if (FilesSelectors[id]) {
				console.log('load css', id, FilesSelectors)

				return FilesSelectors[id]
					.filter(selector => selector.rulesEntries.length !== 0)
					.reduce(
						(acc, selector) =>
							`${acc}${selector.selectors.join(
								','
							)} {${selector.rulesEntries.reduce(
								(acc, [prop, value]) =>
									`${acc}${prop}:${value};`,
								''
							)}}`,
						''
					)
			}
		},
		handleHotUpdate(ctx) {
			console.log('hmr', ctx.file)

			// for (const module of ctx.modules) {
			// 	module.id
			// }
		},
		transform(src, url) {
			const id = UrlToId(url)

			if (!filter(id)) return

			console.log('transform', id)

			const cssFileId = `${normalizePath(url).replace(
				/\.[jt]sx?$/,
				''
			)}_do_style.css?transformTime=${Date.now()}`

			if (!FilesSelectors[cssFileId]) FilesSelectors[cssFileId] = []

			const result = transformSync(src, {
				configFile: false,
				filename: id,
				presets: ['@babel/preset-typescript'],
				plugins: [
					PreTransformer(virtualModuleId),
					Transformer(id, virtualModuleId, cssFileId),
				],
			}) as BabelFileResult // => { code, map, ast }

			// console.log(id, '\n', src, '\n\n', result.code, '\n\n\n')

			const newCode = `${result.code}\nimport ${JSON.stringify(
				cssFileId
			)}`

			return {
				code: newCode,
				map: result.map,
			}
		},
	}
}

export default DoStyle
