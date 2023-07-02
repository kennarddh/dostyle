import { Plugin } from 'vite'

import { BabelFileResult, transformSync } from '@babel/core'

import Transformer from './Transformer'

export interface IDoStyleParameters {
	extensions?: string[]
}

type ITransformedExportedComponents = Record<
	string,
	{ className: string } & (
		| { default: true; exportName?: never }
		| { default?: never; exportName: string }
	)
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

			const result = transformSync(src, {
				configFile: false,
				filename: id,
				presets: ['@babel/preset-typescript'],
				plugins: [Transformer],
			}) as BabelFileResult // => { code, map, ast }

			return {
				code: result.code as string,
				map: result.map,
			}
		},
	}
}

export default DoStyle
