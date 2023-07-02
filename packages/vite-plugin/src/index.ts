import { Plugin } from 'vite'

import { BabelFileResult, transformSync } from '@babel/core'

import Transformer from './Transformer'

export interface IDoStyleParameters {
	extensions?: string[]
}

export type ITransformedComponents = ({ className: string } & (
	| { default: true; exportName?: never; localName?: never }
	| { default?: never; exportName: string; localName: string }
))[]

export type ITransformedExportedComponents = Record<
	string,
	ITransformedComponents
>

const DoStyle = ({
	extensions = ['jsx', 'tsx'],
}: IDoStyleParameters = {}): Plugin => {
	const transformedExportedComponents: ITransformedExportedComponents = {}

	return {
		name: 'do-style',
		enforce: 'pre',
		transform(src, id) {
			if (!extensions.some(ext => id.endsWith(ext))) return

			if (!transformedExportedComponents[id])
				transformedExportedComponents[id] = []

			const result = transformSync(src, {
				configFile: false,
				filename: id,
				presets: ['@babel/preset-typescript'],
				plugins: [Transformer(transformedExportedComponents[id])],
			}) as BabelFileResult // => { code, map, ast }

			return {
				code: result.code as string,
				map: result.map,
			}
		},
	}
}

export default DoStyle
