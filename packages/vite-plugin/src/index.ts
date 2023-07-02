import { Plugin } from 'vite'

import babelCore, { BabelFileResult, transformSync } from '@babel/core'
import { Scope } from '@babel/traverse'

import { FilesTransformedComponents } from './GlobalData'
import Transformer from './Transformer'

export interface IDoStyleParameters {
	extensions?: string[]
}

export interface ITransformedComponents {
	exports: ({
		exportName: string
		localName: string
	} & ({ default: true } | { default?: never }))[]
	locals: {
		className: string
		name: string | null
		scope: Scope
		element: {
			name: string
			rules: IRules
		}
	}[]
}

export type IFilesTransformedComponents = Record<string, ITransformedComponents>

export type IRules = Record<string, string>

const DoStyle = ({
	extensions = ['jsx', 'tsx'],
}: IDoStyleParameters = {}): Plugin => {
	return {
		name: 'do-style',
		enforce: 'pre',
		transform(src, id) {
			if (!extensions.some(ext => id.endsWith(ext))) return

			if (!FilesTransformedComponents[id])
				FilesTransformedComponents[id] = { exports: [], locals: [] }

			const result = transformSync(src, {
				configFile: false,
				filename: id,
				presets: ['@babel/preset-typescript'],
				plugins: [Transformer(id)],
			}) as BabelFileResult // => { code, map, ast }

			return {
				code: result.code as string,
				map: result.map,
			}
		},
	}
}

export default DoStyle
